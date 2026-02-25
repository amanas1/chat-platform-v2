import React, { useReducer } from 'react';
import { chatReducer, initialChatState } from './state/chatReducer';
import { useChatSocket } from './hooks/useChatSocket';
import { useDiscoveryEngine } from './hooks/useDiscoveryEngine';
import socketService from '../../services/socketService';

import { RoomSelectorView } from './views/RoomSelectorView';
import { RoomView } from './views/RoomView';
import { DiscoveryView } from './views/DiscoveryView';
import { PrivateChatView } from './views/PrivateChatView';

import { KnockModal } from './overlays/KnockModal';
import { WaitingOverlay } from './overlays/WaitingOverlay';

interface ChatPlatformV2Props {
  // If the app passes auth info down
  currentUserOverride?: any; 
  onExit?: () => void;
}

export const ChatPlatformV2: React.FC<ChatPlatformV2Props> = ({ currentUserOverride, onExit }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  
  // If passed from props, update local state
  React.useEffect(() => {
    if (currentUserOverride) {
      dispatch({ type: 'SET_CURRENT_USER', payload: currentUserOverride });
    }
  }, [currentUserOverride]);

  const { 
    sendKnock, acceptKnock, rejectKnock, 
    closeSession, sendMessage,
    joinRoom, leaveRoom, sendRoomMessage
  } = useChatSocket(state.currentUser, state.outgoingKnock, state.activeSession?.sessionId || null, dispatch);

  // Watch for mode leaving room without properly cleaning up
  React.useEffect(() => {
    if (state.mode === 'discovery' && state.activeRoomId) {
      leaveRoom(state.activeRoomId);
      dispatch({ type: 'SET_ROOM', payload: '' });
    }
  }, [state.mode, state.activeRoomId, leaveRoom, dispatch]);

  // Engine calculates fair distribution for discovery view
  const discoveryFeed = useDiscoveryEngine(state.onlineUsers, state.currentUser, dispatch, 100);

  // Auto Recovery of state upon unexpected socket reconnects (e.g. server crash)
  const modeRef = React.useRef(state.mode);
  const activeRoomRef = React.useRef(state.activeRoomId);
  const activeSessionRef = React.useRef(state.activeSession);
  
  React.useEffect(() => {
    modeRef.current = state.mode;
    activeRoomRef.current = state.activeRoomId;
    activeSessionRef.current = state.activeSession;
  }, [state.mode, state.activeRoomId, state.activeSession]);

  React.useEffect(() => {
    const handler = () => {
      if (modeRef.current === 'room' && activeRoomRef.current) {
        joinRoom(activeRoomRef.current);
      }
      if (modeRef.current === 'private' && activeSessionRef.current) {
        socketService.joinSession(activeSessionRef.current.sessionId);
      }
    };
    const unsubConnect = socketService.onConnect(handler);
    return () => unsubConnect();
  }, [joinRoom]);

  // Interactions
  const handleSelectRoom = (roomId: string) => {
    if (state.activeRoomId === roomId) return;
    if (state.activeRoomId) leaveRoom(state.activeRoomId);
    dispatch({ type: 'SET_ROOM', payload: roomId });
    joinRoom(roomId);
  };

  const handleMessageSend = (text: string) => {
    if (state.mode === 'private' && state.activeSession) {
      sendMessage(state.activeSession.sessionId, text);
    } else if (state.mode === 'room' && state.activeRoomId) {
      sendRoomMessage(state.activeRoomId, text);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black font-['Plus_Jakarta_Sans']">
      
      {/* Overlays */}
      {state.incomingKnock && (
        <KnockModal 
          knock={state.incomingKnock}
          fromUser={state.onlineUsers.find(u => u.id === state.incomingKnock?.fromUserId)}
          onAccept={() => acceptKnock(state.incomingKnock!)}
          onReject={() => rejectKnock(state.incomingKnock!)}
        />
      )}

      {state.outgoingKnock && state.mode !== 'private' && (
        <WaitingOverlay 
          onCancel={() => dispatch({ type: 'KNOCK_REJECTED', payload: null })}
          targetName={state.onlineUsers.find(u => u.id === state.outgoingKnock?.targetUserId)?.name}
        />
      )}

      {/* Main Views Layering */}
      {state.mode === 'discovery' && (
        <DiscoveryView 
          users={discoveryFeed} 
          onKnockUser={sendKnock}
          onGoToRooms={() => dispatch({ type: 'SET_MODE', payload: 'room' })}
        />
      )}

      {state.mode === 'room' && !state.activeRoomId && (
        <RoomSelectorView 
          onSelectRoom={handleSelectRoom}
          onGoToDiscovery={() => dispatch({ type: 'SET_MODE', payload: 'discovery' })}
        />
      )}

      {state.mode === 'room' && state.activeRoomId && (
        <RoomView 
          roomId={state.activeRoomId}
          messages={state.roomMessages}
          currentUser={state.currentUser}
          onlineUsers={state.onlineUsers}
          onSendMessage={handleMessageSend}
          onLeaveRoom={() => {
            leaveRoom(state.activeRoomId!);
            dispatch({ type: 'SET_ROOM', payload: '' });
          }} 
        />
      )}

      {state.mode === 'private' && state.activeSession && (
        <PrivateChatView 
          session={state.activeSession}
          messages={state.privateMessages}
          currentUser={state.currentUser}
          onSendMessage={handleMessageSend}
          onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
        />
      )}

    </div>
  );
};

export default ChatPlatformV2;
