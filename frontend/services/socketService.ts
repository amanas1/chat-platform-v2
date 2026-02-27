import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';

/**
 * HARDENED ENTERPRISE SOCKET MANAGER v2
 * Designed for 100k+ concurrent users.
 * 
 * IMPROVEMENTS:
 * 1. Listener Safety: Duplicate-safe registration & auto-cleanup.
 * 2. Deterministic Control: Circuit Breaker & Manual Reset.
 * 3. Heartbeat Watchdog: Passive & Active stale connection detection.
 * 4. Production Logging: Environment-aware logging levels.
 * 5. Concurrency: Map-based presence management ready.
 */

export type SocketState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'FAILED' | 'CIRCUIT_BROKEN';

interface SocketMetrics {
  state: SocketState;
  reconnectAttempts: number;
  lastHeartbeat: number;
  activeUrl: string;
  errors: number;
  listenerCount: number;
}

const IS_PROD = import.meta.env.PROD;
const FALLBACK_URLS = [
  import.meta.env.VITE_SOCKET_URL,
  'https://streamflow-backend-production-d554.up.railway.app',
  'https://streamflow-main-2-production.up.railway.app'
].filter(Boolean) as string[];

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private state: SocketState = 'IDLE';
  
  // Backoff & Circuit Breaker
  private reconnectAttempt = 0;
  private maxAttempts = 8; // Failover threshold
  private totalFailThreshold = 20; // Circuit breaker threshold
  private baseDelay = 1000;
  private maxDelay = 30000;
  private circuitBreakerCooldown = 60000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Watchdog
  private lastActivity = Date.now();
  private watchdogInterval: NodeJS.Timeout | null = null;
  private HEARTBEAT_THRESHOLD = 45000; 

  // Failover
  private currentUrlIndex = 0;

  // Listener Registry
  private eventBus: Map<string, Set<Function>> = new Map();
  private metrics: SocketMetrics = {
    state: 'IDLE',
    reconnectAttempts: 0,
    lastHeartbeat: Date.now(),
    activeUrl: FALLBACK_URLS[0],
    errors: 0,
    listenerCount: 0
  };

  private constructor() {
    this.startWatchdog();
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Production-Aware Logging
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (level === 'debug' && IS_PROD) return;
    const prefix = `[SocketManager] ${message}`;
    switch (level) {
      case 'info': console.info(prefix, ...args); break;
      case 'warn': console.warn(prefix, ...args); break;
      case 'error': console.error(prefix, ...args); break;
      case 'debug': console.debug(prefix, ...args); break;
    }
  }

  private transition(newState: SocketState): void {
    const oldState = this.state;
    if (oldState === newState) return;
    this.state = newState;
    this.metrics.state = newState;
    this.log('info', `🚦 ${oldState} -> ${newState}`);
    this.dispatch('state_change', { from: oldState, to: newState });
  }

  public connect(): void {
    if (this.state === 'CONNECTED' || this.state === 'CONNECTING') {
      this.log('debug', 'Existing connection in progress, skipping connect()');
      return; 
    }

    if (this.state === 'CIRCUIT_BROKEN') {
        this.log('warn', 'Circuit breaker active. Manual reset required or wait for cooldown.');
        return;
    }

    this.clearTimers();
    this.transition('CONNECTING');
    
    const targetUrl = FALLBACK_URLS[this.currentUrlIndex];
    this.metrics.activeUrl = targetUrl;

    this.socket = io(targetUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: false, // Manual control
      timeout: 15000,
      autoConnect: true
    });

    this.bindInternalEvents();
  }

  private bindInternalEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempt = 0;
      this.lastActivity = Date.now();
      this.transition('CONNECTED');
      this.reattachListeners();
    });

    this.socket.on('disconnect', (reason) => {
      this.log('warn', `Disconnected: ${reason}`);
      this.transition('DISCONNECTED');
      if (reason !== 'io client disconnect') {
        this.handleRetry();
      }
    });

    this.socket.on('connect_error', (err) => {
      this.metrics.errors++;
      this.log('error', `Connection error on ${FALLBACK_URLS[this.currentUrlIndex]}: ${err.message}`);
      this.handleRetry();
    });

    this.socket.onAny((event) => {
      this.lastActivity = Date.now();
      this.log('debug', `Incoming event: ${event}`);
    });

    // Event Bus Proxy Logic - Simplified to avoid per-event listeners if not needed
    // But for 100k target, we only proxy what's registered to save CPU
  }

  private handleRetry(): void {
    if (this.reconnectTimer) return;
    if (this.state === 'CONNECTED' || this.state === 'CONNECTING') return;

    this.reconnectAttempt++;
    this.metrics.reconnectAttempts++;

    // Circuit Breaker Check
    if (this.metrics.reconnectAttempts > this.totalFailThreshold) {
        this.transition('CIRCUIT_BROKEN');
        this.log('error', '🛑 Circuit breaker tripped. Stopping reconnection attempts.');
        this.reconnectTimer = setTimeout(() => this.resetCircuit(), this.circuitBreakerCooldown);
        return;
    }

    // Failover Check
    if (this.reconnectAttempt > this.maxAttempts) {
      if (this.currentUrlIndex < FALLBACK_URLS.length - 1) {
        this.log('warn', '🌩️ Failover to next endpoint...');
        this.currentUrlIndex++;
        this.reconnectAttempt = 0;
        this.connect();
        return;
      } else {
        // Exhausted all URLs, restart cycle but keep total count for circuit breaker
        this.currentUrlIndex = 0;
        this.reconnectAttempt = 0;
      }
    }

    this.transition('RECONNECTING');

    const delay = Math.min(this.maxDelay, this.baseDelay * Math.pow(2, this.reconnectAttempt)) + Math.floor(Math.random() * 300);
    this.log('info', `Retry ${this.reconnectAttempt}/${this.maxAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resetCircuit(): void {
      this.log('info', 'Circuit breaker reset. Attempting recovery...');
      this.metrics.reconnectAttempts = 0;
      this.reconnectAttempt = 0;
      this.currentUrlIndex = 0;
      this.transition('IDLE');
      this.connect();
  }

  public forceReconnect(): void {
      this.log('info', 'Manual force-reconnect requested.');
      this.disconnect();
      this.metrics.reconnectAttempts = 0;
      this.reconnectAttempt = 0;
      this.connect();
  }

  private startWatchdog(): void {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      const now = Date.now();
      this.metrics.lastHeartbeat = now;

      if (this.state === 'CONNECTED' && (now - this.lastActivity > this.HEARTBEAT_THRESHOLD)) {
        this.log('warn', '🐕 Watchdog: Connection stale. Forcing recovery...');
        if (this.socket) {
            this.socket.disconnect(); // Controlled disconnect to trigger retry
        } else {
            this.handleRetry();
        }
      }
    }, 20000);
  }

  /**
   * Listener Registry with Duplicate Protection
   */
  public on(event: string, handler: Function): () => void {
    if (!this.eventBus.has(event)) {
      this.eventBus.set(event, new Set());
      // Lazy register to socket only when UI needs it
      this.socket?.on(event, (data) => this.dispatch(event, data));
    }
    
    const handlers = this.eventBus.get(event)!;
    if (handlers.has(handler)) {
        this.log('debug', `Duplicate handler for "${event}" ignored.`);
        return () => {};
    }

    handlers.add(handler);
    this.updateListenerMetrics();

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
          this.eventBus.delete(event);
          this.socket?.off(event);
      }
      this.updateListenerMetrics();
    };
  }

  private reattachListeners(): void {
    if (!this.socket) return;
    this.log('debug', 'Re-attaching all listeners to new socket instance...');
    this.eventBus.forEach((_, event) => {
      this.socket?.off(event); // Avoid doubles
      this.socket?.on(event, (data) => this.dispatch(event, data));
    });
  }

  private updateListenerMetrics(): void {
      let count = 0;
      this.eventBus.forEach(set => count += set.size);
      this.metrics.listenerCount = count;
  }

  public getListenerCount(): number {
      return this.metrics.listenerCount;
  }

  private dispatch(event: string, data: any): void {
    this.eventBus.get(event)?.forEach(h => h(data));
  }

  public emit(event: string, data?: any): void {
    if (this.state === 'CONNECTED') {
      this.socket?.emit(event, data);
    } else {
      this.log('warn', `Dropped emit "${event}": State is ${this.state}`);
    }
  }

  public getDiagnostics(): SocketMetrics {
    return { ...this.metrics };
  }

  public disconnect(): void {
    this.log('info', 'Teardown initiated.');
    this.clearTimers();
    if (this.socket) {
      this.socket.removeAllListeners(); // Safety against zombie internal listeners
      this.socket.disconnect();
      this.socket = null;
    }
    this.transition('DISCONNECTED');
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public cleanup(): void {
      this.disconnect();
      this.eventBus.clear();
      this.updateListenerMetrics();
      if (this.watchdogInterval) clearInterval(this.watchdogInterval);
  }

  public get isConnected(): boolean {
      return this.state === 'CONNECTED';
  }

  public get serverUrl(): string {
      return FALLBACK_URLS[this.currentUrlIndex];
  }

  // --- API COMPATIBILITY LAYER (Hardened for Production Minification) ---
  // Using arrow functions to ensure methods are attached to the instance property
  // and not dropped by aggressive tree-shaking in lazy-loaded chunks.
  
  public addListener = (event: string, handler: Function) => {
    return this.on(event, handler);
  };
  
  public registerUser = (user: UserProfile, callback?: Function) => {
    this.socket?.emit('user:register', user, (data: any) => {
      if (callback) callback(data);
    });
  };

  public setOnline = (user: UserProfile) => {
    this.emit('user:online', user);
  };

  public setOffline = () => {
    this.emit('user:offline');
  };

  public getMessages = (sessionId: string, callback?: Function) => {
    this.emit('messages:get', { sessionId });
    if (callback) {
      const unsub = this.on('messages:list', (data) => {
        if (data.sessionId === sessionId) {
          callback(data);
          unsub();
        }
      });
    }
  };

  public joinSession = (sessionId: string) => this.emit('session:join', { sessionId });
  public deleteAccount = (callback?: Function) => {
    this.emit('user:delete');
    if (callback) {
      const unsub = this.on('user:deleted', () => { callback(); unsub(); });
    }
  };

  public searchUsers = (filters: any, callback?: Function) => {
    this.emit('users:search', filters);
    if (callback) {
      const unsub = this.on('users:search:results', (data) => { callback(data); unsub(); });
    }
  };

  public sendKnock = (toUserId: string, callback?: Function) => {
    this.emit('knock:send', { targetUserId: toUserId });
    if (callback) {
      const unsub = this.on('knock:sent', (data) => { 
        if (data.toUserId === toUserId) { callback(data); unsub(); }
      });
    }
  };

  public acceptKnock = (knockId: string, fromUserId: string) => this.emit('knock:accept', { knockId, fromUserId });
  public rejectKnock = (knockId: string, fromUserId: string) => this.emit('knock:reject', { knockId, fromUserId });
  public blockUser = (userId: string) => this.emit('user:block', { targetUserId: userId });
  
  public sendReport = (userId: string, reason: string, messageId?: string) => {
    this.emit('user:report', { targetUserId: userId, reason, messageId });
  };

  public sendMessage = (sessionId: string, content: string, type: string = 'text', metadata?: any) => {
    this.socket?.emit('message:send', { 
      sessionId, 
      text: content, 
      messageType: type, 
      metadata: metadata || {} 
    });
  };

  // --- UI Compatibility Facade (Optimized Arrow Functions) ---
  public onPresenceCount = (cb: Function) => this.on('presence:count', cb);
  public onPresenceList = (cb: Function) => this.on('presence:list', cb);
  public onKnockReceived = (cb: Function) => this.on('knock:received', cb);
  public onKnockAccepted = (cb: Function) => this.on('knock:accepted', cb);
  public onKnockRejected = (cb: Function) => this.on('knock:rejected', cb);
  public onMessageReceived = (cb: Function) => this.on('message:received', cb);
  public onSessionCreated = (cb: Function) => this.on('session:created', cb);
  public onAuthError = (cb: Function) => this.on('user:error', cb);
  public onConnect = (cb: Function) => this.on('connect', cb);
  public onProfileExpiring = (cb: Function) => this.on('user:expiring', cb);
  public onProfileExpired = (cb: Function) => this.on('user:expired', cb);
  public onSuspended = (cb: Function) => this.on('user:suspended', cb);
  public onUserRestored = (cb: Function) => this.on('user:restored', cb);
  public onMessagesDeleted = (cb: Function) => this.on('chat:messages_deleted', cb);
  public onPartnerJoined = (cb: Function) => this.on('chat:partner_joined', cb);
  public onEvent = (ev: string, cb: Function) => this.on(ev, cb);
}

const socketService = SocketManager.getInstance();
export default socketService;
