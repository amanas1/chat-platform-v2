import { io, Socket } from 'socket.io-client';
import { UserProfile, ChatMessage, ChatSession } from '../types';

/**
 * Get Socket.IO server URL
 * ONLY uses: 1) VITE_SOCKET_URL env variable, 2) localhost fallback
 * NO window.location, NO origin, NO platform detection
 */
const getSocketURL = (): string => {
  let url = import.meta.env.VITE_SOCKET_URL;
  
  // Use env variable if set
  if (url) {
    // If it doesn't start with http/https, assume https for production
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    return url;
  }
  
  // Fallback to localhost for development ONLY
  if (import.meta.env.DEV) {
      return 'http://localhost:3001';
  }
  
  // PRODUCTION FALLBACK (Strict)
  return 'https://streamflow-backend-production.up.railway.app';
};

const SERVER_URL = getSocketURL();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private currentProfile: UserProfile | null = null;
  
  // Expose URL for debugging
  public get serverUrl() {
    return SERVER_URL;
  }
  
  // Connection management
  get isConnected() {
    return this.socket?.connected || false;
  }

  onConnect(callback: () => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('connect', callback);
    return () => this.socket?.off('connect', callback);
  }

  async connect() {
    if (this.socket?.connected) return;
    
    console.log(`🔌 Connecting to Socket.IO server: ${SERVER_URL}`);
    
    // Create Socket.IO connection
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 45000, // Increased to 45s to reduce premature timeouts
      autoConnect: false, // We will call connect() manually
      forceNew: true, // Ensure a fresh connection instance
    });
    
    this.socket.connect();
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to AU RadioChat server');
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
  registerUser(profile: UserProfile, callback: (data: { userId: string; expiresAt: number; ttl: number; profile?: UserProfile; activeSessions?: any[] }) => void) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    this.currentProfile = profile;
    this.socket.emit('user:register', profile);
    this.socket.once('user:registered', callback);
  }

  async logout(): Promise<void> {
    this.disconnect();
    console.log('[AUTH] ✅ Logged out');
  }

  requestDeletion(callback: (data: { success: boolean; deletionRequestedAt?: number }) => void) {
    if (!this.socket) return;
    this.socket.emit('user:delete_request');
    this.socket.once('user:delete_requested', (data) => callback(data));
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
  onKnockAccepted(callback: (data: { knockId: string; sessionId: string; partnerId: string; partnerProfile: UserProfile }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('knock:accepted', callback);
    return () => this.socket?.off('knock:accepted', callback);
  }

  joinSession(sessionId: string) {
      if (!this.socket) return;
      this.socket.emit('session:join', { sessionId });
  }

  onPartnerJoined(callback: (data: { sessionId: string; partnerId: string }) => void): () => void {
      if (!this.socket) return () => {};
      this.socket.on('session:partner_joined', callback);
      return () => this.socket?.off('session:partner_joined', callback);
  }
  
  // Session management
  onSessionCreated(callback: (data: { sessionId: string; partnerId: string; partnerProfile: UserProfile; waitingForPartner?: boolean }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('session:created', callback);
    return () => this.socket?.off('session:created', callback);
  }
  
  // Messaging
  sendMessage(sessionId: string, encryptedPayload: string, messageType: 'text' | 'image' | 'audio' | 'video', metadata?: any, ackCallback?: (response: { success: boolean; messageId?: string; deliveredTo?: number; error?: string }) => void) {
    if (!this.socket) {
        console.error("Socket not initialized in sendMessage");
        if (ackCallback) ackCallback({ success: false, error: 'Socket not initialized' });
        return;
    }
    
    if (!this.socket.connected) {
        console.error("[SOCKET] Socket is disconnected, cannot send");
        if (ackCallback) ackCallback({ success: false, error: 'Socket disconnected' });
        return;
    }
    
    console.log(`[SOCKET] Emitting message:send via socket ${this.socket.id} (Connected: ${this.socket.connected}). Type: ${messageType}, Payload length: ${encryptedPayload?.length || 0}`);
    
    this.socket.emit('message:send', {
      sessionId,
      encryptedPayload,
      messageType,
      metadata
    }, ackCallback);
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

  // Bridge Session Controls
  closeSession(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('session:close', { sessionId });
  }

  blockSession(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('session:block', { sessionId });
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

  onAuthError(callback: (error: any) => void) {
      if (!this.socket) return () => {};
      this.socket.on('auth:error', callback);
      return () => this.socket?.off('auth:error', callback);
  }

  // Reporting
  sendReport(targetUserId: string, reason: string, messageId?: string) {
    if (this.socket) {
      this.socket.emit('user:report', { targetUserId, reason, messageId });
    }
  }

  // Anti-Spam: Block User (Persistent)
  blockUser(targetUserId: string) {
    if (this.socket) {
      this.socket.emit('user:block', { targetUserId });
    }
  }

  onUserBlocked(callback: (data: { targetUserId: string }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('user:blocked', callback);
    return () => this.socket?.off('user:blocked', callback);
  }

  // Anti-Spam: Suspension Listener
  onSuspended(callback: (data: { message: string; until: number; reason: string }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('user:suspended', callback);
    return () => this.socket?.off('user:suspended', callback);
  }

  // Generic listener
  onEvent(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => this.socket?.off(event, callback);
  }

  // Bridge nomenclature aliases
  endSession(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('bridge:end', { sessionId });
  }

  blockPartner(sessionId: string) {
    if (!this.socket) return;
    this.socket.emit('bridge:block', { sessionId });
  }

  // Legacy listener
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
