import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const MESSAGE_TTL = 30000;
const MAX_MESSAGES = 50;
const MAX_ROOMS = 1000;
const MAX_SESSIONS = 5000;
const REPORT_THRESHOLD = 3;
const CLEANUP_INTERVAL = 5000;

const allowedOrigins = [
  'https://auradiochat.com',
  'https://www.auradiochat.com',
  'https://stream-flow-main-2.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// --- IN-MEMORY STORAGE ---
const activeUsers = new Map();
const sessions = new Map();
const messages = new Map();
const reports = new Map();
const blocks = new Map();
const rooms = new Map();
const rateLimits = new Map(); // userId -> { eventType: [timestamps] }

// --- UTILS, LOGGING & BROADCASTS ---
const sysLog = (event, data) => {
  console.log(`[SYS] ${new Date().toISOString()} | ${event} | ${JSON.stringify(data)}`);
};

const checkRateLimit = (userId, type, limit, windowMs) => {
  if (!rateLimits.has(userId)) rateLimits.set(userId, {});
  const userLimits = rateLimits.get(userId);
  if (!userLimits[type]) userLimits[type] = [];
  const now = Date.now();
  userLimits[type] = userLimits[type].filter(ts => now - ts < windowMs);
  if (userLimits[type].length >= limit) return false;
  userLimits[type].push(now);
  return true;
};

const sanitizeInput = (str) => {
  if (typeof str !== 'string') return null;
  const cleaned = str.replace(/<[^>]*>?/gm, '').trim().substring(0, 300);
  return cleaned.length > 0 ? cleaned : null;
};
const broadcastPresenceCount = () => {
  io.emit('presence:count', { 
    totalOnline: io.engine.clientsCount, 
    chatOnline: activeUsers.size 
  });
};

const getVisibleUsers = (requestingUserId) => {
  const userBlocks = blocks.get(requestingUserId) || new Set();
  return Array.from(activeUsers.values())
    .filter(u => u?.profile?.id)
    .map(u => ({ ...u.profile, status: 'online' }))
    .filter(u => {
      const targetUserId = u.id;
      if (targetUserId === requestingUserId) return true;
      const isBlockedByMe = userBlocks.has(targetUserId);
      const amIBlockedByThem = blocks.get(targetUserId)?.has(requestingUserId);
      return !isBlockedByMe && !amIBlockedByThem;
    });
};

const broadcastPresenceList = () => {
  activeUsers.forEach((userData, userId) => {
    if (userData?.socketId) {
      const visible = getVisibleUsers(userId);
      io.to(userData.socketId).emit('presence:list', visible);
    }
  });
};

const closeSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.participants.forEach(pid => {
    const p = activeUsers.get(pid);
    if (p?.socketId) io.to(p.socketId).emit('session:close', { sessionId });
  });
  sessions.delete(sessionId);
  messages.delete(sessionId);
};

// --- GLOBAL CLEANUP ---
setInterval(() => {
  const now = Date.now();
  
  // Clean private sessions
  messages.forEach((sessionMsgs, sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
      messages.delete(sessionId);
      return;
    }
    const expired = sessionMsgs.filter(m => m.expiresAt <= now);
    if (expired.length > 0) {
      messages.set(sessionId, sessionMsgs.filter(m => m.expiresAt > now));
      expired.forEach(msg => {
        session.participants.forEach(pid => {
          const p = activeUsers.get(pid);
          if (p?.socketId) io.to(p.socketId).emit('message:expired', { messageId: msg.id, sessionId });
        });
      });
    }
  });

  // Clean public rooms
  rooms.forEach((roomData, roomId) => {
    const expired = roomData.messages.filter(m => m.expiresAt <= now);
    if (expired.length > 0) {
      roomData.messages = roomData.messages.filter(m => m.expiresAt > now);
      expired.forEach(msg => {
        io.to(roomId).emit('room:message:expired', { messageId: msg.id, roomId });
      });
    }

    // Safety constraint: Delete empty rooms
    if (roomData.participants.size === 0 && roomData.messages.length === 0) {
      rooms.delete(roomId);
    }
  });

  // Purge old rate limits to prevent memory leak
  rateLimits.forEach((userLimits, userId) => {
    let hasRecent = false;
    Object.keys(userLimits).forEach(type => {
      userLimits[type] = userLimits[type].filter(ts => now - ts < 300000); // 5 min
      if (userLimits[type].length > 0) hasRecent = true;
    });
    if (!hasRecent) rateLimits.delete(userId);
  });
}, CLEANUP_INTERVAL);

// --- HTTP ROUTES ---
app.get('/', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/test', (req, res) => res.json({ status: 'active', version: '6.0.0-production' }));
app.get('/api/location', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '8.8.8.8');
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,city,query`);
    const data = await response.json();
    res.json(data.status === 'success' ? data : { country: 'Unknown', city: 'Unknown' });
  } catch (e) {
    res.json({ country: 'Unknown', city: 'Unknown' });
  }
});

// --- SOCKET.IO ---
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
  pingTimeout: 20000,
  pingInterval: 10000
});

io.on('connection', (socket) => {
  let boundUserId = null;
  broadcastPresenceCount();

  socket.on('user:register', (profile, callback) => {
    if (!profile?.id) return;
    
    if (!checkRateLimit(profile.id, 'user:register', 1, 3000)) {
      socket.emit('user:error', { message: 'Rate limit exceeded.' });
      return;
    }

    let reconnected = false;
    const existing = activeUsers.get(profile.id);
    if (existing?.socketId && existing.socketId !== socket.id) {
      io.sockets.sockets.get(existing.socketId)?.disconnect(true);
      reconnected = true;
    } else if (existing) {
      reconnected = true;
    }

    boundUserId = profile.id;
    activeUsers.set(boundUserId, { profile, socketId: socket.id });
    if (typeof callback === 'function') callback({ userId: boundUserId, profile });
    socket.emit('user:registered', { userId: boundUserId, profile });
    broadcastPresenceList();
    broadcastPresenceCount();

    if (reconnected) {
      rooms.forEach((room, roomId) => {
        if (room.participants.has(boundUserId)) {
          socket.join(roomId);
          if (room.messages && room.messages.length > 0) {
            room.messages.forEach(msg => socket.emit('room:message', msg));
          }
        }
      });
      sessions.forEach((session, sessionId) => {
        if (session.participants.includes(boundUserId)) {
          const partnerId = session.participants.find(id => id !== boundUserId) || boundUserId;
          const partnerProfile = activeUsers.get(partnerId)?.profile;
          socket.emit('session:restore', { 
            sessionId,
            partnerId,
            partnerProfile,
            messages: messages.get(sessionId) || []
          });
        }
      });
    }
  });

  // Alias for user:register for explicit presence management
  socket.on('user:online', (profile) => {
    if (!profile?.id) return;
    boundUserId = profile.id;
    activeUsers.set(boundUserId, { profile, socketId: socket.id });
    broadcastPresenceList();
    broadcastPresenceCount();
    sysLog('user_online', { userId: boundUserId });
  });

  socket.on('user:offline', () => {
    if (!boundUserId) return;
    activeUsers.delete(boundUserId);
    broadcastPresenceList();
    broadcastPresenceCount();
    sysLog('user_offline', { userId: boundUserId });
    boundUserId = null;
  });

  socket.on('users:search', (filters) => {
    if (!boundUserId) return;
    const sf = filters || {};
    let list = getVisibleUsers(boundUserId);
    if (sf.name) {
      const sn = String(sf.name).toLowerCase();
      list = list.filter(u => u.name && u.name.toLowerCase().includes(sn));
    }
    if (sf.gender && sf.gender !== 'any') list = list.filter(u => u.gender === sf.gender);
    if (sf.country && sf.country !== 'any') list = list.filter(u => u.country === sf.country);
    socket.emit('users:search:results', list);
  });

  socket.on('knock:send', (p) => {
    if (!boundUserId || !p?.targetUserId) return;
    
    if (!checkRateLimit(boundUserId, 'knock:send', 3, 10000)) {
      socket.emit('user:error', { message: 'Rate limit exceeded.' });
      return;
    }

    const target = activeUsers.get(p.targetUserId);
    if (!target) return;
    if (blocks.get(boundUserId)?.has(p.targetUserId) || blocks.get(p.targetUserId)?.has(boundUserId)) return;
    if (target.socketId) {
      io.to(target.socketId).emit('knock:received', {
        knockId: `k_${Date.now()}`,
        fromUserId: boundUserId,
        fromUser: activeUsers.get(boundUserId)?.profile
      });
      socket.emit('knock:sent', { targetUserId: p.targetUserId });
    }
  });

  socket.on('knock:accept', (p) => {
    if (!boundUserId || !p?.fromUserId) return;
    const partner = activeUsers.get(p.fromUserId);
    const me = activeUsers.get(boundUserId);
    if (!partner || !me) return;
    if (blocks.get(boundUserId)?.has(p.fromUserId) || blocks.get(p.fromUserId)?.has(boundUserId)) return;
    
    let existingSessionId = null;
    sessions.forEach((s, sId) => { 
      if (s.participants.includes(boundUserId) && s.participants.includes(p.fromUserId)) {
        existingSessionId = sId;
      }
    });

    if (existingSessionId) {
      if (me.socketId) io.to(me.socketId).emit('session:created', { sessionId: existingSessionId, partnerId: p.fromUserId, partnerProfile: partner.profile });
      if (partner.socketId) io.to(partner.socketId).emit('knock:accepted', { sessionId: existingSessionId, partnerId: boundUserId, partnerProfile: me.profile });
      return;
    }

    if (sessions.size >= MAX_SESSIONS) {
      socket.emit('server:busy', { message: 'Server capacity reached.' });
      return;
    }

    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    sessions.set(sessionId, { participants: [boundUserId, p.fromUserId] });
    if (me.socketId) io.to(me.socketId).emit('session:created', { sessionId, partnerId: p.fromUserId, partnerProfile: partner.profile });
    if (partner.socketId) io.to(partner.socketId).emit('knock:accepted', { sessionId, partnerId: boundUserId, partnerProfile: me.profile });
  });

  socket.on('knock:reject', (p) => {
    if (!boundUserId || !p?.fromUserId) return;
    const partner = activeUsers.get(p.fromUserId);
    if (partner?.socketId) {
      io.to(partner.socketId).emit('knock:rejected', { fromUserId: boundUserId });
    }
  });

  socket.on('messages:get', (p) => {
    if (!boundUserId || !p?.sessionId) return;
    const session = sessions.get(p.sessionId);
    if (session?.participants.includes(boundUserId)) {
      socket.emit('messages:list', { 
        sessionId: p.sessionId, 
        messages: messages.get(p.sessionId) || [] 
      });
    }
  });

  socket.on('session:join', (p) => {
    if (!boundUserId || !p?.sessionId) return;
    const session = sessions.get(p.sessionId);
    if (session?.participants.includes(boundUserId)) {
      socket.emit('messages:list', { sessionId: p.sessionId, participants: session.participants });
    }
  });

  socket.on('message:send', (p, ack) => {
    if (!boundUserId || !p?.sessionId) return;
    
    if (!checkRateLimit(boundUserId, 'message:send', 5, 5000)) {
      socket.emit('user:error', { message: 'Rate limit exceeded.' });
      return;
    }

    const cleanText = sanitizeInput(p.text);
    if (!p.encryptedPayload && !cleanText && !p.audio && !p.sticker) return;

    const session = sessions.get(p.sessionId);
    if (!session?.participants.includes(boundUserId)) return;
    
    const msg = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId: p.sessionId,
      senderId: boundUserId,
      encryptedPayload: p.encryptedPayload || null,
      text: cleanText,
      sticker: p.sticker || null,
      audio: p.audio || null,
      type: p.messageType || 'text',
      metadata: p.metadata || {},
      timestamp: Date.now(),
      expiresAt: Date.now() + MESSAGE_TTL
    };
    if (!messages.has(p.sessionId)) messages.set(p.sessionId, []);
    const sm = messages.get(p.sessionId);
    sm.push(msg);
    if (sm.length > MAX_MESSAGES) sm.shift();
    session.participants.forEach(pid => {
      const usr = activeUsers.get(pid);
      if (usr?.socketId) io.to(usr.socketId).emit('message:received', msg);
    });
    if (typeof ack === 'function') ack({ success: true, messageId: msg.id });
  });

  socket.on('user:delete', () => {
    if (!boundUserId) return;
    sessions.forEach((s, sId) => { 
      if (s.participants.includes(boundUserId)) closeSession(sId); 
    });
    activeUsers.delete(boundUserId);
    blocks.delete(boundUserId);
    blocks.forEach(set => set.delete(boundUserId));
    reports.delete(boundUserId);
    broadcastPresenceList();
    broadcastPresenceCount();
    boundUserId = null;
  });

  socket.on('user:report', (p) => {
    if (!boundUserId || !p?.targetUserId || boundUserId === p.targetUserId) return;
    if (!reports.has(p.targetUserId)) reports.set(p.targetUserId, new Set());
    const tr = reports.get(p.targetUserId);
    tr.add(boundUserId);
    if (tr.size >= REPORT_THRESHOLD) {
      sysLog('user_banned', { targetId: p.targetUserId, reporters: Array.from(tr) });
      const t = activeUsers.get(p.targetUserId);
      if (t?.socketId) {
        io.to(t.socketId).emit('user:error', { message: 'Account terminated due to community reports.' });
        io.sockets.sockets.get(t.socketId)?.disconnect(true);
      }
      activeUsers.delete(p.targetUserId);
      reports.delete(p.targetUserId);
      blocks.delete(p.targetUserId);
      blocks.forEach(set => set.delete(p.targetUserId));
      sessions.forEach((s, sId) => { if (s.participants.includes(p.targetUserId)) closeSession(sId); });
      broadcastPresenceList();
      broadcastPresenceCount();
    }
  });

  socket.on('user:block', (p) => {
    if (!boundUserId || !p?.targetUserId) return;
    if (!blocks.has(boundUserId)) blocks.set(boundUserId, new Set());
    blocks.get(boundUserId).add(p.targetUserId);
    sessions.forEach((s, sId) => { if (s.participants.includes(boundUserId) && s.participants.includes(p.targetUserId)) closeSession(sId); });
    socket.emit('user:blocked', { targetUserId: p.targetUserId });
    broadcastPresenceList();
  });

  socket.on('session:close', (p) => {
    if (!boundUserId || !p?.sessionId) return;
    if (sessions.get(p.sessionId)?.participants.includes(boundUserId)) closeSession(p.sessionId);
  });

  socket.on('room:join', (p) => {
    if (!boundUserId || !p?.roomId) return;
    
    if (!checkRateLimit(boundUserId, 'room:join', 5, 5000)) {
      socket.emit('user:error', { message: 'Rate limit exceeded.' });
      return;
    }

    if (!rooms.has(p.roomId) && rooms.size >= MAX_ROOMS) {
      socket.emit('server:busy', { message: 'Server capacity reached for public rooms.' });
      return;
    }

    socket.join(p.roomId);
    if (!rooms.has(p.roomId)) {
      rooms.set(p.roomId, { participants: new Set(), messages: [] });
    }
    const room = rooms.get(p.roomId);
    room.participants.add(boundUserId);
    
    socket.emit('room:joined', { roomId: p.roomId });
    
    // Usually rooms will send the recent history on join; although requirement says no history storage, 
    // it mentioned to return MAX_MESSAGES. We will just emit the current active ones.
    if (room.messages.length > 0) {
       room.messages.forEach(msg => socket.emit('room:message', msg));
    }
  });

  socket.on('room:leave', (p) => {
    if (!boundUserId || !p?.roomId) return;
    socket.leave(p.roomId);
    
    const room = rooms.get(p.roomId);
    if (room) {
      room.participants.delete(boundUserId);
      if (room.participants.size === 0 && room.messages.length === 0) {
        rooms.delete(p.roomId);
      }
    }
  });

  socket.on('room:message', (p) => {
    if (!boundUserId || !p?.roomId || !p?.text) return;

    if (!checkRateLimit(boundUserId, 'room:message', 5, 5000)) {
      socket.emit('user:error', { message: 'Rate limit exceeded.' });
      return;
    }
    
    const cleanText = sanitizeInput(p.text);
    if (!cleanText) return;

    const room = rooms.get(p.roomId);
    if (!room) return;
    if (!room.participants.has(boundUserId)) return;
    
    const msg = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      roomId: p.roomId,
      senderId: boundUserId,
      text: cleanText,
      type: 'text',
      timestamp: Date.now(),
      expiresAt: Date.now() + 10000 // 10s TTL for public rooms
    };
    
    room.messages.push(msg);
    if (room.messages.length > MAX_MESSAGES) room.messages.shift();
    
    io.to(p.roomId).emit('room:message', msg);
  });

  socket.on('disconnect', () => {
    if (boundUserId) {
      sessions.forEach((s, sId) => { 
        if (s.participants.includes(boundUserId)) {
          const bothOffline = s.participants.every(pid => pid === boundUserId || !activeUsers.has(pid));
          if (bothOffline) {
            closeSession(sId);
          }
        }
      });
      
      rooms.forEach((room, roomId) => {
        if (room.participants.has(boundUserId)) {
          room.participants.delete(boundUserId);
          if (room.participants.size === 0 && room.messages.length === 0) {
            rooms.delete(roomId);
          }
        }
      });

      activeUsers.delete(boundUserId);
    }
    broadcastPresenceList();
    broadcastPresenceCount();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Production Backend listening on port ${PORT}`));
