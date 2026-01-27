import { io, Socket } from 'socket.io-client';
import { UserProfile, ChatMessage, ChatSession } from '../types';

/**
 * Get Socket.IO server URL
 * ONLY uses: 1) VITE_SOCKET_URL env variable, 2) localhost fallback
 * NO window.location, NO origin, NO platform detection
 */
const getSocketURL = (): string => {
  // Use env variable if set (production/mobile/custom)
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3001';
};

const SERVER_URL = getSocketURL();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentProfile: UserProfile | null = null;
  
  // Connection management
  get isConnected() {
    return this.socket?.connected || false;
  }

  onConnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  connect() {
    if (this.socket?.connected) return;
    
    console.log(`🔌 Connecting to Socket.IO server: ${SERVER_URL}`);
    
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to StreamFlow server');
      this.reconnectAttempts = 0;
      
      // Auto-re-register if we have a profile
      if (this.currentProfile) {
          console.log('[SOCKET] Auto-registering user after reconnect');
          this.emit('user:register', this.currentProfile);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // User registration
  registerUser(profile: UserProfile, callback: (data: { userId: string; expiresAt: number; ttl: number; activeSessions?: any[] }) => void) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    this.currentProfile = profile;
    this.socket.emit('user:register', profile);
    this.socket.once('user:registered', callback);
  }
  
  private emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
        this.socket.emit(event, data);
    }
  }
  
  // Listen for profile expiration warnings
  onProfileExpiring(callback: (data: { expiresIn: number }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('profile:expiring', callback);
    return () => this.socket?.off('profile:expiring', callback);
  }
  
  onProfileExpired(callback: () => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('profile:expired', callback);
    return () => this.socket?.off('profile:expired', callback);
  }
  
  // User search
  searchUsers(filters: {
    name?: string;
    minAge?: number;
    maxAge?: number;
    gender?: string;
    country?: string;
    city?: string;
  }, callback: (results: UserProfile[]) => void) {
    if (!this.socket) return;
    
    this.socket.emit('users:search', filters);
    this.socket.once('users:search:results', callback);
  }
  
  // Presence (online users list)
  onPresenceList(callback: (users: UserProfile[]) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('presence:list', callback);
    return () => this.socket?.off('presence:list', callback);
  }

  onPresenceCount(callback: (data: { totalOnline: number; chatOnline: number }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('presence:count', callback);
    return () => this.socket?.off('presence:count', callback);
  }
  
  // Knock system
  sendKnock(targetUserId: string, callback?: (data: { knockId: string; targetUserId: string }) => void) {
    if (!this.socket) return;
    
    this.socket.emit('knock:send', { targetUserId });
    if (callback) {
      this.socket.once('knock:sent', callback);
    }
  }
  
  onKnockReceived(callback: (data: { knockId: string; fromUserId: string; fromUser: UserProfile }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('knock:received', callback);
    return () => this.socket?.off('knock:received', callback);
  }
  
  acceptKnock(knockId: string, fromUserId: string) {
    if (!this.socket) return;
    this.socket.emit('knock:accept', { knockId, fromUserId });
  }
  
  rejectKnock(knockId: string, fromUserId: string) {
    if (!this.socket) return;
    this.socket.emit('knock:reject', { knockId, fromUserId });
  }
  
  onKnockRejected(callback: (data: { knockId: string }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('knock:rejected', callback);
    return () => this.socket?.off('knock:rejected', callback);
  }
  
  // Session management
  onSessionCreated(callback: (data: { sessionId: string; partnerId: string; partnerProfile: UserProfile }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('session:created', callback);
    return () => this.socket?.off('session:created', callback);
  }
  
  // Messaging
  sendMessage(sessionId: string, encryptedPayload: string, messageType: 'text' | 'image' | 'audio' | 'video', metadata?: any) {
    if (!this.socket) {
        console.error("Socket not initialized in sendMessage");
        return;
    }
    
    console.log(`[SOCKET] Emitting message:send via socket ${this.socket.id} (Connected: ${this.socket.connected})`);
    
    this.socket.emit('message:send', {
      sessionId,
      encryptedPayload,
      messageType,
      metadata
    });
  }
  
  onMessageReceived(callback: (message: any) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('message:received', callback);
    return () => this.socket?.off('message:received', callback);
  }
  
  getMessages(sessionId: string, callback: (data: { sessionId: string; messages: any[] }) => void) {
    if (!this.socket) return;
    
    this.socket.emit('messages:get', { sessionId });
    this.socket.once('messages:list', callback);
  }
  
  onMessagesDeleted(callback: (data: { sessionId: string; remainingCount: number }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('messages:deleted', callback);
    return () => this.socket?.off('messages:deleted', callback);
  }
  
  // Typing indicators
  startTyping(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { sessionId });
  }
  
  stopTyping(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { sessionId });
  }
  
  onTypingIndicator(callback: (data: { sessionId: string; userId: string; isTyping: boolean }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('typing:indicator', callback);
    return () => this.socket?.off('typing:indicator', callback);
  }
  
  // Feedback
  sendFeedback(rating: number, message: string) {
    if (!this.socket) return;
    this.socket.emit('feedback:send', { rating, message });
  }

  onFeedbackReceived(callback: (data: { success: boolean }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('feedback:received', callback);
    return () => this.socket?.off('feedback:received', callback);
  }

  // Reporting
  sendReport(targetUserId: string, reason: string, messageId?: string) {
    if (!this.socket) return;
    this.socket.emit('user:report', { targetUserId, reason, messageId });
  }

  // Generic listener
  addListener(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => this.socket?.off(event, callback);
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // WebRTC Signaling
  sendSignal(targetUserId: string, signal: any) {
    if (!this.socket) {
        console.error("[SOCKET] Cannot send signal - socket not connected");
        return;
    }
    console.log(`[SOCKET] Sending signal to ${targetUserId}:`, signal.type || 'candidate');
    this.socket.emit('webrtc:signal', { targetUserId, signal });
  }

  onSignalReceived(callback: (data: { fromUserId: string; signal: any }) => void): () => void {
    if (!this.socket) return () => {};
    console.log("[SOCKET] Listening for webrtc:signal");
    
    const handler = (data: any) => {
        console.log(`[SOCKET] Received signal from ${data.fromUserId}:`, data.signal.type || 'candidate');
        callback(data);
    };
    
    this.socket.on('webrtc:signal', handler);
    return () => this.socket?.off('webrtc:signal', handler);
  }
}

export const socketService = new SocketService();
