import React, { useReducer, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTabSwitchSound, setSoundEnabled, playCardOpenSound, playMessageSentSound, playPanelCloseSound, playRoomJoinSound } from './utils/spatialSoundEngine';
import { chatReducer, initialChatState } from './state/chatReducer';
import { useChatSocket } from './hooks/useChatSocket';
import { useDiscoveryEngine } from './hooks/useDiscoveryEngine';
import socketService from '../../services/socketService';
import { UserProfile } from '../../types';
import { UserProfile as ChatUserProfile } from './types';

import { PrivateChatView } from './views/PrivateChatView';
import { ConveyorCard } from './components/ConveyorCard';
import { KnockModal } from './overlays/KnockModal';
import { WaitingOverlay } from './overlays/WaitingOverlay';

interface ChatPlatformV2Props {
  currentUserOverride?: any; 
  onExit?: () => void;
  language?: string;
}

export const ChatPlatformV2: React.FC<ChatPlatformV2Props> = ({ currentUserOverride, onExit, language = 'en' }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const isMounted = useRef(false);

  useEffect(() => { isMounted.current = true; }, []);
  
  // Props → state sync
  React.useEffect(() => {
    if (currentUserOverride) {
      dispatch({ type: 'SET_CURRENT_USER', payload: currentUserOverride });
    }
  }, [currentUserOverride]);

  // Sound toggle
  React.useEffect(() => {
    const user = state.currentUser as any;
    const enabled = user?.chatSettings?.notificationsEnabled ?? user?.filters?.soundEnabled ?? true;
    setSoundEnabled(enabled);
  }, [state.currentUser]);

  const { 
    sendKnock, acceptKnock, rejectKnock, 
    closeSession, sendMessage,
    joinRoom, leaveRoom, sendRoomMessage
  } = useChatSocket(state.currentUser, state.outgoingKnock, state.activeSession?.sessionId || null, dispatch);

  // Discovery engine (conveyor feed)
  const discoveryFeed = useDiscoveryEngine(state.onlineUsers, state.currentUser, dispatch, 100);

  // Auto Recovery on reconnect
  const modeRef = React.useRef(state.mode);
  const activeSessionRef = React.useRef(state.activeSession);
  
  React.useEffect(() => {
    modeRef.current = state.mode;
    activeSessionRef.current = state.activeSession;
  }, [state.mode, state.activeSession]);

  React.useEffect(() => {
    const handler = () => {
      if (modeRef.current === 'private' && activeSessionRef.current) {
        socketService.joinSession(activeSessionRef.current.sessionId);
      }
    };
    const unsubConnect = socketService.onConnect(handler);
    return () => unsubConnect();
  }, []);

  // Registration state (3-step)
  const [regStep, setRegStep] = React.useState<1 | 2 | 3>(1);
  const isRegistered = !!state.currentUser;
  const isPrivateMode = state.mode === 'private' && state.activeSession;

  // Message send handler (private only in this mode)
  const handleMessageSend = (text: string) => {
    if (state.mode === 'private' && state.activeSession) {
      sendMessage(state.activeSession.sessionId, text);
    }
  };

  return (
    <div className="fixed inset-y-4 right-4 z-[100] flex pointer-events-none font-['Inter'] h-[calc(100vh-32px)]">
      
      {/* Knock Overlays */}
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

      {/* ═══════════ SINGLE RADIO PANEL ═══════════ */}
      <div className="relative w-[440px] h-full pointer-events-auto rounded-2xl overflow-hidden bg-gradient-to-b from-[#0d1117] via-[#111827] to-[#0d1117] border border-white/[0.06] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        
        <AnimatePresence mode="wait">
          {isPrivateMode ? (
            /* ═══ PRIVATE SESSION MODE ═══ */
            <motion.div
              key="private"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <PrivateChatView 
                session={state.activeSession!}
                messages={state.privateMessages}
                currentUser={state.currentUser}
                onSendMessage={handleMessageSend}
                onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
                language={language}
              />
            </motion.div>
          ) : (
            /* ═══ CONVEYOR MODE ═══ */
            <motion.div
              key="conveyor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Panel Header */}
              <div className="shrink-0 px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h1 className="text-[15px] font-bold text-[#e5e7eb] tracking-tight">Radio Private</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-medium">
                    {(discoveryFeed as unknown as ChatUserProfile[]).length} онлайн
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {onExit && (
                    <button onClick={onExit} className="ml-2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Scrollable Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                
                {!isRegistered ? (
                  /* ─── REGISTRATION (3 STEPS) ─── */
                  <div className="p-5 flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[16px] font-bold text-[#e5e7eb]">Регистрация</h2>
                      <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Шаг {regStep}/3</span>
                    </div>

                    {regStep === 1 && (
                      <div className="flex flex-col gap-4 flex-1 animate-[fadeIn_0.25s_ease-out]">
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Имя</label>
                          <input type="text" placeholder="Ваше имя..." className="radio-input w-full px-4 py-3 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Пол</label>
                            <select className="radio-input w-full px-4 py-3 text-sm appearance-none cursor-pointer">
                              <option value="" disabled selected>Выбрать</option>
                              <option value="male">Мужской</option>
                              <option value="female">Женский</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Возраст</label>
                            <input type="number" placeholder="25" min="18" max="99" className="radio-input w-full px-4 py-3 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Страна</label>
                          <input type="text" placeholder="Автоопределение..." className="radio-input w-full px-4 py-3 text-sm" />
                        </div>

                        <button 
                          onClick={() => { playTabSwitchSound(); setRegStep(2); }}
                          className="radio-btn-primary w-full py-3.5 mt-auto text-[12px] uppercase tracking-widest"
                        >
                          Далее
                        </button>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div className="flex flex-col gap-5 flex-1 items-center animate-[fadeIn_0.25s_ease-out]">
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider self-start">Аватар</p>
                        
                        {/* Avatar preview */}
                        <div className="w-24 h-24 rounded-full bg-[#1a1f2e] border border-white/8 flex items-center justify-center my-4">
                          <span className="text-4xl opacity-60">👤</span>
                        </div>

                        {/* Avatar grid (placeholder) */}
                        <div className="grid grid-cols-4 gap-2 w-full">
                          {['😎', '🧑‍💻', '👩‍🎤', '🧔', '👩', '🤖', '🎧', '🌙'].map((emoji, i) => (
                            <button key={i} className="radio-card aspect-square flex items-center justify-center text-2xl hover:bg-white/5">
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-3 w-full mt-auto">
                          <button onClick={() => setRegStep(1)} className="radio-btn-ghost flex-1 py-3 text-[11px] uppercase tracking-wider">
                            Назад
                          </button>
                          <button onClick={() => { playTabSwitchSound(); setRegStep(3); }} className="radio-btn-primary flex-1 py-3 text-[11px] uppercase tracking-wider">
                            Далее
                          </button>
                        </div>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div className="flex flex-col gap-5 flex-1 items-center animate-[fadeIn_0.25s_ease-out]">
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider self-start">Голосовое приветствие</p>
                        
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
                          {/* Record button */}
                          <button className="w-20 h-20 rounded-full bg-[#1a1f2e] border-2 border-amber-800/40 flex items-center justify-center hover:border-amber-600/60 transition-all">
                            <svg className="w-8 h-8 text-amber-500/80" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                          </button>
                          <p className="text-[11px] text-slate-500">Нажмите чтобы записать (макс. 7 сек)</p>
                        </div>

                        <div className="flex gap-3 w-full mt-auto">
                          <button onClick={() => setRegStep(2)} className="radio-btn-ghost flex-1 py-3 text-[11px] uppercase tracking-wider">
                            Назад
                          </button>
                          <button 
                            onClick={() => {
                              // In real flow this would dispatch SET_CURRENT_USER
                              // For now just switch to discovery mode UI
                              playTabSwitchSound();
                              dispatch({ type: 'SET_MODE', payload: 'discovery' });
                            }}
                            className="radio-btn-primary flex-1 py-3.5 text-[12px] uppercase tracking-widest"
                          >
                            Enter the Flow
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ─── CONVEYOR (USER CARDS) ─── */
                  <div className="p-3 flex flex-col gap-2">
                    {(discoveryFeed as unknown as ChatUserProfile[]).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-3xl opacity-40 mb-4">📡</div>
                        <p className="text-[13px] text-slate-500 font-medium">Эфир пуст</p>
                        <p className="text-[11px] text-slate-600 mt-1">Ожидаем подключения...</p>
                      </div>
                    ) : (
                      (discoveryFeed as unknown as ChatUserProfile[]).map((user) => (
                        <ConveyorCard
                          key={user.id}
                          user={user}
                          onKnock={sendKnock}
                          isWaiting={state.outgoingKnock?.targetUserId === user.id}
                          isBusy={false}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ─── MINI RADIO PLAYER ─── */}
              <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] bg-[#0b0f18]/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-900/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🎧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#e5e7eb] font-medium truncate">Late Night Radio — Ambient Flow</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Streaming</p>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" defaultValue="40" 
                  className="w-16 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-amber-600"
                />
                <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPlatformV2;
