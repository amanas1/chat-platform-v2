console.log("🚀 Starting StreamFlow Server...");

// GLOBAL ERROR CATCHERS FOR PRODUCTION STABILITY
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const moderation = require('./moderation');
const { Resend } = require('resend');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ENSURE DATA DIRECTORY EXISTS
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    console.log(`[INIT] Creating data directory: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY missing, running in limited mode (Email auth will fail)");
} else {
    console.log("[AUTH] RESEND_API_KEY is present. Initializing mailer...");
}

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
const MEDIA_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (Persistent)
const TEXT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (Persistent History)
const VOICE_INTRO_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_EARLY_USERS = 100;
const MAX_MESSAGES_PER_SESSION = 50;

const storage = require('./storage');

/**
 * Universal Feature Access Check
 * @param {Object} user - User object
 * @param {string} featureName - Feature identifier
 * @returns {boolean}
 */
function canUseFeature(user, featureName) {
    if (!user || user.accountStatus === 'blocked') return false; // Renamed property check
    
    // Define PRO features here
    const PRO_FEATURES = ['audio_calls', 'video_calls', 'ai_tools', 'unlimited_history'];
    
    if (PRO_FEATURES.includes(featureName)) {
        // Check Early Access or Subscription
        if (user.early_access && user.free_until && Date.now() < user.free_until) {
            return true;
        }
        // Future: Check stripe_subscription_status
        return false;
    }
    
    return true; // Default allow for basic features
}

// Map: userId -> { profile, socketId, expiresAt }
const activeUsers = new Map();

// Map: sessionId -> { participants: [userId1, userId2], createdAt }
// Load existing sessions from storage
const activeSessions = new Map(Object.entries(storage.load('sessions', {})));

// Map: sessionId -> Message[]
// Load persistent messages
const rawMessages = storage.load('messages', {});
const messages = new Map(Object.entries(rawMessages));

// Map: userId -> Set<knockRequestId>
const knockRequests = new Map();

// Authentication Storage
// Map: email -> { otpHash, expiresAt, attempts, lastSent }
// Load persistent auth codes
const rawAuthCodes = storage.load('authCodes', {});
const authCodes = new Map(Object.entries(rawAuthCodes));

// ... (skipping unchanged code)

// Clean expired messages every 1 hour (Reduced I/O load)
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
      
      // Notify session participants that messages expired (Optional for such long intervals, but kept for consistency)
      // If we run this hourly, notifying users "messages deleted" might be weird if they are active, but valid.
    }
  }

  if (hasChanges) {
    saveMessages(); // Persist changes after cleanup
  }
}, 60 * 60 * 1000);

// Map: userId -> { id, email, created_at, last_login_at, status }
const rawUsers = storage.load('users', []); 
// Convert array to Map for easier lookup if using ID, but for Email lookup array find is okay. 
// Actually lets keep it as a Map of userId -> UserData for consistency, or Email -> UserData?
// Requirement 4: "Email - User ID". 
// Let's use an array for storage to mimic SQL rows, but load into memory.
const persistentUsers = new Map(); // userId -> User
rawUsers.forEach(u => persistentUsers.set(u.id, u));

function saveAuthCodes() {
  storage.save('authCodes', Object.fromEntries(authCodes));
}

function savePersistentUsers() {
  storage.save('users', Array.from(persistentUsers.values()));
}

function saveMessages() {
  // Convert Message Map to object for JSON storage
  // Map<sessionId, Message[]> -> Object<sessionId, Message[]>
  storage.save('messages', Object.fromEntries(messages));
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

  // 3. Permanent Account Deletion (30-day grace period)
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  let persistentModified = false;

  for (const [userId, user] of persistentUsers.entries()) {
      if (user.deletionRequestedAt && (now - user.deletionRequestedAt) > thirtyDaysMs) {
          console.log(`[USER] PERMANENTLY DELETING account: ${userId} (Grace period expired)`);
          persistentUsers.delete(userId);
          persistentModified = true;
          
          // cleanup associated sessions and messages
          for (const [sessionId, session] of activeSessions.entries()) {
              if (session.participants.includes(userId)) {
                  activeSessions.delete(sessionId);
                  messages.delete(sessionId);
              }
          }
          persistentModified = true;
      }
  }

  if (persistentModified) {
      savePersistentUsers();
      saveSessions();
      saveMessages();
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

// Helper to get all registered users with their current status
function getAllParticipants() {
    const all = Array.from(persistentUsers.values()).map(user => {
        const active = activeUsers.get(user.id);
        return {
            ...user,
            status: active ? 'online' : 'offline'
        };
    });
    
    // Sort: Online first, then recent
    return all.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return (b.last_login_at || 0) - (a.last_login_at || 0);
    });
}

function syncGlobalPresence() {
  const participants = getAllParticipants();
  io.emit('presence:list', participants);
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

    // 30-Day Lockdown Enforcement
    let userRecord = persistentUsers.get(profile.id);
    if (userRecord) {
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const regTime = userRecord.registrationTimestamp || profile.registrationTimestamp || userRecord.created_at;
        
        const isLocked = (now - regTime) < thirtyDaysMs;
        
        if (isLocked && userRecord.name && userRecord.age) {
            console.log(`[USER] Profile LOCKED for ${profile.id} (${Math.floor((thirtyDaysMs - (now - regTime))/(1000*60*60*24))} days left)`);
            // Restore locked fields from persistent record
            profile.name = userRecord.name;
            profile.age = userRecord.age;
            profile.gender = userRecord.gender;
            profile.avatar = userRecord.avatar;
            profile.registrationTimestamp = regTime; // Keep original
        } else {
            // Update/Verify core fields for the first time or after lock expired
            userRecord.name = profile.name || userRecord.name;
            userRecord.age = profile.age || userRecord.age;
            userRecord.gender = profile.gender || userRecord.gender;
            userRecord.avatar = profile.avatar || userRecord.avatar;
            userRecord.registrationTimestamp = regTime || now;
            profile.registrationTimestamp = userRecord.registrationTimestamp;
        }
        
        // Always allowed updates
        userRecord.intentStatus = profile.intentStatus;
        userRecord.voiceIntro = profile.voiceIntro;
        userRecord.last_login_at = now;
        
        persistentUsers.set(profile.id, userRecord);
        savePersistentUsers();
    }

    boundUserId = profile.id;
    const expiresAt = Date.now() + USER_TTL;
    
    activeUsers.set(boundUserId, {
      profile: { ...profile, status: 'online' },
      socketId: socket.id,
      expiresAt,
      createdAt: Date.now()
    });

    console.log(`[USER] Registered/Synced: ${boundUserId} (Socket: ${socket.id}, Name: ${profile.name})`);
    
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
      profile: profile, // Return the (potentially corrected) profile back to client
      expiresAt,
      ttl: USER_TTL,
      activeSessions: userSessions
    };

    if (callback) callback(regData);
    socket.emit('user:registered', regData);
    
    syncGlobalPresence();
    broadcastPresenceCount();
  });

  // SEARCH USERS (Online + Offline)
  socket.on('users:search', (filters) => {
    // 1. Get all registered users from persistence
    const allUsers = Array.from(persistentUsers.values());
    
    // 2. Map status from activeUsers
    const results = allUsers.map(user => {
        const active = activeUsers.get(user.id);
        return {
            ...user,
            status: active ? 'online' : 'offline',
            // Ensure we don't leak sensitive internal fields if any
        };
    }).filter(user => {
        if (user.id === boundUserId) return false; // Don't show self
        
        // Basic filtering
        if (filters.name && !user.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        
        if (filters.minAge && user.age < filters.minAge) return false;
        if (filters.maxAge && user.age > filters.maxAge) return false;
        
        if (filters.gender && filters.gender !== 'any' && user.gender !== filters.gender) {
          return false;
        }
        
        // Ensure only complete profiles are shown
        if (!user.name || !user.age) return false;

        return true;
    });
    
    // Sort: Online first, then by last seen
    results.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return (b.last_login_at || 0) - (a.last_login_at || 0);
    });

    socket.emit('users:search:results', results);
  });

  // ACCOUNT DELETION REQUEST (30-day grace period)
  socket.on('user:delete_request', () => {
    if (!boundUserId) return;
    
    let userRecord = persistentUsers.get(boundUserId);
    if (userRecord) {
        const now = Date.now();
        // Only set if not already present (preserve original date)
        if (!userRecord.deletionRequestedAt) {
            userRecord.deletionRequestedAt = now;
            persistentUsers.set(boundUserId, userRecord);
            savePersistentUsers();
            console.log(`[USER] Deletion requested for ${boundUserId}. Scheduled for ${new Date(now + 30*24*60*60*1000).toLocaleDateString()}`);
        } else {
            console.log(`[USER] Deletion status checked for ${boundUserId}. Original request was at ${new Date(userRecord.deletionRequestedAt).toLocaleDateString()}`);
        }
        
        socket.emit('user:delete_requested', { success: true, deletionRequestedAt: userRecord.deletionRequestedAt });
        
        // Sync back to client
        socket.emit('user:registered', {
            userId: boundUserId,
            profile: userRecord,
            expiresAt: activeUsers.get(boundUserId)?.expiresAt || (now + USER_TTL),
            ttl: USER_TTL
        });
    }
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

    // PERSIST IMMEDIATELY
    saveMessages();
    
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
// RATE LIMITING SERVICE
// ============================================

class RateLimitService {
  constructor() {
    this.ipLimits = new Map(); // IP -> { count, windowStart }
    this.emailLimits = new Map(); // Email -> lastRequestTime
  }

  getIp(socket) {
    // Handle proxy headers if behind Nginx/Vercel
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return socket.handshake.address;
  }

  checkIpLimit(ip) {
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_REQUESTS = 5;
    
    const now = Date.now();
    const limit = this.ipLimits.get(ip) || { count: 0, windowStart: now };

    if (now - limit.windowStart > WINDOW_MS) {
      // Reset window
      limit.count = 1;
      limit.windowStart = now;
    } else {
      limit.count++;
    }

    this.ipLimits.set(ip, limit);

    if (limit.count > MAX_REQUESTS) {
      const resetIn = Math.ceil((limit.windowStart + WINDOW_MS - now) / 1000);
      return { limited: true, retryIn: resetIn };
    }
    return { limited: false };
  }

  checkEmailLimit(email) {
    const WINDOW_MS = 60 * 1000; // 60 seconds
    const now = Date.now();
    const lastRequest = this.emailLimits.get(email);

    if (lastRequest && now - lastRequest < WINDOW_MS) {
      const retryIn = Math.ceil((lastRequest + WINDOW_MS - now) / 1000);
      return { limited: true, retryIn };
    }

    this.emailLimits.set(email, now);
    return { limited: false };
  }
}

const rateLimiter = new RateLimitService();

// ============================================
// AUTHENTICATION HANDLERS
// ============================================

  socket.on('auth:request_code', async ({ email }) => {
    try {
      // 1. Strict Normalization
      const normalizedEmail = email ? email.normalize().trim().toLowerCase() : '';
      
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        return socket.emit('auth:error', { message: 'Invalid email' });
      }

      // 2. RATE LIMITS (Backend Enforcement)
      const ip = rateLimiter.getIp(socket);
      
      // IP Limit (5 req / 15 min)
      const ipCheck = rateLimiter.checkIpLimit(ip);
      if (ipCheck.limited) {
        console.warn(`[AUTH] IP Limit exceeded for ${ip}`);
        return socket.emit('auth:error', { 
            message: 'Too many requests from this IP. Start again later.', 
            retryIn: ipCheck.retryIn,
            code: 429 
        });
      }

      // Email Limit (1 req / 60 sec)
      const emailCheck = rateLimiter.checkEmailLimit(normalizedEmail);
      if (emailCheck.limited) {
         console.warn(`[AUTH] Email Limit exceeded for ${normalizedEmail}`);
         return socket.emit('auth:error', { 
             message: 'Please wait before requesting a new code.', 
             retryIn: emailCheck.retryIn,
             code: 429
         });
      }

      // 3. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      const now = Date.now();
      
      // Generate Magic Link Token
      const magicToken = crypto.randomBytes(32).toString('hex');

      console.log(`[AUTH DEBUG] Request for: '${normalizedEmail}' (IP: ${ip})`);

      // Store with 10 minute TTL
      authCodes.set(normalizedEmail, {
        otpHash,
        expiresAt: now + 10 * 60 * 1000,
        attempts: 0,
        lastSent: now
      });
      
      // 4. Persist immediately
      saveAuthCodes();

      magicTokens.set(magicToken, {
        email: normalizedEmail,
        expiresAt: now + 10 * 60 * 1000
      });

      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

      if (!resend) {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
        
        if (isProduction) {
            console.error('[AUTH] Registration ATTEMPTED in PROD without RESEND_API_KEY!');
            return socket.emit('auth:error', { message: 'Registration is currently unavailable.' });
        }

        console.warn('[AUTH] Resend API Key missing. Switching to MOCK MODE.');
        console.log(`[MOCK AUTH] OTP for ${normalizedEmail}: ${otp}`);
        console.log(`[MOCK AUTH] Magic Link: ${appUrl}?token=${magicToken}`);
        
        return socket.emit('auth:code_sent', { 
            email: normalizedEmail, 
            mock: true,
            otp: otp // Send OTP back for debug/demo
        });
      }

      // Send Email with Timeout
      console.log(`[AUTH] Attempting to send OTP to ${normalizedEmail} via Resend...`);
      const sendEmailPromise = resend.emails.send({
        from: 'StreamFlow <no-reply@mail.mana.kz>', // Must be verified in Resend dashboard!
        to: [normalizedEmail],
        subject: 'Ваш код для входа',
        text: `Ваш код для входа: ${otp}\n\nИли используйте ссылку: ${appUrl}?token=${magicToken}\n\nЕсли это были не вы — проигнорируйте письмо.`,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; color: #333;">
            <h2 style="color: #bc6ff1;">StreamFlow</h2>
            <p>Ваш код для входа:</p>
            <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; border-radius: 12px; letter-spacing: 5px;">
              ${otp}
            </div>
            <p style="margin-top: 20px;">Или нажмите кнопку ниже:</p>
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

      // Timeout Check (15 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timed out')), 15000)
      );

      try {
        const result = await Promise.race([sendEmailPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
          console.error('[AUTH] Resend error:', error);
          socket.emit('auth:error', { message: 'Failed to send email. Check verification status.' });
        } else {
          console.log('[AUTH] Email sent:', data.id);
          socket.emit('auth:code_sent', { email: normalizedEmail });
        }
      } catch (err) {
        console.error('[AUTH] Email send failed/timeout:', err);
        socket.emit('auth:error', { message: 'Email sending timed out. Please try again.' });
      }

    } catch (generalError) {
      console.error('[AUTH CRITICAL] Handler crashed:', generalError);
      socket.emit('auth:error', { message: 'Internal server error' });
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
      
      // PERSISTENT USER LOGIC
      let userRecord = null;
      for (const user of persistentUsers.values()) {
          if (user.email === normalizedEmail) {
              userRecord = user;
              break;
          }
      }

      if (!userRecord) {
          // CREATE NEW
          const isEarlyAdopter = persistentUsers.size < MAX_EARLY_USERS;
          
          userRecord = {
              id: crypto.randomUUID(),
              email: normalizedEmail,
              created_at: Date.now(),
              last_login_at: Date.now(),
              accountStatus: 'active', // Renamed to avoid config with online status
              role: isEarlyAdopter ? 'early_user' : 'regular',
              early_access: isEarlyAdopter,
              registrationTimestamp: Date.now(),
              free_until: isEarlyAdopter ? Date.now() + (1000 * 60 * 60 * 24 * 30 * 6) : null // 6 months approx
          };
          persistentUsers.set(userRecord.id, userRecord);
          console.log(`[AUTH] Created NEW User: ${userRecord.id} (Early: ${isEarlyAdopter})`);
      } else {
          // UPDATE EXISTING
          userRecord.last_login_at = Date.now();
          if (userRecord.accountStatus === 'blocked') {
              return socket.emit('auth:error', { message: 'Account blocked.' });
          }
           // Re-set to ensure map updates if it was uncoupled logic
          persistentUsers.set(userRecord.id, userRecord); 
      }
      savePersistentUsers();

      socket.emit('auth:success', { userId: userRecord.id, email: normalizedEmail, profile: userRecord });
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
    
    // PERSISTENT USER LOGIC (Duplicate of above, refactor later)
    let userRecord = null;
    for (const user of persistentUsers.values()) {
        if (user.email === email) {
            userRecord = user;
            break;
        }
    }

    if (!userRecord) {
        // CREATE NEW
        const isEarlyAdopter = persistentUsers.size < 100;
        
        userRecord = {
            id: crypto.randomUUID(),
            email: email,
            created_at: Date.now(),
            last_login_at: Date.now(),
            accountStatus: 'active',
            role: isEarlyAdopter ? 'early_user' : 'regular',
            early_access: isEarlyAdopter,
            registrationTimestamp: Date.now(),
            free_until: isEarlyAdopter ? Date.now() + (1000 * 60 * 60 * 24 * 30 * 6) : null
        };
        persistentUsers.set(userRecord.id, userRecord);
         console.log(`[AUTH] Created NEW User via Token: ${userRecord.id} (Early: ${isEarlyAdopter})`);
    } else {
        userRecord.last_login_at = Date.now();
        if (userRecord.accountStatus === 'blocked') {
            return socket.emit('auth:error', { message: 'Account blocked.' });
        }
        persistentUsers.set(userRecord.id, userRecord);
    }
    savePersistentUsers();

    socket.emit('auth:success', { userId: userRecord.id, email, profile: userRecord });
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

// Railway / Heroku / Generic PORT binding
// Note: Railway usually provides process.env.PORT. 3000 is the standard fallback.
const PORT = process.env.PORT || 3000;

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

app.get('/', (req, res) => {
  res.status(200).send('StreamFlow Server is Running');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StreamFlow Server running on port ${PORT}`);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Text Msgs: 60s TTL (Newest on Top)`);
  console.log(`   - Media Msgs: 30s TTL`);
  console.log(`   - Capacity: Max ${MAX_MESSAGES_PER_SESSION} per chat`);
});
