import React, { useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSlideSound } from './utils/audioEffects';
import { chatReducer, initialChatState } from './state/chatReducer';
import { useChatSocket } from './hooks/useChatSocket';
import { useDiscoveryEngine } from './hooks/useDiscoveryEngine';
import socketService from '../../services/socketService';
import { UserProfile } from '../../types';

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

  const isPublicLayerOpen = state.mode === 'room';
  const isPrivateView = state.mode === 'private' || (state.mode === 'room' && state.activeSession);

  return (
    <motion.div 
      className="fixed inset-y-0 right-0 w-full md:w-[900px] z-[100] flex justify-end pointer-events-none font-['Plus_Jakarta_Sans']"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
      onAnimationStart={() => playSlideSound()}
    >
      {/* Overlays (Global to ChatPlatform) */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Layer 1: Private Base */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] h-full bg-gradient-to-br from-[#0B0F1C] via-[#0E1324] to-[#111827] backdrop-blur-[12px] border-l border-white/5 flex flex-col pointer-events-auto shadow-[0_0_40px_rgba(168,85,247,0.15),0_20px_60px_rgba(0,0,0,0.6)] origin-right overflow-hidden"
        animate={{ 
          x: isPublicLayerOpen ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : -150) : 0,  
          scale: isPublicLayerOpen ? 0.95 : 1, 
          filter: isPublicLayerOpen ? 'brightness(0.6)' : 'brightness(1)' 
        }}
        transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
      >
        {/* Header with Close - Only visible if we are not covered by Public Layer on Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0 shadow-sm relative z-10">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-white/90">Communications</h2>
            <button onClick={onExit} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95">✕</button>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {isPrivateView && state.activeSession ? (
            <PrivateChatView 
              session={state.activeSession}
              messages={state.privateMessages}
              currentUser={state.currentUser}
              onSendMessage={handleMessageSend}
              onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
            />
          ) : (
            <DiscoveryView 
              users={(discoveryFeed as unknown) as UserProfile[]} 
              onKnockUser={sendKnock}
              onGoToRooms={() => dispatch({ type: 'SET_MODE', payload: 'room' })}
            />
          )}
        </div>
      </motion.div>

      {/* Layer 2: Public Layer */}
      <AnimatePresence>
        {isPublicLayerOpen && (
          <motion.div 
            className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] h-full bg-gradient-to-br from-[#0B0F1C] via-[#0D1120] to-[#0A0E1A] backdrop-blur-[16px] border-l border-white/10 flex flex-col pointer-events-auto shadow-[-20px_0_40px_rgba(0,0,0,0.5)] overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
            onAnimationStart={() => playSlideSound()}
          >
            {/* Header for Public Layer */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 shrink-0 relative z-10 shadow-sm">
               <button onClick={() => dispatch({ type: 'SET_MODE', payload: 'discovery' })} className="text-slate-400 hover:text-white transition-all hover:-translate-x-1 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 ← Back
               </button>
               <h2 className="text-sm font-black tracking-[0.2em] uppercase text-white/90">System Node</h2>
               <button onClick={onExit} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95">✕</button>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
              {state.activeRoomId ? (
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
              ) : (
                <RoomSelectorView 
                  onSelectRoom={handleSelectRoom}
                  onGoToDiscovery={() => dispatch({ type: 'SET_MODE', payload: 'discovery' })}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ChatPlatformV2;
