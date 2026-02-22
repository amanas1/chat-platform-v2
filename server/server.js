console.log("🚀 Starting AU RadioChat Server...");
console.log("🚀 Backend version 2.0 deployed");

// GLOBAL ERROR CATCHERS FOR PRODUCTION STABILITY
process.on('uncaughtException', (err) => {
    console.error(JSON.stringify({
      type: 'uncaughtException',
      message: err.message
    }));
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(JSON.stringify({
      type: 'unhandledRejection',
      message: reason && reason.message ? reason.message : String(reason)
    }));
});

const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const moderation = require('./moderation');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');
// Load environment variables (Railway provides these automatically)
require('dotenv').config();


// ENSURE DATA DIRECTORY EXISTS
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    console.log(`[INIT] Creating data directory: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
if (!fs.existsSync(AVATARS_DIR)) {
    console.log(`[INIT] Creating avatars directory: ${AVATARS_DIR}`);
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// Email auth is being removed in favor of UUID-based identity.

const app = express();

// 1. TRUST PROXY (Required for Vercel/Railway)
app.set('trust proxy', 1);

// 2. CORS CONFIGURATION (Absolute Priority)
const allowedOrigins = [
  'https://auradiochat.com',
  'https://www.auradiochat.com',
  'https://stream-flow-main-2.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(ao => origin === ao) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`[CORS] BLOCKED: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable Pre-Flight for all routes

// 3. BODY PARSERS
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Avatar Upload & Moderation
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve avatars statically
app.use('/avatars', express.static(AVATARS_DIR));

app.post('/api/moderate-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const fingerprint = req.body.fingerprint;

        if (!fingerprint) {
            return res.status(400).json({ error: 'Missing fingerprint' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'rejected', reason: 'No file uploaded' });
        }

        console.log(`[MODERATION] File details: size=${req.file.size} mimetype=${req.file.mimetype}`);

        // 1. Moderate using Google Vision
        console.log('[MODERATION] Starting moderation.moderateImage...');
        let modResult;
        try {
            modResult = await Promise.race([
              moderation.moderateImage(req.file.buffer),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Moderation timeout')), 5000)
              )
            ]);
        } catch (err) {
            if (err.message === 'Moderation timeout') {
                return res.status(503).json({ status: 'error', reason: 'Moderation service timeout' });
            }
            throw err;
        }
        console.log('[MODERATION] moderation.moderateImage result:', modResult);
        
        if (!modResult.approved) {
            console.warn(`[MODERATION] REJECTED: ${modResult.reason} (Code: ${modResult.errorCode})`);
            
            // Log NSFW violations to suspicious users
            if (modResult.errorCode === 'ERR_NSFW') {
                const suspiciousUsers = storage.load('suspicious_users', []);
                const existing = suspiciousUsers.find(u => u.fingerprint === fingerprint);
                
                if (existing) {
                    existing.violations += 1;
                    existing.lastSeenAt = Date.now();
                } else {
                    suspiciousUsers.push({
                        fingerprint,
                        violations: 1,
                        firstSeenAt: Date.now(),
                        lastSeenAt: Date.now(),
                        lastReason: modResult.reason
                    });
                }
                storage.save('suspicious_users', suspiciousUsers);
                console.log(`[SECURITY] Flagged suspicious user: ${fingerprint}`);
            }

            return res.status(400).json({ 
                status: 'rejected', 
                reason: modResult.reason,
                errorCode: modResult.errorCode
            });
        }

        // 2. Generate unique filename and save approved photo
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${crypto.randomUUID()}${ext}`;
        const filepath = path.join(AVATARS_DIR, filename);

        // Optional: Post-process with sharp to ensure consistency
        // await sharp(req.file.buffer).resize(512, 512, { fit: 'cover' }).toFile(filepath);
        fs.writeFileSync(filepath, req.file.buffer);

        const avatarUrl = `/avatars/${filename}`;
        console.log(`[MODERATION] APPROVED: ${avatarUrl}`);

        return res.json({ status: 'approved', labels: modResult.labels, url: avatarUrl });

    } catch (err) {
        console.error('[MODERATION] Error:', err);
        return res.status(500).json({ status: 'error', reason: err.message });
    }
});

// TEST ROUTE FOR DEPLOYMENT VERIFICATION
app.get('/api/test', (req, res) => {
    res.json({ 
        status: "backend working", 
        version: "2.1",
        timestamp: new Date().toISOString()
    });
});

// HEALTH ENDPOINT FOR UPTIME MONITORING
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

/**
 * Server-side IP Geolocation Proxy
 * Bypasses CORS and Mixed Content issues by fetching from the server
 */
app.get('/api/location', async (req, res) => {
    // Force JSON content type standard
    res.setHeader('Content-Type', 'application/json');

    try {
        // trust proxy is needed if behind Vercel/Nginx
        // x-forwarded-for can be a list: "client, proxy1, proxy2"
        const forwarded = req.headers['x-forwarded-for'];
        let ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

        // Clean up IP (remove ::ffff:)
        if (ip && ip.includes('::ffff:')) {
            ip = ip.replace('::ffff:', '');
        }

        console.log(`[GEO] Resolving IP: ${ip}`);

        if (!ip || ip === '127.0.0.1' || ip === '::1') {
             return res.json({ country: 'Unknown', city: 'Unknown', ip: ip || '127.0.0.1' });
        }

        // Use fetch with timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,query`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'fail') {
             console.warn('[GEO] Upstream lookup failed:', data.message);
             return res.json({ country: 'Unknown', city: 'Unknown', ip });
        }

        return res.json({
            country: data.country,
            city: data.city,
            countryCode: data.countryCode,
            ip: data.query
        });

    } catch (e) {
        console.error('[GEO] Server lookup failed:', e.message);
        // GUARANTEED JSON RETURN - NO HTML ERRORS
        return res.status(200).json({ country: 'Unknown', city: 'Unknown', error: 'Lookup failed' }); 
    }
});

app.post('/api/report-user', async (req, res) => {
    try {
        const { targetUserId, reason, reporterId } = req.body;
        if (!targetUserId) return res.status(400).json({ error: 'Missing target user ID' });

        console.log(`[REPORT] User ${reporterId} reported ${targetUserId}. Reason: ${reason}`);

        // 1. Log the report
        const reports = storage.load('user_reports', []);
        reports.push({
            reporterId,
            targetUserId,
            reason,
            timestamp: Date.now()
        });
        storage.save('user_reports', reports);

        // 2. Automated Action Logic
        const targetUser = persistentUsers.get(targetUserId);
        const suspiciousUsers = storage.load('suspicious_users', []);
        
        // Find if this user's fingerprint is in suspicious list
        const isSuspicious = suspiciousUsers.some(u => u.fingerprint === targetUser?.fingerprint);
        
        // Count total reports for this user
        const targetReports = reports.filter(r => r.targetUserId === targetUserId);

        if (isSuspicious) {
            // AUTO-BLOCK suspicious users on first report
            if (targetUser) {
                targetUser.accountStatus = 'blocked';
                targetUser.banReason = 'Community reports following moderation flags';
                persistentUsers.set(targetUserId, targetUser);
                savePersistentUsers();
                console.log(`[SECURITY] AUTO-BLOCKED suspicious user: ${targetUserId} due to report.`);
            }
            return res.json({ status: 'action_taken', action: 'blocked' });
        } else if (targetReports.length >= 3) {
            // Block normal users after 3 reports
            if (targetUser) {
                targetUser.accountStatus = 'blocked';
                targetUser.banReason = 'Multiple community reports';
                persistentUsers.set(targetUserId, targetUser);
                savePersistentUsers();
                console.log(`[SECURITY] BLOCKED user: ${targetUserId} after 3 reports.`);
            }
            return res.json({ status: 'action_taken', action: 'blocked' });
        }

        res.json({ status: 'reported' });
    } catch (error) {
        console.error('[REPORT] Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const server = http.createServer(app);
// Socket.io Setup with Stability Settings
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 20000, // Increased to Prevent Drops
  pingInterval: 10000, // Frequent Heartbeats
  transports: ['websocket', 'polling'] // Comprehensive Transport Support
});

// ============================================
// IN-MEMORY STORAGE WITH TTL & PERSISTENCE
// ============================================


const VOICE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (Voice)
const TEXT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (Text and Emojis)
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

// ============================================
// ANTI-SPAM: Knock Daily Limits (Persistent)
// Format: { [userId]: { count: number, resetAt: number } }
// ============================================
const knockLimits = storage.load('knock_limits', {});
const KNOCK_DAILY_MAX = 3;

function saveKnockLimits() {
  storage.save('knock_limits', knockLimits);
}

// ============================================
// ANTI-SPAM: IP Rate Limiting (In-Memory, Safe)
// ============================================
const ipConnectionLimits = new Map(); // ip -> { count, windowStart }
const IP_CONN_LIMIT = 150; // max connections per IP per minute (test)
const IP_CONN_WINDOW = 60000; // 1 minute

// Map: userId1:userId2 -> timestamp (24h block)
const reconnectBlocks = new Map(Object.entries(storage.load('reconnectBlocks', {})));

// Map: userId1:userId2 -> true (Indefinite block)
const permanentBlocks = new Map(Object.entries(storage.load('permanentBlocks', {})));

function saveBlocks() {
  storage.save('reconnectBlocks', Object.fromEntries(reconnectBlocks));
  storage.save('permanentBlocks', Object.fromEntries(permanentBlocks));
}

// Map: timestamp -> count (Online History)
const onlineHistory = storage.load('onlineHistory', {});

function saveOnlineHistory() {
  storage.save('onlineHistory', onlineHistory);
}

// ... (skipping unchanged code)

// Clean expired reconnect blocks every 6 hours (TTL 48h)
setInterval(() => {
  const now = Date.now();
  const TTL = 48 * 60 * 60 * 1000;

  for (const [key, timestamp] of reconnectBlocks.entries()) {
    if (now - timestamp > TTL) {
      console.log(`[TTL] reconnectBlock expired: ${key}`);
      reconnectBlocks.delete(key);
    }
  }

  storage.save('reconnectBlocks', Object.fromEntries(reconnectBlocks));
}, 6 * 60 * 60 * 1000);

// Clean expired IP connection limits every 5 minutes (memory leak protection)
setInterval(() => {
  const now = Date.now();

  for (const [ip, data] of ipConnectionLimits.entries()) {
    if (now - data.windowStart > IP_CONN_WINDOW) {
      ipConnectionLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Clean expired messages every 1 hour (Reduced I/O load)
setInterval(() => {
  const now = Date.now();
  let hasChanges = false;
  
  for (const [sessionId, messageList] of messages.entries()) {
    const freshMessages = messageList.filter(msg => {
      // Use pre-computed expiresAt (fallback to manual math if missing for legacy messages)
      if (msg.expiresAt) return now < msg.expiresAt;
      const ttl = (msg.messageType === 'voice' || msg.messageType === 'audio') ? VOICE_TTL : TEXT_TTL;
      return (now - msg.timestamp) < ttl;
    });
    
    if (freshMessages.length !== messageList.length) {
      hasChanges = true;
      if (freshMessages.length === 0) {
        messages.delete(sessionId);
        // Clean up orphaned session from memory when 7-day history expires
        activeSessions.delete(sessionId);
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
const persistentUsers = new Map(); // userId -> User
rawUsers.forEach(u => persistentUsers.set(u.id, u));

const registrationLog = new Map(Object.entries(storage.load('registrationLog', {})));

function saveRegistrationLog() {
  storage.save('registrationLog', Object.fromEntries(registrationLog));
}

function savePersistentUsers() {
  storage.save('users', Array.from(persistentUsers.values()));
}

function saveMessages() {
  // Convert Message Map to object for JSON storage
  // Map<sessionId, Message[]> -> Object<sessionId, Message[]>
  storage.save('messages', Object.fromEntries(messages));
}

// Removed magic link tokens




// Removed legacy device loading

// ============================================
// TTL CLEANUP JOBS
// ============================================



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
    return all.filter(u => !u.hideFromSearch).sort((a, b) => {
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

// Helper to completely destroy a session
function closeSession(sessionId, reason) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const participants = session.participants;

  // Notify participants about end
  participants.forEach(userId => {
    const user = activeUsers.get(userId);
    if (user?.socketId) {
      io.to(user.socketId).emit('session:ended', { sessionId, reason });
    }
  });

  messages.delete(sessionId);
  activeSessions.delete(sessionId);
  saveSessions();
  saveMessages();

  console.log(`[SESSION] Session ${sessionId} closed. Reason: ${reason}`);
}

function saveSessions() {
    storage.save('sessions', Object.fromEntries(activeSessions));
}

// ============================================
// PRESENCE TRACKING
// ============================================

const broadcastPresenceCount = (targetSocket = null) => {
    const totalOnline = io.engine.clientsCount;
    const chatOnline = activeUsers.size;
    const data = { totalOnline, chatOnline };
    
    if (targetSocket) {
        targetSocket.emit('presence:count', data);
    } else {
        io.emit('presence:count', data);
    }

};

setInterval(() => {
  const now = Date.now();
  onlineHistory[now] = io.engine.clientsCount;
  saveOnlineHistory();
}, 5 * 60 * 1000);

// Clean online history every 24 hours (Keep 30 days)
setInterval(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    let hasChanges = false;

    for (const timestamp in onlineHistory) {
        if (now - parseInt(timestamp) > thirtyDaysMs) {
            delete onlineHistory[timestamp];
            hasChanges = true;
        }
    }

    if (hasChanges) {
        saveOnlineHistory();
    }
}, 24 * 60 * 60 * 1000);

// ============================================
// SOCKET.IO EVENTS
// ============================================

// Removed legacy device authentication middleware

// ============================================
// SOCKET.IO CONNECTION HANDLER
// ============================================

io.on('connection', (socket) => {
  console.log(`[SOCKET] New connection: ${socket.id}`);

  // ============================================
  // ANTI-SPAM: Per-IP Connection Rate Limiting
  // ============================================
  try {
    const clientIp = (socket.handshake.headers['x-forwarded-for'] || '').split(',')[0].trim() || socket.handshake.address || 'unknown';
    const now = Date.now();
    const ipData = ipConnectionLimits.get(clientIp) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - ipData.windowStart > IP_CONN_WINDOW) {
      ipData.count = 0;
      ipData.windowStart = now;
    }
    ipData.count++;
    ipConnectionLimits.set(clientIp, ipData);

    if (ipData.count > IP_CONN_LIMIT) {
      moderation.logViolation(clientIp, 'ip_rate_limit', `IP exceeded ${IP_CONN_LIMIT} connections/min`);
      console.warn(`[RATE_LIMIT] IP ${clientIp} exceeded ${IP_CONN_LIMIT} conn/min. Disconnecting.`);
      socket.emit('user:error', { message: 'Too many connections. Please wait.' });
      socket.disconnect(true);
      return;
    }
  } catch (err) {
    console.error('[RATE_LIMIT] Error (non-fatal):', err.message);
    // Never crash — allow connection on error
  }

  broadcastPresenceCount(socket); // Send current count immediately to the new client
  broadcastPresenceCount(); // Then update everyone else
  
  // Send current user list immediately to the new socket (so carousel is populated)
  socket.emit('presence:list', getAllParticipants());
  
  let boundUserId = null;

  // WRAPPER FOR SAFE ASYNC HANDLING TO PREVENT CRASHES
  const safeHandler = (eventName, handler) => {
      return async (...args) => {
          let ackCalled = false;
          let originalAck = null;

          // If the last argument is a function, it's an ackCallback. Wrap it to intercept execution.
          if (args.length > 0 && typeof args[args.length - 1] === 'function') {
              originalAck = args[args.length - 1];
              args[args.length - 1] = (...cbArgs) => {
                  ackCalled = true;
                  originalAck(...cbArgs);
              };
          }

          try {
              // Await handles both synchronous and asynchronous inner functions natively
              await handler(...args);
          } catch (err) {
              // Structured JSON logging as requested (no raw stack dumps)
              console.error(JSON.stringify({
                  event: eventName,
                  userId: boundUserId || null,
                  error: err.message
              }));
              
              // Only call ackCallback if the handler itself didn't already call it before crashing
              if (originalAck && !ackCalled) {
                  originalAck({ success: false, error: 'Internal server error' });
              }
          }
      };
  };

  // USER JOINS
  socket.on('user:register', safeHandler('user:register', async (profile, callback) => {
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

    // 30-Day Lockdown Enforcement - REMOVED for Reversion
    let userRecord = persistentUsers.get(profile.id);
    if (userRecord) {
        const now = Date.now();
        
        // Update/Verify core fields
        userRecord.name = profile.name || userRecord.name;
        userRecord.age = profile.age || userRecord.age;
        userRecord.gender = profile.gender || userRecord.gender;
        userRecord.avatar = profile.avatar || userRecord.avatar;
        
        // Fix: Persist location data
        userRecord.country = profile.country || userRecord.country;
        userRecord.city = profile.city || userRecord.city || 'Unknown';

        userRecord.registrationTimestamp = userRecord.registrationTimestamp || now;
        profile.registrationTimestamp = userRecord.registrationTimestamp;
        
        // Always allowed updates
        userRecord.intentStatus = profile.intentStatus;
        userRecord.voiceIntro = profile.voiceIntro;
        userRecord.last_login_at = now;
        userRecord.fingerprint = profile.fingerprint || userRecord.fingerprint;
        userRecord.hideFromSearch = profile.hideFromSearch || false; // Persist privacy setting
        
        persistentUsers.set(profile.id, userRecord);
        savePersistentUsers();
    } else {
        // Create NEW persistent user if not exists
        const now = Date.now();
        userRecord = {
            ...profile,
            id: profile.id,
            created_at: now,
            last_login_at: now,
            registrationTimestamp: now,
            accountStatus: 'active',
            role: 'user',
            violations: 0,
            reportsAgainst: 0,
            // Ensure location data is captured on creation
            country: profile.country || 'Unknown',
            city: profile.city || 'Unknown'
        };
        
        // Save to persistence
        persistentUsers.set(profile.id, userRecord);
        savePersistentUsers();
        console.log(`[DB] Created NEW persistent user: ${profile.name} (${profile.id})`);
    }

    // BIND SOCKET & ACTIVATE USER
    boundUserId = profile.id;
    socket.userId = profile.id; 
    
    // Create/Update Active User Record (Consolidated)
    activeUsers.set(boundUserId, {
        profile: { 
            ...userRecord, 
            status: 'online' 
        },
        socketId: socket.id,
        isGuest: !profile.isAuthenticated,
        isAuthenticated: profile.isAuthenticated || false,
        isAdmin: profile.isAdmin || false,
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
      activeSessions: userSessions
    };

    if (callback) callback(regData);
    socket.emit('user:registered', regData);
    
    syncGlobalPresence();
    broadcastPresenceCount();
  }));

  // SEARCH USERS (Online + Offline)
  socket.on('users:search', safeHandler('users:search', async (filters) => {
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
        if (user.hideFromSearch) return false; // Hide users who opted out
        
        // Basic filtering
        if (filters.name && !user.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        
        if (filters.minAge && user.age < filters.minAge) return false;
        if (filters.maxAge && user.age > filters.maxAge) return false;
        
        if (filters.gender && filters.gender !== 'any' && user.gender !== filters.gender) {
          return false;
        }

        if (filters.country && filters.country !== 'any' && user.country !== filters.country) {
          return false;
        }

        if (filters.city && filters.city !== 'any' && user.city !== filters.city) {
          return false;
        }
        
        // Ensure only SUFFICIENT profiles are shown (name, age, avatar)
        // Removed hasAgreedToRules check to allow showing legacy users
        if (!user.name || !user.age || !user.avatar) return false;

        return true;
    });
    
    // Sort: Online first, then by last seen
    results.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return (b.last_login_at || 0) - (a.last_login_at || 0);
    });

    socket.emit('users:search:results', results);
  }));

  // IMMEDIATE ACCOUNT DELETION
  socket.on('user:delete_account', safeHandler('user:delete_account', async () => {
    if (!boundUserId) return;
    
    // 1. Remove from activeUsers
    activeUsers.delete(boundUserId);
    
    // 2. Remove from persistentUsers
    persistentUsers.delete(boundUserId);
    
    // 3. Clean up sessions + messages where user is a participant
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.participants.includes(boundUserId)) {
            activeSessions.delete(sessionId);
            messages.delete(sessionId);
        }
    }
    
    // 4. Clean up registration log
    for (const [key, val] of registrationLog.entries()) {
        if (val === boundUserId) {
            registrationLog.delete(key);
        }
    }
    
    // 5. Save all persistence
    savePersistentUsers();
    saveSessions();
    saveMessages();
    saveRegistrationLog();
    
    console.log(`[USER] Account ${boundUserId} permanently deleted.`);
    
    // 6. Confirm and disconnect
    socket.emit('user:deleted_confirmed');
    socket.disconnect(true);
    
    syncGlobalPresence();
    broadcastPresenceCount();
  }));

  // KNOCK (Request to chat)
  socket.on('knock:send', safeHandler('knock:send', async ({ targetUserId }) => {
    if (!boundUserId) return;
    
    const pairId = [boundUserId, targetUserId].sort().join(':');
    // Block check
    if (permanentBlocks.has(pairId)) {
        socket.emit('knock:error', { 
            message: 'Пользователь вас заблокировал.',
            reason: 'PERMANENT_BLOCK'
        });
        return;
    }

    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('knock:error', { message: 'Action restricted due to account status.' });
        return;
    }

    // ============================================
    // ANTI-SPAM: Knock Daily Limit (3/day free users)
    // ============================================
    const senderUser = persistentUsers.get(boundUserId);
    const isFreeUser = !senderUser?.early_access || (senderUser?.free_until && Date.now() >= senderUser.free_until);
    if (isFreeUser) {
      const now = Date.now();
      const limit = knockLimits[boundUserId];
      if (limit && limit.resetAt > now && limit.count >= KNOCK_DAILY_MAX) {
        const remaining = 0;
        socket.emit('knock:error', {
          message: `Daily knock limit reached (${KNOCK_DAILY_MAX}/${KNOCK_DAILY_MAX}). Resets in ${Math.ceil((limit.resetAt - now) / 3600000)}h.`,
          reason: 'DAILY_LIMIT',
          remaining
        });
        console.log(`[KNOCK] User ${boundUserId} hit daily limit (${KNOCK_DAILY_MAX})`);
        return;
      }
      // Reset if expired or first use
      if (!limit || limit.resetAt <= now) {
        knockLimits[boundUserId] = { count: 1, resetAt: now + 86400000 };
      } else {
        limit.count++;
      }
      saveKnockLimits();
    }

    const target = activeUsers.get(targetUserId);
    if (!target || !target.socketId) {
      socket.emit('knock:error', { message: 'User not found or offline' });
      return;
    }
    
    const knockId = `knock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    if (!knockRequests.has(targetUserId)) {
      knockRequests.set(targetUserId, new Set());
    }
    knockRequests.get(targetUserId).add(knockId);
    
    // Calculate remaining knocks for feedback
    const currentLimit = knockLimits[boundUserId];
    const remainingKnocks = isFreeUser && currentLimit ? Math.max(0, KNOCK_DAILY_MAX - currentLimit.count) : -1; // -1 = unlimited
    
    // Notify target user
    io.to(target.socketId).emit('knock:received', {
      knockId,
      fromUserId: boundUserId,
      fromUser: activeUsers.get(boundUserId)?.profile
    });
    
    socket.emit('knock:sent', { knockId, targetUserId, remainingKnocks });
  }));

  // KNOCK ACCEPT
  socket.on('knock:accept', safeHandler('knock:accept', async ({ knockId, fromUserId }) => {
    if (!boundUserId) return;
    
    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('knock:error', { message: 'Action restricted.' });
        return;
    }

    const existingSessionId = findSession(boundUserId, fromUserId);
    let sessionId;
    
    // Original Session model: Long-lived
    const SESSION_DURATION = 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + SESSION_DURATION;

    if (existingSessionId) {
      sessionId = existingSessionId;
      const session = activeSessions.get(sessionId);
      session.updatedAt = Date.now();
      session.expiresAt = expiresAt;
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      activeSessions.set(sessionId, {
        id: sessionId,
        participants: [boundUserId, fromUserId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: expiresAt
      });
      messages.set(sessionId, []);
    }
    saveSessions();

    console.log(`[CHAT] Started session ${sessionId} for [${boundUserId}, ${fromUserId}]`);
    
    // Remove knock request
    if (knockRequests.has(boundUserId)) {
      knockRequests.get(boundUserId).delete(knockId);
    }
    
    // Notify both users
    const user1 = activeUsers.get(boundUserId);
    const user2 = activeUsers.get(fromUserId);
    
    const startData = {
        sessionId,
        expiresAt,
        participants: [boundUserId, fromUserId]
    };

    if (user1?.socketId) {
      // Receiver (Mery) gets session immediately but UI waits
      io.to(user1.socketId).emit('session:created', {
        ...startData,
        partnerId: fromUserId,
        partnerProfile: user2?.profile,
        waitingForPartner: true // Flag to tell UI to show "Waiting..."
      });
    }
    
    if (user2?.socketId) {
      // Sender (Meta) gets "Knock Accepted" -> Needs to confirm join
      io.to(user2.socketId).emit('knock:accepted', {
        knockId,
        sessionId,
        partnerId: boundUserId,
        partnerProfile: user1?.profile
      });
    }
  }));

  // SESSION JOIN (Sender confirms entry)
  socket.on('session:join', safeHandler('session:join', async ({ sessionId }) => {
      if (!boundUserId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      
      const partnerId = session.participants.find(p => p !== boundUserId);
      const partner = activeUsers.get(partnerId);
      
      // Send full session data to Sender (now they enter)
      const startData = {
          sessionId,
          expiresAt: session.expiresAt,
          participants: session.participants
      };
      
      socket.emit('session:created', {
          ...startData,
          partnerId,
          partnerProfile: partner?.profile
      });
      
      // Notify Partner (Receiver) that Sender has joined
      if (partner?.socketId) {
          io.to(partner.socketId).emit('session:partner_joined', {
              sessionId,
              partnerId: boundUserId
          });
      }
  }));

  // KNOCK REJECT
  socket.on('knock:reject', safeHandler('knock:reject', async ({ knockId, fromUserId }) => {
    if (!boundUserId) return;
    
    if (knockRequests.has(boundUserId)) {
      knockRequests.get(boundUserId).delete(knockId);
    }
    
    const fromUser = activeUsers.get(fromUserId);
    if (fromUser?.socketId) {
      io.to(fromUser.socketId).emit('knock:rejected', { knockId });
    }
  }));

  // SEND MESSAGE (E2EE - server just relays encrypted payload)
  socket.on('message:send', safeHandler('message:send', async ({ sessionId, encryptedPayload, messageType, metadata }, ackCallback) => {
    if (!boundUserId) {
      if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Not registered' });
      return;
    }

    if (moderation.isUserBanned(boundUserId)) {
        socket.emit('message:error', { message: 'Your messages are temporarily restricted.' });
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Banned' });
        return;
    }

    if (moderation.checkRateLimit(boundUserId)) {
        const mutedUntil = moderation.getMutedUntil(boundUserId);
        socket.emit('message:error', { 
            message: 'You are sending messages too fast. Temporarily muted.',
            mutedUntil
        });
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Rate limited' });
        return;
    }
    
    const session = activeSessions.get(sessionId);
    if (!session || !session.participants.includes(boundUserId)) {
      socket.emit('message:error', { message: 'Invalid session' });
      if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Invalid session' });
      return;
    }

    // BRIDGE SESSION RESTRICTION: REMOVED

    const safeMetadata = (typeof metadata === 'object' && metadata !== null) ? metadata : {};

    const flagReason = safeMetadata?.text ? moderation.getFilterViolation(safeMetadata.text) : null;
    const isFlagged = flagReason !== null;
    
    if (isFlagged) {
        moderation.logViolation(boundUserId, flagReason, safeMetadata.text);
    }
    
    if (messageType === 'image' || messageType === 'video' || messageType === 'file') {
        console.error(`[MSG] ❌ Unsupported legacy message type (${messageType}) from ${boundUserId}`);
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Unsupported message type. Only text and voice are supported.' });
        return;
    }

    // Validate payload exists
    if (!encryptedPayload) {
        console.error(`[MSG] ❌ Empty payload from ${boundUserId}`);
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Empty payload' });
        return;
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ttl = (messageType === 'voice' || messageType === 'audio') ? VOICE_TTL : TEXT_TTL;
    
    const message = {
      id: messageId,
      sessionId,
      senderId: boundUserId,
      encryptedPayload,
      messageType,
      metadata: {
        ...safeMetadata,
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
    
    let deliveredCount = 0;
    session.participants.forEach(userId => {
      const user = activeUsers.get(userId);
      if (user?.socketId) {
        io.to(user.socketId).emit('message:received', message);
        deliveredCount++;
      }
    });

    // ACK callback to sender
    if (typeof ackCallback === 'function') {
        ackCallback({ success: true, messageId, deliveredTo: deliveredCount });
    }
  }));

  // USER REPORT
  socket.on('user:report', safeHandler('user:report', async ({ targetUserId, reason, messageId }) => {
    if (!boundUserId) return;

    // ANTI-SPAM: Reject self-reports
    if (boundUserId === targetUserId) {
      console.warn(`[REPORT] Self-report rejected: ${boundUserId}`);
      socket.emit('report:acknowledged', { success: false, reason: 'self_report' });
      return;
    }
    
    console.log(`[REPORT] User ${boundUserId} reported ${targetUserId}. Reason: ${reason}`);

    // Get reporter IP for unique validation
    const reporterIp = (socket.handshake.headers['x-forwarded-for'] || '').split(',')[0].trim() || socket.handshake.address || 'unknown';

    // 1. Log the report (with IP for deduplication)
    const reports = storage.load('user_reports', []);
    reports.push({
        reporterId: boundUserId,
        reporterIp,
        targetUserId,
        reason,
        messageId,
        timestamp: Date.now()
    });
    storage.save('user_reports', reports);

    // 2. Automated Action Logic
    const targetUser = persistentUsers.get(targetUserId);
    const suspiciousUsers = storage.load('suspicious_users', []);
    
    // Check if target user fingerprint is in suspicious list
    const isSuspicious = suspiciousUsers.some(u => u.fingerprint === targetUser?.fingerprint);

    if (isSuspicious) {
        // CASE A: User was already flagged for NSFW -> Instant block on first report
        if (targetUser) {
            targetUser.accountStatus = 'blocked';
            const banReason = 'Community reports following high-risk moderation flags';
            targetUser.banReason = banReason;
            persistentUsers.set(targetUserId, targetUser);
            savePersistentUsers();
            moderation.applyBan(targetUserId, 'perm', banReason);
            console.log(`[SECURITY] AUTO-BLOCKED suspicious user: ${targetUserId} due to community report.`);
            
            const targetSocketData = activeUsers.get(targetUserId);
            if (targetSocketData?.socketId) {
                io.to(targetSocketData.socketId).emit('user:error', {
                    message: 'Your access has been restricted due to community reports.',
                    reason: banReason
                });
            }
        }
    } else {
        // CASE B: 24h window — 3 unique reporters (different account + different IP) -> Temporary suspension
        const now = Date.now();
        const recentReports = reports.filter(r =>
            r.targetUserId === targetUserId &&
            now - r.timestamp < 86400000 // 24h window
        );

        // Deduplicate: count only unique (reporterId + reporterIp) pairs
        const uniqueReporters = new Map();
        recentReports.forEach(r => {
            // Only count if both account AND IP are different from existing entries
            if (!uniqueReporters.has(r.reporterId)) {
                uniqueReporters.set(r.reporterId, r.reporterIp);
            }
        });

        // Filter out reporters sharing the same IP (sock puppet protection)
        const uniqueIps = new Set();
        const trulyUniqueReporters = [];
        for (const [reporterId, ip] of uniqueReporters.entries()) {
            if (!uniqueIps.has(ip)) {
                uniqueIps.add(ip);
                trulyUniqueReporters.push(reporterId);
            }
        }

        console.log(`[REPORT] ${targetUserId} has ${trulyUniqueReporters.length} unique reporters in 24h (need 3 for suspension)`);

        if (trulyUniqueReporters.length >= 3 && targetUser) {
            targetUser.accountStatus = 'suspended';
            const banReason = 'Temporary suspension: 3+ unique reporters in 24h';
            targetUser.banReason = banReason;
            targetUser.suspendedAt = now;
            targetUser.suspendedUntil = now + 86400000;
            persistentUsers.set(targetUserId, targetUser);
            savePersistentUsers();
            moderation.applyBan(targetUserId, '1d', banReason);
            console.log(`[SECURITY] SUSPENDED user: ${targetUserId} for 24h (${trulyUniqueReporters.length} unique reporters).`);
            
            const targetSocketData = activeUsers.get(targetUserId);
            if (targetSocketData?.socketId) {
                io.to(targetSocketData.socketId).emit('user:suspended', {
                    message: 'Your profile is temporarily suspended for review.',
                    until: now + 86400000,
                    reason: banReason
                });
            }
        }
    }

    socket.emit('report:acknowledged', { success: true });
  }));

  // WEBRTC SIGNALING RELAY
  socket.on('webrtc:signal', safeHandler('webrtc:signal', async ({ targetUserId, signal }) => {
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
  }));

  // SESSION CONTROLS
  socket.on('session:close', safeHandler('session:close', async ({ sessionId }) => {
    if (!boundUserId) return;
    closeSession(sessionId, 'CLOSE');
  }));

  socket.on('session:block', safeHandler('session:block', async ({ sessionId }) => {
    if (!boundUserId) return;
    closeSession(sessionId, 'BLOCK');
  }));

  // ============================================
  // ANTI-SPAM: Block User (In-Chat, Persistent)
  // ============================================
  socket.on('user:block', safeHandler('user:block', async ({ targetUserId }) => {
    if (!boundUserId || boundUserId === targetUserId) return;
    const pairId = [boundUserId, targetUserId].sort().join(':');
    permanentBlocks.set(pairId, Date.now());
    saveBlocks();
    console.log(`[BLOCK] User ${boundUserId} blocked ${targetUserId}. PairId: ${pairId}`);
    socket.emit('user:blocked', { targetUserId });
  }));

  // GET MESSAGES for a session
  socket.on('messages:get', safeHandler('messages:get', async ({ sessionId }) => {
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
  }));

  // TYPING INDICATOR
  socket.on('typing:start', safeHandler('typing:start', async ({ sessionId }) => {
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
  }));

  socket.on('typing:stop', safeHandler('typing:stop', async ({ sessionId }) => {
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
  }));

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
        // Scrub user from memory to prevent memory leaks from dangling sockets
        activeUsers.delete(discUserId);
        
        // Notify everyone of updated online list
        syncGlobalPresence();
    }
    broadcastPresenceCount();
  });

  // ============================================
// RATE LIMITING SERVICE
// ============================================

// Rate limiting for auth initialization is handled within the /auth/init endpoint.

// Authentication is now handled silently via the /auth/init REST endpoint.

  // FEEDBACK VIA SOCKET
  socket.on('feedback:send', safeHandler('feedback:send', async ({ rating, message }) => {
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
  }));
});

// ============================================
// REST API ENDPOINTS
// ============================================

app.get('/stats', (req, res) => {
  res.json({
    users: activeUsers.size,
    sessions: activeSessions.size,
    totalMessages: Array.from(messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    memoryUsage: process.memoryUsage()
  });
});

// Email auth is handled implicitly by identity from Google (Client-side)

// MODERATION
// ============================================
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
// ADMIN ENDPOINTS
// ============================================

// Cleanup fake users (without avatar or agreement)
app.post('/admin/cleanup-fake-users', (req, res) => {
  const { adminPassword } = req.body;
  
  // Simple password protection
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[ADMIN] ADMIN_PASSWORD not configured');
    return res.status(500).json({ error: 'Admin not configured' });
  }
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const usersBefore = Array.from(persistentUsers.values());
  const usersBeforeCount = usersBefore.length;
  
  // Filter out users without avatar or agreement
  const removedUsers = [];
  for (const [userId, user] of persistentUsers.entries()) {
    if (!user.avatar || !user.hasAgreedToRules) {
      removedUsers.push({
        id: userId,
        name: user.name || 'no name',
        reason: !user.avatar ? 'no avatar' : 'no agreement'
      });
      persistentUsers.delete(userId);
      
      // Also remove from active users
      activeUsers.delete(userId);
    }
  }
  
  // Save changes
  savePersistentUsers();
  syncGlobalPresence();
  
  const usersAfterCount = persistentUsers.size;
  
  res.json({
    success: true,
    usersBefore: usersBeforeCount,
    usersAfter: usersAfterCount,
    usersRemoved: removedUsers.length,
    removedUsers: removedUsers
  });
});

// Full database wipe (For pre-launch cleanup)
app.post('/admin/nuke-all-users', (req, res) => {
  const { adminPassword } = req.body;
  
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[ADMIN] ADMIN_PASSWORD not configured');
    return res.status(500).json({ error: 'Admin not configured' });
  }
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const usersBefore = persistentUsers.size;
  const removedUsersList = Array.from(persistentUsers.values()).map(u => ({
    id: u.id,
    name: u.name || 'no name',
    created: new Date(u.created_at || u.registrationTimestamp).toISOString()
  }));
  
  // NUKE EVERYTHING
  persistentUsers.clear();
  activeUsers.clear();
  activeSessions.clear();
  messages.clear();
  knockRequests.clear();
  
  // Save empty state
  savePersistentUsers();
  saveSessions();
  saveMessages();
  
  syncGlobalPresence();
  broadcastPresenceCount();
  
  console.log(`[ADMIN] 💥 NUKED ALL USERS: ${usersBefore} users removed`);
  
  res.json({
    success: true,
    action: 'FULL_DATABASE_WIPE',
    usersBefore,
    usersAfter: 0,
    removedCount: usersBefore,
    removedUsers: removedUsersList,
    message: 'All users, sessions, and messages have been permanently deleted.'
  });
});


// ============================================
// START SERVER
// ============================================

// Railway / Heroku / Generic PORT binding
// Note: Railway usually provides process.env.PORT. 3000 is the standard fallback.
const PORT = process.env.PORT || 3001;

// Cleanup registration log every hour
setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [key, entry] of registrationLog.entries()) {
        if (now - entry.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
            registrationLog.delete(key);
            changed = true;
        }
    }
    if (changed) {
        storage.save('registrationLog', Object.fromEntries(registrationLog));
    }
}, 60 * 60 * 1000);

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html'));
});

app.get('/', (req, res) => {
  res.status(200).send('AU RadioChat Server is Running. Version: 2.0');
});

// 404 CATCH-ALL FOR JSON (Prevents HTML "Unexpected token <")
app.use((req, res) => {
    console.warn(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Route not found", path: req.url });
});

// 500 GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(JSON.stringify({
      type: 'http500',
      message: err.message
    }));
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AU RadioChat Server running on port ${PORT}`);
  console.log(`📡 Allowed Origins:`, allowedOrigins);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Text Msgs: 7d TTL`);
  console.log(`   - Voice Msgs: 7d TTL`);
  console.log(`   - Capacity: Max ${MAX_MESSAGES_PER_SESSION} per chat`);
});
