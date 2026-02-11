import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { RadioStation, CategoryInfo, ViewMode, ThemeName, BaseTheme, Language, UserProfile, VisualizerVariant, VisualizerSettings, AmbienceState, PassportData, BottleMessage, AlarmConfig, FxSettings, AudioProcessSettings } from './types';
import { GENRES, ERAS, MOODS, EFFECTS, DEFAULT_VOLUME, TRANSLATIONS, ACHIEVEMENTS_LIST, GLOBAL_PRESETS } from './constants';
import { fetchStationsByTag, fetchStationsByUuids } from './services/radioService';
import { curateStationList, isAiAvailable } from './services/geminiService';
import { socketService } from './services/socketService';
import AudioVisualizer from './components/AudioVisualizer';
import DancingAvatar from './components/DancingAvatar';
import CosmicBackground from './components/CosmicBackground';
import RainEffect from './components/RainEffect';
import NewsCarousel from './components/NewsCarousel';
import FireEffect from './components/FireEffect';
import { geolocationService, LocationData } from './services/geolocationService';
import { 
  PauseIcon, VolumeIcon, LoadingIcon, MusicNoteIcon, HeartIcon, MenuIcon, AdjustmentsIcon,
  PlayIcon, ChatBubbleIcon, NextIcon, PreviousIcon, XMarkIcon, DownloadIcon,
  SwatchIcon, EnvelopeIcon, LifeBuoyIcon, ShuffleIcon, PlusIcon, ShareIcon, // Using PlusIcon as placeholder for EQ if needed, or AdjustmentsIcon
  QuestionMarkCircleIcon, RocketIcon
} from './components/Icons';

const ToolsPanel = React.lazy(() => import('./components/ToolsPanel'));
const ChatPanel = React.lazy(() => import('./components/ChatPanelEnhanced'));
const ManualModal = React.lazy(() => import('./components/ManualModal'));
const TutorialOverlay = React.lazy(() => import('./components/TutorialOverlay'));
const DownloadAppModal = React.lazy(() => import('./components/DownloadAppModal'));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal'));
const ShareModal = React.lazy(() => import('./components/ShareModal'));
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './AuthProvider';

const THEME_COLORS: Record<ThemeName, { primary: string; secondary: string }> = {
  default: { primary: '#bc6ff1', secondary: '#f038ff' },
  emerald: { primary: '#00ff9f', secondary: '#00b8ff' },
  midnight: { primary: '#4d4dff', secondary: '#a64dff' },
  cyber: { primary: '#ff00ff', secondary: '#00ffff' },
  volcano: { primary: '#ff3c00', secondary: '#ffcc00' },
  ocean: { primary: '#00d2ff', secondary: '#3a7bd5' },
  sakura: { primary: '#ff758c', secondary: '#ff7eb3' },
  gold: { primary: '#ffcc33', secondary: '#cc9900' },
  frost: { primary: '#74ebd5', secondary: '#acb6e5' },
  forest: { primary: '#a8ff78', secondary: '#78ffd6' },
};

const DEFAULT_VIZ_SETTINGS: VisualizerSettings = {
  scaleX: 1,
  scaleY: 1,
  brightness: 110,
  contrast: 130,
  saturation: 120,
  hue: 0,
  opacity: 1,
  speed: 1,
  autoIdle: true,
  performanceMode: true,
  energySaver: false,
  barDensity: 1.4,
  vizAlignment: 'bottom',
  glowIntensity: 1.4,
  bgOpacity: 0
};

const INITIAL_CHUNK = 5; 
const TRICKLE_STEP = 5;
const AUTO_TRICKLE_LIMIT = 15;
const PAGE_SIZE = 10;

// Replaced with more reliable direct MP3 links
const AMBIENCE_URLS = {
    rain_soft: 'https://soundbible.com/mp3/Rain_Background-Mike_Koenig-1681389445.mp3',
    rain_roof: 'https://soundbible.com/mp3/Rain_Background-Mike_Koenig-1681389445.mp3', // Fallback to same reliable source
    fire: '/kamin.mp3',
    city: 'https://soundbible.com/mp3/City_Traffic-Sound_Explorer-1662968325.mp3',
    vinyl: 'https://cdn.pixabay.com/audio/2022/02/07/audio_6527581fb9.mp3' 
};

const StationCard = React.memo(({ 
  station, isSelected, isFavorite, onPlay, onToggleFavorite, index 
}: { 
  station: RadioStation; isSelected: boolean; isFavorite: boolean; 
  onPlay: (s: RadioStation) => void; onToggleFavorite: (id: string) => void; index: number;
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={() => onPlay(station)} 
      className={`group relative rounded-[2rem] p-5 cursor-pointer transition-all border-2 animate-in fade-in slide-in-from-bottom-3 duration-500 ${isSelected ? 'bg-[var(--selected-item-bg)] border-primary shadow-2xl shadow-primary/20 scale-[1.02]' : 'bg-black/60 backdrop-blur-md border-[var(--panel-border)] hover:border-white/20 hover:bg-black/80'}`}
      style={{ animationDelay: `${(index % 5) * 50}ms` }}
    >
      <div className="flex justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-800/50 relative shadow-inner">
          {!imgLoaded && !imgError && <div className="absolute inset-0 skeleton-loader" />}
          {station.favicon && !imgError ? (
            <img src={station.favicon} loading="lazy" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`} />
          ) : (
            <MusicNoteIcon className="w-6 h-6 text-slate-600" />
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(station.stationuuid); }} className={`p-2 rounded-full transition-all active:scale-150 ${isFavorite ? 'text-secondary bg-secondary/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
          <HeartIcon className="w-5 h-5" filled={isFavorite} />
        </button>
      </div>
      <h3 className="font-bold truncate text-[var(--text-base)] text-sm group-hover:text-primary transition-colors">{station.name}</h3>
      <p className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest truncate">{station.tags || 'Music'} • {station.bitrate || 128}K</p>
    </div>
  );
});

const COUNTRY_FLAGS: Record<string, string> = {
  'Kazakhstan': '🇰🇿', 'KZ': '🇰🇿',
  'Russia': '🇷🇺', 'RU': '🇷🇺',
  'USA': '🇺🇸', 'US': '🇺🇸',
  'Uzbekistan': '🇺🇿', 'UZ': '🇺🇿',
  'Ukraine': '🇺🇦', 'UA': '🇺🇦',
  'Germany': '🇩🇪', 'DE': '🇩🇪',
  'France': '🇫🇷', 'FR': '🇫🇷',
  'China': '🇨🇳', 'CN': '🇨🇳',
  'Japan': '🇯🇵', 'JP': '🇯🇵',
  'UK': '🇬🇧', 'GB': '🇬🇧',
  'Kyrgyzstan': '🇰🇬', 'KG': '🇰🇬',
  'Turkey': '🇹🇷', 'TR': '🇹🇷',
  'Global': '🌍'
};

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  'KZ': { en: 'Kazakhstan', ru: 'Казахстан' },
  'Kazakhstan': { en: 'Kazakhstan', ru: 'Казахстан' },
  'RU': { en: 'Russia', ru: 'Россия' },
  'Russia': { en: 'Russia', ru: 'Россия' },
  'US': { en: 'USA', ru: 'США' },
  'USA': { en: 'USA', ru: 'США' },
  'UZ': { en: 'Uzbekistan', ru: 'Узбекистан' },
  'UA': { en: 'Ukraine', ru: 'Украина' },
  'DE': { en: 'Germany', ru: 'Германия' },
  'TR': { en: 'Turkey', ru: 'Турция' },
  'Global': { en: 'Global', ru: 'Весь мир' }
};

function getCountryName(code: string, lang: 'en' | 'ru'): string {
    const map = COUNTRY_NAMES[code] || COUNTRY_NAMES[code.toUpperCase()];
    return map ? map[lang] : code;
}

function getCountryFlag(country: string): string {
    return COUNTRY_FLAGS[country] || COUNTRY_FLAGS[country.toUpperCase()] || '🌍';
}

export default function App(): React.JSX.Element {
  const { user, isAuthorized } = useAuth();

  // Radio State
  const [viewMode, setViewMode] = useState<ViewMode>('genres');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(GENRES[0]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_CHUNK);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);

  // AI State
  const [isAiCurating, setIsAiCurating] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Common Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  // UI State
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);


  const handleApplyPreset = (presetId: string) => {
      const preset = GLOBAL_PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      setActivePresetId(presetId);
      
      // Apply Theme
      if (preset.theme) {
        setCurrentTheme(preset.theme as ThemeName);
      }
      
      // Apply EQ
      setEqGains(preset.eq);
      
      // Apply FX
      setFxSettings(prev => ({ ...prev, ...preset.fx }));
      
      // Apply Dynamics
      setAudioEnhancements(prev => ({ ...prev, ...preset.process }));

      // Apply Ambience
      // @ts-ignore - Validating existence of property on runtime object
      if (preset.ambience) {
          // @ts-ignore
          setAmbience(prev => ({ ...prev, ...preset.ambience }));
      }
  };

  const [highlightFeature, setHighlightFeature] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  const [sleepTimer, setSleepTimer] = useState<number | null>(null); 
  const [eqGains, setEqGains] = useState<number[]>(new Array(10).fill(0));
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamflow_current_theme') as ThemeName;
      if (saved) return saved;
    }
    return 'volcano';
  });
  const [baseTheme, setBaseTheme] = useState<BaseTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamflow_base_theme') as BaseTheme;
      if (saved) return saved;
    }
    return 'dark';
  });
  const [customCardColor, setCustomCardColor] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamflow_language') as Language;
      if (saved) return saved;
      
      const cached = geolocationService.getCachedLocation();
      if (cached && cached.country) {
        const ruCountries = ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Armenia', 'Azerbaijan', 'Georgia', 'Moldova'];
        if (ruCountries.includes(cached.country)) return 'ru';
      }
    }
    return 'ru';
  });
  const [visualizerVariant, setVisualizerVariant] = useState<VisualizerVariant>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'stage-dancer';
    return 'segmented';
  });
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>(DEFAULT_VIZ_SETTINGS);
  const [danceStyle, setDanceStyle] = useState<number>(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isRandomMode, setIsRandomMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('streamflow_random_mode') === 'true';
    }
    return false;
  });
  const [isIdleView, setIsIdleView] = useState(false);
  const [newsIndex, setNewsIndex] = useState(0);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [fxSettings, setFxSettings] = useState<FxSettings>({ reverb: 0, speed: 1.0 });
  const [onlineStats, setOnlineStats] = useState({ totalOnline: 0, chatOnline: 0 });
  const [countryStats, setCountryStats] = useState<Record<string, number>>({});
  const [pendingKnocksCount, setPendingKnocksCount] = useState(0);
  
  const [audioEnhancements, setAudioEnhancements] = useState<AudioProcessSettings>({
      compressorEnabled: false,
      compressorThreshold: -24,
      compressorRatio: 12,
      bassBoost: 0,
      loudness: 0
  });

  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'ready' | 'error'>('detecting');

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const defaultSettings = {
      notificationsEnabled: true,
      notificationVolume: 0.8,
      notificationSound: 'default' as const
    };

    try {
      const saved = localStorage.getItem('streamflow_user_profile');
      if (saved) {
        const profile = JSON.parse(saved);
        
        // Ensure chatSettings exist
        if (!profile.chatSettings) profile.chatSettings = defaultSettings;
        return profile;
      }
    } catch (e) {}
    
    return {
      id: '', 
      name: '', 
      avatar: null,
      age: 0,
      gender: 'other',
      status: 'online',
      safetyLevel: 'green',
      blockedUsers: [],
      bio: '',
      hasAgreedToRules: false,
      isAuthenticated: false,
      filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true },
      chatSettings: defaultSettings
    };
  });

  const [ambience, setAmbience] = useState<AmbienceState>({ 
      rainVolume: 0, rainVariant: 'soft', fireVolume: 0, cityVolume: 0, vinylVolume: 0, is8DEnabled: false, spatialSpeed: 1 
  });
  const [passport, setPassport] = useState<PassportData>(() => { try { return JSON.parse(localStorage.getItem('streamflow_passport') || '') } catch { return { countriesVisited: [], totalListeningMinutes: 0, nightListeningMinutes: 0, stationsFavorited: 0, unlockedAchievements: [], level: 1 } } });
  const [alarm, setAlarm] = useState<AlarmConfig>({ enabled: false, time: '08:00', days: [1,2,3,4,5] });

  // Derived state for visual mode based on settings
  const visualMode = useMemo(() => {
      if (vizSettings.energySaver) return 'low';
      if (vizSettings.performanceMode) return 'medium';
      return 'high';
  }, [vizSettings.energySaver, vizSettings.performanceMode]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const ambienceRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  
  const dryGainNodeRef = useRef<GainNode | null>(null);
  const wetGainNodeRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);

  const pannerIntervalRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef<number>(0);
  const sleepIntervalRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Connect socket regardless of auth for presence/bridge sessions
    socketService.connect();

    if (isAuthorized && user) {
        setCurrentUser(prev => {
            const updated = { 
                ...prev, 
                id: user.uid, 
                name: prev.name || user.displayName || '',
                isAuthenticated: true 
            };
            // Persist to localStorage for rapid hydration, but not sensitive token
            localStorage.setItem('streamflow_user_profile', JSON.stringify(updated));
            return updated;
        });
    } else {
        setCurrentUser(prev => ({ ...prev, isAuthenticated: false }));
    }
  }, [isAuthorized, user]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Auto-hide sidebar in mobile landscape after inactivity
  useEffect(() => {
    if (!sidebarOpen) return;

    let hideTimer: number;

        const resetHideTimer = () => {
        clearTimeout(hideTimer);
        // Auto-hide on mobile after 3 seconds of inactivity
        if (window.innerWidth < 768) {
            hideTimer = window.setTimeout(() => {
                setSidebarOpen(false);
            }, 3000);
        }
    };

    resetHideTimer();

    // Reset timer on user activity
    window.addEventListener('touchstart', resetHideTimer);
    window.addEventListener('click', resetHideTimer);
    window.addEventListener('scroll', resetHideTimer);
    window.addEventListener('mousemove', resetHideTimer);
    window.addEventListener('resize', resetHideTimer);

    return () => {
        clearTimeout(hideTimer);
        window.removeEventListener('touchstart', resetHideTimer);
        window.removeEventListener('click', resetHideTimer);
        window.removeEventListener('scroll', resetHideTimer);
        window.removeEventListener('mousemove', resetHideTimer);
        window.removeEventListener('resize', resetHideTimer);
    };
  }, [sidebarOpen]);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;
    try {
        // Optimization for Bluetooth: 'playback' latency hint reduces stuttering on wireless devices
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
            sampleRate: 44100,
            latencyHint: 'playback'
        });
        audioContextRef.current = ctx;
        if (!audioRef.current) return;
        const source = ctx.createMediaElementSource(audioRef.current);

        const reverb = ctx.createConvolver();
        reverbNodeRef.current = reverb;
        const rate = ctx.sampleRate;
        const length = rate * 1.2; 
        const decay = 2.0;
        const impulse = ctx.createBuffer(2, length, rate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        reverb.buffer = impulse;

        const dryGain = ctx.createGain(); 
        const wetGain = ctx.createGain(); 
        wetGain.gain.value = 0; 
        dryGainNodeRef.current = dryGain;
        wetGainNodeRef.current = wetGain;

        const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const filters = frequencies.map(freq => {
            const f = ctx.createBiquadFilter();
            f.type = 'peaking';
            f.frequency.value = freq;
            f.Q.value = 1;
            f.gain.value = 0;
            return f;
        });
        filtersRef.current = filters;

        const panner = ctx.createStereoPanner();
        pannerNodeRef.current = panner;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048; 
        analyserNodeRef.current = analyser;

        source.connect(dryGain);
        source.connect(reverb);
        reverb.connect(wetGain);

        dryGain.connect(filters[0]);
        wetGain.connect(filters[0]);

        let node: AudioNode = filters[0];
        for (let i = 1; i < filters.length; i++) {
            node.connect(filters[i]);
            node = filters[i];
        }

        node.connect(panner);
        panner.connect(analyser);
        analyser.connect(ctx.destination);

    } catch (e) {}
  }, []);

  useEffect(() => {
      if (wetGainNodeRef.current && dryGainNodeRef.current) {
          wetGainNodeRef.current.gain.value = fxSettings.reverb;
          dryGainNodeRef.current.gain.value = 1 - (fxSettings.reverb * 0.4); 
      }
      if (audioRef.current) {
          audioRef.current.playbackRate = fxSettings.speed;
      }
  }, [fxSettings]);

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      sleepIntervalRef.current = window.setInterval(() => {
        setSleepTimer((prev) => {
          if (prev !== null && prev > 0) {
            const next = prev - 1;
            if (next <= 0) {
              setIsPlaying(false);
              if (audioRef.current) audioRef.current.pause();
              return null;
            }
            return next;
          }
          return null;
        });
      }, 60000); 
    } else {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    }
    return () => { if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current); };
  }, [sleepTimer]);

  const triggerLocationDetection = useCallback(async () => {
    setLocationStatus('detecting');
    try {
      const loc = await geolocationService.detectLocation();
      if (loc && loc.country !== 'Unknown') {
        setDetectedLocation(loc);
        setLocationStatus('ready');
        
        // Auto-switch language based on country if not set
        if (!localStorage.getItem('streamflow_language')) {
          const ruCountries = ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Armenia', 'Azerbaijan', 'Georgia', 'Moldova'];
          if (ruCountries.includes(loc.country)) setLanguage('ru');
          else setLanguage('en');
        }
      } else {
        setLocationStatus('error');
      }
    } catch (err) {
      console.error('[GEO] Silent detection error:', err);
      setLocationStatus('error');
    }
  }, []);

  useEffect(() => {
    triggerLocationDetection();
  }, [triggerLocationDetection]);

  const handlePlayStation = useCallback((station: RadioStation) => {
    if (locationStatus !== 'ready') {
        alert(language === 'ru' ? '📍 Определение местоположения необходимо для запуска радио и входа в чат.' : '📍 Location detection is required to start the radio and enter the chat.');
        return;
    }
    initAudioContext();
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    
    // Clear any pending load timeout
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    setCurrentStation(station);
    setIsPlaying(true);
    setIsBuffering(true);
    
    if (audioRef.current) {
        audioRef.current.src = station.url_resolved;
        audioRef.current.crossOrigin = "anonymous";
        audioRef.current.playbackRate = fxSettings.speed; 
        audioRef.current.play().catch(() => {});

        // Set 3-second timeout to check if station is "alive"
        // If it fails to play in 3s, remove it and skip to next
        loadTimeoutRef.current = window.setTimeout(() => {
            console.warn(`[RADIO] Station ${station.name} is too slow. Filtering and skipping.`);
            
            setStations(prev => {
                const currentIndex = prev.findIndex(s => s.stationuuid === station.stationuuid);
                const newList = prev.filter(s => s.stationuuid !== station.stationuuid);
                
                if (newList.length > 0) {
                    // Try to play next station in the list
                    const nextIndex = currentIndex % newList.length;
                    setTimeout(() => handlePlayStation(newList[nextIndex]), 10);
                }
                return newList;
            });
            
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            setIsPlaying(false);
            setIsBuffering(false);
        }, 3000);
    }
  }, [initAudioContext, fxSettings.speed]);
  // Removed language from dependency because we no longer use it for notifications here

  useEffect(() => {
    const checkAlarm = setInterval(() => {
      if (alarm.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay();
        
        if (currentTime === alarm.time && alarm.days.includes(currentDay)) {
           if (!isPlaying && stations.length > 0) {
             handlePlayStation(currentStation || stations[0]);
           }
        }
      }
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarm, isPlaying, currentStation, stations, handlePlayStation]);

  // Idle View Removed as per request
  useEffect(() => {
    // Legacy cleanup
    setIsIdleView(false);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (locationStatus !== 'ready') {
        alert(language === 'ru' ? '📍 Определение местоположения необходимо для запуска радио.' : '📍 Location detection is required to start the radio.');
        return;
    }
    if (!currentStation) {
        if (stations.length) handlePlayStation(stations[0]);
        return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      audioRef.current.play().catch(() => {});
    }
  };

    // Persistence and Effects
    useEffect(() => {
        localStorage.setItem('streamflow_random_mode', isRandomMode.toString());
    }, [isRandomMode]);

    const handleNextStation = useCallback(async () => {
      if (isRandomMode) {
          // RANDOM MODE LOGIC: Pick a random safe category
          const safeGenres = GENRES;
          const safeMoods = MOODS;
          const safeEras = ERAS;
          // Combine all "safe" categories
          const allSafe = [...safeGenres, ...safeMoods, ...safeEras];
          const randomCat = allSafe[Math.floor(Math.random() * allSafe.length)];
          
          setIsLoading(true);
          try {
              const randomStations = await fetchStationsByTag(randomCat.id, 20);
              if (randomStations.length > 0) {
                  const randomStation = randomStations[Math.floor(Math.random() * randomStations.length)];
                  handlePlayStation(randomStation);
                  // Optionally update categories to reflect where we are
                  setSelectedCategory(randomCat);
                  setStations(randomStations);
                  // Determine mode
                  if (GENRES.some(g => g.id === randomCat.id)) setViewMode('genres');
                  else if (MOODS.some(m => m.id === randomCat.id)) setViewMode('moods');
                  else setViewMode('eras');
              }
          } catch (e) {
              console.error('Failed to fetch random station', e);
          } finally {
              setIsLoading(false);
          }
          return;
      }

      if (!stations.length) return;
      const currentIndex = currentStation ? stations.findIndex(s => s.stationuuid === currentStation.stationuuid) : -1;
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % stations.length;
      handlePlayStation(stations[nextIndex]);
    }, [stations, currentStation, handlePlayStation, isRandomMode]);

  // Play Button Visualization Effect
  useEffect(() => {
    let animationFrame: number;
    
    // Helper to get theme color
    const getThemeColor = () => {
        // Map theme names to hex colors
        const colors: Record<string, string> = {
            'neon': '#f472b6', // pink-400
            'ocean': '#38bdf8', // sky-400
            'forest': '#4ade80', // green-400
            'sunset': '#fb923c', // orange-400
            'midnight': '#818cf8', // indigo-400
            'default': '#fbcfe8'
        };
        return colors[currentTheme] || '#ffffff';
    };

    const animateButton = () => {
        if (!playButtonRef.current) return;
        
        if (isPlaying && !isBuffering) {
            // Simulate audio reactivity (since we don't have direct access to the main analyser node here without context refactoring)
            // We use a combination of sine waves to create a "breathing" + "jitter" effect that looks like music
            const time = Date.now() / 150;
            const beat = Math.sin(time) * 0.5 + 0.5; // 0 to 1 pulsing
            const jitter = Math.random() * 0.3; // Random noise
            
            const scale = 1 + (beat * 0.05) + (jitter * 0.02); // Scale between 1.0 and 1.1 (уменьшено)
            const glowSize = 5 + (beat * 8) + (jitter * 5); // Shadow between 5px and 18px (уменьшено)
            const color = getThemeColor();
            
            playButtonRef.current.style.transform = `scale(${scale})`;
            playButtonRef.current.style.boxShadow = `0 0 ${glowSize}px ${color}80`; // Добавлен 80 для 50% opacity
            playButtonRef.current.style.borderColor = color;
        } else {
            playButtonRef.current.style.transform = 'scale(1)';
            playButtonRef.current.style.boxShadow = 'none';
        }
        
        animationFrame = requestAnimationFrame(animateButton);
    };

    if (isPlaying) {
        animationFrame = requestAnimationFrame(animateButton);
    } else if (playButtonRef.current) {
        playButtonRef.current.style.transform = 'scale(1)';
        playButtonRef.current.style.boxShadow = 'none';
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, isBuffering, currentTheme]);

  const handlePreviousStation = useCallback(() => {
      if (!stations.length) return;
      const currentIndex = currentStation ? stations.findIndex(s => s.stationuuid === currentStation.stationuuid) : -1;
      const prevIndex = currentIndex === -1 ? stations.length - 1 : (currentIndex - 1 + stations.length) % stations.length;
      handlePlayStation(stations[prevIndex]);
  }, [stations, currentStation, handlePlayStation]);

  useEffect(() => {
    if (isLoading) return;
    if (stations.length > visibleCount && visibleCount < AUTO_TRICKLE_LIMIT) {
      trickleTimerRef.current = window.setTimeout(() => { setVisibleCount(prev => Math.min(prev + TRICKLE_STEP, stations.length)); }, 180); 
    }
    return () => { if (trickleTimerRef.current) clearTimeout(trickleTimerRef.current); };
  }, [isLoading, stations.length, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && !isLoading && stations.length > visibleCount) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, stations.length));
            }
        },
        { threshold: 0.1 }
    );
    if (loaderRef.current) {
        observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [isLoading, stations.length, visibleCount]);

  useEffect(() => {
    if (ambience.is8DEnabled) {
        let angle = 0;
        if (pannerIntervalRef.current) clearInterval(pannerIntervalRef.current);
        pannerIntervalRef.current = window.setInterval(() => {
           if (pannerNodeRef.current) { angle += 0.02 * ambience.spatialSpeed; pannerNodeRef.current.pan.value = Math.sin(angle); }
        }, 30);
    } else {
        if (pannerIntervalRef.current) clearInterval(pannerIntervalRef.current);
        if (pannerNodeRef.current) pannerNodeRef.current.pan.value = 0;
    }
    return () => { if (pannerIntervalRef.current) clearInterval(pannerIntervalRef.current); };
  }, [ambience.is8DEnabled, ambience.spatialSpeed]);

  useEffect(() => {
      ['rain', 'fire', 'city', 'vinyl'].forEach(key => {
          let url = '';
          if (key === 'rain') {
              const rawUrl = ambience.rainVariant === 'roof' ? AMBIENCE_URLS.rain_roof : AMBIENCE_URLS.rain_soft;
              url = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, window.location.origin).href;
          } else {
              const rawUrl = (AMBIENCE_URLS as any)[key];
              url = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, window.location.origin).href;
          }
          let el = ambienceRefs.current[key];
          if (!el) { 
              el = new Audio(url); 
              el.loop = true; 
              el.preload = "auto";
              if (url.includes('stream')) { el.crossOrigin = "anonymous"; }
              ambienceRefs.current[key] = el; 
          } else {
              const currentSrc = new URL(el.src, window.location.origin).pathname;
              const targetSrc = url.startsWith('http') ? url : (url.startsWith('/') ? url : '/' + url);
              
              if (currentSrc !== targetSrc && el.src !== url) {
                  const wasPlaying = !el.paused;
                  el.src = url;
                  if (wasPlaying) el.play().catch(e => console.error(`[AMBIENCE] Resume failed for ${key}`, e));
              }
          }
          const vol = (ambience as any)[`${key}Volume`]; 
          el.volume = vol;
          if (vol > 0 && el.paused) {
              console.log(`[AMBIENCE] Playing ${key} from ${el.src}`);
              el.play().catch(e => console.error(`Ambience ${key} failed to play:`, e));
          } else if (vol === 0 && !el.paused) {
              el.pause();
          }
      });
  }, [ambience.rainVolume, ambience.rainVariant, ambience.fireVolume, ambience.cityVolume, ambience.vinylVolume]);

  useEffect(() => { filtersRef.current.forEach((f, i) => { if (eqGains[i] !== undefined) f.gain.value = eqGains[i]; }); }, [eqGains]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  
  useEffect(() => {
    if (baseTheme === 'light') { document.body.classList.add('light-mode'); } else { document.body.classList.remove('light-mode'); }
    const colors = THEME_COLORS[currentTheme];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    if (customCardColor) {
        const opacity = baseTheme === 'light' ? 0.9 : 0.20; 
        const panelOpacity = baseTheme === 'light' ? 0.98 : 0.25; 
        const inputOpacity = baseTheme === 'light' ? 0.3 : 0.15;
        const borderOpacity = 0.2;
        root.style.setProperty('--card-bg', `rgba(${customCardColor}, ${opacity})`);
        root.style.setProperty('--panel-bg', `rgba(${customCardColor}, ${panelOpacity})`);
        root.style.setProperty('--input-bg', `rgba(${customCardColor}, ${inputOpacity})`);
        root.style.setProperty('--card-border', `rgba(${customCardColor}, ${borderOpacity})`);
        root.style.setProperty('--panel-border', `rgba(${customCardColor}, ${borderOpacity})`);
    } else {
        root.style.removeProperty('--card-bg'); root.style.removeProperty('--panel-bg'); root.style.removeProperty('--input-bg'); root.style.removeProperty('--card-border'); root.style.removeProperty('--panel-border');
    }
    localStorage.setItem('streamflow_current_theme', currentTheme);
    localStorage.setItem('streamflow_base_theme', baseTheme);
  }, [currentTheme, baseTheme, customCardColor]);

  useEffect(() => {
    localStorage.setItem('streamflow_language', language);
  }, [language]);

  // Persistent User Profile protection
  useEffect(() => {
    if (currentUser && currentUser.id) {
        localStorage.setItem('streamflow_user_profile', JSON.stringify(currentUser));
    }
  }, [currentUser]);
  
  const dedupeStations = (data: RadioStation[]) => {
    const seen = new Set();
    return data.filter(s => {
      const key = s.url_resolved.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('?')[0].split('#')[0].replace(/\/$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentStation) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentStation.name,
          artist: currentStation.tags || 'StreamFlow Radio',
          album: 'StreamFlow Live',
          artwork: [
            { src: currentStation.favicon || '/logo192.png', sizes: '96x96', type: 'image/png' },
            { src: currentStation.favicon || '/logo192.png', sizes: '128x128', type: 'image/png' },
            { src: currentStation.favicon || '/logo192.png', sizes: '192x192', type: 'image/png' },
            { src: currentStation.favicon || '/logo512.png', sizes: '512x512', type: 'image/png' },
          ]
        });
      }

      // Explicitly tell the system if we are playing or paused
      // This is crucial for Bluetooth speakers to correctly show the button state (Play vs Pause)
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', handlePreviousStation);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextStation);

      return () => {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      };
    }
  }, [currentStation, isPlaying, togglePlay, handleNextStation, handlePreviousStation]);

  useEffect(() => {
    // Subscribe to presence updates (only active if socket is connected via initAuth)
    const cleanupPresence = socketService.onPresenceCount((stats) => {
        setOnlineStats(stats);
    });

    const cleanupPresenceList = socketService.onPresenceList((users) => {
         const stats: Record<string, number> = {};
         users.forEach(u => {
             // Prefer detectedCountry (IP based) or fallback to profile country
             const c = u.detectedCountry || u.country || 'Global';
             // Normalize: if it looks like a full name, map it? For now just use it.
             // We can rely on getCountryFlag to handle mapping if needed.
             // Ideally we want short codes "KZ", "RU"
             stats[c] = (stats[c] || 0) + 1;
         });
         setCountryStats(stats);
    });

    // Handle incoming knocks
    return () => {
      cleanupPresence();
      cleanupPresenceList();
    };
  }, []);

  const loadCategory = useCallback(async (category: CategoryInfo | null, mode: ViewMode, autoPlay: boolean = false) => { 
    const requestId = Date.now();
    loadRequestIdRef.current = requestId;
    setViewMode(mode); setSelectedCategory(category); setIsLoading(true); setVisibleCount(INITIAL_CHUNK); setStations([]);
    setIsAiCurating(false); 
    try {
      if (mode === 'favorites') {
        const savedFavs = localStorage.getItem('streamflow_favorites');
        const favUuids = savedFavs ? JSON.parse(savedFavs) : [];
        const data = favUuids.length ? await fetchStationsByUuids(favUuids) : [];
        const dedupedPrev = dedupeStations(data);
        if (loadRequestIdRef.current === requestId) { setStations(dedupedPrev); setIsLoading(false); if (dedupedPrev.length > 0 && autoPlay) handlePlayStation(dedupedPrev[0]); }
      } else if (category) {
        const fastData = await fetchStationsByTag(category.id, 10);
        const dedupedFast = dedupeStations(fastData);
        if (loadRequestIdRef.current === requestId) { setStations(dedupedFast); setIsLoading(false); if (dedupedFast.length > 0 && autoPlay) handlePlayStation(dedupedFast[0]); }
        let fetchLimit = 50; 
        if (category.id === 'classical') { fetchLimit = 100; }
        fetchStationsByTag(category.id, fetchLimit).then(fullData => { 
            const dedupedFull = dedupeStations(fullData);
            if (loadRequestIdRef.current === requestId && dedupedFull.length > 0) setStations(dedupedFull); 
        }).catch(() => {});
      }
    } catch (e) { if (loadRequestIdRef.current === requestId) setIsLoading(false); }
  }, [handlePlayStation]);

  useEffect(() => { loadCategory(GENRES[0], 'genres', false); }, [loadCategory]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(p => { const n = p.includes(id) ? p.filter(fid => fid !== id) : [...p, id]; localStorage.setItem('streamflow_favorites', JSON.stringify(n)); return n; });
  }, []);
  



  const handleAiCuration = async () => {
      if (!selectedCategory || isAiCurating || stations.length === 0) return;
      
      setIsAiCurating(true);
      const msg = language === 'ru' 
        ? "Подождите, идет оптимизация станций по вашему вкусу..." 
        : "Please wait, AI is optimizing the station list for you...";
      setAiNotification(msg);

      try {
          const keptIds = await curateStationList(stations, selectedCategory.name, selectedCategory.description || '');
          const filteredStations = stations.filter(s => keptIds.includes(s.stationuuid));
          setStations(filteredStations);
          setVisibleCount(Math.min(INITIAL_CHUNK, filteredStations.length));
      } catch (e) {
          console.error("AI Curation failed");
      } finally {
          setIsAiCurating(false);
          setTimeout(() => setAiNotification(null), 3000);
      }
  };

  const handleShowFeature = (featureId: string) => {
      setManualOpen(false);
      setHighlightFeature(featureId);
  };
  
  const visibleStations = useMemo(() => stations.slice(0, visibleCount), [stations, visibleCount]);

  return (
    <ErrorBoundary>
    <div className={`relative flex h-screen font-sans overflow-hidden bg-[var(--base-bg)] text-[var(--text-base)] transition-all duration-700`}>
      <RainEffect intensity={ambience.rainVolume} />
      <FireEffect intensity={ambience.fireVolume} />
      <audio 
        ref={audioRef} 
        onPlaying={() => { 
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            setIsBuffering(false); 
            setIsPlaying(true); 
        }} 
        onPause={() => {
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            setIsPlaying(false);
        }} 
        onWaiting={() => setIsBuffering(true)} 
        onEnded={() => { 
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            if (audioRef.current) { audioRef.current.load(); audioRef.current.play().catch(() => {}); } 
        }} 
        onError={() => {
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        }}
        crossOrigin="anonymous" 
      />
      

      {(window.innerWidth < 768 && sidebarOpen) && ( <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} /> )}

      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-all duration-500 glass-panel flex flex-col bg-[var(--panel-bg)] ${isIdleView ? '-translate-x-full opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3"><h1 className="text-2xl font-black tracking-tighter">StreamFlow</h1><DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-9 h-9" visualMode={visualMode} /></div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-left duration-300">
            <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--panel-border)] gap-1">
                {(['genres', 'eras', 'moods', 'effects'] as const).map(m => (
                    <button key={m} onClick={() => loadCategory(m === 'genres' ? GENRES[0] : m === 'eras' ? ERAS[0] : m === 'moods' ? MOODS[0] : EFFECTS[0], m, false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === m ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400'}`}>{t[m]}</button>
                ))}
            </div>
            <button onClick={() => loadCategory(null, 'favorites', false)} className={`w-full py-3 rounded-2xl text-xs font-black border transition-all ${viewMode === 'favorites' ? 'bg-secondary border-secondary text-white' : 'bg-[var(--input-bg)] text-slate-400'}`}>
                <HeartIcon className="w-4 h-4 inline mr-2" filled={viewMode === 'favorites'} /> {t.favorites}
            </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 no-scrollbar">
        {viewMode !== 'favorites' && (viewMode === 'genres' ? GENRES : viewMode === 'eras' ? ERAS : viewMode === 'moods' ? MOODS : EFFECTS).map((cat) => (
            <button key={cat.id} onClick={() => loadCategory(cat, viewMode, false)} className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all ${selectedCategory?.id === cat.id ? 'bg-[var(--selected-item-bg)] font-black' : 'text-slate-400 hover:text-[var(--text-base)]'}`}>
                {t[cat.id] || cat.name}
            </button>
        ))}
        </div>
        {/* Sidebar Footer - Restore PWA/Download for Desktop only */}
        <div className="p-4 pt-2 border-t border-[var(--panel-border)] hidden md:block">
             <button onClick={() => setDownloadModalOpen(true)} className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/5 hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                <DownloadIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                <div className="text-left"><p className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white transition-colors">Mobile App</p><p className="text-xs font-black text-white">Download</p></div>
             </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <header className={`h-20 flex items-center px-4 md:px-10 justify-between shrink-0 transition-all duration-500 z-10 ${isIdleView ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 text-[var(--text-base)] hover:text-primary transition-colors flex items-center justify-center"
              title={t.manualTooltip}
            >
              <MenuIcon className="w-7 h-7" />
            </button>
            
            {/* Listening text hidden on mobile, visible on desktop */}
            <div className="hidden md:flex text-slate-400 text-sm font-medium tracking-wide items-center gap-2">
                {t.listeningTo} 
                <span className="text-[var(--text-base)] font-black uppercase tracking-widest ml-1">
                    {viewMode === 'favorites' ? t.favorites : (selectedCategory ? (t[selectedCategory.id] || selectedCategory.name) : '')}
                </span>
            </div>


            {/* Action icons - Tighter gap for mobile */}
            <div className="flex items-center gap-1 sm:gap-4">
              {isAiAvailable() && viewMode !== 'favorites' && !isLoading && (
                  <button 
                    onClick={handleAiCuration} 
                    disabled={isAiCurating}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isAiCurating ? 'bg-primary/20 text-primary cursor-wait' : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scaling-105 active:scaling-95'}`}
                  >
                      {isAiCurating ? <LoadingIcon className="w-3 h-3 animate-spin" /> : <span className="text-sm">✨</span>}
                      <span className="hidden xs:inline">{isAiCurating ? 'Optimizing...' : 'AI Optimize'}</span>
                      {!isAiCurating && <span className="xs:hidden font-bold">AI</span>}
                  </button>
              )}
            <div className="flex items-center gap-3" style={{ order: 2 }}>
            <button onClick={() => setToolsOpen(!toolsOpen)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-105 transition-all" title={t.tools} aria-label={t.tools}><AdjustmentsIcon /></button>
            <button onClick={() => setChatOpen(!chatOpen)} className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:scale-105" title={t.chat} aria-label={t.chat}><ChatBubbleIcon /></button>
          </div>
              {/* Online Counter - Smart Ticker Mode */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md animate-in fade-in zoom-in duration-500 shadow-lg ml-1">
                  {/* Green Dot - Desktop Only now */}
                  <div className={`hidden md:block w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)] ${onlineStats.totalOnline > 0 ? 'bg-green-500' : 'bg-slate-500 shadow-none'}`}></div>
                  
                  {/* MOBILE VERSION (Minimalist: "KZ - 1") */}
                  <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      {Object.keys(countryStats).length > 0 ? (
                          <span className="text-white">{Object.keys(countryStats)[0]} - {countryStats[Object.keys(countryStats)[0]]}</span>
                      ) : (
                          <span className="text-white">KZ - {Number(onlineStats.totalOnline) || 1}</span>
                      )}
                  </span>
                  
                  {/* DESKTOP VERSION (Verbose) */}
                  <span className="hidden md:flex text-[10px] font-black uppercase tracking-wider text-slate-400 items-center gap-1.5">
                      {Object.keys(countryStats).length > 0 ? (
                          <>
                            <span className="text-slate-500">{language === 'ru' ? 'Сейчас слушает' : 'Listening now'}</span>
                            <span>{getCountryFlag(Object.keys(countryStats)[0])}</span>
                            <span className="text-primary">"{getCountryName(Object.keys(countryStats)[0], language)}"</span>
                            <span className="text-slate-500">-</span>
                            <span className="text-slate-500">{language === 'ru' ? 'онлайн' : 'online'}</span>
                            <span className="text-white">{countryStats[Object.keys(countryStats)[0]]}</span>
                          </>
                      ) : (
                          <>
                             <span className="text-slate-500">{language === 'ru' ? 'Сейчас слушает' : 'Listening now'}</span>
                             <span>🇰🇿</span> 
                             <span className="text-primary">"{getCountryName('KZ', language)}"</span>
                             <span className="text-slate-500">-</span>
                             <span className="text-slate-500">{language === 'ru' ? 'онлайн' : 'online'}</span>
                             <span className="text-white">{Number(onlineStats.totalOnline) || 1}</span>
                          </>
                      )}
                  </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center shrink-0 gap-1 md:gap-4">
            {/* Online Counter moved elsewhere */}

            {/* Super-chat label with arrow */}
            {!chatOpen && (
                <div className="flex items-center gap-1 animate-pulse mr-1 md:mr-2">
                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Super-chat</span>
                    <div className="text-primary text-xs">→</div> 
                </div>
            )}
            <button onClick={() => setChatOpen(!chatOpen)} className="p-2 rounded-full relative text-primary hover:scale-110 transition-transform shrink-0 z-50">
                <ChatBubbleIcon className="w-6 h-6" />
                {pendingKnocksCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e293b] animate-pulse">
                        {pendingKnocksCount}
                    </span>
                )}
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto px-6 md:px-10 no-scrollbar transition-all duration-500 ${isIdleView ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <>
            {selectedCategory && viewMode !== 'favorites' && (
                <div className="mb-10 p-10 h-56 rounded-[2.5rem] glass-panel relative overflow-hidden flex flex-col justify-end">
                    <div className={`absolute inset-0 bg-gradient-to-r ${selectedCategory.color} opacity-20 mix-blend-overlay`}></div>
                    <div className="absolute inset-x-0 bottom-0 top-0 z-0 opacity-40"><AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} variant={visualizerVariant} settings={vizSettings} visualMode={visualMode} danceStyle={danceStyle} /></div>
                    <div className="relative z-10 pointer-events-none hidden"><h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase">{t[selectedCategory.id] || selectedCategory.name}</h2></div>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-32">
                {isLoading || isAiCurating ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[1.2] rounded-[2rem] skeleton-loader"></div>) : (
                visibleStations.map((station, index) => (
                    <StationCard key={station.stationuuid} station={station} index={index} isSelected={currentStation?.stationuuid === station.stationuuid} isFavorite={favorites.includes(station.stationuuid)} onPlay={handlePlayStation} onToggleFavorite={toggleFavorite} />
                ))
                )}
            </div>
            {!isLoading && !isAiCurating && stations.length > visibleCount && (
                <div ref={loaderRef} className="h-20 flex items-center justify-center relative z-10 opacity-30 pb-32">
                    <div className="animate-pulse flex space-x-1"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div></div>
                </div>
            )}
            </>
        </div>

        {/* Idle View Removed */}

        <div className={`absolute bottom-2 md:bottom-8 left-0 right-0 px-2 md:px-10 transition-all duration-700 ease-in-out z-20 ${chatOpen ? 'md:pr-[420px] lg:pr-[470px]' : ''} ${isIdleView ? 'opacity-0 translate-y-20 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'}`}>
           <div className={`pointer-events-auto w-full md:w-auto md:max-w-7xl mx-auto rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-6 flex flex-col md:flex-row shadow-2xl border-2 border-[var(--panel-border)] transition-all duration-500 bg-[var(--player-bar-bg)]`}>
               
                {/* ROW 1: STATION INFO (Mobile Only - Logo Restored with Avatar Fallback) */}
                <div className="flex md:hidden items-center gap-3 mb-2 relative z-10 w-full pr-16 bg-black/20 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Album Art / Logo / Dancing Avatar */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg border border-white/10 bg-black/50 relative">
                        {currentStation?.favicon ? (
                            <img 
                                src={currentStation.favicon} 
                                alt={currentStation.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('fallback-active');
                                }}
                            />
                        ) : null}
                        {/* Fallback (absolute positioned to show underneath or when img hidden) */}
                        <div className={`absolute inset-0 flex items-center justify-center bg-slate-900 ${currentStation?.favicon ? '-z-10' : ''}`}>
                            <DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-full h-full p-1" visualMode={visualMode} />
                        </div>
                    </div>
                
                    {/* Info - Left Aligned */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <h4 className="font-black text-sm leading-tight truncate text-slate-100 uppercase tracking-wider">
                                {selectedCategory 
                                    ? (t[selectedCategory.id] || selectedCategory.name) 
                                    : (currentStation?.tags?.[0] || (currentStation?.name ? 'Radio' : 'Stream'))}
                            </h4>
                            <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-tight mt-0.5">{isBuffering ? 'Buffering...' : 'LIVE'}</p>
                    </div>

                    {/* Mobile Only: Top Right Tools */}
                    <div className="flex md:hidden items-center gap-1 absolute right-1.5 top-1/2 -translate-y-1/2">
                        <button 
                             onClick={() => setShareOpen(true)}
                             className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                        >
                            <ShareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setToolsOpen(!toolsOpen)} className={`p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-full`}>
                            <AdjustmentsIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ROW 2 (Mobile Only): PRESETS SCROLLABLE */}
                <div className="flex md:hidden w-full overflow-x-auto no-scrollbar gap-1 pb-2 mb-1 mask-linear-fade pr-12">
                    {/* Reset Button (Compact) */}
                    <button
                        onClick={() => handleApplyPreset('reset')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 border flex items-center gap-1 ${
                            activePresetId === 'reset'
                            ? 'bg-slate-700 text-white border-slate-600' 
                            : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <XMarkIcon className="w-3 h-3" />
                        <span>{t.reset || 'Reset'}</span>
                    </button>
                    {GLOBAL_PRESETS.filter(p => p.id !== 'reset').map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset.id)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 border ${
                                activePresetId === preset.id 
                                ? 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' 
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                {/* ROW 3: CONTROLS */}
                <div className="flex items-center justify-between w-full md:w-auto md:gap-6 z-10 px-2 md:px-0 md:mx-4">
                    
                    {/* LEFT GROUP: Viz Only */}
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* Viz Toggle */}
                        <button 
                            onClick={() => setToolsOpen(!toolsOpen)} 
                            className="p-2 transition-all hover:scale-110 active:scale-95 group"
                            title={t.visualizer}
                        >
                            <div className="w-5 h-5 flex gap-0.5 items-end justify-center">
                                <div className="w-1 h-3 bg-gradient-to-t from-green-400 to-blue-500 rounded-full animate-[bounce_1s_infinite]"></div>
                                <div className="w-1 h-5 bg-gradient-to-t from-purple-400 to-pink-500 rounded-full animate-[bounce_1.2s_infinite]"></div>
                                <div className="w-1 h-2 bg-gradient-to-t from-yellow-400 to-red-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
                            </div>
                        </button>
                    </div>

                    {/* CENTER GROUP: Transport */}
                    <div className="flex items-center gap-3 sm:gap-6">
                        <button onClick={handlePreviousStation} className="p-2 text-slate-400 hover:text-white transition-colors"><PreviousIcon className="w-6 h-6" /></button>
                        
                        <button 
                            ref={playButtonRef} 
                            onClick={locationStatus === 'error' ? triggerLocationDetection : togglePlay} 
                            className={`w-14 h-14 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-black shadow-xl hover:scale-105 transition-all mx-1 duration-75 relative overflow-hidden group ${locationStatus === 'ready' ? 'bg-white' : 'bg-slate-800 border border-white/10'}`}
                        >
                            {locationStatus === 'detecting' ? (
                                <>
                                    <LoadingIcon className="animate-spin w-5 h-5 text-primary mb-0.5" />
                                    <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Loc...</span>
                                </>
                            ) : locationStatus === 'error' ? (
                                <>
                                    <XMarkIcon className="w-5 h-5 text-red-500 mb-0.5" />
                                    <span className="text-[6px] font-black text-red-400 uppercase tracking-tighter">Retry</span>
                                </>
                            ) : isBuffering ? (
                                <LoadingIcon className="animate-spin w-6 h-6" />
                            ) : isPlaying ? (
                                <PauseIcon className="w-6 h-6" />
                            ) : (
                                <PlayIcon className="w-6 h-6 ml-1" />
                            )}
                            {/* Visual cue for silent location detection */}
                            {locationStatus === 'detecting' && (
                                <div className="absolute top-0 right-1 text-[8px] animate-pulse">🛰️</div>
                            )}
                        </button>
                        
                        <button onClick={handleNextStation} className="p-2 text-slate-400 hover:text-white transition-colors"><NextIcon className="w-6 h-6" /></button>
                    </div>

                    {/* RIGHT GROUP: Heart & Shuffle & More */}
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* Favorite (Moved here) */}
                        <button 
                             onClick={(e) => { e.stopPropagation(); if(currentStation) toggleFavorite(currentStation.stationuuid); }}
                             className={`p-2 transition-all duration-300 hover:scale-110 ${currentStation && favorites.includes(currentStation.stationuuid) ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-400 hover:text-white'}`}
                             disabled={!currentStation}
                        >
                            <HeartIcon className={`w-6 h-6 ${currentStation && favorites.includes(currentStation.stationuuid) ? 'fill-current' : ''}`} />
                        </button>

                        <button 
                            onClick={() => setIsRandomMode(!isRandomMode)} 
                            className={`p-2 transition-all hover:scale-110 active:scale-95 ${isRandomMode ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : 'text-slate-400 hover:text-white'}`}
                            title={t.randomMode}
                        >
                            <ShuffleIcon className="w-5 h-5" />
                        </button>
                        
                        {/* Presets (Desktop Only - keep existing logic) */}
                        <div className="hidden 2xl:flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
                            {GLOBAL_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleApplyPreset(preset.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                                        activePresetId === preset.id 
                                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] scale-105' 
                                        : 'text-slate-500 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ROW 3: DESKTOP EXTRAS (Volume, etc) */}
                <div className="hidden md:flex flex-1 justify-end items-center gap-2 md:gap-5 z-10">
                    <button 
                         onClick={() => setShareOpen(true)}
                         className="p-2 text-slate-400 hover:text-primary transition-colors hover:scale-110"
                         title="Share"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setToolsOpen(!toolsOpen)} className={`p-2.5 text-[var(--text-base)] hover:text-primary transition-colors ${isIdleView ? 'hidden' : ''}`}><AdjustmentsIcon className="w-6 h-6" /></button>
                    <div className="flex items-center gap-3"><VolumeIcon className="w-5 h-5 text-slate-400" /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 accent-primary cursor-pointer h-1.5 bg-slate-400/30 rounded-full" /></div>
                </div>
           </div>
        </div>

        <Suspense fallback={null}>
            <ToolsPanel 
                isOpen={toolsOpen} 
                onClose={() => setToolsOpen(false)} 
                eqGains={eqGains} 
                setEqGain={(i, v) => setEqGains(p => { const n = [...p]; n[i] = v; return n; })} 
                onSetEqValues={(vals) => setEqGains(vals)} 
                sleepTimer={sleepTimer} 
                setSleepTimer={setSleepTimer} 
                currentTheme={currentTheme} 
                setTheme={setCurrentTheme} 
                baseTheme={baseTheme} 
                setBaseTheme={setBaseTheme} 
                language={language} 
                setLanguage={setLanguage} 
                visualizerVariant={visualizerVariant} setVisualizerVariant={setVisualizerVariant} 
              vizSettings={vizSettings} setVizSettings={setVizSettings}
              danceStyle={danceStyle} setDanceStyle={setDanceStyle}
              randomMode={isRandomMode} setRandomMode={setIsRandomMode}
              onStartTutorial={() => { setToolsOpen(false); setTutorialOpen(true); }} 
              onOpenManual={() => { setToolsOpen(false); setManualOpen(true); }} 
              onOpenProfile={() => { setToolsOpen(false); setChatOpen(true); }} 
                ambience={ambience} 
                setAmbience={setAmbience} 
                passport={passport} 
                alarm={alarm} 
                setAlarm={setAlarm} 
                onThrowBottle={() => {}} 
                onCheckBottle={() => null} 
                customCardColor={customCardColor} 
                setCustomCardColor={setCustomCardColor} 
                fxSettings={fxSettings} 
                setFxSettings={setFxSettings} 
                audioEnhancements={audioEnhancements} 
                setAudioEnhancements={setAudioEnhancements}
                onGlobalReset={() => { if(window.confirm(t.resetConfirm)){ localStorage.clear(); window.location.reload(); } }}
            />
        </Suspense>
        <Suspense fallback={null}><ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} language={language} onShowFeature={handleShowFeature} /><TutorialOverlay isOpen={tutorialOpen || !!highlightFeature} onClose={() => { setTutorialOpen(false); setHighlightFeature(null); }} language={language} highlightFeature={highlightFeature} /></Suspense>
        <Suspense fallback={null}><DownloadAppModal isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} language={language} installPrompt={installPrompt} /></Suspense>
        <Suspense fallback={null}><FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} language={language} currentUserId={currentUser.id} /></Suspense>

      </main>
      <Suspense fallback={null}>
        <ChatPanel 
            isOpen={chatOpen} 
            onClose={() => setChatOpen(false)} 
            language={language} 
            onLanguageChange={setLanguage} 
            currentUser={currentUser} 
            onUpdateCurrentUser={setCurrentUser} 
            isPlaying={isPlaying} 
            onTogglePlay={togglePlay} 
            onNextStation={handleNextStation} 
            onPrevStation={handlePreviousStation} 
            currentStation={currentStation} 
            analyserNode={analyserNodeRef.current} 
            volume={volume} 
            onVolumeChange={setVolume} 
            visualMode={visualMode} 
            favorites={favorites} 
            onToggleFavorite={toggleFavorite}
            randomMode={isRandomMode}
            onToggleRandomMode={() => setIsRandomMode(!isRandomMode)}
            onShare={() => setShareOpen(true)}
            onPendingKnocksChange={setPendingKnocksCount}
            detectedLocation={detectedLocation}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ShareModal 
            isOpen={shareOpen} 
            onClose={() => setShareOpen(false)} 
        />
      </Suspense>
    </div>
    </ErrorBoundary>
  );
}