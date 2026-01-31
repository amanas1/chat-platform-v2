
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    XMarkIcon, PaperAirplaneIcon, UsersIcon, 
    MicrophoneIcon, FaceSmileIcon, PaperClipIcon, 
    PlayIcon, PauseIcon, CameraIcon, SearchIcon,
    NextIcon, PreviousIcon, VolumeIcon, ChevronDownIcon, ChevronUpIcon,
    HeartIcon, PhoneIcon, VideoCameraIcon, ArrowLeftIcon, UserIcon, ChatBubbleIcon,
    BellIcon, NoSymbolIcon, LifeBuoyIcon, SpeakIcon, GlobeIcon
} from './Icons';
import { ChatMessage, UserProfile, Language, RadioStation, ChatSession, VisualMode } from '../types';
import AudioVisualizer from './AudioVisualizer';
import DancingAvatar from './DancingAvatar';
import { socketService } from '../services/socketService';
import { encryptionService } from '../services/encryptionService';
import { geolocationService } from '../services/geolocationService';
import { TRANSLATIONS, COUNTRIES_DATA, COUNTRY_VERIFICATION_DATA, BLOCKED_COUNTRIES, normalizeCountryName } from '../constants';

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
}

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💧', '🌈', '☀️', '🌙', '⭐', '🎵', '🎶', '🎤', '🎧', '📷', '📸', '🎬', '🎨', '🎭', '🎪', '🎯', '🎲', '🎰', '🎳'
];

const AGES = Array.from({ length: 63 }, (_, i) => (i + 18).toString()); 

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
                canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
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
}

const DrumPicker: React.FC<DrumPickerProps> = ({ options, value, onChange, label }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 32; 
  const handleScroll = () => {
    if (!scrollRef.current) return;
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
      <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
      <div className="relative h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#1e293b] to-transparent z-10 pointer-events-none opacity-50"></div>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#1e293b] to-transparent z-10 pointer-events-none opacity-50"></div>
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-8 bg-primary/20 rounded-lg border border-primary/30 pointer-events-none shadow-[0_0_15px_rgba(188,111,241,0.1)]"></div>
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-8" style={{ scrollBehavior: 'smooth' }}>
          {options.map((opt, i) => (
            <div key={i} className={`h-8 flex items-center justify-center snap-center transition-all duration-300 text-sm font-bold ${value === opt ? 'text-primary scale-110' : 'text-slate-500 opacity-40'}`}>
              {opt}
            </div>
          ))}
          <div className="h-32"></div>
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
    volume, onVolumeChange, visualMode
}) => {
  const [view, setView] = useState<'auth' | 'register' | 'search' | 'inbox' | 'chat'>('auth');
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
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
  const [regAge, setRegAge] = useState('25');
  const [regCountry, setRegCountry] = useState(COUNTRIES_DATA[0].name);
  const [regCity, setRegCity] = useState(COUNTRIES_DATA[0].cities[0]);
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regAvatar, setRegAvatar] = useState<string | null>(currentUser.avatar || null);
  
  const [searchAgeFrom, setSearchAgeFrom] = useState('18');
  const [searchAgeTo, setSearchAgeTo] = useState('80');
  const [searchCountry, setSearchCountry] = useState('Any');
  const [searchCity, setSearchCity] = useState('Any');
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
  const [profileExpiresAt, setProfileExpiresAt] = useState<number | null>(null);
  const [expirationWarning, setExpirationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [onlineStats, setOnlineStats] = useState({ totalOnline: 0, chatOnline: 0 });
  
  //Geolocation state
  const [detectedLocation, setDetectedLocation] = useState<{country: string, city: string, ip?: string} | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationMismatch, setShowLocationMismatch] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false); // First warning popup
  const [countryNotInList, setCountryNotInList] = useState(false); // Country not supported
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false); // User denied geolocation permission
  const [vpnDetected, setVpnDetected] = useState(false); // VPN usage detected (browser geo != IP geo)
  const [locationWarningCount, setLocationWarningCount] = useState(() => {
    const saved = localStorage.getItem('streamflow_location_warnings');
    return saved ? parseInt(saved) : 0;
  });
  const [isLocationBlocked, setIsLocationBlocked] = useState(() => {
    // Check for reset parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === '1') {
      // Clear all block data
      localStorage.removeItem('streamflow_location_blocked_until');
      localStorage.removeItem('streamflow_location_warnings');
      console.log('[RESET] Block data cleared via URL parameter');
      // Remove the parameter from URL without reload
      window.history.replaceState({}, '', window.location.pathname);
      return false;
    }
    
    const blockedUntil = localStorage.getItem('streamflow_location_blocked_until');
    if (blockedUntil && Date.now() < parseInt(blockedUntil)) {
      return true;
    }
    return false;
  });
  const [blockTimeRemaining, setBlockTimeRemaining] = useState<string>('');
  
  // Countdown timer for block
  useEffect(() => {
    if (!isLocationBlocked) {
      setBlockTimeRemaining('');
      return;
    }
    
    const blockedUntil = localStorage.getItem('streamflow_location_blocked_until');
    if (!blockedUntil) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = parseInt(blockedUntil) - now;
      
      if (remaining <= 0) {
        setIsLocationBlocked(false);
        setBlockTimeRemaining('');
        localStorage.removeItem('streamflow_location_blocked_until');
        localStorage.setItem('streamflow_location_warnings', '0');
        return;
      }
      
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      
      setBlockTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLocationBlocked]);
  
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
  
  // Call State
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const availableCitiesReg = useMemo(() => COUNTRIES_DATA.find(c => c.name === regCountry)?.cities || [], [regCountry]);
  const availableCitiesSearch = useMemo(() => COUNTRIES_DATA.find(c => c.name === searchCountry)?.cities || [], [searchCountry]);

  // Pre-fill cities when country changes
  useEffect(() => { 
    if (availableCitiesReg.length > 0) {
      setRegCity(availableCitiesReg[0]); 
    }
  }, [availableCitiesReg]);

  useEffect(() => { scrollToBottom(); }, [messages, view]);

  useEffect(() => {
    const cleanup = socketService.onPresenceCount((stats) => {
        setOnlineStats(stats);
    });
    return cleanup;
  }, []);

  // Auto-detect location when entering registration view
  useEffect(() => {
    // Check if we are in register view and haven't finished detection/have no location
    const shouldStartDetection = view === 'register' && !detectedLocation && !isDetectingLocation;
    
    console.log('[GEO] useEffect check', { 
      view, 
      hasLocation: !!detectedLocation, 
      isDetecting: isDetectingLocation,
      shouldStart: shouldStartDetection 
    });

    if (shouldStartDetection) {
      console.log('[GEO] 🚀 Starting detection cycle...');
      setIsDetectingLocation(true);
      
      (async () => {
        try {
          console.log('[GEO] Step 1: Requesting browser geolocation...');
          
          // Check if geolocation permission was previously denied
          if (navigator.permissions) {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            if (permissionStatus.state === 'denied') {
              console.warn('[GEO] 🚫 Geolocation permission was previously denied. Blocking registration.');
              setGeoPermissionDenied(true);
              setDetectedLocation({ country: 'DENIED', city: 'DENIED' });
              setIsDetectingLocation(false);
              return;
            }
          }
          
          // Try browser geolocation first - THIS IS REQUIRED
          let browserLocation = await geolocationService.getBrowserLocation();
          
          // If browser geolocation failed due to permission denial, BLOCK registration
          if (!browserLocation) {
            console.warn('[GEO] 🚫 Browser geolocation denied or failed. Registration BLOCKED.');
            setGeoPermissionDenied(true);
            setDetectedLocation({ country: 'DENIED', city: 'DENIED' });
            setIsDetectingLocation(false);
            return;
          }
          
          // VPN DETECTION: Also get IP-based location and compare
          console.log('[GEO] Step 2: Fetching IP-based location for VPN check...');
          const ipLocation = await geolocationService.getIPLocation();
          
          // Compare browser country with IP country
          const browserCountry = browserLocation.country.toLowerCase().trim();
          const ipCountry = ipLocation.country.toLowerCase().trim();
          
          console.log(`[GEO] 🔍 VPN Check: Browser says "${browserLocation.country}", IP says "${ipLocation.country}"`);
          
          // If countries don't match, it's likely a VPN
          if (browserCountry !== 'unknown' && ipCountry !== 'unknown' && browserCountry !== ipCountry) {
            console.warn(`[GEO] 🚨 VPN DETECTED! Browser: ${browserLocation.country}, IP: ${ipLocation.country}`);
            setVpnDetected(true);
            setDetectedLocation({ country: 'VPN', city: 'VPN', ip: ipLocation.ip });
            setIsDetectingLocation(false);
            return;
          }
          
          console.log('[GEO] ✅ VPN check passed - locations match');
          setVpnDetected(false);
          
          const location = browserLocation;
          
          if (location && (location.country !== 'Unknown' || location.city !== 'Unknown')) {
            console.log('[GEO] ✅ Successfully detected location:', location);
            setDetectedLocation(location);
            setGeoPermissionDenied(false);
            
            // Auto-fill country and city if detected
            // First check if country is blocked
            const isBlocked = BLOCKED_COUNTRIES.some(bc => 
              bc.toLowerCase() === location.country.toLowerCase()
            );
            
            if (isBlocked) {
              console.warn(`[GEO] 🚫 Country "${location.country}" is in BLOCKED_COUNTRIES list`);
              setCountryNotInList(true);
            } else {
              // Find country in COUNTRIES_DATA for auto-fill
              const countryData = COUNTRIES_DATA.find(c => 
                c.name.toLowerCase() === location.country.toLowerCase()
              );

              if (countryData) {
                console.log(`[GEO] Auto-filling country: ${countryData.name}`);
                setRegCountry(countryData.name);
                setCountryNotInList(false);
                
                // Try to match detected city, or use first city as default
                const cityMatch = countryData.cities.find(c => 
                  c.toLowerCase() === location.city.toLowerCase()
                );
                setRegCity(cityMatch || countryData.cities[0]);
              } else {
                // Country not in our list but NOT blocked - allow access
                console.log(`[GEO] Country "${location.country}" not in COUNTRIES_DATA but not blocked - allowing access`);
                setCountryNotInList(false);
                // Let user select manually
              }
            }
          } else {
            console.warn('[GEO] ❌ All detection methods failed or returned Unknown');
            // Block registration if we can't verify location
            setGeoPermissionDenied(true);
            setDetectedLocation({ country: 'Unknown', city: 'Unknown' });
          }
        } catch (err) {
          console.error('[GEO] 💥 Unexpected error during detection:', err);
          setGeoPermissionDenied(true);
          setDetectedLocation({ country: 'Unknown', city: 'Unknown' });
        } finally {
          console.log('[GEO] 🏁 Detection cycle finished');
          setIsDetectingLocation(false);
        }
      })();
    }
  }, [view, detectedLocation, isDetectingLocation]);
  
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
    socketService.connect();
    
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
      setView('auth');
      onUpdateCurrentUser({ ...currentUser, isAuthenticated: false } as UserProfile);
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
    cleanups.push(socketService.onKnockReceived((data) => {
      if (currentUser.blockedUsers.includes(data.fromUserId)) return;
      playNotificationSound('knock');
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
          
          // Force view change first to ensure user sees the chat
          setActiveSession(data);
          setView('chat');
          
          // Clean up any pending knocks that match this partner
          setPendingKnocks(prev => prev.filter(k => k.fromUserId !== data.partnerId));
          // Also clear sent knocks since we are now connected
          setSentKnocks(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.partnerId);
              return newSet;
          });

          // Try playing sound safely
          try {
             playNotificationSound('door');
          } catch(e) {
             console.warn("Sound play failed", e);
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
          
          // Voice Mode: Read incoming message
          if (decrypted.text && voiceModeRef.current) {
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
                     chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' }
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
        alert(`${data.message}\n${data.reason || ''}`);
        setView('auth');
    }));

    // AI Voice Mode Helper (Refactored out)



    // Listen for report acknowledgment
    cleanups.push(socketService.addListener('report:acknowledged', () => {
        alert(language === 'ru' ? 'Ваша жалоба отправлена на рассмотрение.' : 'Your report has been sent for review.');
    }));

    return () => {
      // Cleanup all event listeners (NOT disconnect!)
      cleanups.forEach(cleanup => cleanup());
    };
  }, [currentUser.id, activeSession]);

  // Entry logic: show registration if profile incomplete, otherwise search
  useEffect(() => {
    if (currentUser.country && currentUser.age) {
      // Register user on server
      socketService.registerUser(currentUser, (data) => {
        setProfileExpiresAt(data.expiresAt);
        console.log(`✅ Profile registered. Expires in ${Math.floor(data.ttl / 3600000)} hours`);
        
        // Restore sessions from server
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
        }
      });
      setView('search');
    } else {
      setView('register');
    }
  }, [currentUser.country, currentUser.age]);

  const handleLogin = () => {
    const mockUser = {
      id: `user_${Date.now()}`,
      name: 'Guest',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      isAuthenticated: true,
      age: 0,
      country: '',
      city: '',
      gender: 'other' as const,
      status: 'online' as const,
      safetyLevel: 'green' as const,
      blockedUsers: [],
      bio: '',
      hasAgreedToRules: false,
      filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }
    };
    onUpdateCurrentUser(mockUser as UserProfile);
  };

  const handleRegistrationComplete = () => {
    // Check if user is blocked for 24 hours
    const blockedUntil = localStorage.getItem('streamflow_location_blocked_until');
    if (blockedUntil && Date.now() < parseInt(blockedUntil)) {
      const hoursLeft = Math.ceil((parseInt(blockedUntil) - Date.now()) / (60 * 60 * 1000));
      const errorMsg = language === 'ru'
        ? `Вы заблокированы за нарушение правил чата! Попробуйте через ${hoursLeft} ч.`
        : `You are blocked for violating chat rules! Try again in ${hoursLeft}h.`;
      setViolationMessage(errorMsg);
      return;
    }
    
    // Collect location fingerprint for trust score
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const browserLocale = navigator.language;
    const browserUtcOffset = -(new Date().getTimezoneOffset() / 60); // Convert to UTC offset hours
    
    // Calculate Trust Score
    let trustScore = 100;
    const trustFlags: string[] = [];
    
    // Check for country mismatch (main check) - normalize names to handle different languages
    // e.g. "Казахстан" should match "Kazakhstan"
    const detectedCountryNormalized = normalizeCountryName(detectedLocation?.country || '');
    const selectedCountryNormalized = normalizeCountryName(regCountry);
    
    const hasCountryMismatch = detectedLocation && 
      detectedLocation.country !== 'Unknown' && 
      detectedCountryNormalized.toLowerCase() !== selectedCountryNormalized.toLowerCase();
    
    // 1. Check IP geolocation match
    if (hasCountryMismatch) {
      trustScore -= 40;
      trustFlags.push(`IP_MISMATCH:${detectedLocation.country}vs${regCountry}`);
      console.log(`[TRUST] ❌ IP mismatch: detected ${detectedLocation.country}, selected ${regCountry} (-40)`);
      
      // TWO-ATTEMPT WARNING SYSTEM
      const currentWarnings = locationWarningCount;
      
      if (currentWarnings === 0) {
        // First attempt with mismatch - show warning, don't block
        console.log('[TRUST] ⚠️ First mismatch - showing warning');
        setLocationWarningCount(1);
        localStorage.setItem('streamflow_location_warnings', '1');
        setShowLocationWarning(true);
        return; // Stop registration, show warning first
      } else {
        // Second attempt with mismatch - BLOCK for 24 hours
        console.log('[TRUST] 🚫 Second mismatch - blocking for 24 hours');
        const blockUntil = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('streamflow_location_blocked_until', blockUntil.toString());
        localStorage.setItem('streamflow_location_warnings', '0'); // Reset for next time
        setIsLocationBlocked(true);
        
        const errorMsg = language === 'ru'
          ? 'Вы заблокированы за нарушение правил чата! Доступ закрыт на 24 часа.'
          : 'You are blocked for violating chat rules! Access denied for 24 hours.';
        setViolationMessage(errorMsg);
        return;
      }
    } else {
      // Country matches - reset warning count
      if (locationWarningCount > 0) {
        setLocationWarningCount(0);
        localStorage.setItem('streamflow_location_warnings', '0');
      }
    }
    
    // 2. Check Timezone match
    const countryVerification = COUNTRY_VERIFICATION_DATA[regCountry];
    if (countryVerification) {
      const tzMatches = countryVerification.timezones.some(tz => 
        browserTimezone.startsWith(tz) || browserTimezone.includes(tz.replace('/', '/'))
      );
      
      if (!tzMatches) {
        trustScore -= 30;
        trustFlags.push(`TZ_MISMATCH:${browserTimezone}`);
        console.log(`[TRUST] ❌ Timezone mismatch: ${browserTimezone} for ${regCountry} (-30)`);
      } else {
        console.log(`[TRUST] ✅ Timezone matches: ${browserTimezone}`);
      }
      
      // 3. Check UTC offset range
      const [minOffset, maxOffset] = countryVerification.utcOffsetRange;
      if (browserUtcOffset < minOffset || browserUtcOffset > maxOffset) {
        trustScore -= 20;
        trustFlags.push(`UTC_MISMATCH:${browserUtcOffset}`);
        console.log(`[TRUST] ❌ UTC offset mismatch: ${browserUtcOffset} not in [${minOffset}, ${maxOffset}] (-20)`);
      }
      
      // 4. Check Browser Locale
      const localeMatches = countryVerification.locales.some(loc => 
        browserLocale.toLowerCase().startsWith(loc.toLowerCase()) ||
        browserLocale.toLowerCase().includes(loc.split('-')[0].toLowerCase())
      );
      
      if (!localeMatches) {
        trustScore -= 15;
        trustFlags.push(`LOCALE_MISMATCH:${browserLocale}`);
        console.log(`[TRUST] ⚠️ Locale mismatch: ${browserLocale} for ${regCountry} (-15)`);
      } else {
        console.log(`[TRUST] ✅ Locale matches: ${browserLocale}`);
      }
    }
    
    // Determine trust level
    let trustLevel: 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK';
    if (trustScore >= 80) trustLevel = 'TRUSTED';
    else if (trustScore >= 50) trustLevel = 'SUSPICIOUS';
    else trustLevel = 'HIGH_RISK';
    
    console.log(`[TRUST] 🏁 Final score: ${trustScore}/100 = ${trustLevel}`, trustFlags);
    
    const updatedUser: UserProfile = { 
      ...currentUser, 
      name: regName, 
      avatar: regAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${regName || Date.now()}`,
      age: parseInt(regAge), 
      country: regCountry, 
      city: regCity, 
      gender: regGender, 
      isAuthenticated: true,
      hasAgreedToRules: true,
      // Geolocation data
      detectedCountry: detectedLocation?.country,
      detectedCity: detectedLocation?.city,
      detectedIP: detectedLocation?.ip,
      deviceId: geolocationService.getDeviceId(),
      registrationTimestamp: Date.now(),
      // Trust Score data
      trustScore,
      trustLevel,
      trustFlags,
      locationFingerprint: {
        browserTimezone,
        browserLocale,
        browserUtcOffset,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      },
      chatSettings: {
        notificationsEnabled: regNotificationsEnabled,
        notificationVolume: regNotificationVolume,
        notificationSound: regNotificationSound as 'default' | 'soft' | 'alert'
      }
    };
    
    // Save registration timestamp in localStorage for 24h lock
    geolocationService.markRegisteredToday();
    
    onUpdateCurrentUser(updatedUser);
    localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));

    
    // Register on server
    socketService.registerUser(updatedUser, (data) => {
      setProfileExpiresAt(data.expiresAt);
      console.log(`✅ Profile created. Expires in 24 hours.`);
      
      // Restore sessions from server (if re-registering)
      if (data.activeSessions && data.activeSessions.length > 0) {
        console.log(`[SESSION] Restoring ${data.activeSessions.length} sessions from server after registration`);
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

  const handleAvatarSetup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file).then(setRegAvatar);
  };

  const handleSearch = () => {
    const filters: any = {};
    if (searchAgeFrom !== 'Any') filters.minAge = parseInt(searchAgeFrom);
    if (searchAgeTo !== 'Any') filters.maxAge = parseInt(searchAgeTo);
    if (searchCountry !== 'Any') filters.country = searchCountry;
    if (searchCity !== 'Any') filters.city = searchCity;
    if (searchGender !== 'any') filters.gender = searchGender;
    
    socketService.searchUsers(filters, (results) => {
      setSearchResults(results);
    });
  };

  const handleKnock = (targetUser: UserProfile) => {
    // Auth Check: Block if user is not authenticated
    if (!currentUser.isAuthenticated || !currentUser.id) {
      const message = language === 'ru' 
        ? '⚠️ Сначала нужно создать профиль!\n\nВы будете перенаправлены на регистрацию.'
        : '⚠️ Please create a profile first!\n\nYou will be redirected to registration.';
      
      alert(message);
      setView('register'); // Redirect to registration
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
    
    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'ru' ? 'Фото не больше 2 МБ' : 'Photo must be under 2MB');
      return;
    }
    
    try {
      const compressedBase64 = await compressImage(file);
      
      /* Optimistic UI removed to prevent duplication
      const tempId = `temp_img_${Date.now()}`;
      const optimisticMessage: any = {
          id: tempId,
          sessionId: activeSession.sessionId,
          senderId: currentUser.id,
          messageType: 'image',
          image: compressedBase64, 
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, optimisticMessage]); 
      */

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
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
      };
      
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

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
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
                        {view !== 'auth' && (
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                                <button 
                                    onClick={() => setView('register')} 
                                    className={`p-2 rounded-xl transition-all duration-300 ${view === 'register' ? 'bg-primary text-white shadow-[0_0_15px_rgba(188,111,241,0.4)]' : 'text-slate-500 hover:text-slate-200'}`}
                                    title={language === 'ru' ? 'Профиль' : 'Profile'}
                                >
                                    <UserIcon className="w-5 h-5" />
                                </button>
                                {currentUser.blockedUsers.length > 0 && (
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
                                        {pendingKnocks.length > 0 && (
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
                            {view === 'search' && detectedLocation?.country && detectedLocation.country !== 'Unknown' ? (
                                <span className="text-[9px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                    📍 {detectedLocation.country}
                                </span>
                            ) : !socketService.isConnected ? (
                                <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Offline</span>
                            ) : (
                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    {onlineStats.chatOnline} {language === 'ru' ? 'онлайн' : 'online'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full border border-white/5"><XMarkIcon className="w-5 h-5" /></button>
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
            {pendingKnocks.length > 0 && view !== 'inbox' && (
                <div className="px-4 py-3 bg-gradient-to-r from-secondary/90 to-primary/90 backdrop-blur-md flex items-center justify-between animate-in slide-in-from-top duration-300 relative z-[9999] cursor-pointer shadow-2xl border-b border-white/20" onClick={() => setView('inbox')}>
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold font-mono tracking-tight">
                            {language === 'ru' 
                                ? `Новое приглашение от ${pendingKnocks[pendingKnocks.length - 1].fromUser?.name || 'пользователя'}` 
                                : `New invite from ${pendingKnocks[pendingKnocks.length - 1].fromUser?.name || 'User'}`
                            }
                        </span>
                    </div>
                    <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">
                        {language === 'ru' ? 'ОТКРЫТЬ' : 'OPEN'}
                    </div>
                </div>
            )}

            {violationMessage && (
                <div className="px-4 py-2 bg-orange-500/90 text-white text-[10px] font-bold text-center animate-in slide-in-from-top duration-300 relative z-40">
                    ⚠️ {violationMessage}
                </div>
            )}

            {/* Block Overlay with Countdown Timer and Scrolling Message */}
            {isLocationBlocked && (
                <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black flex flex-col z-50 overflow-hidden">
                    {/* Top Section - Timer */}
                    <div className="shrink-0 text-center pt-6 pb-3 relative z-10">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3 border-2 border-red-500/50 animate-pulse">
                            <NoSymbolIcon className="w-7 h-7 text-red-500" />
                        </div>
                        <h2 className="text-base font-black text-red-500 uppercase tracking-widest mb-2">
                            {language === 'ru' ? 'ДОСТУП ЗАБЛОКИРОВАН' : 'ACCESS BLOCKED'}
                        </h2>
                        
                        {/* Language Toggle */}
                        <div className="flex justify-center gap-2 mb-3">
                            <button
                                onClick={() => onLanguageChange('ru')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    language === 'ru' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                }`}
                            >
                                🇷🇺 RU
                            </button>
                            <button
                                onClick={() => onLanguageChange('en')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    language === 'en' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                }`}
                            >
                                🇺🇸 EN
                            </button>
                        </div>
                        
                        {/* Countdown Timer */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3 mx-auto inline-block">
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                                {language === 'ru' ? 'До разблокировки' : 'Time remaining'}
                            </p>
                            <div className="text-2xl font-black text-white font-mono tracking-wider">
                                {blockTimeRemaining || '00:00:00'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Scrolling Credits Container */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Gradient Fade Top */}
                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none" />
                        {/* Gradient Fade Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                        
                        {/* Scrolling Text - Slower, starts after 3s */}
                        <div 
                            className="px-6 py-4"
                            style={{
                                animation: 'scrollCredits 120s linear infinite',
                                animationDelay: '3s',
                            }}
                        >
                            <style>{`
                                @keyframes scrollCredits {
                                    0% { transform: translateY(0%); opacity: 1; }
                                    95% { transform: translateY(-85%); opacity: 1; }
                                    100% { transform: translateY(-90%); opacity: 0; }
                                }
                            `}</style>
                            
                            <div className="max-w-xs mx-auto space-y-5 text-center">
                                {/* Show text based on selected language */}
                                {language === 'ru' ? (
                                    <>
                                        <p className="text-base text-slate-200 leading-relaxed font-medium">
                                            Привет, уважаемый пользователь!
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Мы понимаем, что, возможно, ты не хотел(а) нарушать правила. А может быть, намеренно использовал(а) VPN или другие сервисы для обхода ограничений.
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Этот сервис создан для реальных людей, которые хотят общаться искренне и уважительно. Мы не желаем хаоса и беспорядка в нашем сообществе.
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">✨</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Мы долго работали над созданием этого места и не хотим, чтобы здесь оставался негатив.
                                        </p>
                                        
                                        <p className="text-sm text-primary font-medium leading-relaxed">
                                            Уважай себя и других пользователей!
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">🤝</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            После разблокировки будь внимателен при регистрации. Укажи реальное местоположение и помни о правилах общения.
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Не оскорбляй и не унижай достоинство других. Не размещай фото непристойного характера. Веди себя культурно — и к тебе потянутся люди.
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">💜</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Если хочешь найти друга, знакомого или кого-то особенного — добро пожаловать к нам!
                                        </p>
                                        
                                        <p className="text-base text-white font-bold leading-relaxed">
                                            Мы откроем тебе доступ после окончания блокировки.
                                        </p>
                                        
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Не обижайся — это наше правило!
                                        </p>
                                        
                                        <div className="py-6">
                                            <span className="text-3xl">🎵</span>
                                            <p className="text-lg text-primary font-bold mt-4">
                                                А пока — послушай наше радио!
                                            </p>
                                            <p className="text-xs text-slate-600 uppercase tracking-widest mt-2">
                                                StreamFlow Radio
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base text-slate-200 leading-relaxed font-medium">
                                            Hello, dear user!
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            We understand that perhaps you didn't mean to break the rules. Or maybe you intentionally used a VPN or other bypass services.
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            This service is created for real people who want to communicate sincerely and respectfully. We don't want chaos in our community.
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">✨</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            We worked hard to create this place and don't want negativity here.
                                        </p>
                                        
                                        <p className="text-sm text-primary font-medium leading-relaxed">
                                            Respect yourself and other users!
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">🤝</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            After unblock, be careful during registration. Specify your real location and remember the rules.
                                        </p>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Don't insult others. Don't post inappropriate photos. Behave with culture — and people will be drawn to you.
                                        </p>
                                        
                                        <div className="py-2">
                                            <span className="text-xl">💜</span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            If you want to find a friend or someone special — welcome!
                                        </p>
                                        
                                        <p className="text-base text-white font-bold leading-relaxed">
                                            We will grant you access after the block ends.
                                        </p>
                                        
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Don't take offense — it's our rule!
                                        </p>
                                        
                                        <div className="py-6">
                                            <span className="text-3xl">🎵</span>
                                            <p className="text-lg text-primary font-bold mt-4">
                                                Meanwhile — enjoy our radio!
                                            </p>
                                            <p className="text-xs text-slate-600 uppercase tracking-widest mt-2">
                                                StreamFlow Radio
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Country Not In List Modal */}
            {countryNotInList && !isLocationBlocked && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
                    <div className="text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6 border-2 border-slate-600">
                            <GlobeIcon className="w-10 h-10 text-slate-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">
                            {language === 'ru' ? 'ДОСТУП НЕДОСТУПЕН' : 'ACCESS UNAVAILABLE'}
                        </h2>
                        <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                            {language === 'ru' 
                                ? `Извините, у вас нет доступа к чату из-за отсутствия вашей страны (${detectedLocation?.country || 'Unknown'}) в списке поддерживаемых.`
                                : `Sorry, you don't have access to chat because your country (${detectedLocation?.country || 'Unknown'}) is not in our supported list.`}
                        </p>
                        <p className="text-xs text-slate-600">
                            {language === 'ru' 
                                ? 'Мы работаем над расширением географии сервиса'
                                : 'We are working on expanding our service coverage'}
                        </p>
                    </div>
                </div>
            )}

            {/* Geolocation Permission Denied Modal */}
            {geoPermissionDenied && !countryNotInList && !isLocationBlocked && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
                    <div className="text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-6 border-2 border-red-600/50">
                            <NoSymbolIcon className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-black text-red-400 uppercase tracking-widest mb-2">
                            {language === 'ru' ? 'ДОСТУП ЗАПРЕЩЁН' : 'ACCESS DENIED'}
                        </h2>
                        <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
                            {language === 'ru' 
                                ? 'Вы отклонили запрос на доступ к вашему местоположению. Для регистрации в чате необходимо разрешить определение геолокации.'
                                : 'You denied the location access request. You must allow geolocation to register in the chat.'}
                        </p>
                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                            {language === 'ru' 
                                ? 'Чтобы продолжить, разрешите доступ к местоположению в настройках браузера и обновите страницу.'
                                : 'To continue, enable location access in your browser settings and refresh the page.'}
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold uppercase text-xs tracking-wider rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-red-500/30"
                        >
                            {language === 'ru' ? 'Обновить страницу' : 'Refresh Page'}
                        </button>
                    </div>
                </div>
            )}

            {/* VPN Detected Modal */}
            {vpnDetected && !geoPermissionDenied && !countryNotInList && !isLocationBlocked && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
                    <div className="text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-900/50 to-orange-900/50 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="M12 8v4"/>
                                <path d="M12 16h.01"/>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-3">
                            {language === 'ru' ? 'VPN ОБНАРУЖЕН' : 'VPN DETECTED'}
                        </h2>
                        <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto">
                            {language === 'ru' 
                                ? 'Мы обнаружили, что вы используете VPN или прокси-сервер для маскировки вашего реального местоположения.'
                                : 'We detected that you are using a VPN or proxy server to mask your real location.'}
                        </p>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">
                                {language === 'ru' ? 'Причина блокировки:' : 'Reason for block:'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {language === 'ru' 
                                    ? 'Ваш браузер сообщает одну страну, а ваш IP-адрес указывает на другую. Это типичный признак использования VPN.'
                                    : 'Your browser reports one country, but your IP address indicates another. This is a typical sign of VPN usage.'}
                            </p>
                        </div>
                        <p className="text-xs text-slate-600 mb-6 max-w-xs mx-auto">
                            {language === 'ru' 
                                ? 'Для регистрации в чате отключите VPN и обновите страницу.'
                                : 'To register in the chat, disable your VPN and refresh the page.'}
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold uppercase text-xs tracking-wider rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-red-500/30"
                        >
                            {language === 'ru' ? 'Обновить страницу' : 'Refresh Page'}
                        </button>
                    </div>
                </div>
            )}

            {/* Location Warning Modal - First Attempt */}
            {showLocationWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-orange-500/50 rounded-2xl p-6 m-4 max-w-sm shadow-2xl shadow-orange-500/20 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <NoSymbolIcon className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-orange-500 uppercase tracking-wide">
                                    {language === 'ru' ? 'Внимание!' : 'Warning!'}
                                </h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                    {language === 'ru' ? 'Несовпадение местоположения' : 'Location Mismatch'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {language === 'ru' 
                                    ? `Вы определены в стране: `
                                    : `You are detected in: `}
                                <span className="font-bold text-white">{detectedLocation?.country || 'Unknown'}</span>
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {language === 'ru' 
                                    ? `Но вы выбрали: `
                                    : `But you selected: `}
                                <span className="font-bold text-orange-400">{regCountry}</span>
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {language === 'ru' 
                                    ? 'Пожалуйста, укажите реальную страну проживания. Если у вас включён VPN, отключите его и обновите страницу.'
                                    : 'Please specify your actual country of residence. If you have VPN enabled, turn it off and refresh the page.'}
                            </p>
                        </div>
                        
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6">
                            <p className="text-xs text-red-400 font-bold text-center">
                                {language === 'ru' 
                                    ? '⚠️ При повторной ошибке вы будете заблокированы на 24 часа!'
                                    : '⚠️ If you try again with wrong info, you will be blocked for 24 hours!'}
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    setShowLocationWarning(false);
                                    // Auto-select detected country
                                    if (detectedLocation?.country && detectedLocation.country !== 'Unknown') {
                                        const countryData = COUNTRIES_DATA.find(c => 
                                            c.name.toLowerCase() === detectedLocation.country.toLowerCase()
                                        );
                                        if (countryData) {
                                            setRegCountry(countryData.name);
                                            setRegCity(countryData.cities[0]);
                                        }
                                    }
                                }}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                {language === 'ru' ? 'Исправить данные' : 'Fix My Data'}
                            </button>
                            <button 
                                onClick={() => setShowLocationWarning(false)}
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors"
                            >
                                {language === 'ru' ? 'Закрыть' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'auth' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(188,111,241,0.1)] mb-4"><UsersIcon className="w-16 h-16 text-primary opacity-80" /></div>
                    <div><p className="text-sm text-slate-400 leading-relaxed max-w-[250px] mx-auto">{t.authDesc}</p></div>
                    <button onClick={handleLogin} className="flex items-center gap-3 px-6 py-4 bg-white text-black rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-transform active:scale-95 w-full justify-center">
                        {t.signInGuest}
                    </button>
                </div>
            )}
            
            {view === 'register' && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex justify-center mb-6 shrink-0">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-widest">{language === 'ru' ? 'Ваш профиль' : 'Your Profile'}</h3>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col space-y-6">
                        {/* Geolocation Status Indicator */}
                        {isDetectingLocation && (
                            <div className="bg-primary border border-primary/40 rounded-xl p-3 flex items-center justify-between animate-pulse" style={{ backgroundColor: 'rgba(188, 111, 241, 0.2)' }}>
                                <div className="flex items-center gap-3">
                                    <GlobeIcon className="w-4 h-4 text-primary animate-spin" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                        {language === 'ru' ? 'Определяем ваше местоположение...' : 'Detecting your location...'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {detectedLocation && !isDetectingLocation && (
                            <div 
                                className={`border rounded-xl p-3 flex items-center justify-between transition-all ${
                                    detectedLocation.country === 'Unknown' 
                                    ? 'bg-slate-800/40 border-white/10' 
                                    : 'bg-green-600/20 border-green-500/40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <GlobeIcon className={`w-4 h-4 ${detectedLocation.country === 'Unknown' ? 'text-slate-500' : 'text-green-500'}`} />
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${
                                            detectedLocation.country === 'Unknown' ? 'text-slate-500' : 'text-green-500'
                                        }`}>
                                            {detectedLocation.country === 'Unknown' 
                                                ? (language === 'ru' ? 'МЕСТОПОЛОЖЕНИЕ НЕ ОПРЕДЕЛЕНО' : 'LOCATION NOT DETECTED')
                                                : (language === 'ru' ? 'ВАШЕ МЕСТОПОЛОЖЕНИЕ ПОДТВЕРЖДЕНО' : 'LOCATION VERIFIED')
                                            }
                                        </span>
                                        <span className="text-[10px] font-bold text-white leading-none">
                                            {detectedLocation.country === 'Unknown' 
                                                ? (language === 'ru' ? 'Выберите город вручную' : 'Please select manually')
                                                : `${detectedLocation.country}, ${detectedLocation.city}`
                                            }
                                        </span>
                                    </div>
                                </div>
                                {detectedLocation.ip && detectedLocation.ip !== 'Unknown' && (
                                    <span className="text-[9px] font-mono text-slate-400">{detectedLocation.ip}</span>
                                )}
                            </div>
                        )}

                        {/* Country Mismatch Warning */}
                        {detectedLocation && detectedLocation.country !== 'Unknown' && regCountry !== detectedLocation.country && (
                            <div className="bg-orange-600/20 border border-orange-500/40 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-3">
                                    <NoSymbolIcon className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
                                            {language === 'ru' ? 'НЕСООТВЕТСТВИЕ СТРАНЫ' : 'COUNTRY MISMATCH'}
                                        </h4>
                                        <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                                            {language === 'ru' 
                                                ? `Вы находитесь в ${detectedLocation.country}, но выбрали ${regCountry}. Пожалуйста, укажите точное местоположение.`
                                                : `You are in ${detectedLocation.country}, but selected ${regCountry}. Please specify your exact location.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top: Avatar Section */}
                        <div className="flex justify-center py-2">
                            <div className="relative group">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-40 h-40 rounded-[2.5rem] bg-slate-800/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative cursor-pointer shadow-2xl"
                                >
                                    {regAvatar ? (
                                        <img src={regAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <div key={regGender} className="w-full h-full flex items-center justify-center">
                                            {/* Gender-based default avatar */}
                                            {regGender === 'female' ? (
                                                <svg viewBox="0 0 100 100" className="w-28 h-28 opacity-80">
                                                    {/* Female avatar */}
                                                    <defs>
                                                        <linearGradient id="hairFemale" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#92400e" />
                                                            <stop offset="100%" stopColor="#78350f" />
                                                        </linearGradient>
                                                        <linearGradient id="skinFemale" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#fde68a" />
                                                            <stop offset="100%" stopColor="#fbbf24" />
                                                        </linearGradient>
                                                    </defs>
                                                    {/* Hair */}
                                                    <ellipse cx="50" cy="38" rx="35" ry="30" fill="url(#hairFemale)" />
                                                    <ellipse cx="25" cy="55" rx="12" ry="20" fill="url(#hairFemale)" />
                                                    <ellipse cx="75" cy="55" rx="12" ry="20" fill="url(#hairFemale)" />
                                                    {/* Face */}
                                                    <circle cx="50" cy="45" r="25" fill="url(#skinFemale)" />
                                                    {/* Eyes */}
                                                    <ellipse cx="42" cy="42" rx="3" ry="4" fill="#1e293b" />
                                                    <ellipse cx="58" cy="42" rx="3" ry="4" fill="#1e293b" />
                                                    {/* Smile */}
                                                    <path d="M42,52 Q50,58 58,52" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                                                    {/* Blush */}
                                                    <circle cx="35" cy="48" r="4" fill="#fca5a5" opacity="0.5" />
                                                    <circle cx="65" cy="48" r="4" fill="#fca5a5" opacity="0.5" />
                                                    {/* Body/Shirt */}
                                                    <ellipse cx="50" cy="90" rx="30" ry="20" fill="#fef3c7" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 100 100" className="w-28 h-28 opacity-80">
                                                    {/* Male avatar */}
                                                    <defs>
                                                        <linearGradient id="hairMale" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#475569" />
                                                            <stop offset="100%" stopColor="#1e293b" />
                                                        </linearGradient>
                                                        <linearGradient id="skinMale" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#fde68a" />
                                                            <stop offset="100%" stopColor="#f59e0b" />
                                                        </linearGradient>
                                                    </defs>
                                                    {/* Hair - short */}
                                                    <ellipse cx="50" cy="30" rx="28" ry="18" fill="url(#hairMale)" />
                                                    {/* Face */}
                                                    <circle cx="50" cy="45" r="25" fill="url(#skinMale)" />
                                                    {/* Eyebrows */}
                                                    <path d="M36,36 L46,38" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M54,38 L64,36" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                                                    {/* Eyes */}
                                                    <ellipse cx="42" cy="44" rx="3" ry="3" fill="#1e293b" />
                                                    <ellipse cx="58" cy="44" rx="3" ry="3" fill="#1e293b" />
                                                    {/* Smile */}
                                                    <path d="M42,54 Q50,60 58,54" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                                                    {/* Body/Shirt */}
                                                    <ellipse cx="50" cy="90" rx="30" ry="20" fill="#3b82f6" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 w-10 h-10 bg-primary shadow-xl rounded-full flex items-center justify-center border-2 border-[#1e293b] text-white hover:scale-110 transition-transform"
                                >
                                    <CameraIcon className="w-5 h-5" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarSetup} className="hidden" accept="image/*" />
                            </div>
                        </div>

                        {/* Middle: Name & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{language === 'ru' ? 'ВАШЕ ИМЯ' : 'NAME'}</label>
                                <input 
                                    value={regName} 
                                    onChange={(e) => setRegName(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-bold text-sm"
                                    placeholder="GuestUser"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block tracking-widest">{language === 'ru' ? 'ПОЛ' : 'GENDER'}</label>
                                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 h-[46px]">
                                    {(['male', 'female'] as const).map(g => (
                                        <button 
                                            key={g} 
                                            onClick={() => setRegGender(g)} 
                                            className={`flex-1 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter ${regGender === g ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {language === 'ru' ? (g === 'male' ? 'Мужской' : 'Женский') : g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Bottom: Pickers */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <DrumPicker label={language === 'ru' ? 'ВОЗРАСТ' : 'AGE'} options={AGES} value={regAge} onChange={setRegAge} />
                            <DrumPicker label={language === 'ru' ? 'СТРАНА' : 'COUNTRY'} options={COUNTRIES_DATA.map(c => c.name)} value={regCountry} onChange={setRegCountry} />
                            <DrumPicker label={language === 'ru' ? 'ГОРОД' : 'CITY'} options={availableCitiesReg} value={regCity} onChange={setRegCity} />
                        </div>

                        <button 
                            onClick={handleRegistrationComplete} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(188,111,241,0.25)] hover:shadow-primary/40 hover:scale-[1.01] active:scale-95 transition-all text-xs"
                        >
                            {language === 'ru' ? 'СОХРАНИТЬ' : 'SAVE'}
                        </button>

                        {/* Chat Settings Section */}
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{language === 'ru' ? 'Настройки чата' : 'Chat Settings'}</h4>
                            
                            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <BellIcon className={`w-5 h-5 ${regNotificationsEnabled ? 'text-primary' : 'text-slate-500'}`} />
                                    <span className="text-xs font-bold text-white">{language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
                                </div>
                                <button 
                                    onClick={() => setRegNotificationsEnabled(!regNotificationsEnabled)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${regNotificationsEnabled ? 'bg-primary' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${regNotificationsEnabled ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ru' ? 'Громкость уведомлений' : 'Notification Volume'}</label>
                                    <span className="text-[10px] font-mono text-primary">{Math.round(regNotificationVolume * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.05" 
                                    value={regNotificationVolume} 
                                    onChange={(e) => setRegNotificationVolume(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">{language === 'ru' ? 'Звук уведомления' : 'Notification Sound'}</label>
                                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                                    {(['default', 'soft', 'alert'] as const).map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => setRegNotificationSound(s)} 
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all uppercase ${regNotificationSound === s ? 'bg-white/10 text-primary' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'search' && (
                <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                    <div className="p-6 overflow-y-auto no-scrollbar pb-20">
                        <div className="space-y-4 mb-8">
                            <h3 className="text-xl font-black text-white text-center mb-4">{t.findFriends}</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{language === 'ru' ? 'Возраст от' : 'Age from'}</label>
                                    <select 
                                        value={searchAgeFrom} 
                                        onChange={(e) => setSearchAgeFrom(e.target.value)} 
                                        className={`w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs outline-none appearance-none font-bold transition-all ${searchAgeFrom === '18' ? 'text-slate-500' : 'text-white'}`}
                                    >
                                        {AGES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{language === 'ru' ? 'до' : 'to'}</label>
                                    <select 
                                        value={searchAgeTo} 
                                        onChange={(e) => setSearchAgeTo(e.target.value)} 
                                        className={`w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs outline-none appearance-none font-bold transition-all ${searchAgeTo === '80' ? 'text-slate-500' : 'text-white'}`}
                                    >
                                        {AGES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t.country}</label><select value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-white text-xs outline-none appearance-none font-bold"><option value="Any" className="bg-slate-900">{t.any}</option>{COUNTRIES_DATA.map(c => <option key={c.name} value={c.name} className="bg-slate-900">{c.name}</option>)}</select></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t.city}</label><select value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-white text-xs outline-none appearance-none font-bold"><option value="Any" className="bg-slate-900">{t.any}</option>{availableCitiesSearch.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}</select></div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t.gender}</label>
                                    <div className="flex bg-white/5 rounded-xl p-1">
                                        {(['male', 'female'] as const).map(g => (
                                            <button key={g} onClick={() => setSearchGender(searchGender === g ? 'any' : g)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase ${searchGender === g ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t[g]}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSearch} className="w-full py-3.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"><SearchIcon className="w-4 h-4" /> {t.search}</button>
                        </div>
                        <div className="space-y-3">
                            {(searchResults.length > 0 ? searchResults : onlineUsers).map(user => (
                                <div key={user.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="relative"><img src={user.avatar || ''} className="w-12 h-12 rounded-xl object-cover bg-slate-800" /><div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1e293b] ${user.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div></div>
                                    <div className="flex-1 min-w-0"><h5 className="font-bold text-sm text-white truncate">{user.name}</h5><p className="text-[10px] text-slate-400 font-medium">{user.age} • {user.city}</p></div>
                                    {user.id === currentUser.id ? (
                                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-[10px] font-black uppercase tracking-widest shadow-inner">
                                            {t.online}
                                        </div>
                                    ) : (
                                        <button onClick={() => handleKnock(user)} disabled={sentKnocks.has(user.id)} className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${sentKnocks.has(user.id) ? 'bg-green-500/20 text-green-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'}`}>{sentKnocks.has(user.id) ? t.knockSent : t.knock}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'inbox' && (
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 animate-in slide-in-from-right duration-300">
                    {pendingKnocks.length > 0 && (
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
                            <div className="text-center py-8 text-slate-500">
                                <p className="text-xs">{language === 'ru' ? 'Нет активных диалогов' : 'No active dialogs'}</p>
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
            </div>
        )}

        <div className="px-4 py-3 bg-[var(--player-bar-bg)] border-t border-[var(--panel-border)] relative shrink-0 z-30">
            <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-3 w-full"><button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className={`p-2 rounded-xl transition-all ${isVolumeOpen ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white'}`}><VolumeIcon className="w-5 h-5" /></button><div className="h-8 flex-1 bg-black/30 rounded-lg overflow-hidden relative border border-white/5 flex items-center justify-center"><AudioVisualizer analyserNode={analyserNode} isPlaying={isPlaying} variant="segmented" settings={{ scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 0.4, speed: 1, autoIdle: false, performanceMode: true, energySaver: false }} /><div className="absolute inset-0 flex items-center justify-between px-3"><span className="text-[9px] font-black text-white truncate max-w-[100px]">{currentStation?.name || 'Radio'}</span>{isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}</div></div><button onClick={() => setIsPlayerOpen(!isPlayerOpen)} className="p-2 text-slate-400 hover:text-white">{isPlayerOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}</button></div></div>
            {isVolumeOpen && (<div className="absolute left-4 bottom-16 z-50 bg-[#0f172a] p-3 rounded-xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2"><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => onVolumeChange(parseFloat(e.target.value))} className="w-32 h-1 accent-primary cursor-pointer" /></div>)}
            {isPlayerOpen && (<div className="flex items-center justify-center gap-6 py-2 animate-in slide-in-from-top-2"><button onClick={onPrevStation} className="text-slate-400 hover:text-white transition-colors"><PreviousIcon className="w-5 h-5" /></button><button onClick={onTogglePlay} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">{isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}</button><button onClick={onNextStation} className="text-slate-400 hover:text-white transition-colors"><NextIcon className="w-5 h-5" /></button></div>)}
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

    </aside>
  );
};

export default ChatPanelEnhanced;
