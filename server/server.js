const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const moderation = require('./moderation');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e7, // 10MB for media  pingTimeout: 5000,
  pingInterval: 10000
});

// ============================================
// IN-MEMORY STORAGE WITH TTL
// ============================================

const USER_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MESSAGE_TTL = 60 * 1000; // 1 minute

// Map: userId -> { profile, socketId, expiresAt }
const activeUsers = new Map();

// Map: sessionId -> { participants: [userId1, userId2], createdAt }
const activeSessions = new Map();

// Map: sessionId -> Message[]
const messages = new Map();

// Map: userId -> Set<knockRequestId>
const knockRequests = new Map();

// ============================================
// TTL CLEANUP JOBS
// ============================================

// Clean expired users every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiredUsers = [];
  
  for (const [userId, userData] of activeUsers.entries()) {
    if (now > userData.expiresAt) {
      expiredUsers.push(userId);
    } else if (now > userData.expiresAt - (30 * 60 * 1000)) {
      // Warn user 30 minutes before expiration
      if (userData.socketId) {
        io.to(userData.socketId).emit('profile:expiring', {
          expiresIn: userData.expiresAt - now
        });
      }
    }
  }
  
  expiredUsers.forEach(userId => {
    const userData = activeUsers.get(userId);
    if (userData?.socketId) {
      io.to(userData.socketId).emit('profile:expired');
    }
    activeUsers.delete(userId);
  });
  
  if (expiredUsers.length > 0) {
    syncGlobalPresence();
  }
}, 5 * 60 * 1000);

// Clean expired messages every 10 seconds
setInterval(() => {
  const now = Date.now();
  let hasChanges = false;
  
  for (const [sessionId, messageList] of messages.entries()) {
    const freshMessages = messageList.filter(msg => {
      const age = now - msg.timestamp;
      return age < MESSAGE_TTL;
    });
    
    if (freshMessages.length !== messageList.length) {
      hasChanges = true;
      if (freshMessages.length === 0) {
        messages.delete(sessionId);
      } else {
        messages.set(sessionId, freshMessages);
      }
      
      // Notify session participants that messages expired
      const session = activeSessions.get(sessionId);
      if (session) {
        session.participants.forEach(userId => {
          const user = activeUsers.get(userId);
          if (user?.socketId) {
            io.to(user.socketId).emit('messages:deleted', {
              sessionId,
              remainingCount: freshMessages.length
            });
          }
        });
      }
    }
  }
}, 10 * 1000);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function syncGlobalPresence() {
  // Only send online users (with active socketId)
  const userList = Array.from(activeUsers.values())
    .filter(u => u.socketId !== null) // Filter out disconnected users
    .map(u => ({
      ...u.profile,
      status: 'online'
    }));
  io.emit('presence:list', userList);
}

function findSession(userId1, userId2) {
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.participants.includes(userId1) && session.participants.includes(userId2)) {
      return sessionId;
    }
  }
  return null;
}

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`[SOCKET] New connection: ${socket.id}`);
  
  socket.onAny((event, ...args) => {
    console.log(`[EVENT] ${event}`, args);
  });

  let boundUserId = null;

  // USER JOINS
  socket.on('user:register', (profile) => {
    if (!profile || !profile.id) return;
    
    // Check if user is banned
    if (moderation.isUserBanned(profile.id)) {
        console.warn(`[REG] Rejected banned user: ${profile.id}`);
        socket.emit('user:error', { 
            message: 'Your account is currently restricted.',
            reason: moderation.getBanReason(profile.id)
        });
        return;
    }

    boundUserId = profile.id;
    const expiresAt = Date.now() + USER_TTL;
    
    activeUsers.set(boundUserId, {
      profile: { ...profile, status: 'online' },
      socketId: socket.id,
      expiresAt,
      createdAt: Date.now()
    });

    console.log(`[USER] Registered: ${boundUserId} (Socket: ${socket.id})`);
    
    socket.emit('user:registered', {
      userId: boundUserId,
      expiresAt,
      ttl: USER_TTL
    });
    
    syncGlobalPresence();
  });

  // SEARCH USERS
  socket.on('users:search', (filters) => {
    const results = Array.from(activeUsers.values())
      .map(u => u.profile)
      .filter(user => {
        if (user.id === boundUserId) return false; // Don't show self
        
        if (filters.name && !user.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        
        if (filters.minAge && user.age < filters.minAge) return false;
        if (filters.maxAge && user.age > filters.maxAge) return false;
        
        if (filters.gender && filters.gender !== 'any' && user.gender !== filters.gender) {
          return false;
        }
        
        if (filters.country && filters.country !== 'Any' && user.country !== filters.country) {
          return false;
        }
        
        if (filters.city && filters.city !== 'Any' && user.city !== filters.city) {
          return false;
        }
        
        return true;
      });
    
    socket.emit('users:search:results', results);
  });

  // KNOCK (Request to chat)
  socket.on('knock:send', ({ targetUserId }) => {
    if (!boundUserId) return;
    
    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('knock:error', { message: 'Action restricted due to account status.' });
        return;
    }

    const target = activeUsers.get(targetUserId);
    if (!target) {
      socket.emit('knock:error', { message: 'User not found or offline' });
      return;
    }
    
    const knockId = `knock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    if (!knockRequests.has(targetUserId)) {
      knockRequests.set(targetUserId, new Set());
    }
    knockRequests.get(targetUserId).add(knockId);
    
    // Notify target user
    io.to(target.socketId).emit('knock:received', {
      knockId,
      fromUserId: boundUserId,
      fromUser: activeUsers.get(boundUserId)?.profile
    });
    
    socket.emit('knock:sent', { knockId, targetUserId });
  });

  // KNOCK ACCEPT
  socket.on('knock:accept', ({ knockId, fromUserId }) => {
    if (!boundUserId) return;
    
    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('knock:error', { message: 'Action restricted.' });
        return;
    }

    const existingSessionId = findSession(boundUserId, fromUserId);
    let sessionId;
    
    if (existingSessionId) {
      sessionId = existingSessionId;
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      activeSessions.set(sessionId, {
        participants: [boundUserId, fromUserId],
        createdAt: Date.now()
      });
      console.log(`[SESSION] Created new session ${sessionId} for [${boundUserId}, ${fromUserId}]`);
      messages.set(sessionId, []);
    }
    
    // Remove knock request
    if (knockRequests.has(boundUserId)) {
      knockRequests.get(boundUserId).delete(knockId);
    }
    
    // Notify both users
    const user1 = activeUsers.get(boundUserId);
    const user2 = activeUsers.get(fromUserId);
    
    if (user1?.socketId) {
      io.to(user1.socketId).emit('session:created', {
        sessionId,
        partnerId: fromUserId,
        partnerProfile: user2?.profile
      });
    }
    
    if (user2?.socketId) {
      io.to(user2.socketId).emit('session:created', {
        sessionId,
        partnerId: boundUserId,
        partnerProfile: user1?.profile
      });
    }
  });

  // KNOCK REJECT
  socket.on('knock:reject', ({ knockId, fromUserId }) => {
    if (!boundUserId) return;
    
    if (knockRequests.has(boundUserId)) {
      knockRequests.get(boundUserId).delete(knockId);
    }
    
    const fromUser = activeUsers.get(fromUserId);
    if (fromUser?.socketId) {
      io.to(fromUser.socketId).emit('knock:rejected', { knockId });
    }
  });

  // SEND MESSAGE (E2EE - server just relays encrypted payload)
  socket.on('message:send', ({ sessionId, encryptedPayload, messageType, metadata }) => {
    if (!boundUserId) {
        console.warn(`[ERROR] message:send rejected - Socket ${socket.id} not bound to user`);
        return;
    }

    // 1. Check Ban
    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('message:error', { message: 'Your messages are temporarily restricted.' });
        return;
    }

    // 2. Rate Limit / Anti-Spam
    if (moderation.checkRateLimit(boundUserId)) {
        const mutedUntil = moderation.mutedUntil(boundUserId);
        socket.emit('message:error', { 
            message: 'You are sending messages too fast. Temporarily muted.',
            mutedUntil
        });
        return;
    }
    
    const session = activeSessions.get(sessionId);
    if (!session || !session.participants.includes(boundUserId)) {
      console.warn(`[ERROR] message:send rejected - Invalid session ${sessionId} or user ${boundUserId} not in participants [${session?.participants}]`);
      socket.emit('message:error', { message: 'Invalid session' });
      return;
    }

    // 3. Content Filtering (Server-side metadata tagging)
    const flagReason = metadata?.text ? moderation.getFilterViolation(metadata.text) : null;
    const isFlagged = flagReason !== null;
    
    if (isFlagged) {
        moderation.logViolation(boundUserId, flagReason, metadata.text);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const message = {
      id: messageId,
      sessionId,
      senderId: boundUserId,
      encryptedPayload, // Encrypted content
      messageType, // 'text', 'image', 'audio', 'video'
      metadata: {
        ...metadata,
        flagged: isFlagged,
        flagReason
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + MESSAGE_TTL
    };
    
    // Store message
    if (!messages.has(sessionId)) {
      messages.set(sessionId, []);
    }
    messages.get(sessionId).push(message);
    
    // Relay to all participants
    console.log(`[MSG] Sending message in session ${sessionId} from ${boundUserId} (Flagged: ${isFlagged})`);
    session.participants.forEach(userId => {
      const user = activeUsers.get(userId);
      if (user?.socketId) {
        io.to(user.socketId).emit('message:received', message);
      }
    });
  });

  // USER REPORT
  socket.on('user:report', ({ targetUserId, reason, messageId }) => {
    if (!boundUserId) return;
    
    console.log(`[REPORT] User ${boundUserId} reported ${targetUserId}. Reason: ${reason}`);
    moderation.addReport({
        fromUserId: boundUserId,
        targetUserId,
        reason,
        messageId,
        timestamp: Date.now()
    });
    
    socket.emit('report:acknowledged', { success: true });
  });

  // GET MESSAGES for a session
  socket.on('messages:get', ({ sessionId }) => {
    if (!boundUserId) return;
    
    const session = activeSessions.get(sessionId);
    if (!session || !session.participants.includes(boundUserId)) {
      socket.emit('messages:error', { message: 'Invalid session' });
      return;
    }
    
    const sessionMessages = messages.get(sessionId) || [];
    const now = Date.now();
    
    // Only send non-expired messages
    const validMessages = sessionMessages.filter(msg => now < msg.expiresAt);
    
    socket.emit('messages:list', {
      sessionId,
      messages: validMessages
    });
  });

  // TYPING INDICATOR
  socket.on('typing:start', ({ sessionId }) => {
    if (!boundUserId) return;
    
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    session.participants.forEach(userId => {
      if (userId !== boundUserId) {
        const user = activeUsers.get(userId);
        if (user?.socketId) {
          io.to(user.socketId).emit('typing:indicator', {
            sessionId,
            userId: boundUserId,
            isTyping: true
          });
        }
      }
    });
  });

  socket.on('typing:stop', ({ sessionId }) => {
    if (!boundUserId) return;
    
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    session.participants.forEach(userId => {
      if (userId !== boundUserId) {
        const user = activeUsers.get(userId);
        if (user?.socketId) {
          io.to(user.socketId).emit('typing:indicator', {
            sessionId,
            userId: boundUserId,
            isTyping: false
          });
        }
      }
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (boundUserId) {
      console.log(`[DISCONNECT] User ${boundUserId} disconnected`);
      // Remove user completely from activeUsers
      activeUsers.delete(boundUserId);
      syncGlobalPresence();
    }
  });
});

// ============================================
// REST API ENDPOINTS (Optional healthz check)
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeUsers: activeUsers.size,
    activeSessions: activeSessions.size,
    uptime: process.uptime()
  });
});

app.get('/stats', (req, res) => {
  res.json({
    users: activeUsers.size,
    sessions: activeSessions.size,
    totalMessages: Array.from(messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
  });
});

// --- Moderation Admin API ---

app.get('/api/moderation/violations', (req, res) => {
    res.json(moderation.getViolations());
});

app.get('/api/moderation/bans', (req, res) => {
    res.json(moderation.getActiveBans());
});

app.post('/api/moderation/ban', (req, res) => {
    const { userId, duration, reason } = req.body;
    if (!userId || !duration) {
        return res.status(400).json({ error: 'userId and duration (1h, 1d, perm) are required' });
    }
    moderation.applyBan(userId, duration, reason || 'Manual administrative action.');
    res.json({ success: true, message: `User ${userId} banned for ${duration}` });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StreamFlow Server running on port ${PORT}`);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Messages: 1min TTL`);
  console.log(`   - E2EE: Relay only`);
});
