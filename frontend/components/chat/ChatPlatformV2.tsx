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
  
  React.useEffect(() => {
    if (currentUserOverride) {
      dispatch({ type: 'SET_CURRENT_USER', payload: currentUserOverride });
    }
  }, [currentUserOverride]);

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

  // Tab state: 'profile' | 'dialogues' | 'discovery'
  const [activeTab, setActiveTab] = React.useState<'profile' | 'dialogues' | 'discovery'>('discovery');
  
  // Profile form state
  const [gender, setGender] = React.useState<'male' | 'female' | ''>('');
  const [age, setAge] = React.useState('25');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  
  // Discovery sub-view
  const [discoveryView, setDiscoveryView] = React.useState<'main' | 'online'>('main');

  const isPrivateMode = state.mode === 'private' && state.activeSession;

  // Sync to dialogues tab when entering private mode
  React.useEffect(() => {
    if (isPrivateMode) setActiveTab('dialogues');
  }, [isPrivateMode]);

  const handleMessageSend = (text: string) => {
    if (state.mode === 'private' && state.activeSession) {
      sendMessage(state.activeSession.sessionId, text);
    }
  };

  const handleTabSwitch = (tab: 'profile' | 'dialogues' | 'discovery') => {
    playTabSwitchSound();
    setActiveTab(tab);
    if (tab === 'discovery') {
      setDiscoveryView('main');
      dispatch({ type: 'SET_MODE', payload: 'discovery' });
    }
  };

  const onlineCount = (discoveryFeed as unknown as ChatUserProfile[]).length;
  const feed = discoveryFeed as unknown as ChatUserProfile[];

  // Tab titles
  const tabTitles: Record<string, string> = {
    profile: 'ВАШ ПРОФИЛЬ',
    dialogues: 'ДИАЛОГИ',
    discovery: 'ВОКРУГ СВЕТА',
  };

  const statusOptions = [
    'Хочу поговорить',
    'Свободен',
    'Просто слушаю',
    'Без флирта',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-[100] pointer-events-none font-['Inter']">
      
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

      {/* ═══════════ CHAT PANEL ═══════════ */}
      <div className="pointer-events-auto h-full w-[420px] lg:w-[460px] flex flex-col bg-[#0d1117] border-l border-white/[0.06]">
        
        {/* ─── HEADER BAR ─── */}
        <div className="shrink-0 flex items-center gap-1 px-3 py-2.5 border-b border-white/[0.06]">
          {/* Tab Icons */}
          <TabIcon 
            active={activeTab === 'profile'} 
            onClick={() => handleTabSwitch('profile')}
            color={activeTab === 'profile' ? '#f97316' : undefined}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </TabIcon>
          <TabIcon 
            active={activeTab === 'dialogues'} 
            onClick={() => handleTabSwitch('dialogues')}
            color={activeTab === 'dialogues' ? '#f97316' : undefined}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </TabIcon>
          <TabIcon 
            active={activeTab === 'discovery'} 
            onClick={() => handleTabSwitch('discovery')}
            color={activeTab === 'discovery' ? '#f97316' : undefined}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </TabIcon>
          
          {/* Title + Online */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="text-[13px] font-bold text-[#e5e7eb] tracking-wide uppercase">{tabTitles[activeTab]}</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              {onlineCount} ОНЛАЙН
            </span>
          </div>

          {/* Close */}
          {onExit && (
            <button onClick={onExit} className="ml-3 p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            
            {/* ═══ PRIVATE SESSION (overrides everything) ═══ */}
            {isPrivateMode && activeTab === 'dialogues' ? (
              <motion.div key="private-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                <PrivateChatView 
                  session={state.activeSession!}
                  messages={state.privateMessages}
                  currentUser={state.currentUser}
                  onSendMessage={handleMessageSend}
                  onLeaveSession={() => closeSession(state.activeSession!.sessionId)}
                  language={language}
                />
              </motion.div>
            ) : activeTab === 'profile' ? (
              /* ═══ PROFILE TAB ═══ */
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5">
                
                {/* Gender + Age Row */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Пол</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGender('male')}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all
                          ${gender === 'male' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}
                      >
                        МУЖ
                      </button>
                      <button 
                        onClick={() => setGender('female')}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all
                          ${gender === 'female' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}
                      >
                        ЖЕН
                      </button>
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Возраст</label>
                    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                      <input 
                        type="number" min="18" max="99" value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-8 bg-transparent text-white text-[15px] font-bold text-center outline-none"
                      />
                      <span className="text-slate-500 text-[10px] font-bold">18+</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>✨</span> Статус
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`py-2.5 px-3 rounded-xl text-[12px] font-medium transition-all border
                          ${selectedStatus === s 
                            ? 'bg-white/10 text-white border-white/20' 
                            : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-300'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Section */}
                <div className="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#e5e7eb]">Голос</p>
                    <p className="text-[10px] text-slate-500">Главный «крючок» для общения</p>
                  </div>
                </div>

                {/* Settings */}
                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6 hover:bg-white/[0.03] transition-colors">
                  <span className="text-[12px] text-slate-400 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    НАСТРОЙКИ
                  </span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Submit Button */}
                <button 
                  onClick={() => { playTabSwitchSound(); handleTabSwitch('discovery'); }}
                  className="w-full py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
                >
                  ГОТОВО / ПРОДОЛЖИТЬ
                </button>

                <p className="text-[9px] text-slate-600 text-center mt-3">Данные хранятся только в этом браузере пока вы не удалите их.</p>
                <button className="w-full text-[10px] text-red-500/60 font-semibold uppercase tracking-wider mt-4 hover:text-red-400 transition-colors">
                  УДАЛИТЬ АККАУНТ
                </button>
              </motion.div>

            ) : activeTab === 'dialogues' ? (
              /* ═══ DIALOGUES TAB ═══ */
              <motion.div key="dialogues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5 h-full flex flex-col">
                
                <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-6">Мои диалоги</p>

                {state.activeSession ? (
                  <div className="flex-1">
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
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {/* Chat bubble icon */}
                    <div className="w-20 h-20 rounded-full bg-[#1a1f2e] flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        <circle cx="8" cy="10" r="1"/>
                        <circle cx="12" cy="10" r="1"/>
                        <circle cx="16" cy="10" r="1"/>
                      </svg>
                    </div>
                    
                    <h3 className="text-[14px] font-bold text-[#e5e7eb] uppercase tracking-wide mb-2">У вас пока нет активных диалогов</h3>
                    <p className="text-[11px] text-slate-500 mb-8 max-w-[280px] leading-relaxed">
                      Здесь будут появляться ваши текущие разговоры. Начните прямо сейчас!
                    </p>

                    <span className="text-[10px] text-emerald-400 font-semibold mb-6 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      СЕЙЧАС ОНЛАЙН: {onlineCount}
                    </span>

                    <button 
                      onClick={() => handleTabSwitch('discovery')}
                      className="w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      НАЙТИ СОБЕСЕДНИКА
                    </button>

                    <button className="w-full py-3 rounded-2xl text-[11px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                      <span>🎲</span>
                      МНЕ ПОВЕЗЁТ (СЛУЧАЙНЫЙ)
                    </button>

                    <p className="text-[9px] text-slate-600 mt-4 italic">* История не сохраняется</p>
                  </div>
                )}
              </motion.div>

            ) : (
              /* ═══ DISCOVERY TAB ═══ */
              <motion.div key="discovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                
                {discoveryView === 'main' ? (
                  /* ── Main Discovery View ── */
                  <div className="p-5 flex flex-col items-center flex-1">
                    {/* Scene illustration */}
                    <div className="relative w-full flex justify-center my-4">
                      <div className="flex items-end gap-3">
                        <div className="w-14 h-14 rounded-full bg-[#1a1f2e] border border-white/8 flex items-center justify-center opacity-60">
                          <span className="text-xl">🎧</span>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-[#1a1f2e] border-2 border-white/10 flex items-center justify-center">
                          <span className="text-3xl">🎤</span>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-[#1a1f2e] border border-white/8 flex items-center justify-center opacity-60">
                          <span className="text-xl">🎵</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-6">Сцена</p>

                    {/* Online badge */}
                    <span className="text-[10px] text-emerald-400 font-bold px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      СЕЙЧАС ОНЛАЙН: {onlineCount}
                    </span>

                    {/* Title */}
                    <h2 className="text-[22px] font-bold text-white text-center mb-1 leading-tight">Найди собеседника<br />прямо сейчас</h2>
                    <p className="text-[11px] text-slate-500 mb-6">Без истории. Без обязательств. 18+</p>

                    {/* Mode Cards */}
                    <div className="flex gap-3 w-full mb-6">
                      <button 
                        onClick={() => { playCardOpenSound(); /* random match */ }}
                        className="flex-1 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🌐</span>
                          <div className="w-6 h-6 rounded-full bg-[#1a1f2e] border border-white/8 flex items-center justify-center">
                            <span className="text-[10px]">👤</span>
                          </div>
                        </div>
                        <p className="text-[12px] font-bold text-[#e5e7eb] uppercase tracking-wide">Случайный</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Диалог с кем угодно</p>
                      </button>

                      <button 
                        onClick={() => { playCardOpenSound(); setDiscoveryView('online'); }}
                        className="flex-1 p-4 rounded-2xl bg-white/[0.03] border border-orange-500/20 hover:bg-white/[0.05] hover:border-orange-500/40 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🖐</span>
                          <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <span className="text-[10px]">👥</span>
                          </div>
                        </div>
                        <p className="text-[12px] font-bold text-orange-400 uppercase tracking-wide">Кто онлайн</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Только активные</p>
                      </button>
                    </div>

                    {/* Divider */}
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-4">или по параметрам</p>

                    {/* Filters */}
                    <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-4">
                      <div className="flex gap-6 mb-4">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Возраст</label>
                          <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                            <span>18</span>
                            <span className="text-slate-600">—</span>
                            <span>65+</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Пол</label>
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] transition-colors">М</button>
                            <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] transition-colors">Ж</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Search CTA */}
                    <button 
                      onClick={() => { playCardOpenSound(); handleTabSwitch('dialogues'); }}
                      className="w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      НАЧАТЬ ПОИСК
                    </button>
                    <p className="text-[8px] text-slate-600 mt-2">* Сообщения удаляются автоматически</p>
                  </div>
                ) : (
                  /* ── Online Users View (Conveyor) ── */
                  <div className="flex flex-col h-full">
                    {/* Back to main discovery */}
                    <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                      <button 
                        onClick={() => setDiscoveryView('main')} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-[12px] font-bold text-[#e5e7eb] uppercase tracking-wider">Кто онлайн</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{onlineCount}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
                      {feed.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                          <span className="text-3xl opacity-30 mb-3">📡</span>
                          <p className="text-[12px] text-slate-500 font-medium">Пока никого нет</p>
                          <p className="text-[10px] text-slate-600 mt-1">Ожидаем подключения...</p>
                        </div>
                      ) : (
                        feed.map((user) => (
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
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── MINI RADIO PLAYER (Bottom) ─── */}
        <div className="shrink-0 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#e5e7eb] font-medium truncate">Radio</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <button className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            <button className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Tab Icon Button ─── */
const TabIcon: React.FC<{ active: boolean; onClick: () => void; color?: string; children: React.ReactNode }> = ({ active, onClick, color, children }) => (
  <button 
    onClick={onClick}
    className={`p-2.5 rounded-xl transition-all ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
    style={active && color ? { color, backgroundColor: `${color}15` } : {}}
  >
    {children}
  </button>
);

export default ChatPlatformV2;
