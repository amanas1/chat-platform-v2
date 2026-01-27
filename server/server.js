const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');
const moderation = require('./moderation');

// ... (other constants)

// Email Transporter (Configure with Env Vars)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'streamflow.notifications@gmail.com', // Fallback or Env
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// ... (server setup)

  // FEEDBACK
  socket.on('feedback:send', async ({ rating, message }) => {
    console.log(`[FEEDBACK] Rating: ${rating}, Msg: ${message}`);
    
    // 1. Respond to user immediately (don't wait for email)
    socket.emit('feedback:received', { success: true });
    
    // 2. Send Email in background
    try {
        const mailOptions = {
            from: '"StreamFlow Bot" <streamflow.notifications@gmail.com>',
            to: 'amanas5535332@gmail.com',
            subject: `⭐️ New Feedback: ${rating} Stars`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">New Feedback Received</h2>
                    <p><strong>Rating:</strong> ${'⭐️'.repeat(rating)} (${rating}/5)</p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p style="margin: 0; color: #374151;">${message || 'No written message.'}</p>
                    </div>
                    <p style="font-size: 12px; color: #9ca3af;">Sent via StreamFlow App • User ID: ${boundUserId || 'Anonymous'}</p>
                </div>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
             const info = await transporter.sendMail(mailOptions);
             console.log('[EMAIL] Feedback sent:', info.messageId);
        } else {
             console.log('[EMAIL] Skipped sending (No credentials in .env)');
             console.log('--- EMAIL CONTENT PREVIEW ---');
             console.log(mailOptions.html);
             console.log('-----------------------------');
        }

    } catch (error) {
        console.error('[EMAIL] Failed to send feedback:', error);
    }
  });

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8, // 100MB to be safe
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============================================
// IN-MEMORY STORAGE WITH TTL & PERSISTENCE
// ============================================

const USER_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MEDIA_TTL = 30 * 1000; // 30 seconds
const TEXT_TTL = 60 * 1000; // 60 seconds
const MAX_MESSAGES_PER_SESSION = 50;

const storage = require('./storage');

// Map: userId -> { profile, socketId, expiresAt }
const activeUsers = new Map();

// Map: sessionId -> { participants: [userId1, userId2], createdAt }
// Load existing sessions from storage
const activeSessions = new Map(Object.entries(storage.load('sessions', {})));

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
  
  // Also clean sessions if participants are gone (optional, keeping for 24h)
  
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
      const ttl = (msg.messageType === 'image' || msg.messageType === 'audio' || msg.messageType === 'video') ? MEDIA_TTL : TEXT_TTL;
      return age < ttl;
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
    .filter(u => u.socketId !== null)
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

function saveSessions() {
    storage.save('sessions', Object.fromEntries(activeSessions));
}

// ============================================
// PRESENCE TRACKING
// ============================================

const broadcastPresenceCount = () => {
    const totalOnline = io.engine.clientsCount;
    const chatOnline = activeUsers.size;
    io.emit('presence:count', { totalOnline, chatOnline });
};

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`[SOCKET] New connection: ${socket.id}`);
  broadcastPresenceCount();
  
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
    
    // Find all active sessions for this user to sync
    const userSessions = Array.from(activeSessions.entries())
        .filter(([_, session]) => session.participants.includes(boundUserId))
        .map(([sessionId, session]) => {
            const partnerId = session.participants.find(id => id !== boundUserId);
            const partner = activeUsers.get(partnerId);
            return {
                sessionId,
                partnerId,
                partnerProfile: partner?.profile || { id: partnerId, name: 'User', status: 'offline' }
            };
        });

    socket.emit('user:registered', {
      userId: boundUserId,
      expiresAt,
      ttl: USER_TTL,
      activeSessions: userSessions // Send active sessions for recovery
    });
    
    syncGlobalPresence();
    broadcastPresenceCount();
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
    if (!target || !target.socketId) {
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
      saveSessions();
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
    if (!boundUserId) return;

    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('message:error', { message: 'Your messages are temporarily restricted.' });
        return;
    }

    if (moderation.checkRateLimit(boundUserId)) {
        const mutedUntil = moderation.getMutedUntil(boundUserId);
        socket.emit('message:error', { 
            message: 'You are sending messages too fast. Temporarily muted.',
            mutedUntil
        });
        return;
    }
    
    const session = activeSessions.get(sessionId);
    if (!session || !session.participants.includes(boundUserId)) {
      socket.emit('message:error', { message: 'Invalid session' });
      return;
    }

    const flagReason = metadata?.text ? moderation.getFilterViolation(metadata.text) : null;
    const isFlagged = flagReason !== null;
    
    if (isFlagged) {
        moderation.logViolation(boundUserId, flagReason, metadata.text);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const ttl = (messageType === 'image' || messageType === 'audio' || messageType === 'video') ? MEDIA_TTL : TEXT_TTL;
    
    const message = {
      id: messageId,
      sessionId,
      senderId: boundUserId,
      encryptedPayload,
      messageType,
      metadata: {
        ...metadata,
        flagged: isFlagged,
        flagReason
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    
    if (!messages.has(sessionId)) {
      messages.set(sessionId, []);
    }
    
    const list = messages.get(sessionId);
    list.push(message);
    
    // Enforce message cap (Keep last 50)
    if (list.length > MAX_MESSAGES_PER_SESSION) {
      messages.set(sessionId, list.slice(-MAX_MESSAGES_PER_SESSION));
    }
    
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
    moderation.logViolation(targetUserId, `report:${reason}`, `Reported by ${boundUserId}. Msg: ${messageId || 'none'}`);
    socket.emit('report:acknowledged', { success: true });
  });

  // WEBRTC SIGNALING RELAY
  socket.on('webrtc:signal', ({ targetUserId, signal }) => {
    if (!boundUserId) {
        console.log('[SIGNAL] Rejected: User not bound');
        return;
    }

    
    console.log(`[SIGNAL] Relay from ${boundUserId} to ${targetUserId} (${signal.type || 'candidate'})`);
    
    const targetUser = activeUsers.get(targetUserId);
    if (targetUser && targetUser.socketId) {
      console.log(`[SIGNAL] Forwarding to socket ${targetUser.socketId}`);
      io.to(targetUser.socketId).emit('webrtc:signal', {
        fromUserId: boundUserId,
        signal
      });
    } else {
      console.log(`[SIGNAL] Failed: Target user ${targetUserId} not found or has no socket`);
    }
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
          io.to(user.socketId).emit('typing:indicator', { sessionId, userId: boundUserId, isTyping: true });
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
          io.to(user.socketId).emit('typing:indicator', { sessionId, userId: boundUserId, isTyping: false });
        }
      }
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (boundUserId) {
      console.log(`[DISCONNECT] User ${boundUserId} disconnected`);
      const userData = activeUsers.get(boundUserId);
      if (userData) {
          userData.socketId = null;
          activeUsers.set(boundUserId, userData);
      }
      syncGlobalPresence();
      broadcastPresenceCount();
    } else {
      broadcastPresenceCount();
    }
  });

  // FEEDBACK VIA SOCKET
  socket.on('feedback:send', ({ rating, message }) => {
    const feedbackEntry = {
        timestamp: new Date().toISOString(),
        userId: boundUserId || 'guest',
        rating,
        message
    };

    console.log(`[SOCKET FEEDBACK] Received rating ${rating}/5`);

    const logPath = path.join(__dirname, 'feedback.log');
    const logLine = JSON.stringify(feedbackEntry) + '\n';
    
    fs.appendFile(logPath, logLine, (err) => {
        if (err) console.error('[FEEDBACK] Error writing to log:', err);
    });

    socket.emit('feedback:received', { success: true });
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
server.listen(PORT, () => {
  console.log(`🚀 StreamFlow Server running on port ${PORT}`);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Text Msgs: 60s TTL (Newest on Top)`);
  console.log(`   - Media Msgs: 30s TTL`);
  console.log(`   - Capacity: Max ${MAX_MESSAGES_PER_SESSION} per chat`);
});
