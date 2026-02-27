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
import { RegistrationPanel } from './RegistrationPanel';
import { RadioPlayer } from './components/RadioPlayer';


/* ─── localStorage KEY ─── */
const LS_KEY = 'radio_chat_profile';
interface SavedProfile {
  nickname: string;
  gender: 'male' | 'female' | '';
  age: string;
  status: string;
  avatarEmoji: string;
  soundEnabled: boolean;
  bannersEnabled: boolean;
  voiceEnabled: boolean;
  volume: number;
}

const loadProfile = (): SavedProfile | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveProfile = (p: SavedProfile) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
};

/* ═══════════════════════════════════════ */

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

  // ─── REGISTRATION CHECK ───
  const [isRegistered, setIsRegistered] = React.useState(() => {
    try { return !!localStorage.getItem('radio_chat_profile'); } catch { return false; }
  });

  // ─── UI STATE ───
  const [activeTab, setActiveTab] = React.useState<'profile' | 'dialogues' | 'discovery'>('discovery');
  
  // Profile form (loaded from localStorage)
  const [nickname, setNickname] = React.useState('Guest');
  const [gender, setGender] = React.useState<'male' | 'female' | ''>('');
  const [age, setAge] = React.useState('25');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [avatarEmoji, setAvatarEmoji] = React.useState('👨');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [showAgePicker, setShowAgePicker] = React.useState(false);

  // Settings (functional)
  const [soundEnabled_s, setSoundEnabled_s] = React.useState(true);
  const [bannersEnabled, setBannersEnabled] = React.useState(true);
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [volume, setVolume] = React.useState(80);

  // Voice recording
  const [isRecording, setIsRecording] = React.useState(false);
  const [voiceBlob, setVoiceBlob] = React.useState<string | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Scene lighting
  const [sceneActive, setSceneActive] = React.useState(false);

  // Discovery
  const [discoveryView, setDiscoveryView] = React.useState<'main' | 'online'>('main');
  const [filterAgeMin, setFilterAgeMin] = React.useState(18);
  const [filterAgeMax, setFilterAgeMax] = React.useState(65);
  const [filterGender, setFilterGender] = React.useState<'all' | 'male' | 'female'>('all');

  const isPrivateMode = state.mode === 'private' && state.activeSession;

  // ─── LOAD from localStorage ───
  React.useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setNickname(saved.nickname || 'Guest');
      setGender(saved.gender || '');
      setAge(saved.age || '25');
      setSelectedStatus(saved.status || '');
      if (saved.avatarEmoji) setAvatarEmoji(saved.avatarEmoji);
      setSoundEnabled_s(saved.soundEnabled ?? true);
      setBannersEnabled(saved.bannersEnabled ?? true);
      setVoiceEnabled(saved.voiceEnabled ?? true);
      setVolume(saved.volume ?? 80);
    }
  }, []);

  // ─── SAVE to localStorage on change ───
  React.useEffect(() => {
    saveProfile({ nickname, gender, age, status: selectedStatus, avatarEmoji, soundEnabled: soundEnabled_s, bannersEnabled, voiceEnabled, volume });
  }, [nickname, gender, age, selectedStatus, avatarEmoji, soundEnabled_s, bannersEnabled, voiceEnabled, volume]);

  // ─── Sync sound engine ───
  React.useEffect(() => {
    setSoundEnabled(soundEnabled_s);
  }, [soundEnabled_s]);

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

  // ─── Filtered feed ───
  const filteredFeed = React.useMemo(() => {
    return feed.filter(u => {
      const ageOk = u.age >= filterAgeMin && (filterAgeMax >= 65 ? true : u.age <= filterAgeMax);
      const genderOk = filterGender === 'all' || u.gender === filterGender;
      return ageOk && genderOk;
    });
  }, [feed, filterAgeMin, filterAgeMax, filterGender]);

  // ─── Voice Recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) { stopRecording(); return 10; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Mic access denied', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const deleteVoice = () => {
    setVoiceBlob(null);
    setRecordingTime(0);
  };

  // ─── Reset profile ───
  const handleResetData = () => {
    localStorage.removeItem(LS_KEY);
    setNickname('Guest');
    setGender('');
    setAge('25');
    setSelectedStatus('');
    setAvatarEmoji('👨');
    setSoundEnabled_s(true);
    setBannersEnabled(true);
    setVoiceEnabled(true);
    setVolume(80);
    setVoiceBlob(null);
  };

  const tabTitles: Record<string, string> = {
    profile: 'ВАШ ПРОФИЛЬ',
    dialogues: 'ДИАЛОГИ',
    discovery: 'ВОКРУГ СВЕТА',
  };

  const statusOptions = ['Хочу поговорить', 'Свободен', 'Просто слушаю', 'Без флирта'];
  const ages = Array.from({ length: 48 }, (_, i) => i + 18);

  // ─── If not registered, show RegistrationPanel ───
  if (!isRegistered) {
    return <RegistrationPanel onComplete={() => setIsRegistered(true)} />;
  }

  return (
    <>
      {/* ═══ GLOBAL SCENE OVERLAY ═══ */}
      <div
        className={`fixed inset-0 z-[90] pointer-events-none transition-opacity duration-700 ${sceneActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ backdropFilter: sceneActive ? 'blur(5px)' : 'none' }}
      >
        {/* Layer 1 — Deep darkness */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)' }} />
        {/* Layer 2 — Warm amber spotlight (elliptical, vertical stretch) */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 600px 900px at calc(100% - 220px) 200px, rgba(255,190,80,0.35) 0%, rgba(255,150,40,0.25) 20%, rgba(255,120,20,0.12) 40%, rgba(0,0,0,0) 65%),
            linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.2) 100%)
          `
        }} />
      </div>

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
      <div 
        className="pointer-events-auto h-full w-[420px] lg:w-[460px] flex flex-col bg-[#0f172a] border-l border-white/[0.06]"
      >
        
        {/* ─── HEADER BAR ─── */}
        <div className="shrink-0 flex items-center gap-1 px-3 py-2.5 border-b border-white/[0.06]">
          <TabIcon active={activeTab === 'profile'} onClick={() => handleTabSwitch('profile')} color={activeTab === 'profile' ? '#f97316' : undefined}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </TabIcon>
          <TabIcon active={activeTab === 'dialogues'} onClick={() => handleTabSwitch('dialogues')} color={activeTab === 'dialogues' ? '#f97316' : undefined}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </TabIcon>
          <TabIcon active={activeTab === 'discovery'} onClick={() => handleTabSwitch('discovery')} color={activeTab === 'discovery' ? '#f97316' : undefined}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </TabIcon>
          
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="text-[13px] font-bold text-[#e5e7eb] tracking-wide uppercase">{tabTitles[activeTab]}</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              {onlineCount} ОНЛАЙН
            </span>
          </div>

          {onExit && (
            <button onClick={onExit} className="ml-3 p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            
            {/* ═══ PRIVATE SESSION ═══ */}
            {isPrivateMode && activeTab === 'dialogues' ? (
              <motion.div key="private-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                <PrivateChatView 
                  session={state.activeSession!} messages={state.privateMessages} currentUser={state.currentUser}
                  onSendMessage={handleMessageSend} onLeaveSession={() => closeSession(state.activeSession!.sessionId)} language={language}
                />
              </motion.div>

            ) : activeTab === 'profile' ? (
              /* ═══ PROFILE TAB ═══ */
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5">
                
                <h2 className="text-[18px] font-black text-white uppercase tracking-wider text-center mb-2">Ваш профиль</h2>
                <p className="text-[11px] text-slate-500 text-center mb-6 leading-relaxed">Эта информация помогает подобрать собеседников. Сообщения и данные удаляются автоматически.</p>

                {/* Avatar */}
                <div className="flex flex-col items-center mb-5">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-[#1a2235] border-2 border-white/10 flex items-center justify-center overflow-hidden">
                      <span className="text-5xl">{avatarEmoji}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
                    <span className="text-red-400">📍</span> Авто-определение: <span className="font-bold text-white">Global</span>
                  </p>
                </div>

                {/* Name */}
                <div className="mb-5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Ваше имя (псевдоним)</label>
                  <input 
                    type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                    className="w-full radio-input px-4 py-3 text-[14px] font-medium" placeholder="Введите имя..." maxLength={20}
                  />
                </div>

                {/* Gender + Age Row */}
                <div className="flex gap-4 mb-5">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Пол</label>
                    <div className="flex gap-2">
                      <button onClick={() => setGender('male')} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${gender === 'male' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}>МУЖ</button>
                      <button onClick={() => setGender('female')} className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${gender === 'female' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}>ЖЕН</button>
                    </div>
                  </div>
                  <div className="w-28 relative">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Возраст</label>
                    <button 
                      onClick={() => setShowAgePicker(!showAgePicker)}
                      className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-white text-[15px] font-bold">{age}</span>
                      <span className="text-orange-400 text-[10px] font-bold">18+</span>
                    </button>
                    {/* Age Picker Dropdown */}
                    {showAgePicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f172a] border border-white/10 rounded-xl max-h-[200px] overflow-y-auto no-scrollbar z-50 shadow-xl">
                        {ages.map(a => (
                          <button 
                            key={a} 
                            onClick={() => { setAge(String(a)); setShowAgePicker(false); }}
                            className={`w-full px-4 py-2 text-left text-[13px] font-medium transition-colors ${String(a) === age ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300 hover:bg-white/5'}`}
                          >
                            {a}{a >= 65 ? '+' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"><span>✨</span> Статус</label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map(s => (
                      <button key={s} onClick={() => setSelectedStatus(s === selectedStatus ? '' : s)}
                        className={`py-2.5 px-3 rounded-xl text-[12px] font-medium transition-all border ${selectedStatus === s ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-300'}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                {/* Voice Recording */}
                <div className="mb-5">
                  {voiceBlob ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-emerald-400">Голос записан</p>
                        <audio src={voiceBlob} controls className="w-full h-7 mt-1" style={{ filter: 'invert(1) hue-rotate(180deg)', opacity: 0.7 }} />
                      </div>
                      <button onClick={deleteVoice} className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors" title="Удалить">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ) : isRecording ? (
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 animate-pulse">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold text-red-400">Запись... {recordingTime}с / 10с</p>
                          <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                            <div className="h-full bg-red-500/60 rounded-full transition-all" style={{ width: `${recordingTime * 10}%` }} />
                          </div>
                        </div>
                        <button onClick={stopRecording} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase">
                          Стоп
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={startRecording} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#e5e7eb]">голос</p>
                        <p className="text-[10px] text-slate-500">Нажмите для записи • макс 10сек</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Settings Accordion */}
                <div className="mb-5">
                  <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                    <span className="text-[12px] text-slate-400 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      НАСТРОЙКИ
                    </span>
                    <svg className={`w-4 h-4 text-slate-500 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {settingsOpen && (
                    <div className="mt-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 animate-[fadeIn_0.15s_ease-out]">
                      <ToggleRow label="Звуки" on={soundEnabled_s} onToggle={() => setSoundEnabled_s(!soundEnabled_s)} />
                      <ToggleRow label="Баннеры" on={bannersEnabled} onToggle={() => setBannersEnabled(!bannersEnabled)} />
                      <ToggleRow label="Голос" on={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} />
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-400">Громкость</span>
                          <span className="text-[10px] text-slate-500 font-bold">{volume}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button onClick={() => { playTabSwitchSound(); handleTabSwitch('discovery'); }}
                  className="w-full py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
                >ГОТОВО / ПРОДОЛЖИТЬ</button>

                <p className="text-[9px] text-slate-600 text-center mt-3">Данные хранятся только в этом браузере пока вы не удалите их.</p>
                <button onClick={handleResetData} className="w-full text-[10px] text-red-500/60 font-semibold uppercase tracking-wider mt-4 hover:text-red-400 transition-colors">УДАЛИТЬ АККАУНТ</button>
                <p className="text-[8px] text-slate-700 text-center mt-1">Аккаунт будет удалён через 30 дней</p>
                <button onClick={handleResetData} className="w-full text-[9px] text-slate-600 font-medium mt-3 hover:text-slate-400 transition-colors uppercase tracking-wider">СБРОС ДАННЫХ</button>
              </motion.div>

            ) : activeTab === 'dialogues' ? (
              /* ═══ DIALOGUES TAB ═══ */
              <motion.div key="dialogues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5 h-full flex flex-col">
                <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-6">Мои диалоги</p>
                {state.activeSession ? (
                  <div className="flex-1">
                    <PrivateChatView session={state.activeSession} messages={state.privateMessages} currentUser={state.currentUser}
                      onSendMessage={handleMessageSend} onLeaveSession={() => closeSession(state.activeSession!.sessionId)} language={language} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#1a2235] flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        <circle cx="8" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="16" cy="10" r="1"/>
                      </svg>
                    </div>
                    <h3 className="text-[14px] font-bold text-[#e5e7eb] uppercase tracking-wide mb-2">У вас пока нет активных диалогов</h3>
                    <p className="text-[11px] text-slate-500 mb-8 max-w-[280px] leading-relaxed">Здесь будут появляться ваши текущие разговоры. Начните прямо сейчас!</p>
                    <span className="text-[10px] text-emerald-400 font-semibold mb-6 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>СЕЙЧАС ОНЛАЙН: {onlineCount}
                    </span>
                    <button onClick={() => handleTabSwitch('discovery')} className="w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      НАЙТИ СОБЕСЕДНИКА
                    </button>
                    <button className="w-full py-3 rounded-2xl text-[11px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2"><span>🎲</span>МНЕ ПОВЕЗЁТ (СЛУЧАЙНЫЙ)</button>
                    <p className="text-[9px] text-slate-600 mt-4 italic">* История не сохраняется</p>
                  </div>
                )}
              </motion.div>

            ) : (
              /* ═══ DISCOVERY TAB ═══ */
              <motion.div key="discovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                
                {discoveryView === 'main' ? (
                  <div className="p-5 flex flex-col items-center flex-1 relative">
                    {/* Scene Spotlight Overlay — warm light bleeding through panel */}
                    {sceneActive && (
                      <>
                        <div className="absolute inset-0 pointer-events-none z-0" style={{
                          background: 'radial-gradient(circle at 50% 12%, rgba(255,200,100,0.15) 0%, rgba(255,150,50,0.05) 40%, rgba(0,0,0,0) 70%)'
                        }} />
                        <div className="absolute inset-0 pointer-events-none z-0" style={{
                          background: 'linear-gradient(180deg, rgba(255,180,0,0.06) 0%, transparent 50%)'
                        }} />
                      </>
                    )}

                    {/* Scene illustration — clickable lamp */}
                    <button onClick={() => setSceneActive(!sceneActive)} className="relative w-full flex flex-col items-center my-4 cursor-pointer z-10 group">
                      {/* Scene container with border glow */}
                      <div className="p-5 rounded-2xl">
                        <div className="flex items-end gap-3">
                          <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500 ${sceneActive ? 'bg-[#1a2235] border-white/15 opacity-90' : 'bg-[#1a2235] border-white/8 opacity-60'}`}>
                            <span className="text-xl">🎧</span>
                          </div>
                          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${sceneActive ? 'bg-[#1a2235] border-white/15' : 'bg-[#1a2235] border-white/10'}`}>
                            <span className="text-3xl relative z-10">🎤</span>
                          </div>
                          <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500 ${sceneActive ? 'bg-[#1a2235] border-white/15 opacity-90' : 'bg-[#1a2235] border-white/8 opacity-60'}`}>
                            <span className="text-xl">🎵</span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-[10px] uppercase tracking-widest font-semibold mt-3 transition-colors ${sceneActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                        Сцена {sceneActive ? '✦' : ''}
                      </p>
                    </button>

                    {/* Online badge */}
                    <span className="text-[10px] text-emerald-400 font-bold px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-4 flex items-center gap-1.5 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>СЕЙЧАС ОНЛАЙН: {onlineCount}
                    </span>

                    <h2 className="text-[22px] font-bold text-white text-center mb-1 leading-tight z-10">Найди собеседника<br />прямо сейчас</h2>
                    <p className="text-[11px] text-slate-500 mb-6 z-10">Без истории. Без обязательств. 18+</p>

                    {/* Mode Cards */}
                    <div className="flex gap-3 w-full mb-6 z-10">
                      <button onClick={() => { playCardOpenSound(); handleTabSwitch('dialogues'); }}
                        className="flex-1 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left group">
                        <div className="flex items-center gap-2 mb-1"><span className="text-lg">🌐</span>
                          <div className="w-6 h-6 rounded-full bg-[#1a2235] border border-white/8 flex items-center justify-center"><span className="text-[10px]">👤</span></div>
                        </div>
                        <p className="text-[12px] font-bold text-[#e5e7eb] uppercase tracking-wide">Случайный</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Диалог с кем угодно</p>
                      </button>
                      <button onClick={() => { playCardOpenSound(); setDiscoveryView('online'); }}
                        className="flex-1 p-4 rounded-2xl bg-white/[0.03] border border-orange-500/20 hover:bg-white/[0.05] hover:border-orange-500/40 transition-all text-left group">
                        <div className="flex items-center gap-2 mb-1"><span className="text-lg">🖐</span>
                          <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><span className="text-[10px]">👥</span></div>
                        </div>
                        <p className="text-[12px] font-bold text-orange-400 uppercase tracking-wide">Кто онлайн</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Только активные</p>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-4 z-10">или по параметрам</p>

                    {/* Functional Filters */}
                    <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-4 z-10">
                      <div className="flex gap-6 mb-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Возраст</label>
                          <div className="flex items-center gap-2">
                            <select value={filterAgeMin} onChange={e => setFilterAgeMin(Number(e.target.value))}
                              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[13px] font-bold text-white outline-none cursor-pointer appearance-none text-center w-16">
                              {ages.map(a => <option key={a} value={a} className="bg-[#0f172a] text-white">{a}</option>)}
                            </select>
                            <span className="text-slate-600 font-bold">—</span>
                            <select value={filterAgeMax} onChange={e => setFilterAgeMax(Number(e.target.value))}
                              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[13px] font-bold text-white outline-none cursor-pointer appearance-none text-center w-16">
                              {ages.map(a => <option key={a} value={a} className="bg-[#0f172a] text-white">{a}{a >= 65 ? '+' : ''}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Пол</label>
                          <div className="flex gap-2">
                            <button onClick={() => setFilterGender(filterGender === 'male' ? 'all' : 'male')}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${filterGender === 'male' ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'}`}>М</button>
                            <button onClick={() => setFilterGender(filterGender === 'female' ? 'all' : 'female')}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${filterGender === 'female' ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'}`}>Ж</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => { playCardOpenSound(); setDiscoveryView('online'); }}
                      className="w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 z-10">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      НАЧАТЬ ПОИСК
                    </button>
                    <p className="text-[8px] text-slate-600 mt-2 z-10">* Сообщения удаляются автоматически</p>
                  </div>
                ) : (
                  /* ── Online Users (Conveyor) ── */
                  <div className="flex flex-col h-full">
                    <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                      <button onClick={() => setDiscoveryView('main')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-[12px] font-bold text-[#e5e7eb] uppercase tracking-wider">Кто онлайн</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{filteredFeed.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
                      {filteredFeed.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                          <span className="text-3xl opacity-30 mb-3">📡</span>
                          <p className="text-[12px] text-slate-500 font-medium">Пока никого нет</p>
                          <p className="text-[10px] text-slate-600 mt-1">Ожидаем подключения...</p>
                        </div>
                      ) : (
                        filteredFeed.map(user => (
                          <ConveyorCard key={user.id} user={user} onKnock={sendKnock} isWaiting={state.outgoingKnock?.targetUserId === user.id} isBusy={false} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ RADIO PLAYER ═══ */}
        <RadioPlayer />
      </div>
    </div>
    </>
  );
};

/* ─── Toggle Row ─── */
const ToggleRow: React.FC<{ label: string; on: boolean; onToggle: () => void }> = ({ label, on, onToggle }) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] text-slate-400">{label}</span>
    <button onClick={onToggle} className={`w-9 h-5 rounded-full relative transition-colors ${on ? 'bg-emerald-500/30' : 'bg-white/5'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${on ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-slate-600'}`} />
    </button>
  </div>
);

/* ─── Tab Icon Button ─── */
const TabIcon: React.FC<{ active: boolean; onClick: () => void; color?: string; children: React.ReactNode }> = ({ active, onClick, color, children }) => (
  <button onClick={onClick} className={`p-2.5 rounded-xl transition-all ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
    style={active && color ? { color, backgroundColor: `${color}15` } : {}}>
    {children}
  </button>
);

export default ChatPlatformV2;
