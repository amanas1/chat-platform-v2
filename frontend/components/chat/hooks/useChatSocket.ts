import { useEffect, useCallback, useRef } from 'react';
import { ChatAction } from '../state/chatReducer';
import { ChatState, ChatMessage, KnockState, SessionData, UserProfile } from '../types';
import socketService from '../../../services/socketService';
import { playKnockNotification, playMessageNotification } from '../utils/spatialSoundEngine';

export function useChatSocket(
  currentUser: UserProfile | null, 
  outgoingKnock: KnockState | null,
  activeSessionId: string | null,
  dispatch: React.Dispatch<ChatAction>
) {
  const registeredRef = useRef(false);
  const activeSessionRef = useRef(activeSessionId);
  const receivedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeSessionRef.current = activeSessionId;
  }, [activeSessionId]);

  // Auto connect and register
  useEffect(() => {
    registeredRef.current = false;
    socketService.connect();
    
    if (currentUser) {
      const registerAndSetOnline = () => {
        if (registeredRef.current) return;
        
        // Register handles formal session restoration etc.
        socketService.registerUser(currentUser as any, (res: any) => {
          console.log('[ChatV2] Registered:', res);
          registeredRef.current = true;
          // Explicitly set online after registration
          socketService.setOnline(currentUser as any);
        });
      };

      if (socketService.isConnected) {
        registerAndSetOnline();
      }
      
      const unsubConnect = socketService.onConnect(() => {
        registeredRef.current = false; // Reset on reconnect to trigger re-registration
        registerAndSetOnline();
      });
      
      return () => {
        unsubConnect();
        // Explicitly set offline on unmount if currentUser was active
        socketService.setOffline();
      };
    }
  }, [currentUser]);

  // Global Listeners
  useEffect(() => {
    const unsubPresence = socketService.onPresenceList((users: UserProfile[]) => {
      dispatch({ type: 'UPDATE_ONLINE_USERS', payload: users });
    });

    const unsubIncomingKnock = socketService.onEvent('knock:received', (knock: KnockState) => {
      dispatch({ type: 'USER_KNOCKED', payload: knock });
      playKnockNotification();
    });
    
    const unsubKnockSent = socketService.onEvent('knock:sent', (targetUserId: string) => {
       // Optional UI reflection
    });

    const unsubKnockAccepted = socketService.onEvent('knock:accepted', (data: SessionData) => {
      dispatch({ type: 'KNOCK_ACCEPTED', payload: data });
    });

    const unsubKnockRejected = socketService.onEvent('knock:rejected', () => {
      dispatch({ type: 'KNOCK_REJECTED', payload: null });
    });

    const unsubSessionCreated = socketService.onEvent('session:created', (data: SessionData) => {
      dispatch({ type: 'SESSION_CREATED', payload: data });
    });

    const unsubSessionEnded = socketService.onEvent('session:close', () => {
      dispatch({ type: 'SESSION_ENDED', payload: null });
    });

    const unsubSessionRestore = socketService.onEvent('session:restore', (data: any) => {
      dispatch({ type: 'SESSION_CREATED', payload: data });
      if (data.messages && Array.isArray(data.messages)) {
        // Prevent generic duplicate dispatch if same messages arrive
        data.messages.forEach((m: ChatMessage) => {
          if (!receivedMessageIds.current.has(m.id)) {
            receivedMessageIds.current.add(m.id);
            dispatch({ type: 'PRIVATE_MESSAGE_RECEIVED', payload: m });
          }
        });
      }
    });

    const unsubRoomMessage = socketService.onEvent('room:message', (msg: ChatMessage) => {
      dispatch({ type: 'ROOM_MESSAGE_RECEIVED', payload: msg });
      if (msg.senderId !== currentUser?.id) {
        playMessageNotification(false);
      }
    });

    const unsubRoomMessageExpired = socketService.onEvent('room:message:expired', (data: { messageId: string, roomId: string }) => {
      dispatch({ type: 'MESSAGE_EXPIRED', payload: { messageId: data.messageId, isPrivate: false } });
    });

    // Handle generic message receive
    const unsubMessageReceived = socketService.onEvent('message:received', (msg: ChatMessage) => {
      // Note: server doesn't differentiate room vs private on this specific event by default
      // We check if it matches an active session ID
      if (msg.sessionId && msg.sessionId === activeSessionRef.current) {
        if (!receivedMessageIds.current.has(msg.id)) {
          receivedMessageIds.current.add(msg.id);
          dispatch({ type: 'PRIVATE_MESSAGE_RECEIVED', payload: msg }); 
          if (msg.senderId !== currentUser?.id) {
            playMessageNotification(true);
          }
        }
      }
    });

    const unsubMessageExpired = socketService.onEvent('message:expired', (data: { messageId: string, sessionId: string }) => {
      dispatch({ type: 'MESSAGE_EXPIRED', payload: { messageId: data.messageId, isPrivate: true } });
    });

    return () => {
      unsubPresence();
      unsubIncomingKnock();
      unsubKnockSent();
      unsubKnockAccepted();
      unsubKnockRejected();
      unsubSessionCreated();
      unsubSessionEnded();
      unsubSessionRestore();
      unsubRoomMessage();
      unsubRoomMessageExpired();
      unsubMessageReceived();
      unsubMessageExpired();
    };
  }, [dispatch]);

  const sendKnock = useCallback((targetUserId: string) => {
    if (outgoingKnock?.status === 'pending') return;
    socketService.emit('knock:send', { targetUserId });
    dispatch({ 
        type: 'KNOCK_SENT', 
        payload: { id: `k_loc_${Date.now()}`, targetUserId, fromUserId: currentUser?.id || '', status: 'pending', timestamp: Date.now() } 
    });
  }, [currentUser, outgoingKnock, dispatch]);

  const acceptKnock = useCallback((knock: KnockState) => {
    socketService.emit('knock:accept', { fromUserId: knock.fromUserId });
  }, []);

  const rejectKnock = useCallback((knock: KnockState) => {
    socketService.emit('knock:reject', { fromUserId: knock.fromUserId });
    dispatch({ type: 'KNOCK_REJECTED', payload: null });
  }, [dispatch]);

  const closeSession = useCallback((sessionId: string) => {
    socketService.emit('session:close', { sessionId });
    dispatch({ type: 'SESSION_ENDED', payload: null });
  }, [dispatch]);

  const sendMessage = useCallback((sessionId: string, text: string) => {
    if (!socketService.isConnected) return;
    socketService.emit('message:send', { sessionId, text, messageType: 'text' });
    // Optimistic UI could be added here
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (!socketService.isConnected) return;
    socketService.emit('room:join', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socketService.isConnected) return;
    socketService.emit('room:leave', { roomId });
  }, []);

  const sendRoomMessage = useCallback((roomId: string, text: string) => {
    if (!socketService.isConnected) return;
    socketService.emit('room:message', { roomId, text });
  }, []);

  return {
    sendKnock,
    acceptKnock,
    rejectKnock,
    closeSession,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendRoomMessage
  };
}
