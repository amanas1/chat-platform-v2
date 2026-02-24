const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const MESSAGE_TTL = 30000; // 30 seconds
const MAX_MESSAGES = 50;
const REPORT_THRESHOLD = 3;

const allowedOrigins = [
  'https://auradiochat.com',
  'https://www.auradiochat.com',
  'https://stream-flow-main-2.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// --- MIDDLEWARE ---
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// --- IN-MEMORY STORAGE ---
const activeUsers = new Map(); // userId -> { profile, socketId }
const sessions = new Map();    // sessionId -> { participants: [id1, id2] }
const messages = new Map();    // sessionId -> Message[]
const reports = new Map();     // userId -> Set<reporterId>
const blocks = new Map();      // userId -> Set<blockedUserId>

// --- UTILS ---
const broadcastPresenceCount = () => {
  io.emit('presence:count', { 
    totalOnline: io.engine.clientsCount, 
    chatOnline: activeUsers.size 
  });
};

const getVisibleUsers = (requestingUserId) => {
  const userBlocks = blocks.get(requestingUserId) || new Set();
  return Array.from(activeUsers.values())
    .map(u => ({ ...u.profile, status: 'online' }))
    .filter(u => {
      const isBlockedByMe = userBlocks.has(u.id);
      const amIBlockedByThem = blocks.get(u.id)?.has(requestingUserId);
      return !isBlockedByMe && !amIBlockedByThem;
    });
};

// --- HTTP ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/test', (req, res) => res.json({ status: 'active', version: '3.0.0-minimal' }));
app.get('/api/location', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
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
    boundUserId = profile.id;
    activeUsers.set(boundUserId, { profile, socketId: socket.id });
    
    const regData = { userId: boundUserId, profile };
    if (callback) callback(regData);
    socket.emit('user:registered', regData);
    
    io.emit('presence:list', getVisibleUsers(null));
    broadcastPresenceCount();
  });

  socket.on('users:search', (filters) => {
    if (!boundUserId) return;
    let list = getVisibleUsers(boundUserId);
    
    if (filters.name) list = list.filter(u => u.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.gender && filters.gender !== 'any') list = list.filter(u => u.gender === filters.gender);
    if (filters.country && filters.country !== 'any') list = list.filter(u => u.country === filters.country);
    
    socket.emit('users:search:results', list);
  });

  socket.on('knock:send', ({ targetUserId }) => {
    if (!boundUserId) return;
    const target = activeUsers.get(targetUserId);
    const userBlocks = blocks.get(boundUserId);
    const targetBlocks = blocks.get(targetUserId);

    if (userBlocks?.has(targetUserId) || targetBlocks?.has(boundUserId)) return;
    if (target?.socketId) {
      io.to(target.socketId).emit('knock:received', {
        knockId: `k_${Date.now()}`,
        fromUserId: boundUserId,
        fromUser: activeUsers.get(boundUserId)?.profile
      });
      socket.emit('knock:sent', { targetUserId });
    }
  });

  socket.on('knock:accept', ({ fromUserId }) => {
    if (!boundUserId) return;
    const sessionId = [boundUserId, fromUserId].sort().join('_');
    sessions.set(sessionId, { participants: [boundUserId, fromUserId] });
    
    const partner = activeUsers.get(fromUserId);
    const me = activeUsers.get(boundUserId);

    if (me?.socketId) io.to(me.socketId).emit('session:created', { sessionId, partnerId: fromUserId, partnerProfile: partner?.profile });
    if (partner?.socketId) io.to(partner.socketId).emit('knock:accepted', { sessionId, partnerId: boundUserId, partnerProfile: me?.profile });
  });

  socket.on('session:join', ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (session?.participants.includes(boundUserId)) {
      socket.emit('session:created', { sessionId, participants: session.participants });
    }
  });

  socket.on('message:send', ({ sessionId, encryptedPayload, messageType, metadata }, ack) => {
    if (!boundUserId) return;
    const session = sessions.get(sessionId);
    if (!session?.participants.includes(boundUserId)) return;

    const message = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId,
      senderId: boundUserId,
      encryptedPayload,
      messageType,
      metadata,
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

    if (ack) ack({ success: true, messageId: message.id });

    setTimeout(() => {
      const msgs = messages.get(sessionId);
      if (msgs) {
        messages.set(sessionId, msgs.filter(m => m.id !== message.id));
        session.participants.forEach(pid => {
          const p = activeUsers.get(pid);
          if (p?.socketId) io.to(p.socketId).emit('message:expired', { messageId: message.id, sessionId });
        });
      }
    }, MESSAGE_TTL);
  });

  socket.on('messages:get', ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (session?.participants.includes(boundUserId)) {
      socket.emit('messages:list', { sessionId, messages: (messages.get(sessionId) || []).filter(m => m.expiresAt > Date.now()) });
    }
  });

  socket.on('user:report', ({ targetUserId }) => {
    if (!boundUserId || boundUserId === targetUserId) return;
    if (!reports.has(targetUserId)) reports.set(targetUserId, new Set());
    const targetReports = reports.get(targetUserId);
    targetReports.add(boundUserId);

    if (targetReports.size >= REPORT_THRESHOLD) {
      const target = activeUsers.get(targetUserId);
      if (target?.socketId) {
        io.to(target.socketId).emit('user:error', { message: 'Account terminated due to community reports.' });
        io.sockets.sockets.get(target.socketId)?.disconnect();
      }
      activeUsers.delete(targetUserId);
      reports.delete(targetUserId);
      io.emit('presence:list', getVisibleUsers(null));
    }
  });

  socket.on('user:block', ({ targetUserId }) => {
    if (!boundUserId) return;
    if (!blocks.has(boundUserId)) blocks.set(boundUserId, new Set());
    blocks.get(boundUserId).add(targetUserId);
    
    const sessionId = [boundUserId, targetUserId].sort().join('_');
    if (sessions.has(sessionId)) {
      sessions.delete(sessionId);
      messages.delete(sessionId);
      [boundUserId, targetUserId].forEach(uid => {
        const u = activeUsers.get(uid);
        if (u?.socketId) io.to(u.socketId).emit('session:close', { sessionId });
      });
    }
    socket.emit('user:blocked', { targetUserId });
    socket.emit('presence:list', getVisibleUsers(boundUserId));
  });

  socket.on('session:close', ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (session?.participants.includes(boundUserId)) {
      session.participants.forEach(pid => {
        const p = activeUsers.get(pid);
        if (p?.socketId) io.to(p.socketId).emit('session:close', { sessionId });
      });
      sessions.delete(sessionId);
      messages.delete(sessionId);
    }
  });

  socket.on('disconnect', () => {
    if (boundUserId) activeUsers.delete(boundUserId);
    broadcastPresenceCount();
    io.emit('presence:list', getVisibleUsers(null));
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Minimal Backend on port ${PORT}`));
