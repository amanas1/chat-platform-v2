import React, { useReducer, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSlideOpenSound, playSlideCloseSound, playTabSwitchSound, setSoundEnabled } from './utils/spatialSoundEngine';
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
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);
  
  // If passed from props, update local state
  React.useEffect(() => {
    if (currentUserOverride) {
      dispatch({ type: 'SET_CURRENT_USER', payload: currentUserOverride });
    }
  }, [currentUserOverride]);

  // Hook sound state to user preferences
  React.useEffect(() => {
    // Rely on ChatSettings notification toggle or fallback to filters toggle
    const user = state.currentUser as any;
    const enabled = user?.chatSettings?.notificationsEnabled ?? user?.filters?.soundEnabled ?? true;
    setSoundEnabled(enabled);
  }, [state.currentUser]);

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
    playTabSwitchSound();
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
          transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
          onAnimationStart={() => {
            if (!isMounted.current) return;
            if (isPublicLayerOpen) {
              setTimeout(() => playSlideOpenSound(), 50);
            } else {
              playSlideCloseSound();
            }
          }}
        >

          {/* PUBLIC PANEL (Left side of flex, Width: 420px) */}
          <motion.div 
            className={`relative w-[420px] flex flex-col pointer-events-auto shrink-0 z-20 ${DEEP_GRADIENT} ${GLASS_BASE} rounded-none border-0 border-r border-[rgba(249,115,22,0.25)]`}
            initial={false}
            animate={{
              boxShadow: isPublicLayerOpen
                ? '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4), 2px 0 20px rgba(249,115,22,0.15)'
                : '0 25px 60px rgba(0,0,0,0), 0 0 40px rgba(0,0,0,0), 2px 0 0px rgba(249,115,22,0)'
            }}
            transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
          >
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
          </motion.div>

          {/* MAIN CHAT PANEL (Right side of flex, Width: 420px) */}
          <motion.div 
            className={`relative w-[420px] flex flex-col pointer-events-auto shrink-0 z-10 overflow-hidden ${DEEP_GRADIENT} ${GLASS_BASE} rounded-none border-0`}
            initial={false}
            animate={{ 
              scale: isPublicLayerOpen ? 0.965 : 1,
              opacity: isPublicLayerOpen ? 0.92 : 1,
              filter: isPublicLayerOpen ? 'brightness(0.85) blur(1.2px)' : 'brightness(1) blur(0px)',
              x: isPublicLayerOpen ? 10 : 0
            }}
            transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {/* DIM LAYER OVERLAY with Subtle Vignette */}
            <motion.div 
              className="absolute inset-0 bg-black pointer-events-none z-50 rounded-none mix-blend-multiply shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
              initial={false}
              animate={{ opacity: isPublicLayerOpen ? 0.22 : 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
            />
            
            {/* Main Panel Content Area */}
            <div className="flex-1 relative overflow-y-auto no-scrollbar flex flex-col">
               {activeTab === 'registration' && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.4 }}
                   className="p-8 flex flex-col h-full bg-transparent"
                 >
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Создание профиля</h2>
                    <p className="text-sm text-slate-400 mb-8 leading-relaxed">Профиль позволяет участвовать в приватных и публичных диалогах.</p>
                    
                    <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar pb-4">
                       <div className="relative">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block pl-2">Имя</label>
                         <input type="text" placeholder="Введите имя..." className="input-premium w-full px-5 py-4" />
                       </div>
                       
                       <div className="relative">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block pl-2">Возраст</label>
                         <select className="input-premium w-full px-5 py-4 appearance-none cursor-pointer">
                           <option value="" disabled selected>Выберите возраст</option>
                           <option value="18-24">18–24</option>
                           <option value="25-34">25–34</option>
                           <option value="35-44">35–44</option>
                           <option value="45-54">45–54</option>
                           <option value="55-65">55–65</option>
                           <option value="65+">65+</option>
                         </select>
                       </div>

                       <div className="relative">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block pl-2">Пол</label>
                         <select className="input-premium w-full px-5 py-4 appearance-none cursor-pointer">
                           <option value="" disabled selected>Выберите пол</option>
                           <option value="male">Мужской</option>
                           <option value="female">Женский</option>
                         </select>
                       </div>

                       <div className="relative">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block pl-2">О себе</label>
                         <textarea placeholder="Коротко расскажите о себе..." rows={3} className="input-premium w-full px-5 py-4 resize-none" />
                       </div>
                    </div>

                    <button className="btn-premium w-full mt-6 py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                      Продолжить
                    </button>
                 </motion.div>
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
                 <div className="flex-1 flex flex-col h-full bg-transparent p-6 pb-20">
                   <div className="mb-6">
                     <h2 className="text-2xl font-black text-white tracking-tight">Мои диалоги</h2>
                   </div>

                   {state.activeSession ? (
                      <div className="flex-1 glass-panel rounded-[24px] overflow-hidden">
                        <PrivateChatView 
                          session={state.activeSession}
                          messages={state.privateMessages}
                          currentUser={state.currentUser}
                          onSendMessage={handleMessageSend}
                          onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
                          language={language}
                        />
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                         <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-5 border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
                           <span className="text-2xl opacity-60 drop-shadow-md">💬</span>
                         </div>
                         <h3 className="text-[16px] font-black text-white mb-2 tracking-wide">Нет активных диалогов</h3>
                         <p className="text-[13px] text-slate-400 font-medium mb-8 leading-relaxed">Начните общение через поиск.</p>
                         <button onClick={() => handleTabClick('search')} className="btn-premium px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-white border border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                           Перейти к поиску
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

          </motion.div>
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
