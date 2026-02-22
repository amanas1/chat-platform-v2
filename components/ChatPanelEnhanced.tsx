
import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { 
    XMarkIcon, PaperAirplaneIcon, UsersIcon, 
    MicrophoneIcon, FaceSmileIcon, 
    PlayIcon, PauseIcon, SearchIcon, ClockIcon,
    NextIcon, PreviousIcon, VolumeIcon, ChevronDownIcon, ChevronUpIcon,
    HeartIcon, ArrowLeftIcon, UserIcon, ChatBubbleIcon,
    BellIcon, NoSymbolIcon, LifeBuoyIcon, SpeakIcon, GlobeIcon, ArrowRightOnRectangleIcon, AdjustmentsIcon, ShuffleIcon, ShareIcon
} from './Icons';
import { ChatMessage, UserProfile, Language, RadioStation, ChatSession, VisualMode } from '../types';
import AudioVisualizer from './AudioVisualizer';
import DancingAvatar from './DancingAvatar';
const ChatDemoAnimation = React.lazy(() => import('./ChatDemoAnimation'));
const RegistrationDemoAnimation = React.lazy(() => import('./RegistrationDemoAnimation'));
const InteractionDemoAnimation = React.lazy(() => import('./InteractionDemoAnimation'));
import { socketService } from '../services/socketService';
import { encryptionService } from '../services/encryptionService';
import { geolocationService, LocationData } from '../services/geolocationService';
import { TRANSLATIONS, COUNTRIES_DATA, PRESET_AVATARS } from '../constants';
import StickerPicker from './StickerPicker';
const AvatarCreator = React.lazy(() => import('./AvatarCreator').then(module => ({ default: module.AvatarCreator })));

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStation: () => void;
  onPrevStation: () => void;
  currentStation: RadioStation | null;
  analyserNode: AnalyserNode | null;
  volume: number;
  onVolumeChange: (vol: number) => void;
  visualMode: VisualMode;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  randomMode: boolean;
  onToggleRandomMode: () => void;
  onShare: () => void;
  onPendingKnocksChange?: (count: number) => void;
  detectedLocation: (LocationData) | null;
  onRequireLogin?: () => void;
  onLightsToggle?: (isOn: boolean) => void;
}

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💧', '🌈', '☀️', '🌙', '⭐', '🎵', '🎶', '🎤', '🎧', '📷', '📸', '🎬', '🎨', '🎭', '🎪', '🎯', '🎲', '🎰', '🎳'
];

const AGES = [...Array.from({ length: 48 }, (_, i) => (i + 18).toString()), '65+']; 

const INTENT_MAP: Record<string, string> = {
  'Хочу поговорить': 'intentTalk',
  'Свободен': 'intentFree',
  'Просто слушаю': 'intentListen',
  'Без флирта': 'intentNoFlirt'
};

const INTENT_STATUSES = ['Хочу поговорить', 'Свободен', 'Просто слушаю', 'Без флирта'] as const;

const SMART_PROMPTS: Record<string, any> = {
  ru: {
    neutral: ['Привет, я здесь, чтобы просто пообщаться', 'Ищу спокойный диалог'],
    friendly: ['Если хочешь пообщаться — я здесь', 'Открыт к диалогу'],
    calm: ['Без спешки, просто разговор', 'Спокойный диалог'],
    short: ['Просто общение', 'Свободен'],
    open: ['Сейчас свободен, можем пообщаться', 'Если ищешь разговор — постучись']
  },
  en: {
    neutral: ['Hi, I’m here just to talk', 'Looking for a calm conversation'],
    friendly: ['Feel free to reach out if you want to talk', 'Open to a friendly chat'],
    calm: ['No rush, just talking', 'Relaxed conversation'],
    short: ['Just chatting', 'Free to chat'],
    open: ['I’m free right now if you want to talk', 'Feel free to knock']
  },
  es: {
    neutral: ['Hola, estoy aquí solo para hablar', 'Busco una conversación tranquila'],
    friendly: ['No dudes en contactarme si quieres hablar', 'Abierto a una charla amigable'],
    calm: ['Sin prisas, solo hablando', 'Conversación relajada'],
    short: ['Solo chateando', 'Libre para chatear'],
    open: ['Estoy libre ahora si quieres hablar', 'No dudes en llamar']
  },
  fr: {
    neutral: ['Salut, je suis là juste pour parler', 'Je cherche une conversation calme'],
    friendly: ['N’hésitez pas à me contacter pour parler', 'Ouvert à une discussion amicale'],
    calm: ['Pas de précipitation, juste parler', 'Conversation détendue'],
    short: ['Juste en train de discuter', 'Libre pour discuter'],
    open: ['Je suis libre si vous voulez parler', 'N’hésitez pas à frapper']
  },
  zh: {
    neutral: ['嗨，我只是想聊聊', '在寻找轻松的对话'],
    friendly: ['想聊天的话随时联系我', '乐于友好交流'],
    calm: ['不着急，只是聊聊', '轻松的对话'],
    short: ['只是在聊天', '有空聊天'],
    open: ['我现在有空，可以聊聊', '欢迎敲门']
  },
  de: {
    neutral: ['Hi, ich bin nur zum Reden hier', 'Suche ein ruhiges Gespräch'],
    friendly: ['Melde dich gerne, wenn du reden willst', 'Offen für einen netten Chat'],
    calm: ['Keine Eile, einfach nur reden', 'Entspanntes Gespräch'],
    short: ['Einfach nur chatten', 'Bereit für einen Chat'],
    open: ['Ich habe gerade Zeit für ein Gespräch', 'Klopf einfach an']
  }
};



interface DrumPickerProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  label: string;
  disabled?: boolean;
}

const DrumPicker: React.FC<DrumPickerProps> = ({ options, value, onChange, label, disabled }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 32; 
  const handleScroll = () => {
    if (!scrollRef.current || disabled) return;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (options[index] && options[index] !== value) {
      onChange(options[index]);
    }
  };
  useEffect(() => {
    if (!scrollRef.current) return;
    const index = options.indexOf(value);
    if (index !== -1) {
      scrollRef.current.scrollTop = index * itemHeight;
    }
  }, [value, options]);
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[9px] font-bold text-slate-600 uppercase ml-1 tracking-widest">{label}</label>
      <div className={`relative h-28 bg-slate-800/90 border rounded-2xl overflow-hidden shadow-inner transition-opacity ${disabled ? 'border-white/5 opacity-50' : 'border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'}`}>
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none opacity-90"></div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none opacity-90"></div>
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-11 bg-primary/20 rounded-xl border-2 border-white/90 shadow-[0_0_15px_rgba(188,111,241,0.4)] pointer-events-none z-[5]"></div>
        <div ref={scrollRef} onScroll={handleScroll} className={`h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-10 ${disabled ? 'pointer-events-none' : ''}`} style={{ scrollBehavior: 'smooth' }}>
          {options.map((opt, i) => (
            <div key={i} className={`h-8 flex items-center justify-center snap-center transition-all duration-300 text-sm font-black ${value === opt ? 'text-white scale-125 drop-shadow-lg' : 'text-slate-600 opacity-20'}`}>
              {opt}
            </div>
          ))}
          <div className="h-40"></div>
        </div>
      </div>
    </div>
  );
};

// Message TTL countdown component
const MessageTTLIndicator = ({ msg }: { msg: any }) => {
    const ttl = msg.messageType === 'audio' ? 30 : 60;
    const [remaining, setRemaining] = useState(ttl);
    
    useEffect(() => {
        const update = () => {
            const elapsed = Math.floor((Date.now() - msg.timestamp) / 1000);
            const left = Math.max(0, ttl - elapsed);
            setRemaining(left);
        };
        const interval = setInterval(update, 1000);
        update();
        return () => clearInterval(interval);
    }, [msg.timestamp, ttl]);

    
    if (remaining > 15) return null; // Only show in last 15 seconds
    
    return (
        <div className={`text-[8px] font-bold mt-1 flex items-center gap-1 ${remaining <= 5 ? 'text-red-500' : 'text-orange-400'}`}>
            <span className={remaining <= 5 ? "animate-pulse" : ""}>⏱</span>
            {remaining}s
        </div>
    );
};

// Session Timer Component
const SessionTimer = ({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();
            const diff = expiresAt - now;
            
            if (diff <= 0) {
                setTimeLeft('00:00:00');
                onExpire();
                return;
            }
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            setIsUrgent(diff < 300000); // Red if < 5 mins
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        
        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, [expiresAt]); // Intentionally omitting onExpire to prevent frequent re-binds if it changes
    
    return (
        <div className={`px-2 py-0.5 rounded-full border ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-200 animate-pulse' : 'bg-slate-900/80 border-white/10 text-slate-400'} font-mono text-[10px] font-bold backdrop-blur-sm`}>
            ⏱ {timeLeft}
        </div>
    );
};




const ChatPanelEnhanced: React.FC<ChatPanelProps> = ({ 
    isOpen, onClose, language, onLanguageChange,
    currentUser, onUpdateCurrentUser,
    isPlaying, onTogglePlay, onNextStation, onPrevStation, currentStation, analyserNode,
    volume, onVolumeChange, visualMode, favorites, onToggleFavorite, randomMode, onToggleRandomMode, onShare,
    onPendingKnocksChange, detectedLocation: passedLocation, onRequireLogin, onLightsToggle
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showDeleteHint, setShowDeleteHint] = useState(false);

  // Knock Flow States
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
  const [knockAcceptedData, setKnockAcceptedData] = useState<{ sessionId: string; partnerProfile: UserProfile } | null>(null);
  const [incomingKnock, setIncomingKnock] = useState<{ knockId: string; fromUser: UserProfile } | null>(null);

  // Hidden Users State
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(() => {
      const saved = localStorage.getItem('hidden_users_v1');
      return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleHideUser = (userId: string) => {
      if (!confirm(t.hideUserConfirm)) return;
      
      setHiddenUsers(prev => {
          const next = new Set(prev);
          next.add(userId);
          localStorage.setItem('hidden_users_v1', JSON.stringify(Array.from(next)));
          return next;
      });
  };

  // Hidden Sessions State
  const [hiddenSessions, setHiddenSessions] = useState<Set<string>>(() => {
      const saved = localStorage.getItem('hidden_sessions_v1');
      return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleHideSession = (sessionId: string) => {
      if (!confirm(t.hideChatConfirm)) return;
      
      setHiddenSessions(prev => {
          const next = new Set(prev);
          next.add(sessionId);
          localStorage.setItem('hidden_sessions_v1', JSON.stringify(Array.from(next)));
          return next;
      });
  };

  // Helper for TTS
  const announceNotification = (text: string) => {
      if (!currentUser.chatSettings?.voiceNotificationsEnabled) return;
      
      const isCyrillic = /[а-яА-ЯёЁ]/.test(text);
      const targetLang = isCyrillic ? 'ru-RU' : (language === 'zh' ? 'zh-CN' : 'en-US');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      
      // Select voice based on settings AND content language
      const voices = window.speechSynthesis.getVoices();
      const preferredGender = currentUser.chatSettings.notificationVoice || 'female';
      
      // try to find voice matching both lang and gender
      let selectedVoice = voices.find(v => 
          v.lang.startsWith(isCyrillic ? 'ru' : 'en') && 
          v.name.toLowerCase().includes(preferredGender)
      );

      // fallback to just lang
      if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith(isCyrillic ? 'ru' : 'en'));
      }
      
      if (selectedVoice) utterance.voice = selectedVoice;
      window.speechSynthesis.speak(utterance);
  };


  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isRegDemoOpen, setIsRegDemoOpen] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [isInteractDemoOpen, setIsInteractDemoOpen] = useState(false);
  const deleteHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update current time every second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Last Seen Time
  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return t.longAgo;
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return t.justNow;
    if (mins < 60) return `${mins}${t.minsAgo}`;
    if (hours < 24) return `${hours}${t.hoursAgo}`;
    if (days < 7) return `${days}${t.daysAgo}`;
    return new Date(timestamp).toLocaleDateString();
  };

  const [hasRegisteredWithServer, setHasRegisteredWithServer] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSessions, setActiveSessions] = useState<Map<string, any>>(() => {
    // Load sessions from localStorage on init
    try {
      const saved = localStorage.getItem('streamflow_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed));
      }
    } catch (e) {}
    return new Map();
  });
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const activeSessionRef = useRef<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [pendingKnocks, setPendingKnocks] = useState<any[]>([]);
  
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState<string>(currentUser.age?.toString() || '18');
  const [regGender, setRegGender] = useState<'male' | 'female'>((currentUser.gender === 'female' || currentUser.gender === 'male') ? currentUser.gender : 'male');
  const [regAvatar, setRegAvatar] = useState<string | null>(currentUser.avatar || null);
  const [regIntentStatus, setRegIntentStatus] = useState<typeof INTENT_STATUSES[number]>(() => {
    return (currentUser.intentStatus as any) || 'Свободен';
  });
  const [regVoiceIntro, setRegVoiceIntro] = useState<string | null>(currentUser.voiceIntro || null);
  const [isRecordingIntro, setIsRecordingIntro] = useState(false);
  const [introRecordingTime, setIntroRecordingTime] = useState(0);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const mediaRecorderIntroRef = useRef<MediaRecorder | null>(null);
  const audioChunksIntroRef = useRef<Blob[]>([]);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const introTimerRef = useRef<any>(null);
  
  const [searchAgeFrom, setSearchAgeFrom] = useState('18');
  const [searchAgeTo, setSearchAgeTo] = useState('65+');
  const [searchGender, setSearchGender] = useState<'any' | 'male' | 'female'>('any');
  
  const [sentKnocks, setSentKnocks] = useState<Set<string>>(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const valid = (currentUser.sentInvites || [])
        .filter(i => now - i.timestamp < oneDay)
        .map(i => i.toUserId);
    return new Set(valid);
  });
  const [inputText, setInputText] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(true);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [lastSelfMsgId, setLastSelfMsgId] = useState<string | null>(null);
    const [showFlagged, setShowFlagged] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Profile Lockdown Logic (30 Days)
  const isProfileLocked = useMemo(() => {
    if (!currentUser.registrationTimestamp || !currentUser.name || !currentUser.age) return false;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - currentUser.registrationTimestamp;
    return elapsed < thirtyDaysMs;
  }, [currentUser.registrationTimestamp, currentUser.name, currentUser.age]);

  const lockDaysRemaining = useMemo(() => {
    if (!currentUser.registrationTimestamp) return 0;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const remaining = thirtyDaysMs - (Date.now() - currentUser.registrationTimestamp);
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  }, [currentUser.registrationTimestamp]);

  const deletionDaysRemaining = useMemo(() => {
    if (!currentUser.deletionRequestedAt) return null;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const remaining = thirtyDaysMs - (currentTime - currentUser.deletionRequestedAt);
    if (remaining <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return { days, hours, mins, secs };
  }, [currentUser.deletionRequestedAt, currentTime]);

  // Sync registration state with currentUser (especially after login)
  useEffect(() => {
    if (currentUser.name) setRegName(currentUser.name);
    if (currentUser.age) setRegAge(currentUser.age.toString());
    if (currentUser.gender) setRegGender(currentUser.gender);
    if (currentUser.avatar) setRegAvatar(currentUser.avatar);
    if (currentUser.intentStatus) setRegIntentStatus(currentUser.intentStatus as any);
    if (currentUser.voiceIntro) setRegVoiceIntro(currentUser.voiceIntro);
    // Sync settings too
    if (currentUser.chatSettings) {
      setRegNotificationsEnabled(currentUser.chatSettings.notificationsEnabled);
      setRegNotificationVolume(currentUser.chatSettings.notificationVolume);
      setRegNotificationSound(currentUser.chatSettings.notificationSound);
      setRegBannerEnabled(currentUser.chatSettings.bannerNotificationsEnabled ?? false);
      setRegVoiceNotifEnabled(currentUser.chatSettings.voiceNotificationsEnabled ?? false);
      setRegNotifVoice(currentUser.chatSettings.notificationVoice ?? 'female');
    }
  }, [currentUser.id, currentUser.name, currentUser.age, currentUser.gender, currentUser.avatar, currentUser.intentStatus, currentUser.voiceIntro]);
  const [profileExpiresAt, setProfileExpiresAt] = useState<number | null>(null);
  const [isLightsOn, setIsLightsOn] = useState(false);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [onlineStats, setOnlineStats] = useState({ totalOnline: 0, chatOnline: 0 });
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // View state: Default to search if profile complete, else register
  const [view, setView] = useState<'register' | 'search' | 'inbox' | 'chat'>(() => {
    if (currentUser.id && currentUser.name && currentUser.age) return 'search';
    return 'register';
  });

  
  const [detectedLocation, setDetectedLocation] = useState<{country: string, city: string, ip?: string} | null>(() => {
    // Priority 0: passed prop (from Radio)
    if (passedLocation?.country && passedLocation.country !== 'Unknown') {
        return passedLocation;
    }
    // Priority 1: currentUser data
    if (currentUser.detectedCountry && currentUser.detectedCity) {
      return { 
        country: currentUser.detectedCountry, 
        city: currentUser.detectedCity,
        ip: currentUser.detectedIP 
      };
    }
    // Priority 2: localStorage cache
    return geolocationService.getCachedLocation();
  });

  // Sync prop to state if it arrives later
  useEffect(() => {
    if (passedLocation?.country && passedLocation.country !== 'Unknown') {
        setDetectedLocation(prev => {
            // Only update if different to avoid loops
            if (prev?.country !== passedLocation.country || prev?.city !== passedLocation.city) {
                return passedLocation;
            }
            return prev;
        });
    }
  }, [passedLocation]);

  
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
      gender: 'auto' as 'auto' | 'male' | 'female',
      pitch: 1.0,
      rate: 1.0
  });
  const voiceModeRef = useRef(false);
  const voiceSettingsRef = useRef(voiceSettings);

  useEffect(() => {
    voiceModeRef.current = voiceModeEnabled;
  }, [voiceModeEnabled]);
  
  useEffect(() => {
    voiceSettingsRef.current = voiceSettings;
  }, [voiceSettings]);

  // Auto-scrolling carousel logic
  const currentSpeedRef = useRef(0);
  useEffect(() => {
    if ((view !== 'search' && view !== 'register') || !carouselRef.current) return;

    const scrollContainer = carouselRef.current;
    let animationFrameId: number;
    let lastTime = 0;
    const targetSpeed = isHoveringCarousel ? 0 : 0.5; // pixels per frame

    const scroll = (time: number) => {
      if (lastTime !== 0) {
        // Smooth speed interpolation (deceleration/acceleration)
        currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.1;
        
        if (Math.abs(currentSpeedRef.current) > 0.01) {
          scrollContainer.scrollTop -= currentSpeedRef.current;
          
          // Infinite loop: if we scroll past the top, jump to the middle
          // Since we duplicate the list, height is 2x. 
          // middle = scrollHeight / 2.
          if (scrollContainer.scrollTop <= 0) {
              scrollContainer.scrollTop = (scrollContainer.scrollHeight / 2) - 1;
          }
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [view, isHoveringCarousel, searchResults, onlineUsers]);

  // Set initial scroll position to middle for bottom-to-top scroll
  useEffect(() => {
    if ((view === 'search' || view === 'register') && carouselRef.current) {
        const el = carouselRef.current;
        // Small timeout to ensure content is rendered
        setTimeout(() => {
            if (el.scrollHeight > el.clientHeight) {
                el.scrollTop = el.scrollHeight / 2;
            }
        }, 100);
    }
  }, [view, searchResults, onlineUsers]);

  // Mobile touch detection for auto-scroll (MOVED TO TOP LEVEL)
  useEffect(() => {
      const el = carouselRef.current;
      if (!el) return;

      const handleTouchStart = () => setIsHoveringCarousel(true);
      const handleTouchEnd = () => setIsHoveringCarousel(false);

      el.addEventListener('touchstart', handleTouchStart);
      el.addEventListener('touchend', handleTouchEnd);
      return () => {
           el.removeEventListener('touchstart', handleTouchStart);
           el.removeEventListener('touchend', handleTouchEnd);
      };
  }, [searchResults, onlineUsers, view]); // Re-bind when list re-renders/view changes

    // AI Voice Mode Helper (Component Scope)
    const speakMessage = (text: string, senderGender: string = 'other') => {
        if (!voiceModeRef.current && !text.includes('test')) return; 
        if (!('speechSynthesis' in window)) return;
        
        // Settings from ref (latest)
        const { gender: preferredGender, pitch, rate } = voiceSettingsRef.current;

        // Determine target gender: if 'auto', use sender's gender, otherwise use preference
        let targetGender = preferredGender;
        if (targetGender === 'auto') {
            // Map 'other' to random or default (let's default to female for 'other' or randomize? User said "if woman, she speaks")
            // If sender is explicit male, usage male.
            targetGender = (senderGender === 'male') ? 'male' : 'female';
        }

        // Automatic Language Detection (Enhanced)
        const isRussian = /[а-яёА-ЯЁ]/.test(text);
        const langCode = isRussian ? 'ru-RU' : 'en-US';
        
        console.log(`[VOICE] 🎙 Speaking: "${text.substring(0, 30)}..."`);
        console.log(`[VOICE] Lang: ${langCode} | Preferred Gender: ${preferredGender} | Target Gender: ${targetGender} | Sender Gender: ${senderGender}`);
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        
        // Find Voices
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn('[VOICE] ⚠️ No voices available');
            return;
        }

        console.log(`[VOICE] Total voices available: ${voices.length}`);

        // Filter by Language
        const langVoices = voices.filter(v => v.lang.startsWith(isRussian ? 'ru' : 'en'));
        console.log(`[VOICE] Voices for ${langCode}: ${langVoices.length}`);
        
        const voicePool = langVoices.length > 0 ? langVoices : voices;

        // Expanded Gender Keywords for better detection on Mac/Windows/Android
        // IMPORTANT: Avoid generic keywords like "male"/"female" as they cause false matches
        // (e.g., "male" matches "female", "female" is subset of itself)
        const genderKeywords = {
            female: [
                'woman', 'girl', 'lady', // Generic (safe)
                'elena', 'irina', 'milena', 'anna', 'tatyana', 'victoria', // RU Latin
                'елена', 'ирина', 'милена', 'анна', 'татьяна', 'виктория', // RU Cyrillic
                'samantha', 'karen', 'moira', 'tessa', 'veena', 'zira', 'susan', 'catherine' // EN
            ],
            male: [
                'man', 'boy', 'guy', // Generic (safe)
                'pavel', 'alexander', 'yuri', 'maxim', 'ivan', 'dmitry', // RU Latin
                'павел', 'александр', 'юрий', 'максим', 'иван', 'дмитрий', // RU Cyrillic
                'daniel', 'fred', 'rishi', 'alex', 'mark', 'david', 'james', 'george', 'microsoft david' // EN
            ]
        };

        // Debug: log all available voice names for the target language
        console.log(`[VOICE] Available ${langCode} voices:`, voicePool.map(v => v.name).join(', '));

        // Find matching voices (plural - we want to pick the best one)
        const matchingVoices = voicePool.filter(v => {
            const name = v.name.toLowerCase();
            // @ts-ignore
            const keywords = genderKeywords[targetGender] || [];
            return keywords.some(k => name.includes(k));
        });

        // Prioritize Enhanced/улучшенный voices
        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (matchingVoices.length > 0) {
            // Try to find Enhanced version first
            selectedVoice = matchingVoices.find(v => 
                v.name.toLowerCase().includes('enhanced') || 
                v.name.toLowerCase().includes('улучшенный')
            );
            
            // Fallback to any matching voice
            if (!selectedVoice) {
                selectedVoice = matchingVoices[0];
            }
            
            console.log(`[VOICE] 🎯 Found ${matchingVoices.length} matching voice(s), selected: "${selectedVoice.name}"`);
        }

        console.log(`[VOICE] Gender-matched voice: ${selectedVoice ? selectedVoice.name : 'NONE'}`);

        // Smart Fallback: 
        // If no matching gender voice found, try to pick one based on heuristics
        if (!selectedVoice) {
            console.warn(`[VOICE] ⚠️ No ${targetGender} voice found for ${langCode}. Trying fallback...`);
            
            // Fallback strategy for male voice (most common issue)
            if (targetGender === 'male') {
                // Try to find ANY voice that doesn't match female keywords
                selectedVoice = voicePool.find(v => {
                    const name = v.name.toLowerCase();
                    const isFemale = genderKeywords.female.some(k => name.includes(k));
                    return !isFemale; // Pick first non-female voice
                });
                
                if (selectedVoice) {
                    console.log(`[VOICE] 🔄 Fallback: Using non-female voice "${selectedVoice.name}"`);
                }
            }
            
            // Ultimate fallback: use first voice from language
            if (!selectedVoice) {
                selectedVoice = voicePool[0];
                console.log(`[VOICE] 🔄 Ultimate fallback: Using default voice "${selectedVoice.name}"`);
            }
        }

        utterance.voice = selectedVoice || voices[0];
        utterance.rate = rate; 
        utterance.pitch = pitch;
        utterance.volume = 1.0;
        
        console.log(`[VOICE] ✅ Selected voice: "${utterance.voice?.name}" | Pitch: ${pitch} | Rate: ${rate}`);
        
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    };

  const [regNotificationsEnabled, setRegNotificationsEnabled] = useState(currentUser.chatSettings?.notificationsEnabled ?? true);
  const [regNotificationVolume, setRegNotificationVolume] = useState(currentUser.chatSettings?.notificationVolume ?? 0.8);
  const [regNotificationSound, setRegNotificationSound] = useState(currentUser.chatSettings?.notificationSound ?? 'default');
  const [regBannerEnabled, setRegBannerEnabled] = useState(currentUser.chatSettings?.bannerNotificationsEnabled ?? false);
  const [regVoiceNotifEnabled, setRegVoiceNotifEnabled] = useState(currentUser.chatSettings?.voiceNotificationsEnabled ?? false);
  const [regNotifVoice, setRegNotifVoice] = useState<'female' | 'male'>(currentUser.chatSettings?.notificationVoice ?? 'female');
  const [notificationToast, setNotificationToast] = useState<{ senderName: string; text: string; senderId: string; avatar?: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Helper: Banner Notification
  const showBannerNotification = (title: string, body: string) => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
      } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                  new Notification(title, { body, icon: '/pwa-192x192.png' });
              }
          });
      }
  };

  // Helper: Voice Notification
  const playVoiceNotification = () => {
      const text = t.newMsgNotification;
      
      speakMessage(text, 'other'); // Uses the existing speakMessage helper but forces our text
  };

  // Override speakMessage to use our specific notification settings if called for notification context
  // Actually, let's just make a specialized one or reuse speakMessage with a ref hack?
  // Easier to make a standalone simplified one for reliability or adapt speakMessage.
  // We will adapt the socket listener to call speakMessage with the specific text if Voice Notification is ON.
  // BUT we need to ensure speakMessage uses the correct VOICE (Male/Female) selected in settings.
  // The existing speakMessage uses `voiceSettingsRef` (which is for the Voice Mode).
  // We should create a dedicated simple speaker for notifications to not conflict with Voice Mode settings.
  
  const speakNotification = () => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      
      const text = t.newMsgNotification;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = regNotificationVolume;
      utterance.rate = 1.0;
      utterance.pitch = 1.0; 
      const langMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN', de: 'de-DE' };
      utterance.lang = langMap[language] || 'en-US';

      // Find voice
      const voices = window.speechSynthesis.getVoices();
      const targetGender = regNotifVoice; // 'female' or 'male'
      
      // Re-use logic or simplified logic
      const genderKeywords = {
          female: ['woman', 'girl', 'female', 'elena', 'milena', 'anna', 'samantha', 'zira', 'google русский'], // "Google Русский" is often female
          male: ['man', 'boy', 'male', 'pavel', 'alexander', 'david', 'google us english'] 
      };

      let selectedVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          return genderKeywords[targetGender].some(k => name.includes(k));
      });

      if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith(language === 'ru' ? 'ru' : 'en'));
      
      if (selectedVoice) utterance.voice = selectedVoice;
      
      window.speechSynthesis.speak(utterance);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const preRecordingVolumeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const availableCitiesSearch = useMemo(() => [], []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, view]);

  // Keep ref in sync with state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Notify parent about pending knocks count changes
  useEffect(() => {
    onPendingKnocksChange?.(pendingKnocks.length);
  }, [pendingKnocks.length, onPendingKnocksChange]);
  

  useEffect(() => {
    const cleanup = socketService.onPresenceCount((stats) => {
        setOnlineStats(stats);
    });
    return cleanup;
  }, []);

  const detectedCountry = passedLocation?.country || detectedLocation?.country || t.unknown;

  // Background Location Detection (Silent) & Auto-Update Profile
  useEffect(() => {
    // Skip if parent hasn't provided location data yet (initial null state)
    if (!passedLocation) return;

    console.log('[Chat] 📍 Passed Location Prop:', passedLocation);
    
    const detect = async () => {
      // If we have a valid passedLocation (from App.tsx), use it
      if (passedLocation.country && passedLocation.country !== 'Unknown') {
          console.log('[Chat] ✅ Using passed location:', passedLocation.country);
          setDetectedLocation(passedLocation);
          
          // Auto-update profile if it's missing country or has default "Russia" but we are elsewhere
          if (currentUser.id && (!currentUser.country || currentUser.country === 'Russia')) {
             console.log('[GEO] 🌍 Auto-updating profile location to:', passedLocation.country);
             onUpdateCurrentUser({
                 ...currentUser,
                 country: passedLocation.country,
                 city: passedLocation.city || currentUser.city,
                 detectedCountry: passedLocation.country,
                 detectedCity: passedLocation.city,
                 detectedIP: passedLocation.ip
             });
          }
          return;
      }

      // passedLocation exists but country is Unknown — try internal detection
      try {
        const location = await geolocationService.detectLocation();
        if (location) {
          console.log('[Chat] 🕵️ Internal detection found:', location.country);
          setDetectedLocation(location);
          geolocationService.saveLocationToCache(location);
          
           // Auto-update profile here too
           if (currentUser.id && (!currentUser.country || currentUser.country === 'Russia')) {
             console.log('[GEO] 🌍 Auto-updating profile location (internal) to:', location.country);
             onUpdateCurrentUser({
                 ...currentUser,
                 country: location.country,
                 city: location.city || currentUser.city,
                 detectedCountry: location.country,
                 detectedCity: location.city,
                 detectedIP: location.ip
             });
          }
        }
      } catch (err) {
        console.error('[GEO] Silent detection error:', err);
      }
    };
    
    detect();
  }, [passedLocation]);
  
  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    if (activeSessions.size > 0) {
      const sessionsObj = Object.fromEntries(activeSessions);
      localStorage.setItem('streamflow_chat_sessions', JSON.stringify(sessionsObj));
      console.log(`[SESSION] Saved ${activeSessions.size} sessions to localStorage`);
    }
  }, [activeSessions]);
  
  // Message pruning for ephemeral chat (30s media, 60s text, 50 cap)
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      setMessages(prev => {
        const now = Date.now();
        const filtered = prev.filter(msg => {
          const age = now - msg.timestamp;
          if (msg.messageType === 'audio') {
            return age < 30000; // 30s for media
          }
          return age < 60000; // 60s for text
        });
        
        // Keep only top 50 strictly
        if (filtered.length > 50) return filtered.slice(-50);
        return filtered;
      });
    }, 1000);
    return () => clearInterval(pruneInterval);
  }, []);



  // Socket.IO connection setup
  useEffect(() => {
    // socketService.connect() is handled by parent App.tsx
    
    // Collect cleanup functions
    const cleanups: (() => void)[] = [];
    
    // Listen for profile expiration warning
    cleanups.push(socketService.onProfileExpiring((data) => {
      const minutes = Math.floor(data.expiresIn / 60000);
      alert(`⚠️ ${t.profileExpiringWarning.replace('{minutes}', minutes.toString())}`);
    }));
    
    // Listen for profile expiration
    cleanups.push(socketService.onProfileExpired(() => {
      alert(`❌ ${t.profileExpired}`);
      // No manual redirect to auth, App.tsx handles re-auth/re-init
    }));
    
    // Listen for online users
    cleanups.push(socketService.onPresenceList((users) => {
      setOnlineUsers(users);
    }));

    // Mobile: Reconnect on visibility change
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !socketService.isConnected) {
            console.log("📱 App foregrounded, reconnecting socket...");
            socketService.connect();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    cleanups.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
    
    // Sound effects
    const playNotificationSound = (type: 'knock' | 'door') => {
        const { chatSettings } = currentUser;
        if (!chatSettings.notificationsEnabled) return;

        try {
            let soundPath = '';
            if (type === 'door') {
                soundPath = '/sounds/door-creak.mp3';
            } else {
                switch (chatSettings.notificationSound) {
                    case 'soft': soundPath = '/sounds/knock_soft.mp3'; break;
                    case 'alert': soundPath = '/sounds/knock_alert.mp3'; break;
                    default: soundPath = '/sounds/knock.mp3';
                }
            }

            const audio = new Audio(soundPath);
            const baseVol = type === 'knock' ? 0.8 : 0.6;
            audio.volume = baseVol * chatSettings.notificationVolume;
            audio.play().catch(e => console.error("Audio play failed", e));
        } catch (err) {
            console.error("Audio init failed", err);
        }
    };
    
    // Listen for incoming knocks - SINGLE ROBUST LISTENER
    cleanups.push(socketService.onKnockReceived((data) => {
      console.log("[KNOCK] 🔔 Incoming knock received:", data);
      
      if (currentUser.blockedUsers.includes(data.fromUserId)) {
          console.warn("[KNOCK] 🚫 Blocked user tried to knock:", data.fromUserId);
          return;
      }
      
      // Update UI state
      setIncomingKnock({
          knockId: data.knockId,
          fromUser: data.fromUser
      });
      
      setPendingKnocks(prev => {
          // Avoid duplicates
          if (prev.some(k => k.knockId === data.knockId)) return prev;
          return [...prev, data];
      });

      // Voice notification (sound)
      if (currentUser.chatSettings.voiceNotificationsEnabled) {
        console.log("[KNOCK] 🔊 Playing voice notification");
        playNotificationSound('knock');
        announceNotification(`${t.newKnockFrom || 'New knock from'} ${data.fromUser.name}`);
      } else {
        console.log("[KNOCK] 🔊 Playing standard sound");
        playNotificationSound('knock');
      }
      
      // Banner notification
      if (currentUser.chatSettings.bannerNotificationsEnabled && document.visibilityState === 'hidden') {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notif = new Notification(`${data.fromUser.name || t.partner} ${t.isKnocking || 'is knocking!'}`, {
            body: t.newMsg,
            icon: data.fromUser.avatar || '/icon-192.png',
            tag: `knock-${data.knockId}`,
            requireInteraction: true
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        }
      }
    }));

    // ANTI-SPAM: Listen for knock errors (daily limit, blocks, etc.)
    cleanups.push(socketService.addListener('knock:error', (data: { message: string; reason?: string; remaining?: number }) => {
      console.warn('[KNOCK] Error:', data);
      if (data.reason === 'DAILY_LIMIT') {
        alert(data.message || 'Daily knock limit reached.');
      } else if (data.reason === 'PERMANENT_BLOCK') {
        alert(data.message || 'This user has blocked you.');
      } else {
        alert(data.message || 'Could not send knock.');
      }
    }));

    // ANTI-SPAM: Listen for suspension notifications
    cleanups.push(socketService.onSuspended((data) => {
      console.warn('[SUSPENSION]', data);
      alert(data.message || 'Your profile has been temporarily suspended for review.');
    }));

    // RESTORE DELETED ACCOUNT
    cleanups.push(socketService.onUserRestored((restoredProfile) => {
      console.log('✅ Account restored successfully:', restoredProfile);
      localStorage.setItem('streamflow_user_profile', JSON.stringify(restoredProfile));
      alert(language === 'ru' ? 'Добро пожаловать обратно! Ваш аккаунт успешно восстановлен.' : 'Welcome back! Your account has been restored.');
      window.location.reload();
    }));

    // RE-REGISTER ON RECONNECT (Fix for server restarts) — with cleanup
    cleanups.push(socketService.onConnect(() => {
        if (currentUser && currentUser.id) {
            console.log("🔄 Re-registering user after reconnect...");
            socketService.registerUser(currentUser, (data) => {
                console.log("✅ User re-registered successfully");
                // Restore sessions from server on reconnect
                if (data?.activeSessions && data.activeSessions.length > 0) {
                  console.log(`[SESSION] Restoring ${data.activeSessions.length} sessions on reconnect`);
                  setActiveSessions(prev => {
                    const newMap = new Map(prev);
                    data.activeSessions.forEach((session: any) => {
                      if (!newMap.has(session.sessionId)) {
                        newMap.set(session.sessionId, session);
                      }
                    });
                    return newMap;
                  });
                }
            });
        }
    }));

    // Check immediate connection status (for hydration/initial load)
    if (socketService.isConnected && currentUser && currentUser.id) {
         console.log("👤 User state updated, ensuring registration (immediate)...");
         socketService.registerUser(currentUser, (data) => {
             console.log("✅ User registered/updated on server");
             // Restore sessions from server
             if (data?.activeSessions && data.activeSessions.length > 0) {
               console.log(`[SESSION] Restoring ${data.activeSessions.length} sessions (immediate)`);
               setActiveSessions(prev => {
                 const newMap = new Map(prev);
                 data.activeSessions.forEach((session: any) => {
                   if (!newMap.has(session.sessionId)) {
                     newMap.set(session.sessionId, session);
                   }
                 });
                 return newMap;
               });
             }
         });
    }
    
    // Listen for session creation
    cleanups.push(socketService.onSessionCreated((data) => {
      console.log("[CLIENT] Session created:", data);
      
      try {
          setActiveSessions(prev => new Map(prev).set(data.sessionId, data));
          
          // Clean up any pending knocks that match this partner
          setPendingKnocks(prev => prev.filter(k => k.fromUserId !== data.partnerId));
          // Also clear sent knocks since we are now connected
          setSentKnocks(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.partnerId);
              return newSet;
          });

          // Handshake Logic
          if (data.waitingForPartner) {
              // Receiver: Don't enter chat yet, wait for Sender
              setIsWaitingForPartner(true);
              setActiveSession(data); // Set session but don't change view?
              // Actually, we stay in 'search' or 'inbox', showing overlay
          } else {
              // Sender (via join) OR old flow: Enter immediately
              setActiveSession(data);
              setView('chat');
              
              // Try playing sound safely
              try {
                 playNotificationSound('door');
              } catch(e) {
                 console.warn("Sound play failed", e);
              }
          }

          // Load messages for this session
          socketService.getMessages(data.sessionId, ({ messages: msgs }) => {
            const decrypted = msgs.map(msg => ({
              ...msg,
              text: msg.messageType === 'text' && msg.encryptedPayload 
                ? encryptionService.decrypt(msg.encryptedPayload, data.sessionId)
                : undefined,
              audioBase64: msg.messageType === 'audio' && msg.encryptedPayload
                ? encryptionService.decryptBinary(msg.encryptedPayload, data.sessionId)
                : undefined,
              flagged: msg.metadata?.flagged || false
            }));
            setMessages(decrypted);
          });
      } catch (err) {
          console.error("[CLIENT] Error handling session creation:", err);
          // Fallback: try to switch view anyway if critical error
          setView('chat'); 
      }
    }));
    
    // Listen for new messages
    cleanups.push(socketService.onMessageReceived((message) => {
      // IGNORE HISTORICAL MESSAGES (Persisted on server but sent as "new" on reconnect)
      // Check timestamp against page load time (minus buffer)
      const pageLoadTime = (window as any)._streamflowPageLoadTime || Date.now();
      // If message is older than 30s before page load, it's history replayed
      const isHistorical = message.timestamp < (pageLoadTime - 30000);

      const currentActiveSession = activeSessionRef.current;
      console.log(`[CLIENT] 📥 Message received:`, {
        sessionId: message.sessionId,
        senderId: message.senderId,
        messageType: message.messageType,
        currentSession: currentActiveSession?.sessionId,
        historical: isHistorical
      });


      
      const isForActiveSession = currentActiveSession && message.sessionId === currentActiveSession.sessionId;
      
      // If NOT for the active session, or NO active session, show toast/notification
      // (Bypass for our own messages reflected from server)
      if (!isForActiveSession && message.senderId !== currentUser.id && !isHistorical) {
        console.log(`[CLIENT] ⚠️ Message for different or no active session, showing notification toast`);
        
        playNotificationSound('knock');
        
        // Find the session info in our active sessions map
        const msgSession = activeSessions.get(message.sessionId);
        const senderName = msgSession?.partnerProfile?.name || t.partner;
        const senderAvatar = msgSession?.partnerProfile?.avatar;
        
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setNotificationToast({
            senderName,
            text: message.messageType === 'text' ? '[message]' : (message.messageType === 'audio' ? (language === 'ru' ? 'Голосовое сообщение' : 'Voice message') : t.newMsg),
            senderId: message.senderId,
            avatar: senderAvatar
        });
        toastTimeoutRef.current = setTimeout(() => setNotificationToast(null), 2000);
        
        // Banner notification if app is in background
        if (currentUser.chatSettings?.bannerNotificationsEnabled && document.visibilityState === 'hidden') {
            showBannerNotification(
                t.newMsg,
                `${senderName}: ${t.newMsg}`
            );
        }
      }

      // If we don't have an active session, we can't do more (like adding to message list)
      if (!currentActiveSession) return;
      
      // If for a different session, also return (toast already handled above)
      if (message.sessionId !== currentActiveSession.sessionId) return;
      
      
      if (currentUser.blockedUsers.includes(message.senderId)) {
        console.log(`[CLIENT] 🚫 Message ignored: sender is blocked`);
        return;
      }
      
      // Decrypt message SAFELY
      let text, audioBase64;
      try {
          if (message.messageType === 'text' && message.encryptedPayload) {
              text = encryptionService.decrypt(message.encryptedPayload, message.sessionId);
          } else if (message.messageType === 'audio' && message.encryptedPayload) {
              audioBase64 = encryptionService.decryptBinary(message.encryptedPayload, message.sessionId);
          } else if (message.messageType === 'sticker' && message.encryptedPayload) {
              text = encryptionService.decrypt(message.encryptedPayload, message.sessionId); // Sticker URL is text
          }
      } catch (e) {
          console.error(`[CRYPTO] Decryption failed for msg ${message.id}`, e);
          return; // Skip this message to prevent crash
      }

      const decrypted = {
        ...message,
        text,
        audioBase64,
        flagged: message.metadata?.flagged || false
      };
      
      // Show ALL messages from server (including our own)
      // Server is the single source of truth. OPTIMISTIC UI SYNC: 
      // If we received our own message back, remove the optimistic placeholders
      setMessages(prev => {
          const filtered = prev.filter(m => !m.metadata?.optimistic || m.id !== decrypted.id);
          return [...filtered, decrypted];
      });

      // TTS for incoming messages (if enabled and not from self)
      if (decrypted.senderId !== currentUser.id && decrypted.messageType === 'text' && decrypted.text) {
          announceNotification(decrypted.text);
      }
      
      // If our own message was flagged, show warning
      if (decrypted.senderId === currentUser.id && decrypted.flagged) {
          const reasonMsg = t.restrictedDueToReport.replace('{reason}', decrypted.metadata?.flagReason || t.violation);
          setViolationMessage(reasonMsg);
          setTimeout(() => setViolationMessage(null), 5000);
      }

      // Play sound only for messages from others
      if (message.senderId !== currentUser.id) {
          playNotificationSound('knock');
          
          // Banner Notification
          if (currentUser.chatSettings?.bannerNotificationsEnabled && document.visibilityState === 'hidden') {
               const senderName = currentActiveSession?.partnerProfile?.name || t.partner;
               showBannerNotification(
                   t.newMsg, 
                   `${senderName}: ${decrypted.messageType === 'text' ? (decrypted.text?.substring(0, 30) + '...') : (decrypted.messageType === 'audio' ? (language === 'ru' ? 'Голосовое сообщение' : 'Voice message') : t.newMsg)}`
               );
          }

          // Voice Notification is handled by announceNotification above (line 1117)
          // speakNotification() REMOVED to prevent double-speaking

          // In-App Toast Notification
          const isViewingThisChat = view === 'chat' && currentActiveSession?.partnerId === message.senderId;
          
          if (!isViewingThisChat) {
             const senderName = currentActiveSession?.partnerProfile?.name 
                || t.partner;
             const senderAvatar = currentActiveSession?.partnerProfile?.avatar;
             
             if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
             setNotificationToast({
                 senderName,
                 text: decrypted.messageType === 'text' ? (decrypted.text || '') : (decrypted.messageType === 'audio' ? (language === 'ru' ? 'Голосовое сообщение' : 'Voice message') : t.newMsg),
                 senderId: message.senderId,
                 avatar: senderAvatar
             });
             toastTimeoutRef.current = setTimeout(() => setNotificationToast(null), 2000);
          }

          // Voice Mode (Reading chat text aloud) - works independently of voice notification setting
          if (decrypted.text && voiceModeRef.current) {
              // Get partner gender
              let partnerGender = 'other';
              if (currentActiveSession) {
                  const partner = currentActiveSession.partnerProfile;
                  partnerGender = partner?.gender || 'other';
              }
              speakMessage(decrypted.text, partnerGender);
          }
      }
      
      scrollToBottom();
    }));
    
    // Listen for message expiration
    cleanups.push(socketService.onMessagesDeleted((data) => {
      if (activeSessionRef.current && data.sessionId === activeSessionRef.current.sessionId) {
        setMessages(prev => prev.slice(-data.remainingCount));
      }
    }));
    
    // Listen for message errors (Moderation & Session Sync)
    cleanups.push(socketService.addListener('message:error', (data) => {
        if (data.mutedUntil) {
            alert(t.restrictedSpam);
        } else if (data.message === 'Invalid session') {
            console.error("[CHAT] ❌ Invalid Session detected. Attempting auto-recovery...");
            // Force re-registration to sync sessions
            socketService.registerUser(currentUser, (regData) => {
                console.log("[CHAT] 🔄 Re-registered successfully. Refreshing sessions...");
                if (regData.activeSessions && regData.activeSessions.length > 0) {
                     setActiveSessions(prev => {
                        const newMap = new Map(prev);
                        regData.activeSessions.forEach((session: any) => {
                            if (!newMap.has(session.sessionId)) {
                                newMap.set(session.sessionId, session);
                            }
                        });
                        return newMap;
                    });
                    
                    // Update current active session if possible
                    if (activeSession) {
                        const refreshed = regData.activeSessions.find((s:any) => s.sessionId === activeSession.sessionId);
                        if (refreshed) {
                            setActiveSession(refreshed);
                            console.log("[CHAT] ✅ Active session refreshed!");
                            // Optional: Retry sending message here if we had a queue, 
                            // but for now just let user click send again (it will work now)
                            alert(t.sessionRefreshed);
                            return;
                        }
                    }
                    // If we couldn't find the specific session, maybe jump to latest
                     const latest = regData.activeSessions[regData.activeSessions.length - 1];
                     if(latest) setActiveSession(latest);
                }
            });
        } else {
            alert(data.message || 'Error sending message');
        }
    }));

    // Listen for registration errors (Bans)
    cleanups.push(socketService.addListener('user:error', (data) => {
        if (data.code === 'DELETION_LOCKED') return; // Silent ignore, handled by UI hint
        alert(`${data.message}\n${data.reason || ''}`);
        // No redirect to auth, just stay in register view
        setView('register');
    }));

    // Listen for Auth Errors Global (Rate Limits)
    cleanups.push(socketService.onAuthError((data) => {
        console.warn('[AUTH] Auth error:', data.message);
    }));

    // DEBUG: Monitor Disconnects
    cleanups.push(socketService.onEvent('disconnect', (reason) => {
        console.warn(`[SOCKET] ❌ Client disconnected: ${reason}`);
        // Optional: Show toast if active session
        if (activeSessionRef.current) {
             // alert(`DEBUG: Socket disconnected (${reason}). Reconnecting...`);
        }
    }));

    // DEBUG: Monitor Connect
    cleanups.push(socketService.onEvent('connect', () => {
        console.log(`[SOCKET] ✅ Client connected: ${socketService.serverUrl}`);
    }));



    // Listen for report acknowledgment
    cleanups.push(socketService.addListener('report:acknowledged', () => {
        alert(t.reportSent);
    }));

    // Listen for partner joining (Receiver side)
    cleanups.push(socketService.onPartnerJoined((data) => {
        setIsWaitingForPartner(false);
        playNotificationSound('door'); 
        announceNotification(t.partnerJoined);
        setView('chat');
    }));

    // Listen for knock accepted (Sender side)
    cleanups.push(socketService.onKnockAccepted((data) => {
        // ONE-TIME BANNER LOGIC: Check if already acknowledged
        try {
            const rawAck = localStorage.getItem('streamflow_acknowledged_banners');
            const ackList: string[] = rawAck ? JSON.parse(rawAck).map(String) : [];
            const currentSessId = String(data.sessionId);

            if (ackList.includes(currentSessId)) {
                console.log(`[KNOCK] 🚫 Skipping already acknowledged banner for session: ${currentSessId}`);
                // If acknowledged, we assume they already handled the "Start" prompt previously?
                // Or maybe they refreshed. If so, let's just show the prompt again to be safe, 
                // or auto-join if they are the initiator.
                // For safety in this new flow, we will show the prompt.
            }
        } catch (e) {
            console.error("Error checking ack list:", e);
        }

        // MUTUAL CONSENT: Do NOT auto-join. Show confirmation modal.
        console.log("[KNOCK] ✅ User accepted! Waiting for Sender confirmation:", data.sessionId);
        
        setKnockAcceptedData({
            sessionId: data.sessionId,
            partnerProfile: data.partnerProfile
        });

        playNotificationSound('knock'); 
        announceNotification(`${t.knockAccepted} ${data.partnerProfile.name} ${t.partnerWaiting}`);
            
    }));
    
    return () => {
      // Cleanup all event listeners (NOT disconnect!)
      cleanups.forEach(cleanup => cleanup());
    };
  }, [currentUser.id, currentUser.chatSettings]); // FIXED: Removed activeSession to prevent constant re-binding

  useEffect(() => {
    if (currentUser.id && currentUser.name && currentUser.age && !hasRegisteredWithServer) {
      console.log(`[AUTH] Registering with server...`);
      socketService.registerUser(currentUser, (data) => {
        setHasRegisteredWithServer(true);
        // Override server expiration to 30 days as requested.
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        setProfileExpiresAt(thirtyDaysFromNow);
        console.log(`✅ Profile registered. Expires in 30 days`);
        
        if (data.activeSessions && data.activeSessions.length > 0) {
          console.log(`[SESSION] Restoring ${data.activeSessions.length} sessions from server`);
          setActiveSessions(prev => {
            const newMap = new Map(prev);
            data.activeSessions.forEach((session: any) => {
              if (!newMap.has(session.sessionId)) {
                newMap.set(session.sessionId, session);
              }
            });
            return newMap;
          });
          
          // AUTO-RESUME / REPLAY: 
          // If we have sessions but aren't in chat, show the "Knock Accepted" modal again
          const latestSession = data.activeSessions[data.activeSessions.length - 1];
          // CHECK IF ALREADY ACKNOWLEDGED (Fix for persistent notifications)
          try {
            const rawAck = localStorage.getItem('streamflow_acknowledged_banners');
            const ackList: string[] = rawAck ? JSON.parse(rawAck).map(String) : [];
            
            if (latestSession && view !== 'chat') {
                const currentSessId = String(latestSession.sessionId);
                
                // Debug log to verify what's happening
                console.log(`[SESSION_CHECK] Checking session ${currentSessId} against ackList:`, ackList);

                // Ensure we don't show if already acked
                if (!ackList.includes(currentSessId)) {
                    console.log("[SESSION] Found unacknowledged active session:", currentSessId);
                    
                    // Construct specific partner profile
                    const partnerProfile = latestSession.partnerProfile || { name: 'User', avatar: '/avatars/default.png' }; 

                    setKnockAcceptedData({
                        sessionId: currentSessId,
                        partnerProfile: partnerProfile
                    });
                    
                    announceNotification(`${t.acceptedYourKnock} ${partnerProfile.name} ${t.partnerWaiting}`);
                      
                    // Auto-dismiss restored session banner
                    setTimeout(() => setKnockAcceptedData(null), 2000);
                } else {
                    console.log(`[SESSION] Skipping already acknowledged session: ${currentSessId}`);
                }
            }
          } catch (e) {
            console.error("Error checking acknowledged banners:", e);
          }
        }
      });
    }
  }, [currentUser.id, currentUser.name, currentUser.age, hasRegisteredWithServer]);

        {/* Knock Accepted Banner - FIXED POSITION & Z-INDEX */}
        {knockAcceptedData && (
            <div className="fixed top-20 left-4 right-4 z-[9999] bg-green-500/20 border border-green-500/50 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.5)] animate-in zoom-in-95 duration-300 flex flex-col items-center gap-4 text-center">
                <button 
                    onClick={() => {
                        // Mark as acknowledged on dismiss
                        if (knockAcceptedData) {
                            const acknowledged = localStorage.getItem('streamflow_acknowledged_banners');
                            const ackList: string[] = acknowledged ? JSON.parse(acknowledged).map(String) : [];
                            const sId = String(knockAcceptedData.sessionId);
                            if (!ackList.includes(sId)) {
                                ackList.push(sId);
                                localStorage.setItem('streamflow_acknowledged_banners', JSON.stringify(ackList));
                                console.log("[BANNER] Dismissed and acked:", sId);
                            }
                            setKnockAcceptedData(null);
                        }
                    }}
                    className="absolute top-2 right-2 text-green-200/50 hover:text-white p-2"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 rounded-full border-4 border-green-400 p-1">
                    <img src={knockAcceptedData.partnerProfile.avatar} alt="Partner Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-1">{t.knockAccepted}</h4>
                    <p className="text-sm text-green-200 font-bold">{knockAcceptedData.partnerProfile.name} {t.partnerWaiting}</p>
                </div>
                <button 
                    onClick={() => {
                        console.log("🖱️ User clicked JOIN SESSION");
                        // Mark as acknowledged on join
                        if (knockAcceptedData) {
                            const acknowledged = localStorage.getItem('streamflow_acknowledged_banners');
                            const ackList: string[] = acknowledged ? JSON.parse(acknowledged).map(String) : [];
                            const sId = String(knockAcceptedData.sessionId);
                            
                            if (!ackList.includes(sId)) {
                                ackList.push(sId);
                                localStorage.setItem('streamflow_acknowledged_banners', JSON.stringify(ackList));
                                console.log("[BANNER] Joined and acked:", sId);
                            }
                            
                            socketService.joinSession(sId);
                            setKnockAcceptedData(null);
                        }
                    }}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest rounded-xl text-sm shadow-xl hover:shadow-green-500/40 transition-all transform hover:scale-105 active:scale-95"
                >
                    {t.startChat}
                </button>
            </div>
        )}


  const startIntroRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderIntroRef.current = mediaRecorder;
      audioChunksIntroRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksIntroRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksIntroRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const url = reader.result as string;
          setRegVoiceIntro(url);
          
          // Auto-play
          setTimeout(() => {
              const audio = new Audio(url);
              introAudioRef.current = audio;
              setIsPlayingIntro(true);
              audio.onended = () => {
                  setIsPlayingIntro(false);
                  introAudioRef.current = null;
              };
              audio.play().catch(console.error);
          }, 500);
        };
        // Restore volume
        if (preRecordingVolumeRef.current !== null) {
            onVolumeChange(preRecordingVolumeRef.current);
            preRecordingVolumeRef.current = null;
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      // Duck volume
      preRecordingVolumeRef.current = volume;
      onVolumeChange(volume * 0.1);
      
      mediaRecorder.start();
      setIsRecordingIntro(true);
      setIntroRecordingTime(0);
      introTimerRef.current = setInterval(() => setIntroRecordingTime(p => p >= 7 ? 7 : p + 1), 1000);
      const prompts = SMART_PROMPTS[language] || SMART_PROMPTS.en;
      const cats = Object.values(prompts).flat() as string[];
      setActivePrompt(cats[Math.floor(Math.random() * cats.length)]);
    } catch (err) { alert('Microphone error'); }
  };

  const stopIntroRecording = () => {
    if (mediaRecorderIntroRef.current?.state !== 'inactive') mediaRecorderIntroRef.current?.stop();
    setIsRecordingIntro(false);
    if (introTimerRef.current) clearInterval(introTimerRef.current);
  };

  const handlePlayIntro = () => {
      if (!regVoiceIntro || isPlayingIntro) return;
      
      try {
          if (introAudioRef.current) {
              introAudioRef.current.pause();
              introAudioRef.current = null;
          }

          const audio = new Audio(regVoiceIntro);
          introAudioRef.current = audio;
          setIsPlayingIntro(true);
          
          audio.onended = () => {
              setIsPlayingIntro(false);
              introAudioRef.current = null;
          };
          
          audio.onerror = () => {
              setIsPlayingIntro(false);
              introAudioRef.current = null;
          };

          audio.play().catch(console.error);
      } catch (err) {
          console.error(err);
          setIsPlayingIntro(false);
      }
  };

  const handleDeleteAccount = () => {
    if (window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить аккаунт? Вы сможете восстановить его позже с этого же устройства.' : 'Are you sure you want to delete your account? You can restore it later from this device.')) {
        socketService.deleteAccount(() => {
            localStorage.clear();
            window.location.reload();
        });
    }
  };

  const handleRegistrationComplete = () => {
    // 1. Mandatory Fields Validation
    if (!regName.trim()) {
      alert(t.completeProfile);
      return;
    }
    
    if (!regAge) {
      alert(t.completeProfile);
      return;
    }

    if (!regGender) {
      alert(t.completeProfile);
      return;
    }

    // Avatar: if no custom photo, generate a default based on gender
    const effectiveAvatar = regAvatar || currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${regName.trim()}&gender=${regGender === 'female' ? 'female' : 'male'}`;

    // Voice intro and status are optional — nice to have but not blocking

    const updatedUser: UserProfile = { 
      ...currentUser, 
      name: regName.trim() || t.signInGuest, 
      avatar: effectiveAvatar,
      age: parseInt(regAge), 
      gender: regGender, 
      intentStatus: regIntentStatus,
      voiceIntro: regVoiceIntro,
      voiceIntroTimestamp: regVoiceIntro ? Date.now() : currentUser.voiceIntroTimestamp,
      // FIX: allow guest registration without auth. Auth is only needed for social actions.
      isAuthenticated: currentUser.isAuthenticated || false, 
      hasAgreedToRules: true,
      lastSeen: Date.now(),
      registrationTimestamp: currentUser.registrationTimestamp || Date.now(),
      
      // Location Data — prioritize passedLocation (from App.tsx/radio) over local detection
      country: (passedLocation?.country && passedLocation.country !== 'Unknown') ? passedLocation.country : (detectedLocation?.country || currentUser.country || t.unknown),
      detectedCountry: (passedLocation?.country && passedLocation.country !== 'Unknown') ? passedLocation.country : (detectedLocation?.country || currentUser.detectedCountry),
      detectedCity: (passedLocation?.city && passedLocation.city !== 'Unknown') ? passedLocation.city : (detectedLocation?.city || currentUser.detectedCity),
      detectedIP: passedLocation?.ip || detectedLocation?.ip || currentUser.detectedIP,

      chatSettings: {
        notificationsEnabled: regNotificationsEnabled,
        notificationVolume: regNotificationVolume,
        notificationSound: regNotificationSound as 'default' | 'soft' | 'alert',
        bannerNotificationsEnabled: regBannerEnabled,
        voiceNotificationsEnabled: regVoiceNotifEnabled,
        notificationVoice: regNotifVoice
      },
      safetyLevel: 'green',
      blockedUsers: currentUser.blockedUsers || [],
      role: currentUser.role,
      early_access: currentUser.early_access,
      free_until: currentUser.free_until,
      accountStatus: currentUser.accountStatus
    };
    
    onUpdateCurrentUser(updatedUser);
    localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));

    // Register on server/Sync
    socketService.registerUser(updatedUser, (data) => {
      setProfileExpiresAt(data.expiresAt);
      console.log(`[USER] Profile saved/synced. ID: ${updatedUser.id}`);
      
      // Force refresh of online users list to ensure immediate visibility
      socketService.searchUsers({}, (results) => {
          console.log(`[UI] Refreshed online list after registration (${results.length} users)`);
          setSearchResults(results);
      });

      // If server returned a corrected profile (e.g. from lockdown), sync it back
      if (data.profile) {
          onUpdateCurrentUser({ ...updatedUser, ...data.profile });
      }

      // Restore sessions from server 
      if (data.activeSessions && data.activeSessions.length > 0) {
        setActiveSessions(prev => {
          const newMap = new Map(prev);
          data.activeSessions.forEach((session: any) => {
            if (!newMap.has(session.sessionId)) {
              newMap.set(session.sessionId, session);
            }
          });
          return newMap;
        });
      }
    });

    setView('search');
  };

  // Real-time Search Updates
  useEffect(() => {
     // Listen for global presence updates (triggers on any new registration)
     const cleanup = socketService.onPresenceList((allUsers) => {
         // Only auto-update if we are in search view to save performance
         // And if we are NOT searching by name (to avoid overwriting while typing)
         // Actually, let's just validly filter the new list using current filters
         
         const filtered = allUsers.filter(user => {
            // Self is visible in search (shown with 'This is You' label instead of knock button)
            
            // Apply active filters
            if (searchAgeFrom !== 'Any' && user.age && user.age < parseInt(searchAgeFrom)) return false;
            if (searchAgeTo !== 'Any' && searchAgeTo !== '65+' && user.age && user.age > parseInt(searchAgeTo)) return false;
            
            // Gender
            if (searchGender !== 'any' && user.gender !== searchGender) return false;
            
            // Name search (if active) - logic duplicated from server but good for optimistic UI
            const nameSearch = (document.getElementById('search-input') as HTMLInputElement)?.value;
            if (nameSearch && !user.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;

            // Ensure sufficient profile
            return !!(user.name && user.age && user.avatar); // avatar required to appear in carousel
         });
         
         // Sort: Online first (handled by server usually, but ensure here)
         // Server 'presence:list' sends status='online' if active
         
         setSearchResults(filtered);
     });
     
     return cleanup;
  }, [searchAgeFrom, searchAgeTo, searchGender, currentUser.id]);



  const handleSearch = () => {
    const filters: any = {};
    if (searchAgeFrom !== 'Any') filters.minAge = parseInt(searchAgeFrom);
    if (searchAgeTo !== 'Any') filters.maxAge = searchAgeTo === '65+' ? 100 : parseInt(searchAgeTo);
    if (searchGender !== 'any') filters.gender = searchGender;
    
    socketService.searchUsers(filters, (results) => {
      // Keep self in search results so the "This is You" card is visible
      setSearchResults(results);
    });
  };

  const handleKnock = (targetUser: UserProfile) => {
    // Auth Check: Block if user is not authenticated (requires Google login)
    if (!currentUser.isAuthenticated) {
       console.log("[Knock] User not authenticated, triggering login modal");
       if (onRequireLogin) {
         onRequireLogin();
       } else {
         alert(t.signInToChat);
       }
       return;
    }
    
    // Check Invite Limit (3 per 24h)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const recentInvites = (currentUser.sentInvites || []).filter(i => now - i.timestamp < oneDay);
    
    // Check if already invited
    if (recentInvites.some(i => i.toUserId === targetUser.id)) {
        alert(t.alreadyInvited || "Wait for response before knocking again (24h cooldown).");
        return;
    }

    // Check limit count
    if (recentInvites.length >= 3) {
        alert(t.dailyInviteLimitReached || "Daily limit reached (3 invites/day). Try again tomorrow.");
        return;
    }
    
    // Continue with normal knock flow
    // Update local invite history
    const newInvites = [...recentInvites, { timestamp: now, toUserId: targetUser.id }];
    const updatedUser = { ...currentUser, sentInvites: newInvites };
    onUpdateCurrentUser(updatedUser);
    localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser)); // Persist immediately

    setSentKnocks(prev => new Set(prev).add(targetUser.id));
    socketService.sendKnock(targetUser.id, () => {
      console.log(`✅ Knock sent to ${targetUser.name}`);
    });
  };

  const handleAcceptKnock = (knock: any) => {
    socketService.acceptKnock(knock.knockId, knock.fromUserId);
    setPendingKnocks(prev => prev.filter(k => k.knockId !== knock.knockId));
    
    // MUTUAL CONSENT: Show "Waiting for partner..." state
    setIsWaitingForPartner(true);
  };

  const handleRejectKnock = (knock: any) => {
    socketService.rejectKnock(knock.knockId, knock.fromUserId);
    setPendingKnocks(prev => prev.filter(k => k.knockId !== knock.knockId));
  };
  
  const handleBlockUser = (userId: string) => {
    if (!window.confirm(t.blockConfirm || 'Block this user?')) return;
    
    // Server-side persistent block
    socketService.blockUser(userId);
    
    // Local block list (client-side)
    const updatedUser = {
      ...currentUser,
      blockedUsers: [...currentUser.blockedUsers, userId]
    };
    onUpdateCurrentUser(updatedUser);
    localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));
    
    if (activeSession && (activeSession.partnerId === userId || activeSession.partnerProfile?.id === userId)) {
        setView('inbox');
        setActiveSession(null);
    }
  };

  const handleReportUser = (userId: string, messageId?: string) => {
    const reasons = ['Spam', 'Threats', 'Inappropriate Content', 'Other']; // Keeping these as English for now, assuming t.spam, t.threats etc. would be used if localized
    
    const reasonIndex = window.prompt(
        `${t.reportReasonPrompt}\n` +
        reasons.map((r, i) => `${i+1}. ${r}`).join('\n')
    );

    if (reasonIndex && parseInt(reasonIndex) > 0 && parseInt(reasonIndex) <= reasons.length) {
        socketService.sendReport(userId, reasons[parseInt(reasonIndex) - 1], messageId);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeSession) {
        console.warn("Cannot send: Input empty or no active session", { text: inputText, session: activeSession });
        return;
    }
    
    const textContent = inputText.trim();
    
    // Encrypt
    const encrypted = encryptionService.encrypt(textContent, activeSession.sessionId);
    
    // OPTIMISTIC UI: Add message locally first so it appears instantly
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
        id: tempId,
        sessionId: activeSession.sessionId,
        senderId: currentUser.id,
        encryptedPayload: encrypted,
        messageType: 'text',
        metadata: { text: textContent, optimistic: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();
    
    console.log(`[CLIENT] 📤 Sending message to session ${activeSession.sessionId}`);
    console.log(`[CLIENT] Current User ID: ${currentUser.id}`);
    console.log(`[CLIENT] Partner ID: ${activeSession.partnerId}`);
    console.log(`[CLIENT] Message type: text, length: ${textContent.length} chars`);
    
    socketService.sendMessage(
        activeSession.sessionId,
        encrypted,
        'text',
        { text: textContent }
    );
    
    setInputText('');
  };

  const handleSendSticker = (stickerUrl: string) => {
    if (!activeSession) return;
    
    // Encrypt the URL itself
    const encrypted = encryptionService.encrypt(stickerUrl, activeSession.sessionId);
    
    // OPTIMISTIC UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
        id: tempId,
        sessionId: activeSession.sessionId,
        senderId: currentUser.id,
        encryptedPayload: encrypted,
        messageType: 'sticker',
        metadata: { text: stickerUrl, optimistic: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();
    
    socketService.sendMessage(
        activeSession.sessionId,
        encrypted,
        'sticker',
        { text: stickerUrl }
    );
  };

  const startRecording = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0 && activeSession) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const encrypted = encryptionService.encryptBinary(reader.result as string, activeSession.sessionId);
            socketService.sendMessage(activeSession.sessionId, encrypted, 'audio');
          };
        }
        // Restore volume
        if (preRecordingVolumeRef.current !== null) {
            onVolumeChange(preRecordingVolumeRef.current);
            preRecordingVolumeRef.current = null;
        }
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
      };
      
      // Duck volume
      preRecordingVolumeRef.current = volume;
      onVolumeChange(volume * 0.1);
      
      mediaRecorder.start(200);
      setIsRecording(true);
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) {
      console.error('Recording failed', err);
    }
  };

  const stopRecording = (e: React.PointerEvent) => {
    e.preventDefault();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };



  const getPartnerFromSession = (session: any) => onlineUsers.find(u => u.id === session.partnerId) || session.partnerProfile;

  if (!isOpen) return null;
  const partnerDetails = activeSession ? getPartnerFromSession(activeSession) : null;

  return (
    <aside className="w-full md:w-[480px] flex flex-col glass-panel border-l border-[var(--panel-border)] shadow-2xl animate-in slide-in-from-right duration-500 bg-[var(--panel-bg)] z-[90] h-full fixed right-0 top-0 bottom-0">
        <header className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-transparent shrink-0 relative z-50">
            {view === 'chat' && partnerDetails ? (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => { setView('inbox'); setActiveSession(null); }} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"><ArrowLeftIcon className="w-5 h-5" /></button>
                        <img src={partnerDetails.avatar} alt={partnerDetails.name} className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 object-cover" />
                         <div className="min-w-0 flex-1"><h3 className="font-bold text-sm text-white truncate leading-tight">{partnerDetails.name}</h3><p className="text-[10px] text-green-500 font-bold uppercase tracking-widest leading-tight">{t.online}</p></div>
                    </div>
                    


                    <div className="flex items-center gap-1">
                        <button onClick={() => handleReportUser(partnerDetails.id)} className="p-2.5 text-slate-400 hover:text-orange-500 transition-colors hover:bg-white/5 rounded-full" title={t.report}><LifeBuoyIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleBlockUser(partnerDetails.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-white/5 rounded-full" title={t.block}><NoSymbolIcon className="w-5 h-5" /></button>
                        <div className="flex bg-white/5 rounded-full p-0.5 border border-white/5">
                            <button 
                                onClick={() => {
                                    const newState = !voiceModeEnabled;
                                    setVoiceModeEnabled(newState);
                                    if (!newState) setShowVoiceSettings(false); // Auto-close settings
                                    if (newState && 'speechSynthesis' in window) {
                                        const u = new SpeechSynthesisUtterance("");
                                        window.speechSynthesis.speak(u);
                                    }
                                }} 
                                className={`p-2.5 transition-all rounded-full ${voiceModeEnabled ? 'text-primary bg-primary/10 shadow-[0_0_20px_rgba(188,111,241,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                title={voiceModeEnabled ? t.voiceModeDisable : t.voiceModeEnable}
                            >
                                <SpeakIcon className={`w-5 h-5 ${voiceModeEnabled ? 'animate-pulse' : ''}`} />
                            </button>
                            {voiceModeEnabled && (
                                <button 
                                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                                    className={`p-2.5 transition-all rounded-full ${showVoiceSettings ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                                    title={t.voiceSettings}
                                >
                                    <VolumeIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors ml-1"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        {true && (
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                                <button 
                                    onClick={() => setView('register')} 
                                    className={`p-2 rounded-xl transition-all duration-300 ${view === 'register' ? 'bg-primary text-white shadow-[0_0_15px_rgba(188,111,241,0.4)]' : 'text-slate-500 hover:text-slate-200'}`}
                                    title={t.profile}
                                >
                                    <UserIcon className="w-5 h-5" />
                                </button>
                                {currentUser.blockedUsers?.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            if (window.confirm(t.unblockAllConfirm)) {
                                                const updatedUser = { ...currentUser, blockedUsers: [] };
                                                onUpdateCurrentUser(updatedUser);
                                                localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));
                                            }
                                        }}
                                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                                        title={t.unblock}
                                    >
                                        <NoSymbolIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setView('inbox')} 
                                    className={`p-2 rounded-xl transition-all duration-300 ${view === 'inbox' ? 'bg-primary text-white shadow-[0_0_15px_rgba(188,111,241,0.4)]' : 'text-slate-500 hover:text-slate-200'}`}
                                    title={t.dialogs}
                                >
                                    <div className="relative">
                                        <ChatBubbleIcon className="w-5 h-5" />
                                        {pendingKnocks?.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-[#1e293b]"></span>
                                        )}
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setView('search')} 
                                    className={`p-2 rounded-xl transition-all duration-300 ${view === 'search' ? 'bg-primary text-white shadow-[0_0_15px_rgba(188,111,241,0.4)]' : 'text-slate-500 hover:text-slate-200'}`}
                                    title={t.search}
                                >
                                    <UsersIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-col ml-1 block">
                            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                {view === 'search' ? (
                                    <>
                                        {t.aroundWorld}
                                        <GlobeIcon className="w-5 h-5 text-primary/80 animate-[spin_10s_linear_infinite]" />
                                    </>
                                ) : (view === 'inbox' ? t.inbox : '')}
                            </h2>
                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    {onlineStats.chatOnline} {t.onlineCount}
                                </span>
                        </div>
                    </div>
                        <div className="flex items-center gap-2 relative">
                             {/* Help/Demo Menu Button */}
                            <button 
                                onClick={() => setShowDemoMenu(!showDemoMenu)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showDemoMenu ? 'bg-primary text-black' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
                                title={t.helpAndDemos}
                            >
                                <span className="text-lg font-bold">?</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showDemoMenu && (
                                <div className="absolute top-10 right-0 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="p-2 space-y-1">
                                        <button 
                                            onClick={() => {
                                                setIsDemoOpen(true);
                                                setShowDemoMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <span className="text-sm">🎬</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white leading-tight">{t.chatScenario}</div>
                                                <div className="text-[9px] text-slate-400">Romantic Story</div>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setIsRegDemoOpen(true);
                                                setShowDemoMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                <span className="text-sm">📝</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white leading-tight">{t.registration}</div>
                                                <div className="text-[9px] text-slate-400">Step-by-step</div>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setIsInteractDemoOpen(true);
                                                setShowDemoMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                <span className="text-sm">🤝</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white leading-tight">{t.interaction}</div>
                                                <div className="text-[9px] text-slate-400">Social Loop</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="bg-white/5 p-2 text-center">
                                        <p className="text-[9px] text-slate-500">v1.2 Demo Mode</p>
                                    </div>
                                </div>
                            )}

                             {/* Backdrop to close menu */}
                            {showDemoMenu && (
                                <div className="fixed inset-0 z-[90]" onClick={() => setShowDemoMenu(false)} />
                            )}

                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                </>
            )}
        </header>

        {/* VOICE SETTINGS PANEL */}
        {showVoiceSettings && voiceModeEnabled && (
            <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 p-4 animate-in slide-in-from-top-2 relative z-50 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <SpeakIcon className="w-4 h-4" /> {t.voiceSettings}
                    </h3>
                    <button onClick={() => setShowVoiceSettings(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-4">
                    {/* Gender Selection */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{t.voiceTone}</label>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'auto' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'auto' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                🤖 {t.auto}
                            </button>
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'male' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'male' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                👨 {t.male}
                            </button>
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'female' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'female' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                👩 {t.female}
                            </button>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.privacy}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400">{t.hideFromSearch}</span>
                                <button 
                                    onClick={() => onUpdateCurrentUser({ ...currentUser, hideFromSearch: !currentUser.hideFromSearch })}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${currentUser.hideFromSearch ? 'bg-primary' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${currentUser.hideFromSearch ? 'right-0.5' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">
                            {t.hideFromSearchDesc}
                        </p>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <div className="flex justify-between mb-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.speed}</label>
                                <span className="text-[9px] font-mono text-primary">x{voiceSettings.rate.toFixed(1)}</span>
                             </div>
                             <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={voiceSettings.rate} 
                                onChange={e => setVoiceSettings(p => ({ ...p, rate: parseFloat(e.target.value) }))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
                             />
                        </div>
                        <div>
                             <div className="flex justify-between mb-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.voiceTone}</label>
                                <span className="text-[9px] font-mono text-primary">{voiceSettings.pitch.toFixed(1)}</span>
                             </div>
                             <input 
                                type="range" min="0.5" max="2" step="0.1" 
                                value={voiceSettings.pitch} 
                                onChange={e => setVoiceSettings(p => ({ ...p, pitch: parseFloat(e.target.value) }))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
                             />
                        </div>
                    </div>
                    
                    {/* Test Button */}
                    <button 
                        onClick={() => speakMessage(t.voiceEngineTest, 'any')}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                    >
                        {t.previewVoice}
                    </button>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col bg-transparent">
            {/* Notification Banner for Pending Knocks */}
            {pendingKnocks?.length > 0 && view !== 'inbox' && (
                <button
                    onClick={() => setView('inbox')}
                    className="mb-4 w-full py-3 px-4 bg-gradient-to-r from-secondary/20 to-primary/20 hover:from-secondary/30 hover:to-primary/30 border border-secondary/30 rounded-2xl transition-all flex items-center justify-between group animate-in fade-in zoom-in duration-300"
                >
                    <div className="flex items-center gap-3">
                        <BellIcon className="w-5 h-5 text-secondary animate-wiggle" />
                        <span className="text-sm font-bold text-white">
                            {t.newInviteFrom.replace('{name}', pendingKnocks[pendingKnocks.length - 1]?.fromUser?.name || t.user)}
                        </span>
                    </div>
                    <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">
                        {t.open}
                    </div>
                </button>
            )}

            {/* MUTUAL CONSENT: Waiting Overlay (Receiver) */}
            {isWaitingForPartner && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 mb-6 relative">
                         <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                        {t.waitingForPartner}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-[250px] text-center">
                            {t.partnerMustConfirm}
                    </p>
                </div>
            )}

            {/* MUTUAL CONSENT: Confirmation Modal (Sender) */}
            {knockAcceptedData && (
                 <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-300 p-6">
                    <img 
                        src={knockAcceptedData.partnerProfile?.avatar || '/avatars/default.png'} 
                        className="w-24 h-24 rounded-full border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-6"
                    />
                    <h3 className="text-2xl font-black text-white text-center mb-2">
                        {knockAcceptedData.partnerProfile?.name}
                    </h3>
                    <p className="text-sm text-green-400 font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {t.acceptedYourKnock}
                    </p>
                    
                    <div className="w-full max-w-xs space-y-3">
                        <button 
                            onClick={() => {
                                socketService.joinSession(knockAcceptedData.sessionId);
                                setKnockAcceptedData(null);
                            }}
                            className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform"
                        >
                            {t.startChat}
                        </button>
                        <button 
                            onClick={() => setKnockAcceptedData(null)}
                            className="w-full py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest transition-colors"
                        >
                            {t.cancel}
                        </button>
                    </div>
                 </div>
            )}

            {/* In-App Toast Notification with Animated Border */}
            {notificationToast && (
                <div 
                    onClick={() => {
                        // Switch to chat
                        const session = Array.from(activeSessions.values()).find(s => s.partnerId === notificationToast.senderId);
                        if (session) {
                             setActiveSession(session);
                             setView('chat');
                             setNotificationToast(null);
                        } else {
                            // If no session found (rare/bug?), just go inbox
                            setView('inbox');
                        }
                    }}
                    className="absolute top-4 left-4 right-4 z-[100] cursor-pointer animate-in slide-in-from-top duration-500"
                >
                    {/* Animated Border Container */}
                    <div className="relative p-[3px] rounded-2xl overflow-hidden group">
                        {/* Spinning Gradient Background */}
                        <div className="absolute inset-0 bg-[conic-gradient(from_var(--shimmer-angle),theme(colors.slate.900),theme(colors.pink.500),theme(colors.blue.500),theme(colors.slate.900))] animate-[spin_4s_linear_infinite]" />
                        
                        {/* Inner Content */}
                        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-xl p-3 flex items-center gap-3 border border-white/10">
                            {notificationToast.avatar && (
                                <img src={notificationToast.avatar} alt="Notification Avatar" className="w-10 h-10 rounded-full border border-white/10" />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white truncate flex items-center gap-2">
                                    {notificationToast.senderName}
                                    <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1 rounded uppercase tracking-wider">New</span>
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate leading-tight">
                                    {notificationToast.text}
                                </p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setNotificationToast(null); }}
                                className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {violationMessage && (
                <div className="px-4 py-2 bg-orange-500/90 text-white text-[10px] font-bold text-center animate-in slide-in-from-top duration-300 relative z-40">
                    ⚠️ {violationMessage}
                </div>
            )}





            

            {/* Avatar Selection Modal - New AvatarCreator */}
            {showAvatarModal && (
              <Suspense fallback={<div className="p-4 text-center text-white">Loading Editor...</div>}>
                <AvatarCreator 
                    currentAvatar={regAvatar || currentUser.avatar || undefined}
                    onSelect={(url) => {
                        setRegAvatar(url);
                        setShowAvatarModal(false);
                    }}
                    onClose={() => setShowAvatarModal(false)}
                    t={t}
                    lang={language}
                />
              </Suspense>
            )}

            {view === 'register' && (
                <div className={`flex-1 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300 relative transition-all duration-1000 ${isLightsOn ? 'shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]' : ''}`}>
                    {/* Cozy Lighting Overlay */}
                    <div className={`fixed inset-0 bg-black/90 z-0 transition-opacity duration-1000 pointer-events-none ${isLightsOn ? 'opacity-100' : 'opacity-0'}`} />
                    
                    {/* Spotlight Glow Effect (Background) */}
                    <div className={`fixed inset-0 z-0 transition-opacity duration-1000 pointer-events-none ${isLightsOn ? 'opacity-100' : 'opacity-0'}`}
                         style={{
                             background: 'radial-gradient(circle at 50% 30%, rgba(255, 200, 100, 0.15) 0%, rgba(255, 150, 50, 0.05) 40%, transparent 70%)'
                         }}
                    />

                    <div className="flex justify-center mb-4 shrink-0 relative z-10">
                        <div className="flex flex-col items-center w-full">
                            
                            {/* Lighting Controls REMOVED */}
                            {null}

                            <h3 className={`text-2xl font-black leading-tight uppercase tracking-widest mb-2 transition-colors duration-1000 ${isLightsOn ? 'text-yellow-100 drop-shadow-[0_0_15px_rgba(255,200,100,0.5)]' : 'text-white'}`}>
                                {t.completeProfile}
                            </h3>
                            <p className={`text-[10px] max-w-[240px] leading-relaxed mx-auto transition-colors duration-1000 ${isLightsOn ? 'text-yellow-200/70' : 'text-slate-400'}`}>
                                {t.profileInfoHelps}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col space-y-6">
                        {/* Avatar Section */}
                        <div className="flex justify-center py-2 relative">
                            <div className="relative group">
                                <div 
                                    onClick={() => !isProfileLocked && setShowAvatarModal(true)}
                                    className={`w-32 h-32 rounded-[2rem] bg-slate-800/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all relative shadow-2xl ${isProfileLocked ? 'opacity-90 cursor-default border-primary/20' : 'group-hover:border-primary/50 cursor-pointer'}`}
                                >
                                    {regAvatar ? (
                                        <img src={regAvatar} alt="My Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div key={regGender} className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                                            {regGender === 'female' ? (
                                                <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-90 drop-shadow-lg">
                                                    <ellipse cx="50" cy="38" rx="35" ry="32" fill="#92400e" />
                                                    <ellipse cx="22" cy="58" rx="14" ry="22" fill="#78350f" />
                                                    <ellipse cx="78" cy="58" rx="14" ry="22" fill="#78350f" />
                                                    <circle cx="50" cy="45" r="26" fill="#fbbf24" />
                                                    <ellipse cx="41" cy="42" rx="3.5" ry="4.5" fill="#1e293b" />
                                                    <ellipse cx="59" cy="42" rx="3.5" ry="4.5" fill="#1e293b" />
                                                    <path d="M41,53 Q50,60 59,53" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                                                    <ellipse cx="50" cy="94" rx="32" ry="22" fill="#fef3c7" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-90 drop-shadow-lg">
                                                    <ellipse cx="50" cy="32" rx="30" ry="20" fill="#334155" />
                                                    <circle cx="50" cy="46" r="26" fill="#f59e0b" />
                                                    <path d="M35,35 L47,38" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                                                    <path d="M53,38 L65,35" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                                                    <ellipse cx="41" cy="45" rx="3.5" ry="3.5" fill="#1e293b" />
                                                    <ellipse cx="59" cy="45" rx="3.5" ry="3.5" fill="#1e293b" />
                                                    <path d="M41,56 Q50,63 59,56" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
                                                    <ellipse cx="50" cy="94" rx="32" ry="22" fill="#3b82f6" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!isProfileLocked && (
                                    <button 
                                        onClick={() => setShowAvatarModal(true)}
                                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary shadow-xl rounded-full flex items-center justify-center border-4 border-[#0f172a] text-white hover:scale-110 transition-transform"
                                    >
                                        <span className="text-lg">✏️</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Location (Soft Info) */}
                        <div className="flex justify-center">
                            <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5">
                                <span className="text-sm">📍</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {t.detected} 
                                    <span className="text-slate-200 font-bold">{detectedLocation?.country || t.unknown}</span>
                                </span>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{t.yourNameAlias}</label>
                                <input 
                                    value={regName} 
                                    disabled={isProfileLocked}
                                    onChange={(e) => setRegName(e.target.value)} 
                                    className={`w-full border rounded-2xl px-4 py-3 outline-none font-bold text-sm transition-all ${isProfileLocked ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed' : 'bg-black/20 border-white/10 text-white focus:border-primary/50 focus:bg-white/[0.08]'}`}
                                    placeholder="GuestUser"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{t.gender}</label>
                                    <div className={`flex bg-black/20 rounded-xl p-1 border h-[42px] ${isProfileLocked ? 'border-white/5 opacity-80' : 'border-white/5'}`}>
                                        {(['male', 'female'] as const).map(g => (
                                            <button 
                                                key={g} 
                                                disabled={isProfileLocked}
                                                onClick={() => {
                                                    setRegGender(g);
                                                    if (regAvatar && regAvatar.startsWith('data:image/svg+xml')) setRegAvatar(null);
                                                }} 
                                                className={`flex-1 rounded-lg text-sm font-black transition-all uppercase tracking-tighter ${regGender === g ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                {g === 'male' ? t.maleShort : t.femShort}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{t.age}</label>
                                    <div className="bg-black/20 rounded-xl border border-white/5 h-[42px] relative overflow-hidden flex items-center justify-center">
                                        <select 
                                            value={regAge} 
                                            onChange={(e) => setRegAge(e.target.value)} 
                                            disabled={isProfileLocked}
                                            className="w-full h-full bg-transparent text-center font-black text-transparent outline-none appearance-none absolute inset-0 z-10 cursor-pointer"
                                        >
                                            {AGES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                        </select>
                                        <span className="pointer-events-none text-sm font-black text-white z-0">{regAge}</span>
                                        <span className="pointer-events-none absolute right-2 text-[10px] text-red-400 font-bold border border-red-500/30 px-1 rounded">18+</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intent Status Selector */}
                        <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-2 block tracking-widest">{t.intentTalk ? '📌 ' + (language === 'ru' ? 'СТАТУС' : 'STATUS') : '📌 STATUS'}</label>
                            <div className={`grid grid-cols-2 gap-2 ${isProfileLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                                {INTENT_STATUSES.map(status => {
                                    const key = INTENT_MAP[status];
                                    const label = (t as any)[key] || status;
                                    const isActive = regIntentStatus === status;
                                    return (
                                        <button
                                            key={status}
                                            disabled={isProfileLocked}
                                            onClick={() => setRegIntentStatus(status)}
                                            className={`px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${
                                                isActive 
                                                    ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_10px_rgba(188,111,241,0.2)]' 
                                                    : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Voice Intro (Condensed) */}
                        <div className="p-4 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-white/5 rounded-3xl flex items-center gap-4">
                            <button 
                                onClick={isRecordingIntro ? stopIntroRecording : startIntroRecording}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isRecordingIntro ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-pink-500 to-violet-600 shadow-[0_0_20px_rgba(236,72,153,0.4)] animate-[pulse_3s_ease-in-out_infinite] hover:scale-110'}`}
                            >
                                {isRecordingIntro ? <XMarkIcon className="w-5 h-5 text-white" /> : <MicrophoneIcon className="w-6 h-6 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-wider mb-0.5">
                                    {t.voiceIntroTitle}
                                </h4>
                                <p className="text-[9px] text-slate-400 truncate">
                                    {isRecordingIntro 
                                        ? `${t.recording}... 0:0${introRecordingTime} / 0:07` 
                                        : (regVoiceIntro ? t.introRecorded : t.introHook)}
                                </p>
                            </div>
                        </div>
                        
                        {regVoiceIntro && !isRecordingIntro && (
                            <div className="flex gap-2 w-full mt-2 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handlePlayIntro();
                                    }}
                                    disabled={isPlayingIntro}
                                    className={`flex-1 py-3 ${isPlayingIntro ? 'bg-green-500/20 text-green-400' : 'bg-green-500 hover:bg-green-400 text-white'} rounded-xl font-bold text-xs uppercase transition-all shadow-lg flex items-center justify-center gap-2`}
                                >
                                    {isPlayingIntro ? <span className="animate-pulse">▶ {t.playing}</span> : t.playback}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setRegVoiceIntro(null);
                                        if(introAudioRef.current) {
                                            introAudioRef.current.pause();
                                            setIsPlayingIntro(false);
                                        }
                                    }}
                                    className="px-4 py-3 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl font-bold text-xs uppercase transition-all"
                                >
                                    {t.retry}
                                </button>
                            </div>
                        )}

                        {/* Settings Collapsible */}
                        <details className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <AdjustmentsIcon className="w-4 h-4" /> {t.settings}
                                </span>
                                <ChevronDownIcon className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300">{t.sounds}</span>
                                        <button onClick={() => setRegNotificationsEnabled(!regNotificationsEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${regNotificationsEnabled ? 'bg-secondary' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${regNotificationsEnabled ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-300">{t.banners}</span>
                                            <span className="text-[9px] text-slate-500">{t.background}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (!regBannerEnabled) Notification.requestPermission();
                                                setRegBannerEnabled(!regBannerEnabled);
                                            }} 
                                            className={`w-9 h-5 rounded-full relative transition-colors ${regBannerEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${regBannerEnabled ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-300">{t.voiceAlert}</span>
                                            <span className="text-[9px] text-slate-500">{t.announce}</span>
                                        </div>
                                        <button onClick={() => setRegVoiceNotifEnabled(!regVoiceNotifEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${regVoiceNotifEnabled ? 'bg-pink-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${regVoiceNotifEnabled ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {regVoiceNotifEnabled && (
                                        <div className="flex bg-black/40 p-1 rounded-lg">
                                            <button 
                                                onClick={() => setRegNotifVoice('female')}
                                                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md transition-colors ${regNotifVoice === 'female' ? 'bg-pink-500 text-white' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                👩 {t.femShort}
                                            </button>
                                            <button 
                                                onClick={() => setRegNotifVoice('male')}
                                                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md transition-colors ${regNotifVoice === 'male' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                👨 {t.maleShort}
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500 uppercase">{t.volume}</span><span className="text-[10px] text-secondary">{Math.round(regNotificationVolume * 100)}%</span></div>
                                        <input type="range" min="0" max="1" step="0.1" value={regNotificationVolume} onChange={e => setRegNotificationVolume(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg accent-secondary" />
                                    </div>
                                </div>
                            </div>
                        </details>

                        {/* Main CTA */}
                        <button 
                            onClick={handleRegistrationComplete} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(188,111,241,0.25)] hover:shadow-primary/40 hover:scale-[1.01] active:scale-95 transition-all text-xs mb-4"
                        >
                            {isProfileLocked ? t.updatePartial : t.continue}
                        </button>

                         {/* Deletion / Logout Area - Subtle */}
                        {currentUser.id && (
                             <div className="flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <p className="text-[9px] text-center text-slate-500">
                                    {t.dataStoredNotice}
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="text-[9px] font-bold text-red-400/50 hover:text-red-400 uppercase tracking-widest text-center transition-colors"
                                >
                                    {currentUser.deletionRequestedAt 
                                        ? t.cancelDeletion
                                        : t.deleteAccount}
                                </button>
                                {!currentUser.deletionRequestedAt && (
                                    <p className="text-[8px] text-center text-slate-600 mt-1">
                                        {t.accountDeleteNotice}
                                    </p>
                                )}
                                
                                {/* Hard Reset / Fix */}
                                <button
                                    onClick={() => {
                                        if (window.confirm(t.resetDataConfirm)) {
                                            localStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                    className="text-[9px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest mt-4 opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    {t.resetData}
                                </button>
                             </div>
                        )}
                    </div>

                    {/* Carousel visible to guests in register view */}
                    {onlineUsers.filter(u => u.avatar).length > 0 && (
                        <div 
                            ref={view === 'register' ? carouselRef : undefined}
                            onMouseEnter={() => setIsHoveringCarousel(true)}
                            onMouseLeave={() => setIsHoveringCarousel(false)}
                            className="flex-1 min-h-0 overflow-y-auto no-scrollbar border-t border-white/5"
                        >
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-3">
                                    {language === 'ru' ? '👥 Сейчас в сети' : '👥 Currently online'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 px-4 pb-12">
                                {(() => {
                                    const list = onlineUsers.filter(u => u.avatar);
                                    const duplicatedList = [...list, ...list];
                                    return duplicatedList.map((user, idx) => {
                                        const isMe = user.id === currentUser.id;
                                        return (
                                        <div key={`reg-${user.id}-${idx}`} className={`bg-white/[0.03] border ${isMe ? 'border-blue-500/30' : 'border-white/10'} rounded-2xl p-3 flex items-center gap-3`}>
                                            <div className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-800 ${isMe ? 'ring-2 ring-blue-500/50' : ''}`}>
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                <div className={`absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full border border-slate-900 ${user.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-xs text-white truncate">{user.name}</span>
                                                    {isMe && (
                                                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold border border-blue-500/30 whitespace-nowrap leading-none mt-0.5">
                                                            {language === 'ru' ? 'Это Вы онлайн' : 'You are online'}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-slate-400">{user.age}</span>
                                                    {user.country && <span className="text-[8px] text-slate-500">📍{user.country}</span>}
                                                </div>
                                                {user.intentStatus && (
                                                    <span className="text-[8px] text-violet-400 font-bold">{user.intentStatus}</span>
                                                )}
                                            </div>
                                            <span className={`text-[8px] font-bold ${user.status === 'online' ? 'text-green-400' : 'text-slate-500'}`}>
                                                {user.status === 'online' ? '● ' + (language === 'ru' ? 'В СЕТИ' : 'ONLINE') : '○ OFF'}
                                            </span>
                                        </div>
                                    )});
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'search' && (
                (currentUser.age && parseInt(currentUser.age.toString()) < 18) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                            <span className="text-4xl">🔞</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {t.accessRestricted}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                            {t.ageRestrictionNotice}
                        </p>
                    </div>
                ) : (
                <div className={`flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 relative transition-all duration-1000 ${isLightsOn ? 'shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]' : ''}`}>
                    {/* Cozy Lighting Overlay (Search) */}
                    <div className={`fixed inset-0 bg-black/90 z-0 transition-opacity duration-1000 pointer-events-none ${isLightsOn ? 'opacity-100' : 'opacity-0'}`} />
                    
                    {/* Spotlight Glow Effect (Search) */}
                    <div className={`fixed inset-0 z-0 transition-opacity duration-1000 pointer-events-none ${isLightsOn ? 'opacity-100' : 'opacity-0'}`}
                         style={{
                             background: 'radial-gradient(circle at 50% 40%, rgba(255, 200, 100, 0.1) 0%, rgba(255, 150, 50, 0.02) 50%, transparent 80%)'
                         }}
                    />

                    <div className="flex flex-col h-full relative z-10 overflow-hidden">
                        <div className="p-6 pb-2 shrink-0">
                            <div className="flex flex-col items-center gap-1 mb-6">
                                {/* Lighting Controls (Search) */}
                                <div className="flex items-end justify-center gap-12 mb-2 w-full max-w-sm relative">
                                    {/* Left Projector */}
                                    <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${isLightsOn ? 'opacity-100 transform rotate-45 translate-y-4 text-yellow-200' : 'opacity-50 text-slate-600'}`}>
                                        <div className={`w-10 h-10 rounded-full border-2 bg-slate-800 relative overflow-hidden shadow-xl ${isLightsOn ? 'border-yellow-400 shadow-[0_0_20px_rgba(255,200,0,0.5)] bg-yellow-900/50' : 'border-slate-600'}`}>
                                            <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                                            {isLightsOn && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}
                                        </div>
                                        <div className="w-1 h-8 bg-slate-700 rounded-full" />
                                    </div>

                                    {/* Central Tumbler Switch */}
                                    <div className="flex flex-col items-center relative -top-4">
                                        <button 
                                            onClick={() => {
                                                const newState = !isLightsOn;
                                                setIsLightsOn(newState);
                                                if (onLightsToggle) onLightsToggle(newState);
                                            }}
                                            className={`w-14 h-24 rounded-full border-4 transition-all duration-300 shadow-2xl relative overflow-hidden group ${isLightsOn ? 'bg-yellow-900/50 border-yellow-500 shadow-[0_0_30px_rgba(255,180,0,0.4)]' : 'bg-slate-800 border-slate-600'}`}
                                        >
                                            <div className={`absolute left-1 right-1 h-10 rounded-full transition-all duration-300 flex items-center justify-center border-t border-white/10 ${isLightsOn ? 'top-12 bg-gradient-to-b from-yellow-500 to-yellow-700 shadow-[0_0_10px_rgba(255,200,0,0.8)]' : 'top-1 bg-gradient-to-b from-slate-500 to-slate-700 shadow-lg'}`}>
                                                <div className={`w-1 h-4 rounded-full bg-black/20 ${isLightsOn ? '' : 'hidden'}`} />
                                            </div>
                                        </button>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors ${isLightsOn ? 'text-yellow-500 text-shadow-glow' : 'text-slate-600'}`}>
                                            {t.stage}
                                        </span>
                                    </div>

                                    {/* Right Projector */}
                                    <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${isLightsOn ? 'opacity-100 transform -rotate-45 translate-y-4 text-yellow-200' : 'opacity-50 text-slate-600'}`}>
                                        <div className={`w-10 h-10 rounded-full border-2 bg-slate-800 relative overflow-hidden shadow-xl ${isLightsOn ? 'border-yellow-400 shadow-[0_0_20px_rgba(255,200,0,0.5)] bg-yellow-900/50' : 'border-slate-600'}`}>
                                            <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                                            {isLightsOn && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}
                                        </div>
                                        <div className="w-1 h-8 bg-slate-700 rounded-full" />
                                    </div>
                                    
                                    {/* Long Light Beams aiming at Cards */}
                                    {isLightsOn && (
                                        <>
                                            {/* Extended beams to reach carousel */}
                                            <div className="absolute top-14 left-[-40px] w-[200px] h-[1200px] bg-gradient-to-b from-yellow-200/20 via-yellow-200/5 to-transparent transform rotate-[15deg] pointer-events-none blur-2xl z-20 mix-blend-screen" />
                                            <div className="absolute top-14 right-[-40px] w-[200px] h-[1200px] bg-gradient-to-b from-yellow-200/20 via-yellow-200/5 to-transparent transform -rotate-[15deg] pointer-events-none blur-2xl z-20 mix-blend-screen" />
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full animate-in fade-in zoom-in duration-500">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                                        {t.onlineStatsPrefix}{onlineStats.totalOnline + 42}
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-white text-center leading-tight mt-2">
                                    {t.discoveryAction}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                                    {t.discoveryNotice}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <button 
                                    onClick={() => handleSearch()}
                                    className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-600/30 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <img src="https://em-content.zobj.net/source/microsoft-teams/363/game-die_1f3b2.png" alt="Random Mode" className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <p className="text-xl mb-1">🎲</p>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">{t.randomChat}</p>
                                    <p className="text-[9px] text-slate-400 leading-tight">{t.randomChatDesc}</p>
                                </button>
                                <button 
                                    onClick={() => handleSearch()}
                                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-600/30 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <img src="https://em-content.zobj.net/source/microsoft-teams/363/fire_1f525.png" alt="Popular" className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <p className="text-xl mb-1">🔥</p>
                                    <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-0.5">{t.onlineNow}</p>
                                    <p className="text-[9px] text-slate-400 leading-tight">{t.activeUsersOnly}</p>
                                </button>
                            </div>

                            {/* Refined Filters (Visually Secondary) */}
                            <div className="space-y-4 mb-2 p-1">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.orByParameters}</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                </div>

                                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block">{t.age}</label>
                                            <div className="flex items-center gap-2 bg-black/20 rounded-xl p-1 border border-white/5">
                                                <select 
                                                    value={searchAgeFrom} 
                                                    onChange={(e) => setSearchAgeFrom(e.target.value)} 
                                                    className="w-full bg-transparent text-xs font-bold text-white outline-none text-center appearance-none py-1.5"
                                                >
                                                    {AGES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                                </select>
                                                <span className="text-slate-600">-</span>
                                                <select 
                                                    value={searchAgeTo} 
                                                    onChange={(e) => setSearchAgeTo(e.target.value)} 
                                                    className="w-full bg-transparent text-xs font-bold text-white outline-none text-center appearance-none py-1.5"
                                                >
                                                    {AGES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block">{t.gender}</label>
                                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 h-[34px]">
                                                {(['male', 'female'] as const).map(g => (
                                                    <button 
                                                        key={g} 
                                                        onClick={() => setSearchGender(searchGender === g ? 'any' : g)} 
                                                        className={`flex-1 rounded-lg text-xs font-bold transition-all uppercase ${searchGender === g ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        {t[g].substring(0, 1)}
                                                    </button>
                                                ))}

                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSearch} 
                                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 relative overflow-hidden group"
                                    >
                                        <SearchIcon className="w-4 h-4" /> 
                                        {t.startSearch}
                                    </button>
                                    
                                    <p className="text-[9px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1 opacity-70">
                                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                        {t.autoDeleteNotice}
                                    </p>
                                </div>
                            </div>
                            </div>
                        </div>

                        <div 
                            ref={carouselRef}
                            onMouseEnter={() => setIsHoveringCarousel(true)}
                            onMouseLeave={() => setIsHoveringCarousel(false)}
                            className="relative w-full flex-1 overflow-y-auto no-scrollbar"
                        >
                            <div className="flex flex-col gap-3 px-4 pb-12 pt-2">
                                {(() => {
                                    const list = ((searchResults?.length > 0 ? searchResults : onlineUsers) || [])
                                        .filter(u => !hiddenUsers.has(u.id));
                                    // Duplicate the list for infinite circular scrolling
                                    const duplicatedList = [...list, ...list];
                                    return duplicatedList.map((user, idx) => {
                                        const isMe = user.id === currentUser.id;
                                        return (
                                        <div key={`${user.id}-${idx}`} className={`bg-white/[0.03] border ${isMe ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/10'} rounded-3xl relative group hover:bg-white/[0.06] transition-all duration-300 overflow-hidden`}>
                                            {/* Hide Button */}
                                            {!isMe && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleHideUser(user.id); }}
                                                    className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    title={t.hide}
                                                >
                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Top row: avatar + info */}
                                            <div className="flex items-start gap-3 p-3 pb-2">
                                                {/* Avatar */}
                                                <div className={`relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 shadow-lg ${isMe ? 'ring-2 ring-blue-500/50' : ''}`}>
                                                    <img src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`} alt={user.name} className={`w-full h-full object-cover ${user.status === 'offline' ? 'grayscale-[0.5]' : ''}`} />
                                                    <div className={`absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${user.status === 'online' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-slate-500'}`} />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    {/* Name + age + location */}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h3 className="font-black text-sm text-white leading-tight truncate max-w-[120px]">{user.name}</h3>
                                                        {isMe && (
                                                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold border border-blue-500/30 whitespace-nowrap leading-none mt-0.5">
                                                                {language === 'ru' ? 'Это Вы онлайн' : 'You are online'}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-bold text-slate-300">{user.age}</span>
                                                        {user.country && (
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="text-[10px]">📍</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[70px]">{user.country}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                {/* Status badge + online dot */}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {user.intentStatus && (
                                                        <span className="px-2 py-0.5 bg-primary/20 border border-primary/40 rounded-full text-[9px] font-black text-violet-300 uppercase tracking-wider">
                                                            {user.intentStatus}
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${user.status === 'online' ? 'text-green-400' : 'text-slate-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                                        {user.status === 'online' ? (language === 'ru' ? 'В СЕТИ' : 'ONLINE') : 'OFF'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom action row */}
                                        <div className="flex gap-2 px-3 pb-3">
                                            {/* Voice Intro button */}
                                            <button 
                                                onClick={() => user.voiceIntro && new Audio(user.voiceIntro).play()}
                                                disabled={!user.voiceIntro}
                                                className={`flex-1 h-10 rounded-xl flex items-center gap-2 px-3 transition-all ${user.voiceIntro ? 'bg-indigo-600/80 hover:bg-indigo-600 active:scale-95' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                    <PlayIcon className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black text-white uppercase tracking-wider leading-none">{language === 'ru' ? 'ГОЛОС' : 'VOICE'}</p>
                                                    <div className="flex gap-[2px] mt-0.5">
                                                        {[3,5,4,6,3,5,4].map((h, i) => (
                                                            <div key={i} className={`w-[2px] rounded-full ${user.voiceIntro ? 'bg-white/60' : 'bg-white/20'}`} style={{ height: `${h}px` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Knock button — always orange, auth gate is in handler */}
                                            <button 
                                                onClick={() => handleKnock(user)} 
                                                disabled={sentKnocks.has(user.id)} 
                                                className={`flex-1 h-10 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1 
                                                    ${sentKnocks.has(user.id)
                                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:brightness-110 active:scale-95 shadow-[0_0_12px_rgba(249,115,22,0.3)]'}`}
                                            >
                                                {sentKnocks.has(user.id) ? (
                                                    <>✓ {t.sent}</>
                                                ) : (
                                                    <>{t.knock} {!currentUser.isAuthenticated ? '🔒' : '👋'}</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    );
                                });
                                })()}
                                {((searchResults?.length > 0 ? searchResults : onlineUsers) || []).filter(u => !hiddenUsers.has(u.id)).length === 0 && (
                                     <div className="w-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                                        <div className="text-4xl mb-4">🔭</div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.noUsersFound}</p>
                                        <p className="text-[10px] text-slate-600 mt-2">{t.tryAdjustingFilters}</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>
              )
            )}

            {view === 'inbox' && (
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 animate-in slide-in-from-right duration-300">
                    {pendingKnocks?.length > 0 && (
                        <div className="space-y-3 mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary pl-2 mb-2">{t.knocking} ({pendingKnocks.length})</h4>
                            {pendingKnocks.map(knock => {
                                const details = knock.fromUser;
                                return (
                                    <div key={knock.knockId} className="p-3 bg-white/5 border border-secondary/30 rounded-2xl flex items-center gap-3">
                                        <img src={details?.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                                        <div className="flex-1 min-w-0"><h5 className="font-bold text-sm text-white truncate">{details?.name}</h5><p className="text-[10px] text-slate-400">{t.wantsToConnect}</p></div>
                                        <div className="flex gap-2"><button onClick={() => handleRejectKnock(knock)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-red-400 transition-colors"><XMarkIcon className="w-4 h-4" /></button><button onClick={() => handleAcceptKnock(knock)} className="p-2 bg-secondary text-white rounded-full hover:scale-110 transition-transform shadow-lg"><HeartIcon className="w-4 h-4" filled /></button></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2 mb-2">{t.myDialogs}</h4>
                        {activeSessions.size === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 flex items-center justify-center mb-4 relative transition-transform hover:scale-110">
                                    <span className="text-5xl grayscale-0">💬</span>
                                </div>
                                
                                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                                    {t.noActiveChats}
                                </h3>
                                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mb-8">
                                    {t.noActiveChatsDesc}
                                </p>

                                {/* Activity Badge */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
                                    <span className="relative flex h-1.5 w-1.5">
                                      {/* Pulse Removed */}
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                                        {t.onlineStatsPrefix}{onlineStats.totalOnline + 15} {t.onlineCountLabel}
                                    </span>
                                </div>

                                <div className="w-full space-y-3">
                                    <button 
                                        onClick={() => setView('search')}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group"
                                    >
                                        <SearchIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {t.findingSomeoneBtn}
                                    </button>
                                    
                                    <button 
                                        onClick={() => setView('search')}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] flex items-center justify-center gap-2"
                                    >
                                        <span>🎲</span>
                                        {t.feelingLucky}
                                    </button>
                                </div>

                                <p className="mt-8 text-[9px] text-slate-600 font-medium flex items-center justify-center gap-1.5 opacity-60">
                                    <ClockIcon className="w-3 h-3" />
                                    {t.historyNotSaved}
                                </p>
                            </div>
                        )}
                        {Array.from(activeSessions.values()).filter(s => !hiddenSessions.has(s.sessionId)).map(session => {
                            const partner = getPartnerFromSession(session);
                            const isPartnerOnline = onlineUsers.some(u => u.id === session.partnerId);
                            return (
                                <div 
                                    key={session.sessionId} 
                                    onClick={() => { 
                                        setActiveSession(session); 
                                        setView('chat');
                                        // Load messages for this session
                                        socketService.getMessages(session.sessionId, ({ messages: msgs }) => {
                                            const decrypted = msgs.map(msg => ({
                                                ...msg,
                                                text: msg.messageType === 'text' && msg.encryptedPayload 
                                                    ? encryptionService.decrypt(msg.encryptedPayload, session.sessionId)
                                                    : undefined,
                                                audioBase64: msg.messageType === 'audio' && msg.encryptedPayload
                                                    ? encryptionService.decryptBinary(msg.encryptedPayload, session.sessionId)
                                                    : undefined,
                                                flagged: msg.metadata?.flagged || false
                                            }));
                                            setMessages(decrypted);
                                        });
                                    }} 
                                    className="p-4 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-[1.5rem] flex items-center gap-4 cursor-pointer transition-all active:scale-98 bg-white/[0.02] group relative"
                                >
                                    
                                    {/* Hide Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleHideSession(session.sessionId); }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/80 text-white/50 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                                        title={t.hideChatConfirm}
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="relative">
                                        <img src={partner?.avatar} className="w-14 h-14 rounded-2xl object-cover bg-slate-800" />
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${isPartnerOnline ? 'bg-green-500' : 'bg-slate-500'} border-2 border-[#1e293b] rounded-full`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-sm text-white truncate">{partner?.name}</h5>
                                        <p className={`text-xs truncate font-medium ${isPartnerOnline ? 'text-green-400' : 'text-slate-500'}`}>
                                            {isPartnerOnline ? t.onlineStatus : t.wasOnline}
                                        </p>
                                    </div>
                                    <div className="text-slate-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'chat' && activeSession && (
                <div className="flex-1 flex flex-col h-full relative">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
                        <div className="text-center py-6"><span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-slate-500 uppercase font-bold tracking-widest">{t.today}</span></div>
                        {[...messages].sort((a,b) => a.timestamp - b.timestamp).map(msg => {
                            const isMsgFlagged = msg.flagged && !showFlagged[msg.id];
                            return (
                             <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm backdrop-blur-md transition-all ${msg.senderId === currentUser.id ? 'bg-primary/20 border border-white/10 text-white rounded-tr-sm' : 'bg-white/5 border border-white/5 text-white rounded-tl-sm'} ${isMsgFlagged ? 'opacity-40 grayscale blur-[1px]' : ''}`}>
                                    {isMsgFlagged ? (
                                        <div className="flex flex-col items-center gap-2 py-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{t.contentFiltered}</p>
                                            <button 
                                                onClick={() => setShowFlagged(prev => ({ ...prev, [msg.id]: true }))}
                                                className="text-[9px] font-bold underline text-white/60 hover:text-white"
                                            >
                                                {t.showAnyway}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.messageType === 'text' && msg.text && (() => {
                                                const isOnlyEmojis = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u.test(msg.text) && /[^\s]/.test(msg.text);
                                                return <p className={`leading-relaxed whitespace-pre-wrap ${isOnlyEmojis ? 'text-[5rem] leading-none text-center block w-full py-2 my-2' : ''}`}>{msg.text}</p>;
                                            })()}
                                            {msg.messageType === 'sticker' && msg.text && (
                                                <img src={msg.text} alt="Sticker" className="w-32 h-32 object-contain block my-1" loading="lazy" />
                                            )}
                                            {msg.messageType === 'audio' && (
                                                msg.audioBase64 ? (
                                                    <div className="flex items-center gap-3 py-1 min-w-[160px] pr-2">
                                                        <button onClick={() => new Audio(msg.audioBase64).play()} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors shrink-0"><PlayIcon className="w-4 h-4" /></button>
                                                        <div className="flex-1 flex flex-col justify-center gap-1"><div className="h-1 bg-white/30 w-full rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-white/60 w-1/3"></div></div><span className="text-[9px] uppercase font-bold opacity-70">0:05</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mt-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 opacity-80">AUDIO ERROR</span>
                                                        <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Decryption failed</span>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                    <div className={`text-[9px] mt-1 font-bold flex justify-end items-center gap-1 ${msg.senderId === currentUser.id ? 'text-white/60' : 'text-slate-500'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        {msg.senderId === currentUser.id && <span className="text-[10px]">✓</span>}
                                        {msg.senderId !== currentUser.id && (
                                            <button onClick={() => handleReportUser(msg.senderId, msg.id)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400">!</button>
                                        )}
                                    </div>
                                    <MessageTTLIndicator msg={msg} />
                                </div>
                             </div>
                            );
                        })}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>
                </div>
            )}
        </div>

        {view === 'chat' && activeSession && (
            <div className="p-3 bg-transparent border-t border-white/5 shrink-0 relative z-40 pb-6 backdrop-blur-md">
                {/* Session Timer - Bottom Left */}
                {profileExpiresAt && (
                    <div className="absolute -top-8 left-3 z-50">
                        <SessionTimer 
                            expiresAt={profileExpiresAt} 
                            onExpire={() => {
                                alert(t.sessionExpired);
                                window.location.reload();
                            }} 
                        />
                    </div>
                )}
                {isRecording && (<div className="absolute inset-x-2 -top-16 h-14 bg-red-600/90 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 text-white animate-in slide-in-from-bottom border border-red-400/30 shadow-2xl z-50"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-white rounded-full animate-ping"></div><span className="font-bold text-xs uppercase tracking-widest">{recordingTime}s {t.recording}</span></div><button onPointerUp={stopRecording} className="text-[10px] font-black bg-white text-red-600 px-4 py-2 rounded-xl hover:scale-105 transition-transform shadow-lg">{t.send}</button></div>)}
                {showEmojiPicker && (<div className="absolute bottom-24 left-2 right-2 bg-[#1e293b] p-3 rounded-[2rem] h-64 overflow-y-auto no-scrollbar grid grid-cols-8 gap-1 border border-white/10 shadow-2xl z-50 animate-in slide-in-from-bottom-5">{EMOJIS.map(e => <button key={e} onClick={() => { setInputText(p => p + e); setShowEmojiPicker(false); }} className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors">{e}</button>)}</div>)}
                {showStickerPicker && (
                    <StickerPicker 
                        onSelect={(url) => handleSendSticker(url)}
                        onClose={() => setShowStickerPicker(false)}
                    />
                )}
                <div className="flex items-center gap-1.5 md:gap-2">
                    
                    <div className="flex-1 min-w-0 bg-white/5 border border-white/5 rounded-[1.5rem] flex items-center px-1.5 md:px-2 min-h-[46px] md:min-h-[50px] hover:bg-white/10 transition-all">
                        <input 
                            value={inputText} 
                            onChange={e => setInputText(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                            placeholder={t.messagePlaceholder} 
                            className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 md:py-3 px-2 md:px-3 text-sm text-white placeholder:text-slate-500 font-medium" 
                        />
                        <button 
                            onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }} 
                            className={`p-1.5 md:p-2 transition-colors active:scale-90 shrink-0 ${showStickerPicker ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                            title="Стикеры"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 h-6">
                              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }} 
                            className={`p-1.5 md:p-2 transition-colors active:scale-90 shrink-0 ${showEmojiPicker ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                            title="Эмодзи"
                        >
                            <FaceSmileIcon className="w-5 h-5 md:w-6 h-6" />
                        </button>
                    </div>
                    
                    {inputText.trim() ? (
                        <button 
                            onClick={handleSendMessage} 
                            className="p-2.5 md:p-3 bg-primary/40 border border-white/10 text-white rounded-full shadow-lg hover:bg-primary/60 active:scale-95 transition-all shrink-0"
                        >
                            <PaperAirplaneIcon className="w-5 h-5 md:w-6 h-6" />
                        </button>
                    ) : (
                        <button 
                            onPointerDown={startRecording} 
                            onPointerUp={stopRecording} 
                            style={{ touchAction: 'none' }}
                            className={`p-2.5 md:p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                        >
                            <MicrophoneIcon className="w-5 h-5 md:w-6 h-6" />
                        </button>
                    )}
                </div>
                
            </div>
        )}

        <div className="px-4 py-3 bg-[var(--player-bar-bg)] border-t border-[var(--panel-border)] relative shrink-0 z-30">
            <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-3 w-full"><button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className={`p-2 rounded-xl transition-all ${isVolumeOpen ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white'}`}><VolumeIcon className="w-5 h-5" /></button><div className="h-8 flex-1 bg-black/30 rounded-lg overflow-hidden relative border border-white/5 flex items-center justify-center"><AudioVisualizer analyserNode={analyserNode} isPlaying={isPlaying} variant="segmented" settings={{ scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 0.4, speed: 1, autoIdle: false, performanceMode: true, energySaver: false }} /><div className="absolute inset-0 flex items-center justify-between px-3"><span className="text-[9px] font-black text-white truncate max-w-[100px]">{currentStation?.name || 'Radio'}</span>{isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}</div></div><button onClick={() => setIsPlayerOpen(!isPlayerOpen)} className="p-2 text-slate-400 hover:text-white">{isPlayerOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}</button></div></div>
            {isVolumeOpen && (<div className="absolute left-4 bottom-16 z-50 bg-[#0f172a] p-3 rounded-xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2"><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => onVolumeChange(parseFloat(e.target.value))} className="w-32 h-1 accent-primary cursor-pointer" /></div>)}
            {isPlayerOpen && (
                <div className="flex items-center justify-center gap-3 md:gap-5 px-2 py-2 animate-in slide-in-from-top-2">
                    {/* EQ Button */}
                    <button className="p-1.5 hover:scale-110 active:scale-95 group">
                            <div className="w-3.5 h-3.5 flex gap-0.5 items-end justify-center">
                            <div className="w-0.5 h-2 bg-gradient-to-t from-green-400 to-blue-500 rounded-full animate-[bounce_1s_infinite]"></div>
                            <div className="w-0.5 h-3.5 bg-gradient-to-t from-purple-400 to-pink-500 rounded-full animate-[bounce_1.2s_infinite]"></div>
                            <div className="w-0.5 h-1.5 bg-gradient-to-t from-yellow-400 to-red-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
                            </div>
                    </button>

                    <button onClick={onPrevStation} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <PreviousIcon className="w-5 h-5" />
                    </button>
                    
                    <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all mx-1">
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                    </button>

                     <button onClick={onNextStation} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <NextIcon className="w-5 h-5" />
                    </button>

                    {/* Favorite */}
                    {currentStation && (
                        <button 
                            onClick={() => onToggleFavorite(currentStation.stationuuid)}
                            className={`p-1.5 transition-all hover:scale-110 active:scale-95 ${favorites.includes(currentStation.stationuuid) ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            <HeartIcon className={`w-4 h-4 ${favorites.includes(currentStation.stationuuid) ? 'fill-current' : ''}`} />
                        </button>
                    )}

                    {/* Shuffle */}
                    <button 
                        onClick={onToggleRandomMode} 
                        className={`p-1.5 transition-all hover:scale-110 active:scale-95 ${randomMode ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ShuffleIcon className="w-4 h-4" />
                    </button>

                    {/* Share */}
                    <button 
                         onClick={onShare}
                         className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:scale-110"
                    >
                        <ShareIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

        </div>





        {isDemoOpen || isRegDemoOpen || isInteractDemoOpen ? (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <React.Suspense fallback={<div className="text-white">Loading demo...</div>}>
                    <div className="w-full max-w-sm">
            {isRegDemoOpen && (
                <RegistrationDemoAnimation onComplete={() => setIsRegDemoOpen(false)} />
            )}
            
            {/* INTERACTION DEMO OVERLAY */}
            {isInteractDemoOpen && (
                <InteractionDemoAnimation onComplete={() => setIsInteractDemoOpen(false)} />
            )}

            {/* CHAT SCENARIO */}
            {isDemoOpen && (
                <ChatDemoAnimation onComplete={() => setIsDemoOpen(false)} />
            )}
        </div>
                </React.Suspense>
            </div>
        ) : null}

        {/* Waiting for Partner Overlay */}
        {isWaitingForPartner && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-8 text-center animate-in fade-in">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative">
                     <span className="text-4xl animate-pulse">⏳</span>
                     <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t.waitingForPartnerTitle}</h3>
                <p className="text-sm text-slate-400 max-w-xs">{t.waitingForPartnerDesc}</p>
            </div>
        )}

        {/* Knock Accepted Banner */}
        {knockAcceptedData && (
            <div className="absolute top-4 inset-x-4 z-[60] bg-green-500/20 border border-green-500/50 backdrop-blur-lg rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={knockAcceptedData.partnerProfile.avatar} className="w-12 h-12 rounded-full border-2 border-green-400" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">{t.knockAccepted}</h4>
                        <p className="text-[10px] text-green-200">{knockAcceptedData.partnerProfile.name} {t.partnerWaiting}</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        socketService.joinSession(knockAcceptedData.sessionId);
                        setKnockAcceptedData(null);
                        // setView handled by onSessionCreated/onSessionJoin event flow
                    }}
                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    {t.enter}
                </button>
            </div>
        )}

        {/* Incoming Knock Banner - Top Right Overlay */}
        {incomingKnock && (
            <div className="absolute top-4 right-4 z-[70] bg-slate-900/90 border border-cyan-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-in slide-in-from-right-full w-80">
                <div className="flex items-start gap-4">
                    <img src={incomingKnock.fromUser.avatar || ''} className="w-12 h-12 rounded-full border-2 border-cyan-400" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-white mb-0.5">{t.incomingKnock}</h4>
                            <button onClick={() => setIncomingKnock(null)} className="text-white/40 hover:text-white">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-cyan-200 font-bold mb-1">{incomingKnock.fromUser.name}, {incomingKnock.fromUser.age}</p>
                        <p className="text-[10px] text-slate-400 mb-3">{incomingKnock.fromUser.country}</p>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    handleRejectKnock({ knockId: incomingKnock.knockId, fromUserId: incomingKnock.fromUser.id });
                                    setIncomingKnock(null);
                                }}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-200 text-[10px] font-bold rounded-lg border border-white/10 transition-colors"
                            >
                                {t.reject}
                            </button>
                            <button 
                                onClick={() => {
                                    handleAcceptKnock({ knockId: incomingKnock.knockId, fromUserId: incomingKnock.fromUser.id });
                                    setIncomingKnock(null);
                                    // Accepted -> Waiting Logic triggers via event
                                }}
                                className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all"
                            >
                                {t.accept}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </aside>
  );
};

export default ChatPanelEnhanced;
