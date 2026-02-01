const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const moderation = require('./moderation');
const { Resend } = require('resend');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

const USER_TTL = 60 * 24 * 60 * 60 * 1000; // 60 days
const MEDIA_TTL = 30 * 1000; // 30 seconds
const TEXT_TTL = 60 * 1000; // 60 seconds
const VOICE_INTRO_TTL = 24 * 60 * 60 * 1000; // 24 hours
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

// Authentication Storage
// Map: email -> { otpHash, expiresAt, attempts, lastSent }
// Authentication Storage
// Map: email -> { otpHash, expiresAt, attempts, lastSent }
// Load persistent auth codes
const rawAuthCodes = storage.load('authCodes', {});
const authCodes = new Map(Object.entries(rawAuthCodes));

function saveAuthCodes() {
  storage.save('authCodes', Object.fromEntries(authCodes));
}
// Map: token -> { email, expiresAt }
const magicTokens = new Map();




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

// Clean expired voice intros every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, userData] of activeUsers.entries()) {
    if (userData.profile.voiceIntro && userData.profile.voiceIntroTimestamp) {
      if (now - userData.profile.voiceIntroTimestamp > VOICE_INTRO_TTL) {
        console.log(`[CLEANUP] Removing expired voice intro for user ${userId}`);
        userData.profile.voiceIntro = null;
        userData.profile.voiceIntroTimestamp = null;
      }
    }
  }
}, 60 * 60 * 1000);

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
  socket.on('user:register', (profile, callback) => {
    if (!profile || !profile.id) return;
    
    // Check if user is banned
    if (moderation.isUserBanned(profile.id)) {
        console.warn(`[REG] Rejected banned user: ${profile.id}`);
        const error = { 
            message: 'Your account is currently restricted.',
            reason: moderation.getBanReason(profile.id)
        };
        if (callback) callback({ error });
        socket.emit('user:error', error);
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

    console.log(`[USER] Registered: ${boundUserId} (Socket: ${socket.id}, Country: ${profile.country}, Detected: ${profile.detectedCountry || 'N/A'})`);
    
    // ... rest of join logic
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

    const regData = {
      userId: boundUserId,
      expiresAt,
      ttl: USER_TTL,
      activeSessions: userSessions
    };

    if (callback) callback(regData);
    socket.emit('user:registered', regData);
    
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
    
    console.log(`[MSG] 📤 Broadcasting message ${messageId} to session ${sessionId}`);
    console.log(`[MSG] Session participants: [${session.participants.join(', ')}]`);
    
    session.participants.forEach(userId => {
      const user = activeUsers.get(userId);
      console.log(`[MSG] Checking participant ${userId}: socketId=${user?.socketId || 'NONE'}`);
      if (user?.socketId) {
        console.log(`[MSG] ✅ Sending to ${userId} via socket ${user.socketId}`);
        io.to(user.socketId).emit('message:received', message);
      } else {
        console.log(`[MSG] ❌ User ${userId} has no active socket connection`);
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
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
    
    // Find user by socketId
    let discUserId = null;
    for (const [uid, udata] of activeUsers.entries()) {
      if (udata.socketId === socket.id) {
        discUserId = uid;
        break;
      }
    }
    
    if (discUserId) {
      const userData = activeUsers.get(discUserId);
      if (userData) {
        userData.socketId = null;
        // Don't delete yet, wait for TTL expiry
      }
    }
    broadcastPresenceCount();
  });

  // ============================================
  // AUTHENTICATION HANDLERS
  // ============================================

  socket.on('auth:request_code', async ({ email }) => {
    if (!email || !email.includes('@')) {
      return socket.emit('auth:error', { message: 'Invalid email' });
    }

    // 1. Strict Normalization
    const normalizedEmail = email.trim().toLowerCase();
    
    const now = Date.now();
    const existing = authCodes.get(normalizedEmail);
    
    // Rate limit: 60 seconds
    if (existing && now - existing.lastSent < 60000) {
      return socket.emit('auth:error', { 
        message: 'Please wait before requesting a new code',
        retryIn: Math.ceil((60000 - (now - existing.lastSent)) / 1000)
      });
    }

    // 2. Generate 6-digit OTP as STRING
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Generate Magic Link Token
    const magicToken = crypto.randomBytes(32).toString('hex');

    console.log(`[AUTH DEBUG] Request for: '${normalizedEmail}'`);
    console.log(`[AUTH DEBUG] Generated OTP: ${otp} (Type: ${typeof otp})`);
    console.log(`[AUTH DEBUG] OTP Hash: ${otpHash}`);

    // Store with 10 minute TTL
    authCodes.set(normalizedEmail, {
      otpHash,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      lastSent: now
    });
    
    // 3. Persist immediately
    saveAuthCodes();

    magicTokens.set(magicToken, {
      email: normalizedEmail,
      expiresAt: now + 10 * 60 * 1000
    });

    console.log(`[AUTH] OTP for ${normalizedEmail}: ${otp}`);
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    console.log(`[AUTH] Magic Link for ${normalizedEmail}: ${appUrl}?token=${magicToken}`);

    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'StreamFlow <onboarding@resend.dev>', // Use default until domain is verified
          to: [normalizedEmail],
          subject: 'Ваш код для входа',
          text: `Ваш код для входа: ${otp}\n\nИли используйте ссылку для автоматического входа: ${process.env.VITE_APP_URL || 'http://localhost:5173'}?token=${magicToken}\n\nЕсли это были не вы — просто проигнорируйте письмо.`,
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; color: #333;">
              <h2 style="color: #bc6ff1;">StreamFlow</h2>
              <p>Ваш код для входа:</p>
              <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; border-radius: 12px; letter-spacing: 5px;">
                ${otp}
              </div>
              <p style="margin-top: 20px;">Или нажмите кнопку ниже, чтобы войти автоматически:</p>
              <a href="${appUrl}?token=${magicToken}" 
                 style="display: block; background: #bc6ff1; color: white; padding: 15px; text-decoration: none; border-radius: 12px; font-weight: bold; text-align: center;">
                Войти автоматически
              </a>
              <p style="font-size: 10px; color: #999; margin-top: 30px;">
                Если это были не вы — просто проигнорируйте письмо.
              </p>
            </div>
          `
        });

        if (error) {
          console.error('[AUTH] Resend error:', error);
          socket.emit('auth:error', { message: 'Failed to send email' });
        } else {
          console.log('[AUTH] Email sent:', data.id);
          socket.emit('auth:code_sent', { email: normalizedEmail });
        }
      } catch (err) {
        console.error('[AUTH] Server error during email send:', err);
        socket.emit('auth:error', { message: 'Internal server error' });
      }
    } else {
      console.log('[AUTH] MOCK MODE: Email not sent (RESEND_API_KEY missing)');
      socket.emit('auth:code_sent', { email: normalizedEmail, mock: true });
    }
  });

  socket.on('auth:verify_code', ({ email, otp }) => {
    // 1. Strict Normalization
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const inputOtp = String(otp).trim();

    console.log(`[AUTH DEBUG] Verify Request: '${normalizedEmail}' with Code: '${inputOtp}'`);

    const data = authCodes.get(normalizedEmail);
    if (!data) {
        console.log(`[AUTH DEBUG] No record found for: '${normalizedEmail}'`);
        return socket.emit('auth:error', { message: 'Code expired or not found' });
    }

    if (Date.now() > data.expiresAt) {
      authCodes.delete(normalizedEmail);
      saveAuthCodes(); // Persist deletion
      return socket.emit('auth:error', { message: 'Code expired' });
    }

    if (data.attempts >= 5) {
      return socket.emit('auth:error', { message: 'Too many attempts. Request a new code.' });
    }

    const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex');
    
    console.log(`[AUTH DEBUG] Stored Hash: ${data.otpHash}`);
    console.log(`[AUTH DEBUG] Input Hash:  ${inputHash}`);

    if (inputHash === data.otpHash) {
      // SUCCESS
      authCodes.delete(normalizedEmail);
      saveAuthCodes(); // Persist deletion
      
      const userId = `u_${crypto.createHash('md5').update(normalizedEmail).digest('hex')}`;
      socket.emit('auth:success', { userId, email: normalizedEmail });
    } else {
      // FAILURE
      data.attempts++;
      saveAuthCodes(); // Persist attempt count
      
      console.log(`[AUTH DEBUG] Invalid Code. Attempts: ${data.attempts}/5`);
      socket.emit('auth:error', { message: 'Invalid code', attemptsRemaining: 5 - data.attempts });
    }
  });

  socket.on('auth:verify_token', ({ token }) => {
    const data = magicTokens.get(token);
    if (!data) return socket.emit('auth:error', { message: 'Invalid or expired token' });

    if (Date.now() > data.expiresAt) {
      magicTokens.delete(token);
      return socket.emit('auth:error', { message: 'Token expired' });
    }

    const email = data.email;
    magicTokens.delete(token);
    const userId = `u_${crypto.createHash('md5').update(email).digest('hex')}`;
    socket.emit('auth:success', { userId, email });
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

// Cleanup registration log every hour
setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [key, entry] of registrationLog.entries()) {
        if (now - entry.timestamp > USER_TTL) {
            registrationLog.delete(key);
            changed = true;
        }
    }
    if (changed) {
        storage.save('registrationLog', Object.fromEntries(registrationLog));
    }
}, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`🚀 StreamFlow Server running on port ${PORT}`);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Text Msgs: 60s TTL (Newest on Top)`);
  console.log(`   - Media Msgs: 30s TTL`);
  console.log(`   - Capacity: Max ${MAX_MESSAGES_PER_SESSION} per chat`);
});
