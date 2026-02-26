import React, { useReducer, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSlideOpenSound, playSlideCloseSound, playTabSwitchSound, setSoundEnabled, playFlipSound } from './utils/spatialSoundEngine';
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
  const [regStep, setRegStep] = React.useState<1 | 2 | 3>(1);

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
    playFlipSound();
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
            <div className="flex-1 relative overflow-y-auto no-scrollbar flex flex-col perspective-[1000px]">
               <AnimatePresence mode="wait">
                 {activeTab === 'registration' && (
                   <motion.div 
                     key="registration"
                     initial={{ rotateX: -90, opacity: 0, y: -20, transformOrigin: "top" }}
                     animate={{ rotateX: 0, opacity: 1, y: 0, transformOrigin: "top" }}
                     exit={{ rotateX: 90, opacity: 0, y: 20, transformOrigin: "bottom" }}
                     transition={{ duration: 0.24, ease: [0.25, 0.8, 0.25, 1] }}
                     className="p-8 flex flex-col h-full bg-transparent"
                   >
                      <div className="flex items-center justify-between mb-8">
                         <h2 className="text-2xl font-black text-white tracking-tight display-font text-glow-subtle">Создание образа</h2>
                         <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Шаг {regStep} из 3</div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto no-scrollbar pb-4 flex flex-col">
                        {regStep === 1 && (
                          <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
                             <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-2">Выберите роль на сцене</p>
                             <div className="grid grid-col-1 gap-3">
                                <button onClick={() => { playTabSwitchSound(); setRegStep(2); }} className="hover-stage-lift glass-surface p-5 rounded-2xl text-left relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <h3 className="text-white font-black text-lg mb-1 tracking-wide">Слушатель</h3>
                                  <p className="text-slate-400 text-xs font-medium">Предпочитаю наблюдать и вовлекаться постепенно.</p>
                                </button>
                                <button onClick={() => { playTabSwitchSound(); setRegStep(2); }} className="hover-stage-lift glass-surface p-5 rounded-2xl text-left relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <h3 className="text-white font-black text-lg mb-1 tracking-wide">Спикер</h3>
                                  <p className="text-slate-400 text-xs font-medium">Хочу активно общаться и знакомиться с новыми людьми.</p>
                                </button>
                             </div>
                          </div>
                        )}

                        {regStep === 2 && (
                          <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                             <p className="text-xs text-slate-400 font-bold tracking-widest uppercase text-center mb-2">Настройте свет</p>
                             
                             {/* Central Avatar Spotlight */}
                             <div className="relative self-center w-28 h-28 mb-4">
                               <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
                               <div className="w-full h-full rounded-full bg-[#080b14] border-2 border-orange-500/30 flex items-center justify-center relative z-10 shadow-[inset_0_5px_15px_rgba(249,115,22,0.1)]">
                                  <span className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">👽</span>
                               </div>
                             </div>

                             <div className="space-y-4">
                               <input type="text" placeholder="Ваше сценическое имя..." className="input-stage w-full px-5 py-4 font-medium" />
                               <div className="grid grid-cols-2 gap-3">
                                  <select className="input-stage px-5 py-4 appearance-none cursor-pointer text-sm">
                                    <option value="" disabled selected>Возраст</option>
                                    <option value="18-24">18–24</option>
                                    <option value="25-34">25–34</option>
                                  </select>
                                  <select className="input-stage px-5 py-4 appearance-none cursor-pointer text-sm">
                                    <option value="" disabled selected>Пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                  </select>
                               </div>
                             </div>

                             <button onClick={() => { playTabSwitchSound(); setRegStep(3); }} className="w-full mt-auto py-4 rounded-xl border border-white/10 text-white font-black tracking-widest uppercase hover:bg-white/5 transition-all text-[11px]">
                               Далее
                             </button>
                          </div>
                        )}

                        {regStep === 3 && (
                          <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out] justify-center items-center text-center">
                             <div className="w-20 h-20 mb-6 relative">
                               <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                               <span className="text-6xl relative z-10 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">🎤</span>
                             </div>
                             <h2 className="text-3xl font-black text-white mb-3 tracking-tight display-font text-glow">Сцена готова</h2>
                             <p className="text-sm text-slate-400 mb-10 leading-relaxed max-w-[250px]">Вы готовы выйти в эфир. Ваши настройки сохранены.</p>

                             <button 
                               onClick={() => handleTabClick('search')} 
                               className="cta-stage-glow w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] relative overflow-hidden group"
                             >
                               <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1s_ease-in-out]" />
                               Выйти в эфир
                             </button>
                          </div>
                        )}
                      </div>
                   </motion.div>
                 )}

               {activeTab === 'search' && (
                 <motion.div
                   key="search"
                   initial={{ rotateX: -90, opacity: 0, y: -20, transformOrigin: "top" }}
                   animate={{ rotateX: 0, opacity: 1, y: 0, transformOrigin: "top" }}
                   exit={{ rotateX: 90, opacity: 0, y: 20, transformOrigin: "bottom" }}
                   transition={{ duration: 0.24, ease: [0.25, 0.8, 0.25, 1] }}
                   className="h-full"
                 >
                   <DiscoveryView 
                     users={(discoveryFeed as unknown) as UserProfile[]} 
                     onKnockUser={sendKnock}
                     onGoToRooms={() => handleTabClick('public')}
                     language={language}
                   />
                 </motion.div>
               )}

               {activeTab === 'conversations' && (
                 <motion.div
                   key="conversations"
                   initial={{ rotateX: -90, opacity: 0, y: -20, transformOrigin: "top" }}
                   animate={{ rotateX: 0, opacity: 1, y: 0, transformOrigin: "top" }}
                   exit={{ rotateX: 90, opacity: 0, y: 20, transformOrigin: "bottom" }}
                   transition={{ duration: 0.24, ease: [0.25, 0.8, 0.25, 1] }}
                   className="flex-1 flex flex-col h-full bg-transparent p-6 pb-20"
                 >
                   <div className="mb-6">
                     <h2 className="text-2xl font-black text-white tracking-tight display-font text-glow-subtle">Мои диалоги</h2>
                   </div>

                   {state.activeSession ? (
                      <div className="flex-1 glass-surface hover-stage-lift rounded-[24px] overflow-hidden">
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
                         <h3 className="text-[16px] font-black text-white mb-2 tracking-wide text-glow-subtle">Сцена пуста</h3>
                         <p className="text-[13px] text-slate-400 font-medium mb-8 leading-relaxed">Начните поиск, чтобы найти собеседника.</p>
                         <button onClick={() => handleTabClick('search')} className="px-8 py-3.5 rounded-full glass-surface hover-stage-lift text-white border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                           Перейти к поиску
                         </button>
                      </div>
                   )}
                 </motion.div>
               )}
               </AnimatePresence>
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
