import React, { useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSlideSound } from './utils/audioEffects';
import { chatReducer, initialChatState } from './state/chatReducer';
import { useChatSocket } from './hooks/useChatSocket';
import { useDiscoveryEngine } from './hooks/useDiscoveryEngine';
import socketService from '../../services/socketService';
import { UserProfile } from '../../types';
import { TRANSLATIONS } from '../../types/constants';

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
  language?: string;
}

export const ChatPlatformV2: React.FC<ChatPlatformV2Props> = ({ currentUserOverride, onExit, language = 'en' }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  
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

  // Internal Tab State for Main Panel modes
  const [activeTab, setActiveTab] = React.useState<'registration' | 'search' | 'conversations'>('registration');

  // Sync mode changes to tabs if they come from elsewhere
  React.useEffect(() => {
    if (state.mode === 'discovery' && activeTab !== 'search') setActiveTab('search');
    if (state.mode === 'private' && activeTab !== 'conversations') setActiveTab('conversations');
  }, [state.mode]);

  // Clean up active room if we leave the public panel
  React.useEffect(() => {
    if (state.mode !== 'room' && state.activeRoomId) {
      leaveRoom(state.activeRoomId);
      dispatch({ type: 'SET_ROOM', payload: '' });
    }
  }, [state.mode, state.activeRoomId, leaveRoom, dispatch]);

  // Handle Tab Switching
  const handleTabClick = (tabId: string) => {
    if (tabId === 'public') {
      dispatch({ type: 'SET_MODE', payload: 'room' });
    } else if (tabId === 'search') {
      dispatch({ type: 'SET_MODE', payload: 'discovery' });
      setActiveTab('search');
    } else if (tabId === 'conversations') {
      dispatch({ type: 'SET_MODE', payload: 'private' });
      setActiveTab('conversations');
    } else if (tabId === 'registration') {
      setActiveTab('registration');
      // If we go to registration, maybe clear room mode so panel slides back
      if (state.mode === 'room') {
        dispatch({ type: 'SET_MODE', payload: 'discovery' }); 
      }
    }
  };

  const isPublicLayerOpen = state.mode === 'room';

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

  // Base Style Constants
  const DEEP_GRADIENT = "bg-gradient-to-b from-[#0b0f1a] via-[#0e1424] to-[#0a0d16]";
  const GLASS_BASE = "bg-[rgba(255,255,255,0.04)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)]";

  return (
    <div className="fixed inset-y-4 right-4 z-[100] flex pointer-events-none font-['Plus_Jakarta_Sans'] h-[calc(100vh-32px)]">
      
      {/* Overlays */}
      <AnimatePresence>
        {state.incomingKnock && (
          <KnockModal 
            knock={state.incomingKnock}
            fromUser={state.onlineUsers.find(u => u.id === state.incomingKnock?.fromUserId)}
            onAccept={() => acceptKnock(state.incomingKnock!)}
            onReject={() => rejectKnock(state.incomingKnock!)}
            language={language}
          />
        )}
        {state.outgoingKnock && state.mode !== 'private' && (
          <WaitingOverlay 
            onCancel={() => dispatch({ type: 'KNOCK_REJECTED', payload: null })}
            targetName={state.onlineUsers.find(u => u.id === state.outgoingKnock?.targetUserId)?.name}
            language={language}
          />
        )}
      </AnimatePresence>

      <div className="relative w-[420px] h-full overflow-hidden rounded-[24px] shadow-[[-20px_0_40px_rgba(0,0,0,0.4)]]">
        
        {/* SLIDING FLEX CONTAINER (Width: 840px = 420px + 420px) */}
        <motion.div 
          className="flex h-full w-[840px]"
          initial={false}
          animate={{ x: isPublicLayerOpen ? 0 : -420 }} // When open, shift to show left panel (x=0). When closed, shift to show right panel (x=-420).
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          onAnimationStart={() => isPublicLayerOpen && playSlideSound()}
        >

          {/* PUBLIC PANEL (Left side of flex, Width: 420px) */}
          <div className={`w-[420px] flex flex-col pointer-events-auto shrink-0 z-10 ${DEEP_GRADIENT} ${GLASS_BASE} rounded-none border-0`}>
            {/* Public Panel Header */}
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shadow-sm relative z-10 shrink-0">
               <button onClick={() => handleTabClick('search')} className="text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 ← Назад
               </button>
               <h2 className="text-sm font-black tracking-[0.2em] uppercase text-white/90">Публичные комнаты</h2>
            </div>

            <div className="flex-1 relative overflow-y-auto no-scrollbar flex flex-col">
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
                  language={language}
                />
              ) : (
                <RoomSelectorView 
                  onSelectRoom={handleSelectRoom}
                  onGoToDiscovery={() => handleTabClick('search')}
                  language={language}
                />
              )}
            </div>
          </div>

          {/* MAIN CHAT PANEL (Right side of flex, Width: 420px) */}
          <div className={`w-[420px] flex flex-col pointer-events-auto shrink-0 z-20 overflow-hidden ${DEEP_GRADIENT} ${GLASS_BASE} rounded-none border-0 border-l border-[rgba(255,255,255,0.05)]`}>
            
            {/* Main Panel Content Area */}
            <div className="flex-1 relative overflow-y-auto no-scrollbar flex flex-col">
               {activeTab === 'registration' && (
                 <div className="p-8 flex flex-col h-full bg-transparent">
                    <h2 className="text-2xl font-black text-white mb-2">Регистрация</h2>
                    <p className="text-sm text-slate-400 mb-8">Создайте свой профиль для сети.</p>
                    
                    <div className="space-y-4 flex-1">
                       <input type="text" placeholder="Введите имя..." className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors" />
                       <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-4 text-slate-300 focus:outline-none focus:border-orange-500/50 transition-colors appearance-none">
                         <option value="" disabled selected>Выберите возраст</option>
                         <option value="18">18+</option>
                         <option value="under18">&lt; 18</option>
                       </select>
                    </div>

                    <button className="w-full py-4 rounded-full mt-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300">
                      Сохранить
                    </button>
                 </div>
               )}

               {activeTab === 'search' && (
                 <DiscoveryView 
                   users={(discoveryFeed as unknown) as UserProfile[]} 
                   onKnockUser={sendKnock}
                   onGoToRooms={() => handleTabClick('public')}
                   language={language}
                 />
               )}

               {activeTab === 'conversations' && (
                 <div className="flex-1 flex flex-col h-full">
                   {state.activeSession ? (
                      <PrivateChatView 
                        session={state.activeSession}
                        messages={state.privateMessages}
                        currentUser={state.currentUser}
                        onSendMessage={handleMessageSend}
                        onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
                        language={language}
                      />
                   ) : (
                      <div className="p-8 flex flex-col h-full items-center justify-center text-center text-slate-400">
                         <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4 border border-[rgba(255,255,255,0.05)]">
                           <span className="text-2xl opacity-50">💬</span>
                         </div>
                         <h3 className="font-bold text-white mb-2">Нет активных диалогов</h3>
                         <p className="text-xs">Воспользуйтесь поиском, чтобы начать общение.</p>
                         <button onClick={() => handleTabClick('search')} className="mt-6 px-6 py-3 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all text-xs font-bold uppercase tracking-wider">
                           Начать поиск
                         </button>
                      </div>
                   )}
                 </div>
               )}
            </div>

            {/* Navigation Tab Bar */}
            <div className="shrink-0 p-4 border-t border-[rgba(255,255,255,0.08)] bg-black/20 flex flex-wrap gap-2 justify-center backdrop-blur-md z-30">
               <NavButton active={activeTab === 'registration' && !isPublicLayerOpen} onClick={() => handleTabClick('registration')} label="Регистрация" />
               <NavButton active={activeTab === 'search' && !isPublicLayerOpen} onClick={() => handleTabClick('search')} label="Поиск" />
               <NavButton active={activeTab === 'conversations' && !isPublicLayerOpen} onClick={() => handleTabClick('conversations')} label="Мои диалоги" />
               <NavButton active={isPublicLayerOpen} onClick={() => handleTabClick('public')} label="Публичные комнаты" isCTA />
               {onExit && <button onClick={onExit} className="ml-auto p-2 text-slate-500 hover:text-white transition-colors">✕</button>}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Internal Navigation Tab Button Component
const NavButton: React.FC<{ active: boolean, onClick: () => void, label: string, isCTA?: boolean }> = ({ active, onClick, label, isCTA }) => {
  if (isCTA) {
    return (
      <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
          active 
            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-105' 
            : 'bg-[rgba(255,255,255,0.03)] text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)]'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
        active 
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
          : 'bg-transparent text-slate-400 hover:bg-[rgba(255,255,255,0.05)] hover:text-white border border-transparent'
      }`}
    >
      {label}
    </button>
  );
};

export default ChatPlatformV2;
