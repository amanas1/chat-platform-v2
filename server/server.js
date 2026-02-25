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
    const existing = activeUsers.get(profile.id);
    if (existing?.socketId && existing.socketId !== socket.id) {
      io.sockets.sockets.get(existing.socketId)?.disconnect(true);
    }
    boundUserId = profile.id;
    activeUsers.set(boundUserId, { profile, socketId: socket.id });
    if (typeof callback === 'function') callback({ userId: boundUserId, profile });
    socket.emit('user:registered', { userId: boundUserId, profile });
    broadcastPresenceList();
    broadcastPresenceCount();
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
    
    let existing = false;
    sessions.forEach(s => { if (s.participants.includes(boundUserId) && s.participants.includes(p.fromUserId)) existing = true; });
    if (existing) return;

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
    if (!p.encryptedPayload && !p.text && !p.audio && !p.sticker) return;
    const session = sessions.get(p.sessionId);
    if (!session?.participants.includes(boundUserId)) return;
    const msg = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId: p.sessionId,
      senderId: boundUserId,
      encryptedPayload: p.encryptedPayload || null,
      text: p.text || null,
      sticker: p.sticker || null,
      audio: p.audio || null,
      messageType: p.messageType || 'text',
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

  socket.on('disconnect', () => {
    if (boundUserId) {
      sessions.forEach((s, sId) => { if (s.participants.includes(boundUserId)) closeSession(sId); });
      activeUsers.delete(boundUserId);
    }
    broadcastPresenceList();
    broadcastPresenceCount();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Production Backend listening on port ${PORT}`));
