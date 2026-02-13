
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    XMarkIcon, PaperAirplaneIcon, UsersIcon, 
    MicrophoneIcon, FaceSmileIcon, PaperClipIcon, 
    PlayIcon, PauseIcon, CameraIcon, SearchIcon, ClockIcon,
    NextIcon, PreviousIcon, VolumeIcon, ChevronDownIcon, ChevronUpIcon,
    HeartIcon, PhoneIcon, VideoCameraIcon, ArrowLeftIcon, UserIcon, ChatBubbleIcon,
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
}

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💧', '🌈', '☀️', '🌙', '⭐', '🎵', '🎶', '🎤', '🎧', '📷', '📸', '🎬', '🎨', '🎭', '🎪', '🎯', '🎲', '🎰', '🎳'
];

const AGES = Array.from({ length: 63 }, (_, i) => (i + 18).toString()); 

const INTENT_STATUSES = ['Хочу поговорить', 'Свободен', 'Просто слушаю', 'Без флирта'] as const;

const SMART_PROMPTS = {
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
  }
};

const stylizeAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 384;
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No context');

                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2;
                const sy = (img.height - min) / 2;
                ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);

                const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.floor(data[i] / 64) * 64;
                    data[i+1] = Math.floor(data[i+1] / 64) * 64;
                    data[i+2] = Math.floor(data[i+2] / 64) * 64;
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/webp', 0.6));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const processChatImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Limit max dimension to 1280px for better quality on modern phones
                const MAX_SIZE = 1280;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No context');

                // Standard draw without filters
                ctx.drawImage(img, 0, 0, width, height);

                // Use JPEG for maximum compatibility and smaller file size
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
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
    const ttl = (msg.messageType === 'image' || msg.messageType === 'audio' || msg.messageType === 'video') ? 30 : 60;
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
    onPendingKnocksChange, detectedLocation: passedLocation, onRequireLogin
}) => {
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showDeleteHint, setShowDeleteHint] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  // Knock Flow States
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
  const [knockAcceptedData, setKnockAcceptedData] = useState<{ sessionId: string; partnerProfile: UserProfile } | null>(null);
  const [incomingKnock, setIncomingKnock] = useState<{ knockId: string; fromUser: UserProfile } | null>(null);

  // Helper for TTS
  const announceNotification = (text: string) => {
      if (!currentUser.chatSettings?.voiceNotificationsEnabled) return;
      
      const isCyrillic = /[а-яА-ЯёЁ]/.test(text);
      const targetLang = isCyrillic ? 'ru-RU' : 'en-US';

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

  // Refs
  // messagesEndRef is defined below, removing duplicate
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
    if (!timestamp) return language === 'ru' ? 'Давно' : 'A while ago';
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return language === 'ru' ? 'только что' : 'just now';
    if (mins < 60) return language === 'ru' ? `${mins}м назад` : `${mins}m ago`;
    if (hours < 24) return language === 'ru' ? `${hours}ч назад` : `${hours}h ago`;
    if (days < 7) return language === 'ru' ? `${days}д назад` : `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const [hasRegisteredWithServer, setHasRegisteredWithServer] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
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
  const [messages, setMessages] = useState<any[]>([]);
  const [pendingKnocks, setPendingKnocks] = useState<any[]>([]);
  
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState<string>(currentUser.age?.toString() || '18');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>(currentUser.gender || 'male');
  const [regAvatar, setRegAvatar] = useState<string | null>(currentUser.avatar || null);
  const [regIntentStatus, setRegIntentStatus] = useState<typeof INTENT_STATUSES[number]>(() => {
    return (currentUser.intentStatus as any) || 'Свободен';
  });
  const [regVoiceIntro, setRegVoiceIntro] = useState<string | null>(currentUser.voiceIntro || null);
  const [isRecordingIntro, setIsRecordingIntro] = useState(false);
  const [introRecordingTime, setIntroRecordingTime] = useState(0);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const mediaRecorderIntroRef = useRef<MediaRecorder | null>(null);
  const audioChunksIntroRef = useRef<Blob[]>([]);
  const introTimerRef = useRef<any>(null);
  
  const [searchAgeFrom, setSearchAgeFrom] = useState('18');
  const [searchAgeTo, setSearchAgeTo] = useState('80');
  const [searchGender, setSearchGender] = useState<'any' | 'male' | 'female'>('any');
  
  const [sentKnocks, setSentKnocks] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(true);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [mutedUntil, setMutedUntil] = useState<number | null>(null);
    const [showFlagged, setShowFlagged] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

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
  const [expirationWarning, setExpirationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [onlineStats, setOnlineStats] = useState({ totalOnline: 0, chatOnline: 0 });
  
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // View state: Default to search if profile complete, else register
  const [view, setView] = useState<'register' | 'search' | 'inbox' | 'chat'>(() => {
    if (currentUser.id && currentUser.name && currentUser.age) return 'search';
    return 'register';
  });

  
  const [detectedLocation, setDetectedLocation] = useState<{country: string, city: string, ip?: string} | null>(() => {
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

  // ... (Call State) ...

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
      const text = language === 'ru' 
        ? "К вам пришло сообщение - посмотрим в чате !" 
        : "You have a new message - let's check the chat!";
      
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
      
      const text = language === 'ru' 
        ? "К вам пришло сообщение - посмотрим в чате !" 
        : "You have a new message - let's check the chat!";

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = regNotificationVolume;
      utterance.rate = 1.0;
      utterance.pitch = 1.0; 
      utterance.lang = language === 'ru' ? 'ru-RU' : 'en-US';

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

  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callPartner, setCallPartner] = useState<UserProfile | null>(null);
  const [isMicPreparing, setIsMicPreparing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const preRecordingVolumeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const availableCitiesSearch = useMemo(() => [], []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, view]);

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

  const detectedCountry = detectedLocation?.country || (language === 'ru' ? 'Неизвестно' : 'Unknown');

  // Background Location Detection (Silent)
  useEffect(() => {
    const detect = async () => {
      try {
        const location = await geolocationService.detectLocation();
        if (location) {
          setDetectedLocation(location);
          geolocationService.saveLocationToCache(location);
        }
      } catch (err) {
        console.error('[GEO] Silent detection error:', err);
      }
    };
    if (!detectedLocation) detect();
  }, []);
  
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
          if (msg.messageType === 'image' || msg.messageType === 'audio' || msg.messageType === 'video') {
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
    return () => clearInterval(pruneInterval);
  }, []);

  // Ringtone Management
  useEffect(() => {
     if (callStatus === 'ringing' || callStatus === 'calling') {
         console.log(`🔔 Ringtone started (${callStatus})`);
         if (!ringtoneRef.current) {
             ringtoneRef.current = new Audio('/sounds/call.mp3');
             ringtoneRef.current.loop = true;
         }
         // For 'calling' we might want a slightly different volume or start delay
         ringtoneRef.current.volume = 0.5;
         ringtoneRef.current.play().catch(err => console.error("Ringtone play error", err));
     } else {
         if (ringtoneRef.current) {
             console.log("🔕 Ringtone stopped");
             ringtoneRef.current.pause();
             ringtoneRef.current.currentTime = 0;
         }
     }
     
     return () => {
         if (ringtoneRef.current) {
             ringtoneRef.current.pause();
             ringtoneRef.current.currentTime = 0;
         }
     };
  }, [callStatus]);

  // Audio Stream Effect
  useEffect(() => {
    if (remoteStream) {
        console.log("[UI] Setting remote stream to audio element", remoteStream.getTracks());
        const audioEl = document.getElementById('remote-audio') as HTMLAudioElement;
        if (audioEl) {
            audioEl.srcObject = remoteStream;
            audioEl.play().catch(e => console.error("Auto-play failed", e));
        }
    }
  }, [remoteStream]);

  // Socket.IO connection setup
  useEffect(() => {
    // socketService.connect() is handled by parent App.tsx
    
    // Collect cleanup functions
    const cleanups: (() => void)[] = [];
    
    // Listen for profile expiration warning
    cleanups.push(socketService.onProfileExpiring((data) => {
      setExpirationWarning(true);
      const minutes = Math.floor(data.expiresIn / 60000);
      alert(`⚠️ ${language === 'ru' ? `Ваш профиль истечет через ${minutes} минут!` : `Your profile expires in ${minutes} minutes!`}`);
    }));
    
    // Listen for profile expiration
    cleanups.push(socketService.onProfileExpired(() => {
      alert(language === 'ru' ? '❌ Ваш профиль истек. Пожалуйста, создайте новый.' : '❌ Your profile has expired. Please create a new one.');
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
    
    // Listen for incoming knocks
    cleanups.push(socketService.onKnockReceived((data) =>{
      if (currentUser.blockedUsers.includes(data.fromUserId)) return;
      
      // Voice notification (sound)
      if (currentUser.chatSettings.voiceNotificationsEnabled) {
        playNotificationSound('knock');
      }
      
      // Banner notification
      if (currentUser.chatSettings.bannerNotificationsEnabled && document.visibilityState === 'hidden') {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notif = new Notification(`${data.fromUser.name || 'Кто-то'} стучится!`, {
            body: language === 'ru' ? 'Новый запрос на общение' : 'New chat request',
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
      
      setPendingKnocks(prev => [...prev, data]);
    }));

    // RE-REGISTER ON RECONNECT (Fix for server restarts)
    socketService.onConnect(() => {
        if (currentUser && currentUser.id && currentUser.isAuthenticated) {
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
    });

    // Check immediate connection status (for hydration/initial load)
    if (socketService.isConnected && currentUser && currentUser.id && currentUser.isAuthenticated) {
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
              image: msg.messageType === 'image' && msg.encryptedPayload
                ? encryptionService.decryptBinary(msg.encryptedPayload, data.sessionId)
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
      console.log(`[CLIENT] 📥 Message received:`, {
        sessionId: message.sessionId,
        senderId: message.senderId,
        messageType: message.messageType,
        currentSession: activeSession?.sessionId
      });
      
      if (!activeSession || message.sessionId !== activeSession.sessionId) {
        console.log(`[CLIENT] ⚠️ Message ignored: session mismatch or no active session`);
        return;
      }
      
      if (currentUser.blockedUsers.includes(message.senderId)) {
        console.log(`[CLIENT] 🚫 Message ignored: sender is blocked`);
        return;
      }
      
      // Decrypt message
      const decrypted = {
        ...message,
        text: message.messageType === 'text' && message.encryptedPayload 
          ? encryptionService.decrypt(message.encryptedPayload, message.sessionId)
          : undefined,
        image: message.messageType === 'image' && message.encryptedPayload
          ? encryptionService.decryptBinary(message.encryptedPayload, message.sessionId)
          : undefined,
        audioBase64: message.messageType === 'audio' && message.encryptedPayload
          ? encryptionService.decryptBinary(message.encryptedPayload, message.sessionId)
          : undefined,
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
          const reasonMsg = language === 'ru' 
            ? `Ваше сообщение было отмечено фильтром: ${decrypted.metadata?.flagReason || 'нарушение'}.`
            : `Your message was flagged: ${decrypted.metadata?.flagReason || 'violation'}.`;
          setViolationMessage(reasonMsg);
          setTimeout(() => setViolationMessage(null), 5000);
      }

      // Play sound only for messages from others
      if (message.senderId !== currentUser.id) {
          playNotificationSound('knock');
          
          // Banner Notification
          if (currentUser.chatSettings?.bannerNotificationsEnabled && document.visibilityState === 'hidden') {
               const senderName = activeSession?.partnerProfile?.name || onlineUsers.find(u => u.id === message.senderId)?.name || (language === 'ru' ? 'Собеседник' : 'Partner');
               showBannerNotification(
                   language === 'ru' ? 'Новое сообщение' : 'New Message', 
                   `${senderName}: ${decrypted.messageType === 'text' ? (decrypted.text?.substring(0, 30) + '...') : (language === 'ru' ? 'Отправил файл' : 'Sent a file')}`
               );
          }

          // Voice Notification
          if (currentUser.chatSettings?.voiceNotificationsEnabled) {
              speakNotification();
          }

          // In-App Toast Notification (New Colorful Animation)
          // Show if we are NOT in the chat view tailored to this user, OR if we just want to notify always (user request implies visibility).
          // We'll show it if the user is NOT currently looking at this specific conversation.
          const isViewingThisChat = view === 'chat' && activeSession?.partnerId === message.senderId;
          
          if (!isViewingThisChat) {
             const senderName = activeSession?.partnerProfile?.name 
                || onlineUsers.find(u => u.id === message.senderId)?.name 
                || (language === 'ru' ? 'Собеседник' : 'Partner');
             const senderAvatar = activeSession?.partnerProfile?.avatar || onlineUsers.find(u => u.id === message.senderId)?.avatar;
             
             if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
             setNotificationToast({
                 senderName,
                 text: decrypted.messageType === 'text' ? (decrypted.text || '') : (language === 'ru' ? '📷 Фото' : '📷 Photo'),
                 senderId: message.senderId,
                 avatar: senderAvatar
             });
             toastTimeoutRef.current = setTimeout(() => setNotificationToast(null), 5000);
          }

          // Voice Mode (Reading content) - Only if Voice Notification is OFF to avoid double speaking overrides
          if (decrypted.text && voiceModeRef.current && !currentUser.chatSettings?.voiceNotificationsEnabled) {
              // Get partner gender
              let partnerGender = 'other';
              if (activeSession) {
                  const partner = activeSession.partnerProfile || onlineUsers.find(u => u.id === message.senderId);
                  partnerGender = partner?.gender || 'other';
              }
              speakMessage(decrypted.text, partnerGender);
          }
      }
      
      scrollToBottom();
    }));
    
    // Listen for message expiration
    cleanups.push(socketService.onMessagesDeleted((data) => {
      if (activeSession && data.sessionId === activeSession.sessionId) {
        setMessages(prev => prev.slice(-data.remainingCount));
      }
    }));
    
    // Listen for WebRTC signals
    cleanups.push(socketService.onSignalReceived(async ({ fromUserId, signal }) => {
      if (currentUser.blockedUsers.includes(fromUserId)) return;
      
      if (signal.type === 'offer') {
         // Incoming call
         if (callStatus !== 'idle') return;
         
         // Try to find partner in online users OR active sessions OR pending knocks
         let partner = onlineUsers.find(u => u.id === fromUserId);
         if (!partner) {
             const session = Array.from(activeSessions.values()).find(s => s.partnerId === fromUserId);
             if (session) partner = session.partnerProfile || getPartnerFromSession(session);
         }
         
         // Fallback: Look in pending knocks or create temporary profile
         if (!partner) {
             const knock = pendingKnocks.find(k => k.fromUserId === fromUserId);
             if (knock && knock.fromUser) {
                 partner = knock.fromUser;
             } else {
                 // Final fallback so call works even if user info missing
                 partner = {
                     id: fromUserId,
                     name: 'Incoming Call...',
                     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
                     age: 0,
                     country: 'Unknown',
                     city: '',
                     gender: 'other',
                     status: 'online',
                     safetyLevel: 'green',
                     blockedUsers: [],
                     bio: '',
                     hasAgreedToRules: true,
                     isAuthenticated: true,
                     filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true },
                     chatSettings: { 
                         notificationsEnabled: true, 
                         notificationVolume: 0.8, 
                         notificationSound: 'default',
                         bannerNotificationsEnabled: false,
                         voiceNotificationsEnabled: false,
                         notificationVoice: 'female'
                     }
                 };
             }
         }

         if (partner) {
             setCallPartner(partner);
             setCallStatus('ringing');
             playNotificationSound('knock'); 
             
             const pc = createPeerConnection(fromUserId);
             peerConnectionRef.current = pc;
             pendingCandidates.current = []; // Reset queue
             
             await pc.setRemoteDescription(new RTCSessionDescription(signal));
             
             // Process queued candidates
             if (pendingCandidates.current.length > 0) {
                 console.log(`[WEBRTC] Processing ${pendingCandidates.current.length} queued candidates`);
                 for (const candidate of pendingCandidates.current) {
                     await pc.addIceCandidate(candidate).catch(e => console.warn("Queue ICE error:", e));
                 }
                 pendingCandidates.current = [];
             }
         }
      } else if (signal.type === 'answer') {
          if (callStatus === 'calling' && peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
              setCallStatus('connected');
              
              // Process queued candidates
              if (pendingCandidates.current.length > 0) {
                  console.log(`[WEBRTC] Processing ${pendingCandidates.current.length} queued candidates (answer)`);
                  for (const candidate of pendingCandidates.current) {
                      await peerConnectionRef.current.addIceCandidate(candidate).catch(e => console.warn("Queue ICE error:", e));
                  }
                  pendingCandidates.current = [];
              }
          }
      } else if (signal.candidate) {
          if (peerConnectionRef.current) {
              if (peerConnectionRef.current.remoteDescription) {
                 try {
                     await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
                 } catch (e) {
                     console.warn("ICE Candidate error (ignoring):", e);
                 }
              } else {
                  // Queue candidate if remote description not set
                  console.log("[WEBRTC] Queueing ICE candidate (no remote desc)");
                  pendingCandidates.current.push(new RTCIceCandidate(signal.candidate));
              }
          }
      } else if (signal.type === 'bye') {
          endCall(false);
      }
    }));
    
    // Listen for message errors (Moderation)
    cleanups.push(socketService.addListener('message:error', (data) => {
        if (data.mutedUntil) {
            setIsMuted(true);
            setMutedUntil(data.mutedUntil);
            alert(language === 'ru' ? 'Вы временно ограничены за спам.' : 'You are temporarily restricted due to spamming.');
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
        setOtpError(data.message);
        setIsVerifyingOtp(false);
    }));

    // AI Voice Mode Helper (Refactored out)



    // Listen for report acknowledgment
    cleanups.push(socketService.addListener('report:acknowledged', () => {
        alert(language === 'ru' ? 'Ваша жалоба отправлена на рассмотрение.' : 'Your report has been sent for review.');
    }));

    // Listen for partner joining (Receiver side)
    cleanups.push(socketService.onPartnerJoined((data) => {
        setIsWaitingForPartner(false);
        playNotificationSound('door'); 
        announceNotification(language === 'ru' ? 'Собеседник вошел в чат' : 'Partner has joined the chat');
        setView('chat');
    }));

    // Listen for knock accepted (Sender side)
    cleanups.push(socketService.onKnockAccepted((data) => {
        setKnockAcceptedData({
            sessionId: data.sessionId,
            partnerProfile: data.partnerProfile
        });
        
        // REVERTED AUTO-JOIN: User requested manual confirmation to prevent desync
        // socketService.joinSession(data.sessionId);

        playNotificationSound('knock'); // Success sound
        announceNotification(language === 'ru' 
            ? `Стук принят! ${data.partnerProfile.name} ждет вас.` 
            : `Knock accepted! ${data.partnerProfile.name} is waiting for you.`);
    }));

    // Listen for incoming knock (Receiver side) - OVERRIDE existing listener
    cleanups.push(socketService.onKnockReceived((data) => {
        console.log("Knock received:", data);
        setIncomingKnock({
            knockId: data.knockId,
            fromUser: data.fromUser
        });
        playNotificationSound('knock');
        announceNotification(language === 'ru'
            ? `Вам стучится ${data.fromUser.name}`
            : `New knock from ${data.fromUser.name}`);
    }));    return () => {
      // Cleanup all event listeners (NOT disconnect!)
      cleanups.forEach(cleanup => cleanup());
    };
  }, [currentUser.id, activeSession, currentUser.chatSettings]); // Added chatSettings dependency

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
          
          // AUTO-RESUME: Keep this for reconnection recovery
          const latestSession = data.activeSessions[data.activeSessions.length - 1];
          if (latestSession) {
              console.log("[SESSION] Auto-resuming latest session:", latestSession.sessionId);
              setActiveSession(latestSession);
              setView('chat'); 
          }
        }
      });
    }
  }, [currentUser.id, currentUser.name, currentUser.age, hasRegisteredWithServer]);

        {/* Knock Accepted Banner - FIXED POSITION & Z-INDEX */}
        {knockAcceptedData && (
            <div className="fixed top-20 left-4 right-4 z-[9999] bg-green-500/20 border border-green-500/50 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.5)] animate-in zoom-in-95 duration-300 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-green-400 p-1">
                    <img src={knockAcceptedData.partnerProfile.avatar} className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-1">{language === 'ru' ? 'Стук принят!' : 'Knock Accepted!'}</h4>
                    <p className="text-sm text-green-200 font-bold">{knockAcceptedData.partnerProfile.name} {language === 'ru' ? 'ждет вас' : 'is waiting for you'}</p>
                </div>
                <button 
                    onClick={() => {
                        console.log("🖱️ User clicked JOIN SESSION");
                        socketService.joinSession(knockAcceptedData.sessionId);
                        setKnockAcceptedData(null);
                    }}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest rounded-xl text-sm shadow-xl hover:shadow-green-500/40 transition-all transform hover:scale-105 active:scale-95"
                >
                    {language === 'ru' ? 'Начать чат' : 'Start Chat'}
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
          setRegVoiceIntro(reader.result as string);
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
      const prompts = language === 'ru' ? SMART_PROMPTS.ru : SMART_PROMPTS.en;
      const cats = Object.values(prompts).flat();
      setActivePrompt(cats[Math.floor(Math.random() * cats.length)]);
    } catch (err) { alert('Microphone error'); }
  };

  const stopIntroRecording = () => {
    if (mediaRecorderIntroRef.current?.state !== 'inactive') mediaRecorderIntroRef.current?.stop();
    setIsRecordingIntro(false);
    if (introTimerRef.current) clearInterval(introTimerRef.current);
  };

  const handleSentImageClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const stylized = await stylizeAvatar(file);
      // In chat, we send stylized images for consistency with the privacy brief
      if (activeSession) {
        socketService.sendMessage(activeSession.sessionId, stylized, 'image');
      }
    }
  };

  const handleDeleteAccount = () => {
    // Show premium hint instead of browser alert
    if (deleteHintTimeoutRef.current) clearTimeout(deleteHintTimeoutRef.current);
    setShowDeleteHint(true);
    deleteHintTimeoutRef.current = setTimeout(() => setShowDeleteHint(false), 4000);

    // If already requested, don't do server call
    if (currentUser.deletionRequestedAt && deletionDaysRemaining) {
        return;
    }

    // Proceed with server call immediately (UI hint already shown above)
    socketService.requestDeletion((data) => {
      if (data.success) {
          const updatedUser = { 
              ...currentUser, 
              deletionRequestedAt: data.deletionRequestedAt 
          };
          onUpdateCurrentUser(updatedUser);
          localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));
      }
    });
  };

  const handleRegistrationComplete = () => {
    // 1. Mandatory Fields Validation
    if (!regName.trim()) {
      alert(language === 'ru' ? '❌ Пожалуйста, введите ваше имя или псевдоним.' : '❌ Please enter your name or alias.');
      return;
    }
    
    if (!regAge) {
      alert(language === 'ru' ? '❌ Пожалуйста, укажите ваш возраст.' : '❌ Please specify your age.');
      return;
    }

    if (!regGender) {
      alert(language === 'ru' ? '❌ Пожалуйста, выберите ваш пол.' : '❌ Please select your gender.');
      return;
    }

    if (!regAvatar && !currentUser.avatar) {
      alert(language === 'ru' 
        ? '❌ Пожалуйста, загрузите фотографию профиля.\n\nНажмите на иконку камеры, чтобы выбрать фото.' 
        : '❌ Please upload a profile photo.\n\nClick the camera icon to select a photo.');
      return;
    }

    // NEW: Voice intro validation (mandatory)
    if (!regVoiceIntro) {
      alert(language === 'ru' 
        ? '❌ Пожалуйста, запишите голосовое приветствие.\n\nНажмите на кнопку микрофона и представьтесь (до 7 секунд).' 
        : '❌ Please record a voice introduction.\n\nClick the microphone button and introduce yourself (up to 7 seconds).');
      return;
    }

    // NEW: Status validation (mandatory)
    if (!regIntentStatus) {
      alert(language === 'ru' 
        ? '❌ Пожалуйста, выберите ваш статус.' 
        : '❌ Please select your status.');
      return;
    }

    // 2. Pre-save Confirmation
    const confirmMessage = language === 'ru' 
        ? "✅ Все поля заполнены!\n\nПроверьте свои данные - после регистрации изменения недоступны до истечения 30 дней.\n\nСохранить профиль?" 
        : "✅ All fields completed!\n\nCheck your details - core changes will be locked for 30 days after saving.\n\nProceed?";
    
    if (!window.confirm(confirmMessage)) {
        return;
    }

    const updatedUser: UserProfile = { 
      ...currentUser, 
      name: regName.trim() || (language === 'ru' ? 'Гость' : 'Guest'), 
      avatar: regAvatar,
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
      
      // Location Data
      country: detectedLocation?.country || currentUser.country || (language === 'ru' ? 'Неизвестно' : 'Unknown'),
      detectedCountry: detectedLocation?.country || currentUser.detectedCountry,
      detectedCity: detectedLocation?.city || currentUser.detectedCity,
      detectedIP: detectedLocation?.ip || currentUser.detectedIP,

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
            if (user.id === currentUser.id) return false;
            
            // Apply active filters
            if (searchAgeFrom !== 'Any' && user.age && user.age < parseInt(searchAgeFrom)) return false;
            if (searchAgeTo !== 'Any' && user.age && user.age > parseInt(searchAgeTo)) return false;
            
            // Gender
            if (searchGender !== 'any' && user.gender !== searchGender) return false;
            
            // Name search (if active) - logic duplicated from server but good for optimistic UI
            const nameSearch = (document.getElementById('search-input') as HTMLInputElement)?.value;
            if (nameSearch && !user.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;

            // Ensure sufficient profile
            return user.name && user.age && user.avatar;
         });
         
         // Sort: Online first (handled by server usually, but ensure here)
         // Server 'presence:list' sends status='online' if active
         
         setSearchResults(filtered);
     });
     
     return cleanup;
  }, [searchAgeFrom, searchAgeTo, searchGender, currentUser.id]);

  const handleAvatarSetup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stylizeAvatar(file).then(setRegAvatar);
  };

  const handleSearch = () => {
    const filters: any = {};
    if (searchAgeFrom !== 'Any') filters.minAge = parseInt(searchAgeFrom);
    if (searchAgeTo !== 'Any') filters.maxAge = parseInt(searchAgeTo);
    if (searchGender !== 'any') filters.gender = searchGender;
    
    socketService.searchUsers(filters, (results) => {
      setSearchResults(results);
    });
  };

  const handleKnock = (targetUser: UserProfile) => {
    // Auth Check: Block if user is not authenticated
    // Auth Check: Block if user is not authenticated
    if (!currentUser.isAuthenticated) {
       console.log("[Knock] User not authenticated, triggering login modal");
       if (onRequireLogin) {
         onRequireLogin();
       } else {
         alert(language === 'ru' ? 'Пожалуйста, войдите в систему' : 'Please login first');
       }
       return;
    }
    
    // Continue with normal knock flow
    setSentKnocks(prev => new Set(prev).add(targetUser.id));
    socketService.sendKnock(targetUser.id, () => {
      console.log(`✅ Knock sent to ${targetUser.name}`);
    });
  };

  const handleAcceptKnock = (knock: any) => {
    socketService.acceptKnock(knock.knockId, knock.fromUserId);
    setPendingKnocks(prev => prev.filter(k => k.knockId !== knock.knockId));
  };

  const handleRejectKnock = (knock: any) => {
    socketService.rejectKnock(knock.knockId, knock.fromUserId);
    setPendingKnocks(prev => prev.filter(k => k.knockId !== knock.knockId));
  };
  
  const handleBlockUser = (userId: string) => {
    if (!window.confirm(language === 'ru' ? 'Заблокировать пользователя?' : 'Block this user?')) return;
    
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
    const reasons = language === 'ru' 
        ? ['Спам', 'Угрозы', 'Непристойный контент', 'Другое']
        : ['Spam', 'Threats', 'Inappropriate Content', 'Other'];
    
    const reasonIndex = window.prompt(
        (language === 'ru' ? 'Выберите причину жалобы:\n' : 'Select a reason for the report:\n') +
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
        'text'
    );
    
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    
    if (file.size > 5 * 1024 * 1024) { // Increased to 5MB for better user experience
      alert(language === 'ru' ? 'Фото не больше 5 МБ' : 'Photo must be under 5MB');
      return;
    }
    
    try {
      setIsFileUploading(true);
      // FIX: Use simple compression for chat, NOT stylizeAvatar (filters)
      const compressedBase64 = await processChatImage(file);
      
      const encrypted = encryptionService.encryptBinary(compressedBase64, activeSession.sessionId);
      
      socketService.sendMessage(
        activeSession.sessionId,
        encrypted,
        'image'
      );
      
      // Clear inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error("Image compression failed", error);
    } finally {
      setIsFileUploading(false);
    }
    
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

  // --- WebRTC Logic ---
  // --- WebRTC Logic (Minimal Skeleton) ---
  const createPeerConnection = (partnerId: string) => {
      console.log("🔗 Creating PeerConnection...");
      const pc = new RTCPeerConnection({
          iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
          ]
      });
      
      pc.onicecandidate = (event) => {
          if (event.candidate) {
              console.log("❄️ ICE candidate generated");
              socketService.sendSignal(partnerId, { candidate: event.candidate });
          }
      };
      
      pc.ontrack = (event) => {
          console.log(`📥 Remote track received: ${event.track.kind}`);
          
          let stream = event.streams[0];
          if (!stream) {
              console.log("⚠️ No stream in ontrack, creating one from tracks");
              stream = new MediaStream([event.track]);
          }
          
          setRemoteStream(stream);
          
          const audioEl = document.getElementById('remote-audio') as HTMLAudioElement;
          if (audioEl) {
              console.log("[WEBRTC] Attaching stream to remote-audio element");
              audioEl.srcObject = stream;
              audioEl.muted = false;
              audioEl.volume = 1.0;
              
              const playPromise = audioEl.play();
              if (playPromise !== undefined) {
                  playPromise
                      .then(() => console.log("🔊 Remote audio playback started successfully"))
                      .catch(e => {
                          console.error("❌ Remote audio playback failed (interaction required?):", e);
                          // We usually show the overlay button in this case
                      });
              }
          } else {
              console.error("❌ Could not find remote-audio element in DOM");
          }
      };
      
      pc.onconnectionstatechange = () => {
          console.log(`🔄 Connection state: ${pc.connectionState}`);
          if (pc.connectionState === 'connected') {
              setCallStatus('connected');
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              console.error("[WEBRTC] Connection failed or closed");
          }
      };
      
      pc.oniceconnectionstatechange = () => console.log(`❄️ ICE Connection state: ${pc.iceConnectionState}`);
      
      return pc;
  };

  const initiateCall = async () => {
      if (!callPartner) {
          console.error("[CALL] Cannot initiate call - no call partner set");
          return;
      }
      
      console.log(`[CALL] 🔵 Initiating call to ${callPartner.name} (${callPartner.id})`);
      console.log(`[CALL] Browser: ${navigator.userAgent}`);
      console.log(`[CALL] MediaDevices available: ${!!navigator.mediaDevices}`);
      
      try {
          // Request microphone access with timeout
          setIsMicPreparing(true);
          console.log("[CALL] 🎤 Requesting microphone access...");
          
          const getUserMediaWithTimeout = (constraints: MediaStreamConstraints, timeout = 10000) => {
              return Promise.race([
                  navigator.mediaDevices.getUserMedia(constraints),
                  new Promise<MediaStream>((_, reject) => 
                      setTimeout(() => reject(new Error('getUserMedia timeout - user may have denied permission or device is unavailable')), timeout)
                  )
              ]);
          };
          
          const stream = await getUserMediaWithTimeout({ audio: true });
          setIsMicPreparing(false);
          console.log("[CALL] ✅ getUserMedia success - Audio tracks:", stream.getAudioTracks().length);
          stream.getAudioTracks().forEach((track, idx) => {
              console.log(`[CALL]   Track ${idx}: ${track.label} (enabled: ${track.enabled}, muted: ${track.muted})`);
          });
          
          setLocalStream(stream);
          localStreamRef.current = stream;
          setCallStatus('calling');
          
          console.log("[CALL] 🔗 Creating peer connection...");
          const pc = createPeerConnection(callPartner.id);
          peerConnectionRef.current = pc;
          
          stream.getTracks().forEach((track, idx) => {
              console.log(`[CALL] 📡 Adding local track ${idx} to peer connection`);
              pc.addTrack(track, stream);
          });

          console.log("[CALL] 📝 Creating offer...");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log("[CALL] ✅ Local description set");
          console.log("[CALL] 📤 Sending offer to", callPartner.id);
          
          socketService.sendSignal(callPartner.id, { type: 'offer', sdp: offer.sdp });
          console.log("[CALL] ✅ Offer sent successfully");
      } catch (err: any) {
          console.error("[CALL] ❌ Call initiation failed:", err);
          console.error("[CALL] Error name:", err.name);
          console.error("[CALL] Error message:", err.message);
          console.error("[CALL] Error stack:", err.stack);
          
          let userMessage = "Failed to start call. ";
          if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
              userMessage += "Microphone permission was denied. Please allow microphone access and try again.";
          } else if (err.name === 'NotFoundError') {
              userMessage += "No microphone found. Please connect a microphone and try again.";
          } else if (err.message?.includes('timeout')) {
              userMessage += "Request timed out. Please check your microphone permissions and try again.";
          } else {
              userMessage += err.message || "Unknown error occurred.";
          }
          
          alert(userMessage);
          setIsMicPreparing(false);
          setCallStatus('idle');
          setCallPartner(null);
      }
  };

  const acceptCall = async () => {
      if (!callPartner) {
          console.error("[CALL] Cannot accept call - no call partner set");
          return;
      }
      if (!peerConnectionRef.current) {
          console.error("[CALL] Cannot accept call - no peer connection exists");
          return;
      }
      
      console.log(`[CALL] 🟢 Accepting call from ${callPartner.name} (${callPartner.id})`);
      console.log(`[CALL] Browser: ${navigator.userAgent}`);
      
      try {
          setIsMicPreparing(true);
          console.log("[CALL] 🎤 Requesting microphone access for answer...");
          
          const getUserMediaWithTimeout = (constraints: MediaStreamConstraints, timeout = 10000) => {
              return Promise.race([
                  navigator.mediaDevices.getUserMedia(constraints),
                  new Promise<MediaStream>((_, reject) => 
                      setTimeout(() => reject(new Error('getUserMedia timeout - user may have denied permission or device is unavailable')), timeout)
                  )
              ]);
          };
          
          const stream = await getUserMediaWithTimeout({ audio: true });
          setIsMicPreparing(false);
          console.log("[CALL] ✅ getUserMedia success (answer) - Audio tracks:", stream.getAudioTracks().length);
          stream.getAudioTracks().forEach((track, idx) => {
              console.log(`[CALL]   Track ${idx}: ${track.label} (enabled: ${track.enabled}, muted: ${track.muted})`);
          });
          
          setLocalStream(stream);
          localStreamRef.current = stream;
          
          const pc = peerConnectionRef.current;
          stream.getTracks().forEach((track, idx) => {
              console.log(`[CALL] 📡 Adding local track ${idx} to peer connection (answer)`);
              pc.addTrack(track, stream);
          });
          
          console.log("[CALL] 📝 Creating answer...");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("[CALL] ✅ Local description set (answer)");
          console.log("[CALL] 📤 Sending answer to", callPartner.id);
          
          socketService.sendSignal(callPartner.id, { type: 'answer', sdp: answer.sdp });
          console.log("[CALL] ✅ Answer sent successfully");
          setCallStatus('connected');
      } catch (err: any) {
          console.error("[CALL] ❌ Call acceptance failed:", err);
          console.error("[CALL] Error name:", err.name);
          console.error("[CALL] Error message:", err.message);
          console.error("[CALL] Error stack:", err.stack);
          
          let userMessage = "Failed to accept call. ";
          if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
              userMessage += "Microphone permission was denied. Please allow microphone access and try again.";
          } else if (err.name === 'NotFoundError') {
              userMessage += "No microphone found. Please connect a microphone and try again.";
          } else if (err.message?.includes('timeout')) {
              userMessage += "Request timed out. Please check your microphone permissions and try again.";
          } else {
              userMessage += err.message || "Unknown error occurred.";
          }
          
          alert(userMessage);
          setIsMicPreparing(false);
          endCall(true);
      }
  };
  
  const endCall = (notify = true) => {
      console.log("[CALL] Ending call");
      if (notify && callPartner) {
          socketService.sendSignal(callPartner.id, { type: 'bye' });
      }
      
      if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
      }
      
      if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
      }
      
      setLocalStream(null);
      setRemoteStream(null);
      setCallStatus('idle');
      setCallPartner(null);
  };

  // --- End WebRTC ---


  const getPartnerFromSession = (session: any) => onlineUsers.find(u => u.id === session.partnerId) || session.partnerProfile;

  if (!isOpen) return null;
  const partnerDetails = activeSession ? getPartnerFromSession(activeSession) : null;

  return (
    <aside className="w-full md:w-[420px] flex flex-col glass-panel border-l border-[var(--panel-border)] shadow-2xl animate-in slide-in-from-right duration-500 bg-[var(--panel-bg)] z-[60] h-full fixed right-0 top-0 bottom-0">
        <header className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-transparent shrink-0 relative z-50">
            {view === 'chat' && partnerDetails ? (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => { setView('inbox'); setActiveSession(null); }} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"><ArrowLeftIcon className="w-5 h-5" /></button>
                        <img src={partnerDetails.avatar} className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 object-cover" />
                         <div className="min-w-0 flex-1"><h3 className="font-bold text-sm text-white truncate leading-tight">{partnerDetails.name}</h3><p className="text-[10px] text-green-500 font-bold uppercase tracking-widest leading-tight">{t.online}</p></div>
                    </div>
                    


                    <div className="flex items-center gap-1">
                        <button onClick={() => handleReportUser(partnerDetails.id)} className="p-2.5 text-slate-400 hover:text-orange-500 transition-colors hover:bg-white/5 rounded-full" title={language === 'ru' ? 'Пожаловаться' : 'Report'}><LifeBuoyIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleBlockUser(partnerDetails.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-white/5 rounded-full" title={language === 'ru' ? 'Заблокировать' : 'Block'}><NoSymbolIcon className="w-5 h-5" /></button>
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
                                title={language === 'ru' ? (voiceModeEnabled ? 'Выключить живую озвучку' : 'Включить живую озвучку') : (voiceModeEnabled ? 'Disable Live Voice' : 'Enable Live Voice')}
                            >
                                <SpeakIcon className={`w-5 h-5 ${voiceModeEnabled ? 'animate-pulse' : ''}`} />
                            </button>
                            {voiceModeEnabled && (
                                <button 
                                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                                    className={`p-2.5 transition-all rounded-full ${showVoiceSettings ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                                    title="Voice Settings"
                                >
                                    <VolumeIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {/* <button onClick={() => {
                          if (partnerDetails) {
                            setCallPartner(partnerDetails);
                            setTimeout(() => initiateCall(), 0);
                          }
                        }} className="p-2.5 text-slate-300 hover:text-primary transition-colors hover:bg-white/5 rounded-full" title={language === 'ru' ? 'Голосовой звонок' : 'Voice Call'}><PhoneIcon className="w-5 h-5" /></button>
                        <button disabled className="p-2.5 text-slate-500 cursor-not-allowed opacity-50 rounded-full" title={language === 'ru' ? 'Видео скоро' : 'Video coming soon'}><VideoCameraIcon className="w-5 h-5" /></button> */}
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
                                    title={language === 'ru' ? 'Профиль' : 'Profile'}
                                >
                                    <UserIcon className="w-5 h-5" />
                                </button>
                                {currentUser.blockedUsers?.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            if (window.confirm(language === 'ru' ? 'Разблокировать всех?' : 'Unblock all users?')) {
                                                const updatedUser = { ...currentUser, blockedUsers: [] };
                                                onUpdateCurrentUser(updatedUser);
                                                localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));
                                            }
                                        }}
                                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                                        title={language === 'ru' ? 'Разблокировать' : 'Unblock'}
                                    >
                                        <NoSymbolIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setView('inbox')} 
                                    className={`p-2 rounded-xl transition-all duration-300 ${view === 'inbox' ? 'bg-primary text-white shadow-[0_0_15px_rgba(188,111,241,0.4)]' : 'text-slate-500 hover:text-slate-200'}`}
                                    title={language === 'ru' ? 'Диалоги' : 'Dialogs'}
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
                                    title={language === 'ru' ? 'Поиск' : 'Search'}
                                >
                                    <UsersIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-col ml-1 block">
                            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                                {view === 'search' ? (
                                    <>
                                        {language === 'ru' ? 'Вокруг Света' : 'Around World'}
                                        <GlobeIcon className="w-5 h-5 text-primary/80 animate-[spin_10s_linear_infinite]" />
                                    </>
                                ) : (view === 'inbox' ? (language === 'ru' ? 'Диалоги' : 'Inbox') : '')}
                            </h2>
                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    {onlineStats.chatOnline} {language === 'ru' ? 'онлайн' : 'online'}
                                </span>
                        </div>
                    </div>
                        <div className="flex items-center gap-2 relative">
                             {/* Help/Demo Menu Button */}
                            <button 
                                onClick={() => setShowDemoMenu(!showDemoMenu)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showDemoMenu ? 'bg-primary text-black' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
                                title={language === 'ru' ? 'Помощь и демо' : 'Help & Demos'}
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
                                                <div className="text-xs font-bold text-white leading-tight">{language === 'ru' ? 'Сценарий Чата' : 'Chat Scenario'}</div>
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
                                                <div className="text-xs font-bold text-white leading-tight">{language === 'ru' ? 'Регистрация' : 'Registration'}</div>
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
                                                <div className="text-xs font-bold text-white leading-tight">{language === 'ru' ? 'Событие' : 'Interaction'}</div>
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
                        <SpeakIcon className="w-4 h-4" /> {language === 'ru' ? 'Настройки Голоса' : 'Voice Settings'}
                    </h3>
                    <button onClick={() => setShowVoiceSettings(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-4">
                    {/* Gender Selection */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{language === 'ru' ? 'Тон Голоса' : 'Voice Tone'}</label>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'auto' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'auto' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                🤖 {language === 'ru' ? 'Авто' : 'Auto'}
                            </button>
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'male' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'male' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                👨 {language === 'ru' ? 'Мужской' : 'Male'}
                            </button>
                            <button 
                                onClick={() => setVoiceSettings(p => ({ ...p, gender: 'female' }))}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${voiceSettings.gender === 'female' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                👩 {language === 'ru' ? 'Женский' : 'Female'}
                            </button>
                        </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <div className="flex justify-between mb-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ru' ? 'Скорость' : 'Speed'}</label>
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
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ru' ? 'Высота' : 'Pitch'}</label>
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
                        onClick={() => speakMessage(language === 'ru' ? 'Проверка голосового движка' : 'Voice engine test', 'any')}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                    >
                        {language === 'ru' ? '▶ Прослушать' : '▶ Preview Voice'}
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
                            {language === 'ru' 
                                ? `Новое приглашение от ${pendingKnocks[pendingKnocks.length - 1]?.fromUser?.name || 'пользователя'}` 
                                : `New invite from ${pendingKnocks[pendingKnocks.length - 1]?.fromUser?.name || 'User'}`}
                        </span>
                    </div>
                    <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">
                        {language === 'ru' ? 'ОТКРЫТЬ' : 'OPEN'}
                    </div>
                </button>
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
                                <img src={notificationToast.avatar} className="w-10 h-10 rounded-full border border-white/10" />
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





            

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl overflow-hidden">
                        <button 
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">
                                {language === 'ru' ? 'Выберите аватар' : 'Choose Avatar'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {language === 'ru' ? 'Загрузите свое фото или выберите готовый вариант' : 'Upload your photo or select a preset'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Option 1: Upload Photo */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-primary/30 transition-colors group">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform">
                                    <CameraIcon className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="font-bold text-white text-sm mb-1">{language === 'ru' ? 'Загрузить фото' : 'Upload Photo'}</h4>
                                <p className="text-[10px] text-slate-400 text-center mb-4 leading-tight">
                                    {language === 'ru' ? 'Будет применен мультяшный стиль' : 'Cartoon style will be applied'}
                                </p>
                                <button 
                                    onClick={() => {
                                        alert(language === 'ru' 
                                            ? 'Ваше фото будет с фильтром "Стилизация" для приватности!' 
                                            : 'Your photo will be stylized for privacy!');
                                        fileInputRef.current?.click();
                                    }}
                                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors"
                                >
                                    {language === 'ru' ? 'Выбрать файл' : 'Select File'}
                                </button>
                            </div>

                            {/* Option 2: Presets */}
                            <div className="flex flex-col">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
                                    {language === 'ru' ? 'Готовые варианты' : 'Presets'}
                                </h4>
                                <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {PRESET_AVATARS.map((avatar, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setRegAvatar(avatar);
                                                setShowAvatarModal(false);
                                            }}
                                            className="aspect-square rounded-2xl overflow-hidden border-2 border-white/10 hover:border-primary hover:scale-105 transition-all relative group shadow-lg"
                                        >
                                            <img src={avatar} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'register' && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex justify-center mb-4 shrink-0">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-widest mb-2">{language === 'ru' ? 'Ваш профиль' : 'Your Profile'}</h3>
                            <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                                {language === 'ru' 
                                    ? 'Эта информация помогает подбирать собеседников. Сообщения и данные удаляются автоматически.' 
                                    : 'This info helps find better matches. Messages and data are automatically deleted.'}
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
                                        <img src={regAvatar} className="w-full h-full object-cover" />
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
                                        <CameraIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={(e) => {
                                        handleAvatarSetup(e);
                                        setShowAvatarModal(false); // Close modal after selection
                                    }} 
                                    className="hidden" 
                                    accept="image/*" 
                                />
                            </div>
                        </div>

                        {/* Location (Soft Info) */}
                        <div className="flex justify-center">
                            <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5">
                                <span className="text-sm">📍</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {language === 'ru' ? 'Авто-определение: ' : 'Auto-detected: '} 
                                    <span className="text-slate-200 font-bold">{detectedCountry || 'Unknown'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{language === 'ru' ? 'ВАШЕ ИМЯ (ПСЕВДОНИМ)' : 'YOUR NAME (ALIAS)'}</label>
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
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{language === 'ru' ? 'ПОЛ' : 'GENDER'}</label>
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
                                                {language === 'ru' ? (g === 'male' ? 'М' : 'Ж') : g.toUpperCase().substring(0, 1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{language === 'ru' ? 'ВОЗРАСТ' : 'AGE'}</label>
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
                                    {language === 'ru' ? 'ГОЛОСОВОЕ ПРИВЕТСТВИЕ' : 'VOICE INTRO'}
                                </h4>
                                <p className="text-[9px] text-slate-400 truncate">
                                    {isRecordingIntro 
                                        ? `Recording... 0:0${introRecordingTime} / 0:07` 
                                        : (regVoiceIntro ? (language === 'ru' ? '✅ Приветствие записано' : '✅ Intro recorded') : (language === 'ru' ? 'Главный «крючок» для общения' : 'Your main hook for chats'))}
                                </p>
                            </div>
                            {regVoiceIntro && !isRecordingIntro && (
                                <button onClick={() => new Audio(regVoiceIntro).play()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                    <PlayIcon className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Settings Collapsible */}
                        <details className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <AdjustmentsIcon className="w-4 h-4" /> {language === 'ru' ? 'НАСТРОЙКИ' : 'SETTINGS'}
                                </span>
                                <ChevronDownIcon className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300">{language === 'ru' ? 'Звуки' : 'Sounds'}</span>
                                        <button onClick={() => setRegNotificationsEnabled(!regNotificationsEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${regNotificationsEnabled ? 'bg-secondary' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${regNotificationsEnabled ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-300">{language === 'ru' ? 'Баннеры' : 'Banners'}</span>
                                            <span className="text-[9px] text-slate-500">{language === 'ru' ? 'В фоне' : 'Background'}</span>
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
                                            <span className="text-xs font-bold text-slate-300">{language === 'ru' ? 'Голос' : 'Voice Alert'}</span>
                                            <span className="text-[9px] text-slate-500">{language === 'ru' ? 'Озвучка' : 'Announce'}</span>
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
                                                👩 {language === 'ru' ? 'Жен' : 'Fem'}
                                            </button>
                                            <button 
                                                onClick={() => setRegNotifVoice('male')}
                                                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md transition-colors ${regNotifVoice === 'male' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                👨 {language === 'ru' ? 'Муж' : 'Male'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ru' ? 'Громкость' : 'Volume'}</span><span className="text-[10px] text-secondary">{Math.round(regNotificationVolume * 100)}%</span></div>
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
                            {language === 'ru' ? (isProfileLocked ? 'ОБНОВИТЬ (ЧАСТИЧНО)' : 'ГОТОВО / ПРОДОЛЖИТЬ') : (isProfileLocked ? 'UPDATE (PARTIAL)' : 'CONTINUE')}
                        </button>

                         {/* Deletion / Logout Area - Subtle */}
                        {currentUser.id && (
                             <div className="flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <p className="text-[9px] text-center text-slate-500">
                                    {language === 'ru' 
                                        ? 'Данные хранятся только в этом браузере пока вы не удалите их.'
                                        : 'Data is stored only in this browser until you delete it.'}
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="text-[9px] font-bold text-red-400/50 hover:text-red-400 uppercase tracking-widest text-center transition-colors"
                                >
                                    {currentUser.deletionRequestedAt 
                                        ? (language === 'ru' ? 'ОТМЕНИТЬ УДАЛЕНИЕ' : 'CANCEL DELETION')
                                        : (language === 'ru' ? 'УДАЛИТЬ АККАУНТ' : 'DELETE ACCOUNT')}
                                </button>
                                
                                {/* Hard Reset / Fix */}
                                <button
                                    onClick={() => {
                                        if (window.confirm(language === 'ru' ? 'Сбросить профиль локально? (Исправляет ошибки отображения)' : 'Reset local profile? (Fixes display errors)')) {
                                            localStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                    className="text-[9px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest mt-4 opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    {language === 'ru' ? 'СБРОС ДАННЫХ' : 'RESET DATA'}
                                </button>
                             </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'search' && (
                (currentUser.age && parseInt(currentUser.age.toString()) < 18) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                            <span className="text-4xl">🔞</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {language === 'ru' ? 'Доступ ограничен' : 'Access Restricted'}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                            {language === 'ru' 
                                ? 'К сожалению, функции поиска и общения доступны только для пользователей старше 18 лет. Вы можете продолжить слушать радио.' 
                                : 'Unfortunately, search and chat features are restricted to users 18+. You can continue listening to the radio.'}
                        </p>
                    </div>
                ) : (
                <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                    <div className="p-6 overflow-y-auto no-scrollbar pb-20">
                            <div className="flex flex-col items-center gap-1 mb-6">
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full animate-in fade-in zoom-in duration-500">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                                        {language === 'ru' ? `Сейчас онлайн: ~${onlineStats.totalOnline + 42}` : `Online now: ~${onlineStats.totalOnline + 42}`}
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-white text-center leading-tight mt-2">
                                    {language === 'ru' ? 'Найди собеседника прямо сейчас' : 'Find someone right now'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                                    {language === 'ru' ? 'Без истории. Без обязательств. 18+' : 'No history. No strings attached. 18+'}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <button 
                                    onClick={() => handleSearch()}
                                    className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-600/30 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <img src="https://em-content.zobj.net/source/microsoft-teams/363/game-die_1f3b2.png" className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <p className="text-xl mb-1">🎲</p>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">{language === 'ru' ? 'Случайный' : 'Random'}</p>
                                    <p className="text-[9px] text-slate-400 leading-tight">{language === 'ru' ? 'Диалог с кем угодно' : 'Chat with anyone'}</p>
                                </button>
                                <button 
                                    onClick={() => handleSearch()}
                                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-600/30 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <img src="https://em-content.zobj.net/source/microsoft-teams/363/fire_1f525.png" className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <p className="text-xl mb-1">🔥</p>
                                    <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-0.5">{language === 'ru' ? 'Кто онлайн' : 'Online Now'}</p>
                                    <p className="text-[9px] text-slate-400 leading-tight">{language === 'ru' ? 'Только активные' : 'Active users only'}</p>
                                </button>
                            </div>

                            {/* Refined Filters (Visually Secondary) */}
                            <div className="space-y-4 mb-2 p-1">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ru' ? 'ИЛИ ПО ПАРАМЕТРАМ' : 'OR BY PARAMETERS'}</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                </div>

                                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block">{language === 'ru' ? 'Возраст' : 'Age'}</label>
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
                                                        className={`flex-1 rounded-lg text-[9px] font-black transition-all uppercase ${searchGender === g ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
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
                                        {language === 'ru' ? 'НАЧАТЬ ПОИСК' : 'START SEARCH'}
                                    </button>
                                    
                                    <p className="text-[9px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1 opacity-70">
                                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                        {language === 'ru' ? 'Сообщения удаляются автоматически' : 'Messages auto-deleted'}
                                    </p>
                                </div>
                            </div>
                        <div className="space-y-3">
                            {((searchResults?.length > 0 ? searchResults : onlineUsers) || []).map(user => (
                                <div key={user.id} className={`p-4 rounded-3xl flex flex-col gap-3 transition-all animate-in slide-in-from-bottom-2 duration-300 border ${user.status === 'online' ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-white/[0.02] border-white/[0.02] opacity-80'}`}>
                                    
                                    {/* Header: Identity & Status */}
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <img src={user.avatar || ''} className={`w-14 h-14 rounded-2xl object-cover bg-slate-800 shadow-xl ${user.status === 'offline' ? 'grayscale-[0.5]' : ''}`} />
                                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] ${user.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-500'}`}></div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[56px]">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h5 className="font-black text-sm text-white truncate">
                                                    {user.name}
                                                </h5>
                                                <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded-md font-bold">{user.age}</span>
                                                {user.country && (
                                                    <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-full">
                                                        <span className="text-[10px]">📍</span>
                                                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter max-w-[80px] truncate">{user.country}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 rounded-md text-[9px] font-black text-secondary uppercase tracking-tight">
                                                    {user.intentStatus || 'Свободен'}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-tight ${user.status === 'online' ? 'text-green-400' : 'text-slate-500'}`}>
                                                    {user.status === 'online' 
                                                        ? (language === 'ru' ? '● В СЕТИ' : '● ONLINE') 
                                                        : (language === 'ru' 
                                                            ? `Был(а): ${new Date(user.lastSeen || (user as any).last_login_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'})}`
                                                            : `Seen: ${new Date(user.lastSeen || (user as any).last_login_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'})}`
                                                        )
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row: Voice & Knock */}
                                    <div className="flex items-center gap-2 h-11">
                                        {user.voiceIntro ? (
                                            <button 
                                                onClick={() => {
                                                    const audio = new Audio(user.voiceIntro);
                                                    audio.play();
                                                }}
                                                className="flex-1 h-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 rounded-xl flex items-center px-3 gap-3 transition-all group"
                                            >
                                                <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                                    <PlayIcon className="w-3.5 h-3.5 text-white ml-0.5" />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest text-left mb-0.5">
                                                        {language === 'ru' ? 'ГОЛОС' : 'VOICE INTRO'}
                                                    </span>
                                                    <div className="flex gap-0.5 items-end h-2 w-full opacity-50">
                                                        <div className="w-0.5 bg-indigo-400 h-1.5 rounded-full animate-pulse"></div>
                                                        <div className="w-0.5 bg-indigo-400 h-full rounded-full animate-pulse delay-75"></div>
                                                        <div className="w-0.5 bg-indigo-400 h-1 rounded-full animate-pulse delay-150"></div>
                                                        <div className="w-0.5 bg-indigo-400 h-1.5 rounded-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="flex-1 h-full bg-white/5 rounded-xl flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase border border-white/5 italic">
                                                {language === 'ru' ? 'НЕТ ГОЛОСА' : 'NO VOICE'}
                                            </div>
                                        )}

                                        {user.id === currentUser.id ? (
                                            <div className="w-28 h-full bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[9px] font-black uppercase tracking-widest flex items-center justify-center">
                                                {language === 'ru' ? 'ЭТО ВЫ' : 'YOU'}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleKnock(user)} 
                                                disabled={sentKnocks.has(user.id)} 
                                                className={`w-32 h-full rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg ${sentKnocks.has(user.id) ? 'bg-green-500/20 text-green-500 cursor-default' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-95'}`}
                                            >
                                                {sentKnocks.has(user.id) ? (language === 'ru' ? 'ОТПРАВЛЕНО' : 'SENT') : (language === 'ru' ? 'ПОСТУЧАТЬСЯ' : 'KNOCK')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl relative rotate-3 group transition-transform hover:rotate-6">
                                    <span className="text-4xl filter drop-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500">💬</span>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 rounded-full animate-ping"></div>
                                </div>
                                
                                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                                    {language === 'ru' ? 'У вас пока нет активных диалогов' : 'No active chats yet'}
                                </h3>
                                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mb-8">
                                    {language === 'ru' 
                                        ? 'Здесь будут появляться ваши текущие разговоры. Начните прямо сейчас!' 
                                        : 'Your active conversations will appear here. Start one right now!'}
                                </p>

                                {/* Activity Badge */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                                        {language === 'ru' ? `~${onlineStats.totalOnline + 15} ищут собеседника` : `~${onlineStats.totalOnline + 15} searching now`}
                                    </span>
                                </div>

                                <div className="w-full space-y-3">
                                    <button 
                                        onClick={() => setView('search')}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group"
                                    >
                                        <SearchIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {language === 'ru' ? 'НАЙТИ СОБЕСЕДНИКА' : 'FIND SOMEONE'}
                                    </button>
                                    
                                    <button 
                                        onClick={() => setView('search')}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] flex items-center justify-center gap-2"
                                    >
                                        <span>🎲</span>
                                        {language === 'ru' ? 'МНЕ ПОВЕЗЕТ (СЛУЧАЙНЫЙ)' : 'I\'M FEELING LUCKY'}
                                    </button>
                                </div>

                                <p className="mt-8 text-[9px] text-slate-600 font-medium flex items-center justify-center gap-1.5 opacity-60">
                                    <ClockIcon className="w-3 h-3" />
                                    {language === 'ru' ? 'История не сохраняется' : 'History is not saved'}
                                </p>
                            </div>
                        )}
                        {Array.from(activeSessions.values()).map(session => {
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
                                                image: msg.messageType === 'image' && msg.encryptedPayload
                                                    ? encryptionService.decryptBinary(msg.encryptedPayload, session.sessionId)
                                                    : undefined,
                                                audioBase64: msg.messageType === 'audio' && msg.encryptedPayload
                                                    ? encryptionService.decryptBinary(msg.encryptedPayload, session.sessionId)
                                                    : undefined,
                                                flagged: msg.metadata?.flagged || false
                                            }));
                                            setMessages(decrypted);
                                        });
                                    }} 
                                    className="p-4 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-[1.5rem] flex items-center gap-4 cursor-pointer transition-all active:scale-98 bg-white/[0.02]"
                                >
                                    <div className="relative">
                                        <img src={partner?.avatar} className="w-14 h-14 rounded-2xl object-cover bg-slate-800" />
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${isPartnerOnline ? 'bg-green-500' : 'bg-slate-500'} border-2 border-[#1e293b] rounded-full`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-sm text-white truncate">{partner?.name}</h5>
                                        <p className={`text-xs truncate font-medium ${isPartnerOnline ? 'text-green-400' : 'text-slate-500'}`}>
                                            {isPartnerOnline ? (language === 'ru' ? 'Онлайн' : 'Online') : (language === 'ru' ? 'Был(а) в сети' : 'Was online')}
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
                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{language === 'ru' ? 'СОДЕРЖАНИЕ ФИЛЬТРУЕТСЯ' : 'CONTENT FILTERED'}</p>
                                            <button 
                                                onClick={() => setShowFlagged(prev => ({ ...prev, [msg.id]: true }))}
                                                className="text-[9px] font-bold underline text-white/60 hover:text-white"
                                            >
                                                {language === 'ru' ? 'Показать' : 'Show Anyway'}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                            {msg.image && <div className="relative"><img src={msg.image} className="rounded-xl max-w-full mt-1 object-cover" /></div>}
                                            {msg.audioBase64 && (
                                                <div className="flex items-center gap-3 py-1 min-w-[160px] pr-2">
                                                    <button onClick={() => new Audio(msg.audioBase64).play()} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors shrink-0"><PlayIcon className="w-4 h-4" /></button>
                                                    <div className="flex-1 flex flex-col justify-center gap-1"><div className="h-1 bg-white/30 w-full rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-white/60 w-1/3"></div></div><span className="text-[9px] uppercase font-bold opacity-70">0:05</span></div>
                                                </div>
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
                                alert(language === 'ru' ? 'Время сессии истекло!' : 'Session time expired!');
                                window.location.reload();
                            }} 
                        />
                    </div>
                )}
                {isRecording && (<div className="absolute inset-x-2 -top-16 h-14 bg-red-600/90 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 text-white animate-in slide-in-from-bottom border border-red-400/30 shadow-2xl z-50"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-white rounded-full animate-ping"></div><span className="font-bold text-xs uppercase tracking-widest">{recordingTime}s {t.recording}</span></div><button onPointerUp={stopRecording} className="text-[10px] font-black bg-white text-red-600 px-4 py-2 rounded-xl hover:scale-105 transition-transform shadow-lg">{t.send}</button></div>)}
                {showEmojiPicker && (<div className="absolute bottom-24 left-2 right-2 bg-[#1e293b] p-3 rounded-[2rem] h-64 overflow-y-auto no-scrollbar grid grid-cols-8 gap-1 border border-white/10 shadow-2xl z-50 animate-in slide-in-from-bottom-5">{EMOJIS.map(e => <button key={e} onClick={() => { setInputText(p => p + e); setShowEmojiPicker(false); }} className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors">{e}</button>)}</div>)}
                <div className="flex items-center gap-1.5 md:gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-2 md:p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90 shrink-0"
                    >
                        <PaperClipIcon className="w-5 h-5 md:w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 min-w-0 bg-white/5 border border-white/5 rounded-[1.5rem] flex items-center px-1.5 md:px-2 min-h-[46px] md:min-h-[50px] hover:bg-white/10 transition-all">
                        <input 
                            value={inputText} 
                            onChange={e => setInputText(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                            placeholder={language === 'ru' ? 'Сообщение...' : 'Message...'} 
                            className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 md:py-3 px-2 md:px-3 text-sm text-white placeholder:text-slate-500 font-medium" 
                        />
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                            className="p-1.5 md:p-2 text-slate-400 hover:text-yellow-400 transition-colors active:scale-90 shrink-0"
                        >
                            <FaceSmileIcon className="w-5 h-5 md:w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => cameraInputRef.current?.click()} 
                            className="p-1.5 md:p-2 text-slate-400 hover:text-white transition-colors active:scale-90 shrink-0"
                        >
                            <CameraIcon className="w-5 h-5 md:w-6 h-6" />
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
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} /><input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                
                {isFileUploading && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                {language === 'ru' ? 'Отправка...' : 'Sending...'}
                            </span>
                        </div>
                    </div>
                )}
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

        {/* CALL OVERLAY */}
         {(callStatus !== 'idle' || isMicPreparing) && callPartner && (
            <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
                
                {/* Remote Video (Full Screen) */}
                <video 
                    id="remote-video"
                    autoPlay 
                    playsInline 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`}
                />
                
                {/* Local Video (PIP) */}
                {localStream && (
                    <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                        <video 
                            ref={v => { if(v) v.srcObject = localStream }}
                            autoPlay 
                            playsInline 
                            muted // Always mute local video to prevent echo
                            className="w-full h-full object-cover mirror-mode" 
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>
                )}

                <div className="relative z-10 flex flex-col items-center">
                    {(callStatus !== 'connected' || isMicPreparing) && (
                        <div className="mb-8 relative">
                            <img src={callPartner.avatar} className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-2xl animate-pulse" />
                            <div className="absolute -bottom-2 -right-2 bg-black/50 px-3 py-1 rounded-full text-[10px] font-mono text-white/70 backdrop-blur-md">
                                {isMicPreparing ? (language === 'ru' ? 'Запрос микрофона...' : 'Requesting Mic...') : 
                                 (callStatus === 'calling' ? (language === 'ru' ? 'Вызов...' : 'Calling...') : 
                                  (callStatus === 'ringing' ? (language === 'ru' ? 'Входящий звонок...' : 'Ringing...') : ''))}
                            </div>
                        </div>
                    )}
                    
                    <h2 className={`text-2xl font-bold text-white mb-2 text-shadow ${callStatus === 'connected' ? 'opacity-0 hover:opacity-100 transition-opacity' : ''}`}>{callPartner.name}</h2>
                    
                    <div id="call-debug" className="text-[10px] items-center text-white/50 font-mono mb-4 bg-black/40 px-2 py-1 rounded hidden md:block backdrop-blur-md">
                        {isMicPreparing ? 'Media access...' : (callStatus === 'connected' ? 'Connected' : 'Handshaking...')}
                    </div>

                    {callStatus === 'connected' && (
                        <p className="text-[10px] text-white/30 italic mb-4 max-w-[200px] text-center">
                            {language === 'ru' ? 'Если нет звука, убедитесь, что микрофон разрешен в браузере.' : 'If no audio, ensure microphone is allowed in browser.'}
                        </p>
                    )}
                
                {callStatus === 'connected' && (
                    <button 
                        onClick={() => {
                            const videoEl = document.getElementById('remote-video') as HTMLVideoElement;
                            const audioEl = document.getElementById('remote-audio') as HTMLAudioElement;
                            if (remoteStream) {
                                console.log("[UI] Manually re-attaching stream and playing audio/video");
                                if (videoEl) {
                                    videoEl.srcObject = null;
                                    setTimeout(() => { videoEl.srcObject = remoteStream; videoEl.play().catch(e => console.error("Video play error", e)); }, 100);
                                }
                                if (audioEl) {
                                    audioEl.srcObject = null;
                                    setTimeout(() => { 
                                        audioEl.srcObject = remoteStream; 
                                        audioEl.muted = false;
                                        audioEl.volume = 1.0;
                                        audioEl.play().catch(e => console.error("Audio play error", e)); 
                                    }, 100);
                                }
                                alert(language === 'ru' ? 'Стрим подключен!' : 'Stream attached!');
                            } else {
                                alert(language === 'ru' ? 'Стрим еще не получен. Подождите...' : 'No stream found! (Wait for connection)');
                            }
                        }}
                        className="mb-8 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-full text-xs font-black text-black uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 z-50 animate-bounce"
                    >
                        📸 ENABLE VIDEO / AUDIO
                    </button>
                )}
                
                <div className="flex items-center gap-8 relative z-20">
                    {callStatus === 'ringing' ? (
                        <>
                            <button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                                <PhoneIcon className="w-8 h-8 rotate-[135deg]" />
                            </button>
                            <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-green-500/30 animate-bounce">
                                <VideoCameraIcon className="w-8 h-8" />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                             <PhoneIcon className="w-8 h-8 rotate-[135deg]" />
                        </button>
                    )}
                </div>
                </div>
                
                {/* Fallback Audio Element (just in case) */}
                <audio id="remote-audio" autoPlay playsInline className="hidden" />
            </div>
        )}



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
                <h3 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Ожидание собеседника...' : 'Waiting for partner...'}</h3>
                <p className="text-sm text-slate-400 max-w-xs">{language === 'ru' ? 'Ожидаем, пока второй участник войдет в комнату.' : 'Waiting for the other user to enter the room.'}</p>
            </div>
        )}

        {/* Knock Accepted Banner */}
        {knockAcceptedData && (
            <div className="absolute top-4 inset-x-4 z-[60] bg-green-500/20 border border-green-500/50 backdrop-blur-lg rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={knockAcceptedData.partnerProfile.avatar} className="w-12 h-12 rounded-full border-2 border-green-400" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">{language === 'ru' ? 'Стук принят!' : 'Knock Accepted!'}</h4>
                        <p className="text-[10px] text-green-200">{knockAcceptedData.partnerProfile.name} {language === 'ru' ? 'ждет вас' : 'is waiting for you'}</p>
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
                    {language === 'ru' ? 'ВОЙТИ' : 'ENTER'}
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
                            <h4 className="text-sm font-bold text-white mb-0.5">{language === 'ru' ? 'Входящий стук' : 'Incoming Knock'}</h4>
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
                                {language === 'ru' ? 'ОТКЛОНИТЬ' : 'REJECT'}
                            </button>
                            <button 
                                onClick={() => {
                                    handleAcceptKnock({ knockId: incomingKnock.knockId, fromUserId: incomingKnock.fromUser.id });
                                    setIncomingKnock(null);
                                    // Accepted -> Waiting Logic triggers via event
                                }}
                                className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all"
                            >
                                {language === 'ru' ? 'ПРИНЯТЬ' : 'ACCEPT'}
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
