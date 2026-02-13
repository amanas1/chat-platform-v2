console.log("🚀 Starting AU RadioChat Server...");

// GLOBAL ERROR CATCHERS FOR PRODUCTION STABILITY
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const fs = require('fs');
console.log('[INIT] ✓ fs loaded');
const express = require('express');
console.log('[INIT] ✓ express loaded');
const http = require('http');
console.log('[INIT] ✓ http loaded');
const { Server } = require('socket.io');
console.log('[INIT] ✓ socket.io loaded');
const cors = require('cors');
console.log('[INIT] ✓ cors loaded');
const multer = require('multer');
console.log('[INIT] ✓ multer loaded');
const moderation = require('./moderation');
console.log('[INIT] ✓ moderation loaded');
const crypto = require('crypto');
console.log('[INIT] ✓ crypto loaded');
const path = require('path');
console.log('[INIT] ✓ path loaded');
const cookieParser = require('cookie-parser');
console.log('[INIT] ✓ cookie-parser loaded');
console.log('[INIT] ✓ devices NOT loaded (Legacy)');

// Load environment variables (Railway provides these automatically)
require('dotenv').config();
console.log('[INIT] ✓ dotenv configured');


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

// CORS configuration to allow cookies from Vercel frontend
const allowedOrigins = [
  'http://localhost:3000', // Local development (Frontend)
  'http://localhost:3001', // Local development (Backend/Self)
  'http://localhost:3002', // Local development (Your current port)
  'https://stream-flow-main-2.vercel.app', // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Enable credentials (cookies)
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Avatar Upload & Moderation
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve avatars statically
app.use('/avatars', express.static(AVATARS_DIR));

app.post('/api/moderate-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'rejected', reason: 'No file uploaded' });
        }

        console.log(`[MODERATION] File details: size=${req.file.size} mimetype=${req.file.mimetype}`);

        // 1. Moderate using Google Vision
        console.log('[MODERATION] Starting moderation.moderateImage...');
        const modResult = await moderation.moderateImage(req.file.buffer);
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

/**
 * Server-side IP Geolocation Proxy
 * Bypasses CORS and Mixed Content issues by fetching from the server
 */
app.get('/api/location', async (req, res) => {
    try {
        // trust proxy is needed if behind Vercel/Nginx
        // x-forwarded-for can be a list: "client, proxy1, proxy2"
        const forwarded = req.headers['x-forwarded-for'];
        let ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

        // Start local dev with a known KZ IP if localhost
        if (ip === '::1' || ip === '127.0.0.1') {
            ip = '95.56.242.1'; // Example Almaty IP
        }

        console.log(`[GEO] Resolving location for IP: ${ip}`);
        
        // Use ip-api.com (free, non-commercial, 45 requests/minute)
        // We use HTTP because the pro endpoint is HTTPS but requires key.
        // Free endpoint handles HTTP fine.
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,query`);
        const data = await response.json();

        if (data.status === 'success') {
             res.json({
                country: data.country,
                city: data.city,
                countryCode: data.countryCode,
                ip: data.query
            });
        } else {
             res.status(404).json({ error: 'Location not found' });
        }
    } catch (e) {
        console.error('[GEO] Server lookup failed:', e);
        res.status(500).json({ error: 'Internal server error' });
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

// Clean expired users every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiredUsers = [];
  let persistentModified = false; // Track if we need to save changes
  
  
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

  for (const [userId, user] of persistentUsers.entries()) {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const canDeleteAfter = (user.registrationTimestamp || user.created_at) + thirtyDaysMs;

      if (user.deletionRequestedAt && now > canDeleteAfter) {
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

    // Log to history (once per broadcast to all)
    if (!targetSocket) {
        const now = Date.now();
        onlineHistory[now] = totalOnline;
        saveOnlineHistory();
    }
};

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
  broadcastPresenceCount(socket); // Send current count immediately to the new client
  broadcastPresenceCount(); // Then update everyone else
  
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
        userRecord.detectedCountry = profile.detectedCountry || userRecord.detectedCountry;
        userRecord.detectedCity = profile.detectedCity || userRecord.detectedCity;

        userRecord.registrationTimestamp = userRecord.registrationTimestamp || now;
        profile.registrationTimestamp = userRecord.registrationTimestamp;
        
        // Always allowed updates
        userRecord.intentStatus = profile.intentStatus;
        userRecord.voiceIntro = profile.voiceIntro;
        userRecord.last_login_at = now;
        userRecord.fingerprint = profile.fingerprint || userRecord.fingerprint;
        
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
            detectedCountry: profile.detectedCountry,
            detectedCity: profile.detectedCity
        };
        
        // Save to persistence
        persistentUsers.set(profile.id, userRecord);
        savePersistentUsers();
        console.log(`[DB] Created NEW persistent user: ${profile.name} (${profile.id})`);
    }

    // 2. BIND SOCKET & ACTIVATE USER
    // This runs for BOTH existing and new users
    boundUserId = profile.id;
    socket.userId = profile.id; 
    
    // Create/Update Active User Record
    // Explicitly set flags to ensure Guest messaging works
    activeUsers.set(boundUserId, {
        ...userRecord,
        status: 'online',
        socketId: socket.id,
        isGuest: !profile.isAuthenticated,
        isAuthenticated: profile.isAuthenticated || false,
        isAdmin: profile.isAdmin || false
    });

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
  });

  // ACCOUNT DELETION REQUEST (30-day grace period)
  socket.on('user:delete_request', () => {
    if (!boundUserId) return;
    
    let userRecord = persistentUsers.get(boundUserId);
    if (userRecord) {
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const regTime = userRecord.registrationTimestamp || userRecord.created_at;
        const canDeleteAfter = regTime + thirtyDaysMs;

        if (now < canDeleteAfter) {
            const daysLeft = Math.ceil((canDeleteAfter - now) / (1000 * 60 * 60 * 24));
            return socket.emit('user:error', { 
                message: `Profile deletion available after 30 days. Please wait ${daysLeft} more days.`,
                code: 'DELETION_LOCKED'
            });
        }

        if (!userRecord.deletionRequestedAt) {
            userRecord.deletionRequestedAt = now;
            persistentUsers.set(boundUserId, userRecord);
            savePersistentUsers();
            console.log(`[USER] Deletion requested for ${boundUserId}.`);
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
    
    const pairId = [boundUserId, targetUserId].sort().join(':');
    console.log(`[DEBUG] Knock pairId: ${pairId}`);

    // Blocks - REMOVED for Reversion
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
    
    // Original Session model: Long-lived
    const SESSION_DURATION = 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + SESSION_DURATION;

    if (existingSessionId) {
      sessionId = existingSessionId;
      const session = activeSessions.get(sessionId);
      session.updatedAt = Date.now();
      session.expiresAt = expiresAt;
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
  });

  // SESSION JOIN (Sender confirms entry)
  socket.on('session:join', ({ sessionId }) => {
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

    // BRIDGE SESSION RESTRICTION: REMOVED

    const flagReason = metadata?.text ? moderation.getFilterViolation(metadata.text) : null;
    const isFlagged = flagReason !== null;
    
    if (isFlagged) {
        moderation.logViolation(boundUserId, flagReason, metadata.text);
    }
    
    if (messageType === 'image' || messageType === 'audio' || messageType === 'video') {
         console.log(`[MSG] 📸 Media message (${messageType}) from ${boundUserId}. Payload length: ${encryptedPayload.length}`);
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
    
    console.log(`[REPORT] User ${boundUserId} reported ${targetUserId}. Reason: ${reason}`);

    // 1. Log the report
    const reports = storage.load('user_reports', []);
    reports.push({
        reporterId: boundUserId,
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
    
    // Count total reports for this target user
    const targetReports = reports.filter(r => r.targetUserId === targetUserId);

    if (isSuspicious) {
        // CASE A: User was already flagged for NSFW -> Instant block on first report
        if (targetUser) {
            targetUser.accountStatus = 'blocked';
            const banReason = 'Community reports following high-risk moderation flags';
            targetUser.banReason = banReason;
            persistentUsers.set(targetUserId, targetUser);
            savePersistentUsers();
            
            // Centralized ban enforcement
            moderation.applyBan(targetUserId, 'perm', banReason);
            
            console.log(`[SECURITY] AUTO-BLOCKED suspicious user: ${targetUserId} due to community report.`);
            
            // Notify target if online
            const targetSocketData = activeUsers.get(targetUserId);
            if (targetSocketData?.socketId) {
                io.to(targetSocketData.socketId).emit('user:error', {
                    message: 'Your access has been restricted due to community reports.',
                    reason: banReason
                });
            }
        }
    } else if (targetReports.length >= 3) {
        // CASE B: Normal user reached 3 reports -> Automatic block
        if (targetUser) {
            targetUser.accountStatus = 'blocked';
            const banReason = 'Consensus community reports (3+)';
            targetUser.banReason = banReason;
            persistentUsers.set(targetUserId, targetUser);
            savePersistentUsers();
            
            // Centralized ban enforcement
            moderation.applyBan(targetUserId, 'perm', banReason);
            
            console.log(`[SECURITY] BLOCKED user: ${targetUserId} after reaching threshold (3 reports).`);
            
            const targetSocketData = activeUsers.get(targetUserId);
            if (targetSocketData?.socketId) {
                io.to(targetSocketData.socketId).emit('user:error', {
                    message: 'Your access has been restricted due to multiple reports.',
                    reason: banReason
                });
            }
        }
    }

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

  // SESSION CONTROLS
  socket.on('session:close', ({ sessionId }) => {
    if (!boundUserId) return;
    closeSession(sessionId, 'CLOSE');
  });

  socket.on('session:block', ({ sessionId }) => {
    if (!boundUserId) return;
    closeSession(sessionId, 'BLOCK');
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

// Rate limiting for auth initialization is handled within the /auth/init endpoint.

// Authentication is now handled silently via the /auth/init REST endpoint.

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
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cleanup2026secure';
  
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
  
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cleanup2026secure';
  
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
  res.status(200).send('AU RadioChat Server is Running');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AU RadioChat Server running on port ${PORT}`);
  console.log(`   - Users: 24h TTL`);
  console.log(`   - Text Msgs: 60s TTL (Newest on Top)`);
  console.log(`   - Media Msgs: 30s TTL`);
  console.log(`   - Capacity: Max ${MAX_MESSAGES_PER_SESSION} per chat`);
});
