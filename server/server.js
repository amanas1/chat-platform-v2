import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const MESSAGE_TTL = 30000; // 30 seconds
const MAX_MESSAGES = 50;
const REPORT_THRESHOLD = 3;
const CLEANUP_INTERVAL = 5000; // 5 seconds

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
const activeUsers = new Map(); // userId -> { profile, socketId }
const sessions = new Map();    // sessionId -> { participants: [id1, id2] }
const messages = new Map();    // sessionId -> Message[]
const reports = new Map();     // userId -> Set<reporterId>
const blocks = new Map();      // userId -> Set<blockedUserId>

// --- UTILS & BROADCASTS ---
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
}, CLEANUP_INTERVAL);

// --- HTTP ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/test', (req, res) => res.json({ status: 'active', version: '5.0.0-hardened' }));
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
    
    // Prevent ghost users: disconnect old socket if exists
    const existing = activeUsers.get(profile.id);
    if (existing?.socketId && existing.socketId !== socket.id) {
      io.sockets.sockets.get(existing.socketId)?.disconnect(true);
    }

    boundUserId = profile.id;
    activeUsers.set(boundUserId, { profile, socketId: socket.id });
    
    const regData = { userId: boundUserId, profile };
    if (typeof callback === 'function') callback(regData);
    socket.emit('user:registered', regData);
    
    broadcastPresenceList();
    broadcastPresenceCount();
  });

  socket.on('users:search', (filters) => {
    if (!boundUserId) return;
    const safeFilters = filters || {};
    let list = getVisibleUsers(boundUserId);
    
    if (safeFilters.name) {
      const searchName = String(safeFilters.name).toLowerCase();
      list = list.filter(u => u.name && u.name.toLowerCase().includes(searchName));
    }
    if (safeFilters.gender && safeFilters.gender !== 'any') {
      list = list.filter(u => u.gender === safeFilters.gender);
    }
    if (safeFilters.country && safeFilters.country !== 'any') {
      list = list.filter(u => u.country === safeFilters.country);
    }
    
    socket.emit('users:search:results', list);
  });

  socket.on('knock:send', (payload) => {
    if (!boundUserId || !payload?.targetUserId) return;
    const { targetUserId } = payload;
    
    const target = activeUsers.get(targetUserId);
    if (!target) return;

    const myBlocks = blocks.get(boundUserId);
    const targetBlocks = blocks.get(targetUserId);
    if (myBlocks?.has(targetUserId) || targetBlocks?.has(boundUserId)) return;

    if (target.socketId) {
      io.to(target.socketId).emit('knock:received', {
        knockId: `k_${Date.now()}`,
        fromUserId: boundUserId,
        fromUser: activeUsers.get(boundUserId)?.profile
      });
      socket.emit('knock:sent', { targetUserId });
    }
  });

  socket.on('knock:accept', (payload) => {
    if (!boundUserId || !payload?.fromUserId) return;
    const { fromUserId } = payload;
    
    // Hardening: validate target, blocks, and online status
    const partner = activeUsers.get(fromUserId);
    const me = activeUsers.get(boundUserId);
    if (!partner || !me) return;

    const blocked = blocks.get(boundUserId)?.has(fromUserId) || blocks.get(fromUserId)?.has(boundUserId);
    if (blocked) return;

    // Prevent double session creation
    let existingSessionId = null;
    sessions.forEach((s, id) => {
      if (s.participants.includes(boundUserId) && s.participants.includes(fromUserId)) {
        existingSessionId = id;
      }
    });
    if (existingSessionId) return;

    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    sessions.set(sessionId, { participants: [boundUserId, fromUserId] });
    
    if (me.socketId) io.to(me.socketId).emit('session:created', { sessionId, partnerId: fromUserId, partnerProfile: partner.profile });
    if (partner.socketId) io.to(partner.socketId).emit('knock:accepted', { sessionId, partnerId: boundUserId, partnerProfile: me.profile });
  });

  socket.on('session:join', (payload) => {
    if (!boundUserId || !payload?.sessionId) return;
    const session = sessions.get(payload.sessionId);
    if (session?.participants.includes(boundUserId)) {
      socket.emit('session:created', { sessionId: payload.sessionId, participants: session.participants });
    }
  });

  socket.on('message:send', (payload, ack) => {
    if (!boundUserId || !payload?.sessionId || !payload?.encryptedPayload) return;
    const { sessionId, encryptedPayload, messageType, metadata } = payload;
    
    const session = sessions.get(sessionId);
    if (!session?.participants.includes(boundUserId)) return;

    const message = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId,
      senderId: boundUserId,
      encryptedPayload,
      messageType: messageType || 'text',
      metadata: metadata || {},
      timestamp: Date.now(),
      expiresAt: Date.now() + MESSAGE_TTL
    };

    if (!messages.has(sessionId)) messages.set(sessionId, []);
    const sessionMsgs = messages.get(sessionId);
    sessionMsgs.push(message);
    if (sessionMsgs.length > MAX_MESSAGES) sessionMsgs.shift();

    session.participants.forEach(pid => {
      const p = activeUsers.get(pid);
      if (p?.socketId) io.to(p.socketId).emit('message:received', message);
    });

    if (typeof ack === 'function') ack({ success: true, messageId: message.id });
  });

  socket.on('messages:get', (payload) => {
    if (!boundUserId || !payload?.sessionId) return;
    const session = sessions.get(payload.sessionId);
    if (session?.participants.includes(boundUserId)) {
      const now = Date.now();
      const list = (messages.get(payload.sessionId) || []).filter(m => m.expiresAt > now);
      socket.emit('messages:list', { sessionId: payload.sessionId, messages: list });
    }
  });

  socket.on('user:report', (payload) => {
    if (!boundUserId || !payload?.targetUserId || boundUserId === payload.targetUserId) return;
    const { targetUserId } = payload;
    
    if (!reports.has(targetUserId)) reports.set(targetUserId, new Set());
    const targetReports = reports.get(targetUserId);
    targetReports.add(boundUserId);

    if (targetReports.size >= REPORT_THRESHOLD) {
      const target = activeUsers.get(targetUserId);
      if (target?.socketId) {
        io.to(target.socketId).emit('user:error', { message: 'Account terminated due to community reports.' });
        io.sockets.sockets.get(target.socketId)?.disconnect(true);
      }
      
      // Ban Cleanup: Remove from activeUsers, reports, blocks, and sessions
      activeUsers.delete(targetUserId);
      reports.delete(targetUserId);
      blocks.delete(targetUserId);
      blocks.forEach(set => set.delete(targetUserId));

      sessions.forEach((session, sId) => {
        if (session.participants.includes(targetUserId)) closeSession(sId);
      });

      broadcastPresenceList();
      broadcastPresenceCount();
    }
  });

  socket.on('user:block', (payload) => {
    if (!boundUserId || !payload?.targetUserId) return;
    const { targetUserId } = payload;
    
    if (!blocks.has(boundUserId)) blocks.set(boundUserId, new Set());
    blocks.get(boundUserId).add(targetUserId);
    
    sessions.forEach((session, sId) => {
      if (session.participants.includes(boundUserId) && session.participants.includes(targetUserId)) {
        closeSession(sId);
      }
    });

    socket.emit('user:blocked', { targetUserId });
    broadcastPresenceList();
  });

  socket.on('session:close', (payload) => {
    if (!boundUserId || !payload?.sessionId) return;
    const session = sessions.get(payload.sessionId);
    if (session?.participants.includes(boundUserId)) {
      closeSession(payload.sessionId);
    }
  });

  socket.on('disconnect', () => {
    if (boundUserId) {
      // Memory Leak Prevention: Cleanup user sessions
      sessions.forEach((session, sId) => {
        if (session.participants.includes(boundUserId)) closeSession(sId);
      });
      activeUsers.delete(boundUserId);
    }
    broadcastPresenceList();
    broadcastPresenceCount();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Minimal Backend (Hardened) on port ${PORT}`));
