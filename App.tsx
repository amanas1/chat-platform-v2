import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RadioStation, CategoryInfo, ViewMode, ThemeName, BaseTheme, Language, UserProfile, VisualizerVariant, VisualizerSettings, AmbienceState, PassportData, BottleMessage, AlarmConfig, FxSettings, AudioProcessSettings } from './types';
import { GENRES, ERAS, MOODS, EFFECTS, DEFAULT_VOLUME, TRANSLATIONS, ACHIEVEMENTS_LIST, GLOBAL_PRESETS } from './constants';
import { fetchStationsByTag, fetchStationsByUuids } from './services/radioService';
import { curateStationList, isAiAvailable } from './services/geminiService';
import { socketService } from './services/socketService';
import AudioVisualizer from './components/AudioVisualizer';
import DancingAvatar from './components/DancingAvatar';
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
const LoginModal = React.lazy(() => import('./components/LoginModal'));
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './AuthProvider';

// SEO Components
import { SEOHead } from './components/seo/SEOHead';
import SEOContent from './components/seo/SEOContent';
import { AboutPage, PrivacyPage, ContactPage, GenresPage } from './components/seo/StaticPages';
import { JazzRadioPage, RockRadioPage, ElectronicRadioPage, HipHopRadioPage } from './components/seo/GenrePages';
import DynamicRadioHub from './components/seo/DynamicRadioHub';
import { DirectoryPage } from './components/seo/DirectoryPage';

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
  scaleY: 1.1,
  brightness: 100,
  contrast: 130,
  saturation: 120,
  hue: 0,
  opacity: 1,
  speed: 0.6,
  autoIdle: true,
  performanceMode: true,
  energySaver: false,
  barDensity: 2.8,
  vizAlignment: 'bottom',
  glowIntensity: 1.7,
  bgOpacity: 0.7
};

const NEON_DEFAULT_SETTINGS: VisualizerSettings = {
  scaleX: 1,
  scaleY: 1.1,
  brightness: 100,
  contrast: 100,
  saturation: 120,
  hue: 0,
  opacity: 1,
  speed: 2.0,
  autoIdle: true,
  performanceMode: true,
  energySaver: false,
  barDensity: 2.6,
  vizAlignment: 'bottom',
  glowIntensity: 1.3,
  bgOpacity: 0.7
};

const VISUALIZERS_LIST: { id: VisualizerVariant; labelKey: string; defaults?: VisualizerSettings }[] = [
    { id: 'segmented', labelKey: 'vizDigital' },
    { id: 'rainbow-lines', labelKey: 'vizNeon', defaults: NEON_DEFAULT_SETTINGS },
    { id: 'galaxy', labelKey: 'vizGalaxy' },
    { id: 'mixed-rings', labelKey: 'vizRings' },
    { id: 'bubbles', labelKey: 'vizBubbles' },
    { id: 'stage-dancer', labelKey: 'vizStageDancer' },
    { id: 'trio-dancers', labelKey: 'vizTrioDancers' },
    { id: 'viz-journey', labelKey: 'vizJourney' },
];

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
      role="button"
      aria-label={`Play ${station.name}`}
      className={`group relative rounded-[2rem] p-5 cursor-pointer transition-all border-2 animate-in fade-in slide-in-from-bottom-3 duration-500 bg-black/60 backdrop-blur-md border-[var(--panel-border)] hover:border-white/20 hover:bg-black/80`}
      style={{ animationDelay: `${(index % 5) * 50}ms` }}
    >
      <div className="flex justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-800/50 relative shadow-inner">
          {!imgLoaded && !imgError && <div className="absolute inset-0 skeleton-loader" />}
          {station.favicon && !imgError ? (
            <img src={station.favicon} alt={station.name} loading="lazy" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`} />
          ) : (
            <MusicNoteIcon className="w-6 h-6 text-slate-600" />
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(station.stationuuid); }} 
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`p-2 rounded-full transition-all active:scale-150 ${isFavorite ? 'text-secondary bg-secondary/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <HeartIcon className="w-5 h-5" filled={isFavorite} />
        </button>
      </div>
      <h3 className={`font-bold truncate text-sm transition-colors ${isSelected ? 'text-primary' : 'text-[var(--text-base)] group-hover:text-primary'}`}>{station.name}</h3>
      <p className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest truncate">{station.tags || 'Music'} • {station.bitrate || 128}K</p>
    </div>
  );
});

const COUNTRY_FLAGS: Record<string, string> = {
  'Kazakhstan': '🇰🇿', 'KZ': '🇰🇿',
  'Russia': '🇷🇺', 'RU': '🇷🇺',
  'United States': '🇺🇸', 'US': '🇺🇸', 'USA': '🇺🇸',
  'Uzbekistan': '🇺🇿', 'UZ': '🇺🇿',
  'Ukraine': '🇺🇦', 'UA': '🇺🇦',
  'Germany': '🇩🇪', 'DE': '🇩🇪',
  'France': '🇫🇷', 'FR': '🇫🇷',
  'China': '🇨🇳', 'CN': '🇨🇳',
  'Japan': '🇯🇵', 'JP': '🇯🇵',
  'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧',
  'Kyrgyzstan': '🇰🇬', 'KG': '🇰🇬',
  'Turkey': '🇹🇷', 'TR': '🇹🇷',
  'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪', 'AE': '🇦🇪',
  'Global': '🌍'
};

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  'KZ': { en: 'Kazakhstan', ru: 'Казахстан', es: 'Kazajistán', fr: 'Kazakhstan', zh: '哈萨克斯坦', de: 'Kasachstan' },
  'Kazakhstan': { en: 'Kazakhstan', ru: 'Казахстан', es: 'Kazajistán', fr: 'Kazakhstan', zh: '哈萨克斯坦', de: 'Kasachstan' },
  'RU': { en: 'Russia', ru: 'Россия', es: 'Rusia', fr: 'Russie', zh: '俄罗斯', de: 'Russland' },
  'Russia': { en: 'Russia', ru: 'Россия', es: 'Rusia', fr: 'Russie', zh: '俄罗斯', de: 'Russland' },
  'US': { en: 'United States', ru: 'США', es: 'EE. UU.', fr: 'États-Unis', zh: '美国', de: 'USA' },
  'USA': { en: 'United States', ru: 'США', es: 'EE. UU.', fr: 'États-Unis', zh: '美国', de: 'USA' },
  'United States': { en: 'United States', ru: 'США', es: 'EE. UU.', fr: 'États-Unis', zh: '美国', de: 'USA' },
  'UZ': { en: 'Uzbekistan', ru: 'Узбекистан', es: 'Uzbekistán', fr: 'Ouzbékistan', zh: '乌兹别克斯坦', de: 'Usbekistan' },
  'UA': { en: 'Ukraine', ru: 'Украина', es: 'Ucrania', fr: 'Ukraine', zh: '乌克兰', de: 'Ukraine' },
  'DE': { en: 'Germany', ru: 'Германия', es: 'Alemania', fr: 'Allemagne', zh: 'Deutschland', de: 'Deutschland' },
  'TR': { en: 'Turkey', ru: 'Турция', es: 'Turquía', fr: 'Turquie', zh: '土耳其', de: 'Türkei' },
  'UK': { en: 'United Kingdom', ru: 'Великобритания', es: 'Reino Unido', fr: 'Royaume-Uni', zh: '英国', de: 'Großbritannien' },
  'United Kingdom': { en: 'United Kingdom', ru: 'Великобритания', es: 'Reino Unido', fr: 'Royaume-Uni', zh: '英国', de: 'Großbritannien' },
  'UAE': { en: 'United Arab Emirates', ru: 'ОАЭ', es: 'EAU', fr: 'Émirats Arabes Unis', zh: '阿联酋', de: 'VAE' },
  'United Arab Emirates': { en: 'United Arab Emirates', ru: 'ОАЭ', es: 'EAU', fr: 'Émirats Arabes Unis', zh: '阿联酋', de: 'VAE' },
  'Global': { en: 'Global', ru: 'Весь мир', es: 'Global', fr: 'Global', zh: '全球', de: 'Weltweit' }
};

function getCountryName(code: string, lang: Language): string {
    const map = COUNTRY_NAMES[code] || COUNTRY_NAMES[code.toUpperCase()];
    return map ? (map[lang] || map['en']) : code;
}

function getCountryFlag(country: string): string {
    return COUNTRY_FLAGS[country] || COUNTRY_FLAGS[country.toUpperCase()] || '🌍';
}

/**
 * VolumeDrum Component
 * A vertical cylindrical volume control with a graduation scale.
 */
const VolumeDrum = React.memo(({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const drumRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleInteraction = useCallback((e: any) => {
        if (!drumRef.current) return;
        const rect = drumRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const pos = (rect.bottom - clientY) / rect.height;
        const newValue = Math.max(0, Math.min(1, pos));
        onChange(newValue);
    }, [onChange]);

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleInteraction(e);
    };

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent | TouchEvent) => {
            handleInteraction(e);
        };
        const onEnd = () => setIsDragging(false);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, handleInteraction]);

    return (
        <div 
            ref={drumRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="relative w-8 h-20 bg-slate-900 rounded-lg border border-white/5 cursor-ns-resize overflow-hidden group shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center select-none translate-z-0"
            style={{ 
                background: 'linear-gradient(90deg, #05080f 0%, #161c2c 35%, #2a354d 50%, #161c2c 65%, #05080f 100%)',
            }}
            title="Volume"
        >
            {/* Depth caps */}
            <div className="absolute top-0 inset-x-0 h-1 bg-black/40 border-b border-white/5 z-20" />
            <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40 border-t border-white/5 z-20" />

            {/* Scale Marks */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none z-10">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className={`h-[1px] bg-white transition-opacity duration-300 ${i % 5 === 0 ? 'w-full opacity-30 shadow-[0_0_2px_rgba(255,255,255,0.4)]' : 'w-2/3 mx-auto opacity-10'}`} />
                ))}
            </div>

            {/* Level Fill */}
            <div 
                className="absolute bottom-0 inset-x-0 bg-primary/10 transition-all duration-75 mix-blend-screen"
                style={{ height: `${value * 100}%` }}
            />

            {/* Indicator */}
            <div 
                className="absolute left-0 right-0 h-0.5 bg-primary z-30 transition-all duration-75"
                style={{ 
                    bottom: `${value * 100}%`, 
                    transform: 'translateY(50%)',
                    boxShadow: '0 0 12px var(--color-primary), 0 0 4px white' 
                }}
            />

            {/* Gloss */}
            <div className="absolute inset-y-0 left-1/4 w-1.5 bg-white/5 blur-sm pointer-events-none" />
            
            {/* Value Label */}
            <div className="absolute inset-x-0 top-1 text-center pointer-events-none z-40 opacity-0 group-hover:opacity-40 transition-opacity">
                <span className="text-[6px] font-black text-white">{Math.round(value * 100)}</span>
            </div>
        </div>
    );
});

export default function App(): React.JSX.Element {
  const { user, isAuthorized, loading } = useAuth();
  
  // Storage Migration: AU RadioChat -> AU RadioChat
  useEffect(() => {
    const migrateStorage = () => {
       const keysToMigrate = [
           'user_profile', 'language', 'random_mode', 'favorites', 
           'theme', 'base_theme', 'visualizer_variant', 'viz_settings',
           'ambience_state', 'passport_data', 'alarm_config', 'fx_settings',
           'audio_process_settings', 'tools_open_count'
       ];
       
       let migratedCount = 0;
       
       keysToMigrate.forEach(key => {
           const oldKey = `streamflow_${key}`;
           const newKey = `auradiochat_${key}`;
           const oldData = localStorage.getItem(oldKey);
           
           if (oldData && !localStorage.getItem(newKey)) {
               localStorage.setItem(newKey, oldData);
               localStorage.removeItem(oldKey); // Optional: keep or remove
               migratedCount++;
           }
       });
       
       if (migratedCount > 0) {
           console.log(`[Rebranding] Migrated ${migratedCount} keys from AU RadioChat to AU RadioChat.`);
       }
    };
    
    migrateStorage();
  }, []);

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
  const mainContentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/favorites') {
        loadCategory(null, 'favorites', true, true);
    } else if (location.pathname === '/genres') {
        // Just ensure we are in a genre-like mode if we navigate here, 
        // though GenresPage has its own content.
    }
  }, [location.pathname]);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const sidebarTimerRef = useRef<NodeJS.Timeout | null>(null);


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
      const saved = localStorage.getItem('auradiochat_current_theme') as ThemeName;
      if (saved) return saved;
    }
    return 'volcano';
  });
  const [baseTheme, setBaseTheme] = useState<BaseTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auradiochat_base_theme') as BaseTheme;
      if (saved) return saved;
    }
    return 'dark';
  });
  const [customCardColor, setCustomCardColor] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auradiochat_language') as Language;
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
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('auradiochat_visualizer_variant') as VisualizerVariant;
        if (saved) return saved;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'stage-dancer';
    return 'rainbow-lines';
  });
  const [vizSettingsMap, setVizSettingsMap] = useState<Record<string, VisualizerSettings>>(() => {
    const defaultSettings: Record<string, VisualizerSettings> = {};
    VISUALIZERS_LIST.forEach(v => {
        defaultSettings[v.id] = v.defaults || DEFAULT_VIZ_SETTINGS;
    });

    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('auradiochat_viz_settings_v3');
        if (saved) return JSON.parse(saved);
        
        // Migration from old single setting
        const oldSaved = localStorage.getItem('auradiochat_viz_settings');
        const savedVariant = localStorage.getItem('auradiochat_visualizer_variant') as VisualizerVariant || 'rainbow-lines';
        
        if (oldSaved) {
            try {
                const parsed = JSON.parse(oldSaved);
                defaultSettings[savedVariant] = parsed;
            } catch(e) {}
        }
        
        if (window.innerWidth < 768) {
            defaultSettings[savedVariant] = { ...defaultSettings[savedVariant], energySaver: true, performanceMode: false };
        }
    }
    return defaultSettings;
  });

  const vizSettings = useMemo(() => vizSettingsMap[visualizerVariant] || DEFAULT_VIZ_SETTINGS, [vizSettingsMap, visualizerVariant]);
  
  const setVizSettings = useCallback((newVal: VisualizerSettings | ((prev: VisualizerSettings) => VisualizerSettings)) => {
      setVizSettingsMap(prev => {
          const current = prev[visualizerVariant] || DEFAULT_VIZ_SETTINGS;
          const updated = typeof newVal === 'function' ? (newVal as any)(current) : newVal;
          return { ...prev, [visualizerVariant]: updated };
      });
  }, [visualizerVariant]);
  const [danceStyle, setDanceStyle] = useState<number>(1);
  const [autoDance, setAutoDance] = useState(false);

  useEffect(() => {
    if (!autoDance) return;
    const interval = setInterval(() => {
        setDanceStyle(prev => prev >= 3 ? 1 : prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoDance]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [isRandomMode, setIsRandomMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auradiochat_random_mode');
      if (saved !== null) return saved === 'true';
    }
    return true; 
  });
  const [isIdleView, setIsIdleView] = useState(false);
  const [newsIndex, setNewsIndex] = useState(0);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [fxSettings, setFxSettings] = useState<FxSettings>({ reverb: 0, speed: 1.0 });
  const [onlineStats, setOnlineStats] = useState({ totalOnline: 0, chatOnline: 0 });
  const [countryStats, setCountryStats] = useState<Record<string, number>>({});
  const [pendingKnocksCount, setPendingKnocksCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [audioEnhancements, setAudioEnhancements] = useState<AudioProcessSettings>({
      compressorEnabled: false,
      compressorThreshold: -24,
      compressorRatio: 12,
      bassBoost: 0,
      loudness: 0
  });

  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'ready' | 'error'>('detecting');
  const [isGlobalLightsOn, setIsGlobalLightsOn] = useState(false);
  
  // Automatic Safe Mode logic
  const [isAppVisible, setIsAppVisible] = useState(true);
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024; // PWA/Mobile threshold
  }, []);

  const isSafeMode = useMemo(() => isMobile && !isAppVisible, [isMobile, isAppVisible]);
  const [isBackgroundOptimized, setIsBackgroundOptimized] = useState(true);

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
        const saved = localStorage.getItem('auradiochat_user_profile');
        if (saved) {
             const parsed = JSON.parse(saved);
             // Ensure new fields exist
             if (!parsed.chatSettings.bannerNotificationsEnabled) {
                 parsed.chatSettings = { 
                     ...parsed.chatSettings, 
                     bannerNotificationsEnabled: false,
                     voiceNotificationsEnabled: false,
                     notificationVoice: 'female'
                 };
             }
             return parsed;
        }
    } catch (e) {
        // align with lint requirements
    }
    
    return {
      id: "u-" + Math.random().toString(36).substr(2, 9),
      name: "Guest",
      avatar: null,
      age: 25,
      gender: 'other',
      status: 'online',
      blockedUsers: [],
      hasAgreedToRules: false,
      safetyLevel: 'green',
      bio: '',
      filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true },
      chatSettings: { 
          notificationsEnabled: true, 
          notificationVolume: 0.8, 
          notificationSound: 'default',
          bannerNotificationsEnabled: true,
          voiceNotificationsEnabled: false,
          notificationVoice: 'female'
      }
    };
  });

  const [ambience, setAmbience] = useState<AmbienceState>({ 
      rainVolume: 0, rainVariant: 'soft', fireVolume: 0, cityVolume: 0, vinylVolume: 0, is8DEnabled: false, spatialSpeed: 1 
  });
  const [passport, setPassport] = useState<PassportData>(() => { try { return JSON.parse(localStorage.getItem('auradiochat_passport') || '') } catch { return { countriesVisited: [], totalListeningMinutes: 0, nightListeningMinutes: 0, stationsFavorited: 0, unlockedAchievements: [], level: 1 } } });
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
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const pannerIntervalRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef<number>(0);
  const sleepIntervalRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);
  const stationsRef = useRef<RadioStation[]>([]);
  const currentStationRef = useRef<RadioStation | null>(null);
  const isPlayingRef = useRef(false);
  const isRandomModeRef = useRef(false);
  const handleNextStationRef = useRef<() => void>(() => {});
  const handlePreviousStationRef = useRef<() => void>(() => {});
  const handlePlayStationRef = useRef<(s: RadioStation) => void>(() => {});
  const togglePlayRef = useRef<() => void>(() => {});

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
            return updated;
        });
    } else {
        // Only reset if we don't have a local authenticated session (e.g. guest)
        setCurrentUser(prev => {
             // If we already have a session (guest or otherwise) that is strictly authenticated, keep it.
             // This prevents the "reset" when Google Auth is null but user registered manually as guest.
             if (prev.isAuthenticated && prev.name && prev.id) return prev;
             
             return { ...prev, isAuthenticated: false };
        });
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

  // Sidebar Automation (Mobile & Desktop)
  useEffect(() => {
    const resetHideTimer = () => {
      if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
      
      const width = window.innerWidth;
      const isMobile = width < 1024;
      
      if (sidebarOpen) {
        // Desktop: 60s, Mobile: 5s
        const hideDelay = isMobile ? 5000 : 60000;
        sidebarTimerRef.current = setTimeout(() => {
          setSidebarOpen(false);
        }, hideDelay);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Auto-show when mouse near left edge
      if (!sidebarOpen && e.clientX < 20) {
        setSidebarOpen(true);
      }
      resetHideTimer();
    };

    resetHideTimer();

    // Event listeners
    window.addEventListener('touchstart', resetHideTimer);
    window.addEventListener('click', resetHideTimer);
    window.addEventListener('scroll', resetHideTimer);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', resetHideTimer);
    window.addEventListener('resize', resetHideTimer);

    return () => {
      if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
      window.removeEventListener('touchstart', resetHideTimer);
      window.removeEventListener('click', resetHideTimer);
      window.removeEventListener('scroll', resetHideTimer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', resetHideTimer);
      window.removeEventListener('resize', resetHideTimer);
    };
  }, [sidebarOpen]);

  // Lazy Audio Context Initialization
  const initAudioContextFn = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') return;
    
    if (!audioContextRef.current) {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
                latencyHint: 'playback'
            });
            audioContextRef.current = ctx;

            if (audioRef.current) {
                 if (isSafeMode) {
                     console.log('[AUDIO] Launching in Safe Mode (Direct Path)');
                 } else {
                     const source = ctx.createMediaElementSource(audioRef.current);
                     const reverb = ctx.createConvolver();
                     reverbNodeRef.current = reverb;
                     
                     const rate = ctx.sampleRate;
                     const isMobile = window.innerWidth < 768;
                     const length = rate * (isMobile ? 0.5 : 1.2); 
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
                     
                     const frequencies = isMobile 
                        ? [64, 250, 1000, 4000, 12000] 
                        : [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
                     
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

                     sourceNodeRef.current = source;

                     // Initial connection based on mode
                     if (isSafeMode) {
                        source.connect(ctx.destination);
                     } else {
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
                     }
                     
                     if (wetGainNodeRef.current && dryGainNodeRef.current) {
                          wetGainNodeRef.current.gain.value = fxSettings.reverb;
                          dryGainNodeRef.current.gain.value = 1 - (fxSettings.reverb * 0.4); 
                     }
                 }
            }
        } catch (e) {
            console.error("Audio Context Init Failed", e);
        }
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  }, [fxSettings, isSafeMode]); // isSafeMode included for initial connect logic
  
  // Call init only on user interaction (handled in togglePlay)
  const initAudioContext = initAudioContextFn; 

  // Auto-Suspend AudioContext when paused for 10s or tab hidden
  useEffect(() => {
    let suspendTimer: NodeJS.Timeout;
    
    if (!isPlaying) {
        suspendTimer = setTimeout(() => {
            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                console.log("[Audio] Suspending Context to save battery...");
                audioContextRef.current.suspend();
            }
        }, 10000);
    }

    return () => clearTimeout(suspendTimer);
  }, [isPlaying]);

  // Handle visibility change for Automatic Safe Mode and suspension
  useEffect(() => {
      const handleVisChange = () => {
          const hidden = document.hidden;
          setIsAppVisible(!hidden);

          if (hidden) {
              if (audioContextRef.current && audioContextRef.current.state === 'running') {
                   if (!isPlaying) audioContextRef.current.suspend();
              }
          } else {
              if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                  audioContextRef.current.resume();
              }
          }
      };
      document.addEventListener('visibilitychange', handleVisChange);
      return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [isPlaying]);

  // Handle seamless transition between Safe Mode and Full FX
  useEffect(() => {
      const source = sourceNodeRef.current;
      const ctx = audioContextRef.current;
      const dryGain = dryGainNodeRef.current;
      const reverb = reverbNodeRef.current;
      
      if (!ctx || !source) return;

      try {
          source.disconnect();
          if (isSafeMode) {
              console.log('[AUDIO] Background detected: Activating Safe Mode...');
              source.connect(ctx.destination);
          } else {
              console.log('[AUDIO] Foreground detected: Activating Full FX...');
              if (dryGain && reverb) {
                  source.connect(dryGain);
                  source.connect(reverb);
              } else {
                  // Fallback if graph not fully set up
                  source.connect(ctx.destination);
              }
          }
      } catch (e) {
          console.warn('[AUDIO] Failed to switch modes seamlessly', e);
      }
  }, [isSafeMode]);

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
    console.log('[GEO] Triggering detection...');
    if (!detectedLocation) setLocationStatus('detecting'); // Only show loading if we don't have data
    
    try {
      const loc = await geolocationService.detectLocation();
      const cached = geolocationService.getCachedLocation();
      console.log('[GEO] Detection result:', loc);
      
      if (loc && loc.country && loc.country !== 'Unknown') {
        console.log('[GEO] Valid location found, setting state:', loc);
        setDetectedLocation(loc);
        geolocationService.saveLocationToCache(loc);
        setLocationStatus('ready');
      } else if (cached && cached.country !== 'Unknown') {
        console.log('[GEO] Fallback to cached location:', cached);
        // Only update if we don't have a valid location already (or it matches cache)
        setDetectedLocation(prev => prev?.country && prev.country !== 'Unknown' ? prev : cached);
        setLocationStatus('ready');
      } else {
        console.log('[GEO] Ultimate fallback to Global');
        // CRITICAL FIX: Only set to Global if we have NOTHING else. 
        // If we already have a valid location in state (from a race condition or previous call), KEEP IT.
        setDetectedLocation(prev => {
            if (prev?.country && prev.country !== 'Unknown') {
                console.log('[GEO] Keeping existing valid location instead of resetting to Global:', prev);
                return prev;
            }
            return { country: 'Global', city: 'Global', countryCode: 'Global' };
        });
        setLocationStatus('ready');
      }

      // Auto-switch language logic remains...
      if (!localStorage.getItem('auradiochat_language')) {
         // ... (keep existing logic)
         const target = loc?.country || cached?.country;
         if (target && ['Russia', 'Ukraine', 'Kazakhstan', 'Belarus', 'Uzbekistan'].includes(target)) {
             setLanguage('ru');
         }
      }

    } catch (err) {
      console.error('[GEO] Silent detection error:', err);
      setLocationStatus('ready'); 
    }
  }, []);

  useEffect(() => {
    triggerLocationDetection();
  }, [triggerLocationDetection]);

  const handlePlayStation = useCallback((station: RadioStation) => {
    currentStationRef.current = station; // Instant ref update for Media Session stability
    
    // Scroll to top
    setTimeout(() => {
        if (visualizerRef.current) {
            visualizerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Always try global scroll as fallback for mobile browser bars
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
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
        
        // RE-INITIALIZE Audio Graph logic for Safe Mode
        // If isSafeMode is true, we should probably DISCONNECT the audio element from the context
        // to ensure the OS plays it directly.
        if (isSafeMode) {
            console.log('[AUDIO] Launching in Safe Mode (Direct Path)');
            // Note: If previously connected to a context, we might need a fresh audio element or careful disconnection.
            // On mobile, the safest way to "bypass" is to not call createMediaElementSource.
        }

        audioRef.current.play().catch(() => {});

        // Set 3-second timeout to check if station is "alive"
        loadTimeoutRef.current = window.setTimeout(() => {
            console.warn(`[RADIO] Station ${station.name} is too slow. Filtering and skipping.`);
            
            setStations(prev => {
                const currentIndex = prev.findIndex(s => s.stationuuid === station.stationuuid);
                const newList = prev.filter(s => s.stationuuid !== station.stationuuid);
                
                if (newList.length > 0) {
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

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (!currentStation) {
        if (stations.length) handlePlayStation(stations[0]);
        return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      initAudioContext(); // Ensure context is ready/resumed
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      audioRef.current.play().catch(() => {});
    }
  }, [currentStation, isPlaying, handlePlayStation, stations]);

    // Persistence and Effects
    useEffect(() => {
        localStorage.setItem('auradiochat_random_mode', isRandomMode.toString());
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
    localStorage.setItem('auradiochat_current_theme', currentTheme);
    localStorage.setItem('auradiochat_base_theme', baseTheme);
  }, [currentTheme, baseTheme, customCardColor]);
  useEffect(() => {
    localStorage.setItem('auradiochat_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('auradiochat_visualizer_variant', visualizerVariant);
  }, [visualizerVariant]);

  useEffect(() => {
    localStorage.setItem('auradiochat_viz_settings_v3', JSON.stringify(vizSettingsMap));
  }, [vizSettingsMap]);

  useEffect(() => {
    localStorage.setItem('auradiochat_random_mode', isRandomMode.toString());
  }, [isRandomMode]);

  // Persistent User Profile protection
  useEffect(() => {
    localStorage.setItem('auradiochat_user_profile', JSON.stringify(currentUser));
  }, [currentUser]);
  
  const dedupeStations = (data: RadioStation[]) => {
    // Service already dedupes aggressively, this is just a safety pass for UUID-based fetches
    const seen = new Set();
    return data.filter(s => {
      if (!s.stationuuid || seen.has(s.stationuuid)) return false;
      seen.add(s.stationuuid);
      return true;
    });
  };

  // Sync refs for stable handlers
  useEffect(() => { stationsRef.current = stations; }, [stations]);
  useEffect(() => { currentStationRef.current = currentStation; }, [currentStation]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isRandomModeRef.current = isRandomMode; }, [isRandomMode]);
  useEffect(() => { handleNextStationRef.current = handleNextStation; }, [handleNextStation]);
  useEffect(() => { handlePreviousStationRef.current = handlePreviousStation; }, [handlePreviousStation]);
  useEffect(() => { handlePlayStationRef.current = handlePlayStation; }, [handlePlayStation]);
  useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);

  // Consolidate Media Session Logic for maximum cross-device compatibility
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // 1. Update Metadata
    if (currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: currentStation.tags || 'AU RadioChat Radio',
        album: 'AU RadioChat Live',
        artwork: [
          { src: currentStation.favicon || '/logo192.png', sizes: '96x96', type: 'image/png' },
          { src: currentStation.favicon || '/logo128.png', sizes: '128x128', type: 'image/png' },
          { src: currentStation.favicon || '/logo192.png', sizes: '192x192', type: 'image/png' },
          { src: currentStation.favicon || '/logo512.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }

    // 2. Set Playback State
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentStation, isPlaying]);

  // Persistent Media Session Handlers (registered once)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: Record<string, MediaSessionActionHandler> = {
      play: () => {
          console.log('[MediaSession] Play Triggered');
          if (togglePlayRef.current) togglePlayRef.current();
      },
      pause: () => {
          console.log('[MediaSession] Pause Triggered');
          if (togglePlayRef.current) togglePlayRef.current();
      },
      stop: () => {
          console.log('[MediaSession] Stop Triggered');
          if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
          }
      },
      nexttrack: () => {
          console.log('[MediaSession] Next Track Triggered');
          if (isRandomModeRef.current) handleNextStationRef.current();
          else {
              const s = stationsRef.current;
              const c = currentStationRef.current;
              if (s.length > 0) {
                  const idx = c ? s.findIndex(st => st.stationuuid === c.stationuuid) : -1;
                  const next = (idx + 1) % s.length;
                  handlePlayStationRef.current(s[next]);
              }
          }
      },
      previoustrack: () => {
          console.log('[MediaSession] Previous Track Triggered');
          const s = stationsRef.current;
          const c = currentStationRef.current;
          if (s.length > 0) {
              const idx = c ? s.findIndex(st => st.stationuuid === c.stationuuid) : -1;
              const prev = (idx - 1 + s.length) % s.length;
              handlePlayStationRef.current(s[prev]);
          }
      }
    };

    // Also map seek actions to prev/next for car/headset compatibility
    handlers.seekbackward = handlers.previoustrack;
    handlers.seekforward = handlers.nexttrack;

    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
      } catch (e) {
        // Some browsers don't support all actions
      }
    });

    return () => {
        // Cleanup handlers if needed
        Object.keys(handlers).forEach(action => {
            try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, null); } catch(e){}
        });
    };
  }, []); // Only once

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
             stats[c] = (stats[c] || 0) + 1;
         });
         setCountryStats(stats);
         
         // FALLBACK: If we still don't have a location, but we see a major country in the stats (which might include us if backend detected us), use it.
         // Or improved logic: If we are "Unknown", and the backend sends us in the list with a country, GRAFT it.
         if (currentUser.id) {
             const myUserParams = users.find(u => u.id === currentUser.id);
             if (myUserParams && (myUserParams.country !== 'Unknown' || myUserParams.detectedCountry)) {
                 const bestCountry = myUserParams.detectedCountry || myUserParams.country;
                 if (bestCountry && bestCountry !== 'Unknown' && (!detectedLocation || detectedLocation.country === 'Unknown')) {
                     console.log('[GEO] 📡 Grafting location from Socket Presence:', bestCountry);
                     setDetectedLocation({ country: bestCountry, city: 'Unknown', countryCode: 'Unknown' });
                 }
             }
         }
    });

    // Handle incoming knocks
    return () => {
      cleanupPresence();
      cleanupPresenceList();
    };
  }, [currentUser.id, detectedLocation]);

  const loadCategory = useCallback(async (category: CategoryInfo | null, mode: ViewMode, autoPlay: boolean = false, isModeSwitch: boolean = false) => { 
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        if (isModeSwitch) {
            // Explicitly set 5s timer for category switches to ensure it doesn't close immediately
            if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
            sidebarTimerRef.current = setTimeout(() => {
                setSidebarOpen(false);
            }, 5000);
        } else {
            // Style selection: close immediately
            if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
            setSidebarOpen(false);
            // Scroll to top after sidebar closes
            setTimeout(() => {
                if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    }
    const requestId = Date.now();
    loadRequestIdRef.current = requestId;
    setViewMode(mode); setSelectedCategory(category); setIsLoading(true); setVisibleCount(INITIAL_CHUNK); setStations([]);
    setIsAiCurating(false); 
    try {
      if (mode === 'favorites') {
        const savedFavs = localStorage.getItem('auradiochat_favorites');
        const favUuids = savedFavs ? JSON.parse(savedFavs) : [];
        const data = favUuids.length ? await fetchStationsByUuids(favUuids) : [];
        const dedupedPrev = dedupeStations(data);
        if (loadRequestIdRef.current === requestId) { setStations(dedupedPrev); setIsLoading(false); if (dedupedPrev.length > 0 && autoPlay) handlePlayStation(dedupedPrev[0]); }
      } else if (category) {
        const fastData = await fetchStationsByTag(category.id, 10);
        const dedupedFast = dedupeStations(fastData);
        if (loadRequestIdRef.current === requestId) { setStations(dedupedFast); setIsLoading(false); if (dedupedFast.length > 0 && autoPlay) handlePlayStation(dedupedFast[0]); }
        let fetchLimit = (category.id === 'chinese' || category.id === 'vietnam' || category.id === 'oriental' || category.id === 'love' || category.id === 'slow') ? 250 : 120; 
        fetchStationsByTag(category.id, fetchLimit).then(fullData => { 
            const dedupedFull = dedupeStations(fullData);
            if (loadRequestIdRef.current === requestId && dedupedFull.length > 0) setStations(dedupedFull); 
        }).catch(() => {});
      }
    } catch (e) { if (loadRequestIdRef.current === requestId) setIsLoading(false); }
  }, [handlePlayStation]);

  useEffect(() => { loadCategory(GENRES[0], 'genres', false); }, [loadCategory]);
  
  useEffect(() => {
    if (!sidebarOpen && sidebarTimerRef.current) {
        clearTimeout(sidebarTimerRef.current);
        sidebarTimerRef.current = null;
    }
  }, [sidebarOpen]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(p => { const n = p.includes(id) ? p.filter(fid => fid !== id) : [...p, id]; localStorage.setItem('auradiochat_favorites', JSON.stringify(n)); return n; });
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

  const LanguageWrapper = ({ children }: { children: React.ReactNode }) => {
      const { lang } = useParams<{ lang: string }>();
      useEffect(() => {
          if (lang && ['en', 'es', 'fr', 'de', 'ru', 'zh'].includes(lang)) {
              setLanguage(lang as Language);
          }
      }, [lang]);
      return <>{children}</>;
  };

  const renderHome = () => (
    <>
        <Helmet>
            <title>AU RadioChat – Global Online Radio Streaming Player</title>
            <meta name="description" content="AU RadioChat – Global Online Radio Streaming Platform. Listen to jazz, rock, electronic, hip-hop and world radio stations live. Free international internet radio player with smart chat." />
            <link rel="canonical" href="https://auradiochat.com/" />
        </Helmet>
        {selectedCategory && viewMode !== 'favorites' && (
            <div ref={visualizerRef} className="mb-8">
                <div className="p-10 h-56 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-end animated-player-border">
                    <div className={`absolute inset-0 bg-gradient-to-r ${selectedCategory.color} opacity-20 mix-blend-overlay`}></div>
                    <div className="absolute inset-x-0 bottom-0 top-0 z-0 opacity-40"><AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} variant={visualizerVariant} settings={vizSettings} visualMode={visualMode} danceStyle={danceStyle} /></div>
                    {/* Category name removed for clean visualizer look */}
                </div>
                {/* Trust Line */}
                <div className="text-center mt-4 opacity-0 animate-in fade-in slide-in-from-top-2 duration-700 delay-300 fill-mode-forwards">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">24/7 Live Streaming • Global Stations • No Installation Required</p>
                </div>
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
            <div ref={loaderRef} className="h-20 flex items-center justify-center relative z-10 opacity-30">
                <div className="animate-pulse flex space-x-1"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div></div>
            </div>
        )}
        <SEOContent language={language} />
    </>
  );

  // Ensure lights are turned off when chat is closed
  useEffect(() => {
    if (!chatOpen) {
      setIsGlobalLightsOn(false);
    }
  }, [chatOpen]);

  return (
    <ErrorBoundary>
    <div className={`relative flex h-screen font-sans overflow-hidden bg-[var(--base-bg)] text-[var(--text-base)] transition-all duration-700`}>
      <SEOHead language={language} />
      <RainEffect intensity={ambience.rainVolume} />
      <RainEffect intensity={ambience.rainVolume} />
      <FireEffect intensity={ambience.fireVolume} />
      {/* Global Dimming Overlay for "Stage Mode" */}
      <div className={`absolute inset-0 bg-black/80 z-[80] transition-opacity duration-1000 pointer-events-none ${isGlobalLightsOn ? 'opacity-100' : 'opacity-0'}`} />
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        webkit-playsinline="true"
        onPlay={() => {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        }}
        onPlaying={() => { 
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            setIsBuffering(false); 
            setIsPlaying(true); 
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        }} 
        onPause={() => {
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            setIsPlaying(false);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        }} 
        onWaiting={() => setIsBuffering(true)} 
        onEnded={() => { 
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            if (audioRef.current) { audioRef.current.load(); audioRef.current.play().catch(() => {}); } 
        }} 
        onError={() => {
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        }}
      />
      

      {(window.innerWidth < 1024 && sidebarOpen) && ( <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} /> )}

      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-all duration-500 glass-panel flex flex-col bg-[var(--panel-bg)] ${isIdleView ? '-translate-x-full opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <Link to="/" className="hover:opacity-80 transition-opacity flex flex-col">
                        <div className="text-2xl font-black tracking-tighter leading-none text-white">AU RadioChat</div>
                        <div className="text-[10px] font-bold text-rose-500 tracking-widest uppercase mt-1">
                            {t.tagline || 'Global Online Radio Streaming Player'}
                        </div>
                    </Link>
                    <span className="text-[9px] font-semibold text-slate-400 tracking-wider mt-0.5 italic opacity-90">
                        V1.1 • {t.platform || 'Global Streaming Platform'}
                    </span>
                </div>
               <DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-12 h-12" visualMode={visualMode} />
           </div>
           <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-left duration-300">
            <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--panel-border)] gap-1">
                {(['genres', 'eras', 'moods', 'effects'] as const).map(m => (
                    <button key={m} onClick={(e) => { e.stopPropagation(); loadCategory(m === 'genres' ? GENRES[0] : m === 'eras' ? ERAS[0] : m === 'moods' ? MOODS[0] : EFFECTS[0], m, true, true); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === m ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400'}`}>{t[m]}</button>
                ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); loadCategory(null, 'favorites', true, true); }} className={`w-full py-3 rounded-2xl text-xs font-black border transition-all ${viewMode === 'favorites' ? 'bg-secondary border-secondary text-white' : 'bg-[var(--input-bg)] text-slate-400'}`}>
                <HeartIcon className="w-4 h-4 inline mr-2" filled={viewMode === 'favorites'} /> {t.favorites}
            </button>
        </div>
        <div 
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 no-scrollbar"
          onScroll={() => {
              if (sidebarTimerRef.current) {
                  clearTimeout(sidebarTimerRef.current);
                  sidebarTimerRef.current = setTimeout(() => setSidebarOpen(false), 5000);
              }
          }}
        >
        {viewMode !== 'favorites' && (viewMode === 'genres' ? GENRES : viewMode === 'eras' ? ERAS : viewMode === 'moods' ? MOODS : EFFECTS).map((cat) => (
            <button key={cat.id} onClick={(e) => { e.stopPropagation(); loadCategory(cat, viewMode, true); }} className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all ${selectedCategory?.id === cat.id ? 'bg-[var(--selected-item-bg)] font-black' : 'text-slate-400 hover:text-[var(--text-base)]'}`}>
                {t[cat.id] || cat.name}
            </button>
        ))}
        </div>
        {/* Sidebar Footer - Restore PWA/Download for Desktop only */}
        <div className="p-4 pt-2 border-t border-[var(--panel-border)] hidden md:block">
             <button onClick={() => setDownloadModalOpen(true)} className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/5 hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                <DownloadIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                <div className="text-left"><p className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white transition-colors">{t.mobileApp || 'Mobile App'}</p><p className="text-xs font-black text-white">{t.downloadText || 'Download'}</p></div>
             </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <header className={`h-20 flex items-center px-4 md:px-10 justify-between shrink-0 transition-all duration-500 z-10 ${isIdleView ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              aria-label="Open Menu"
              className="p-2 text-[var(--text-base)] hover:text-primary transition-colors flex items-center justify-center"
              title={t.manualTooltip}
            >
              <MenuIcon className="w-7 h-7" />
            </button>
            {/* Mobile Online Counter */}
            <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm ml-1">
                <span className="text-xs animate-spin-slow">🌍</span>
                <span className="text-[11px] font-black text-primary tracking-tighter">
                    {onlineStats.totalOnline || 1}
                </span>
            </div>

            {/* Listening text hidden on mobile, visible on desktop */}
            <div className="hidden md:flex text-slate-400 text-sm font-medium tracking-wide items-center gap-3">
                <span className="whitespace-nowrap">{t.listeningTo}</span>
                <span className="text-[var(--text-base)] font-black uppercase tracking-widest">
                    {viewMode === 'favorites' ? t.favorites : (selectedCategory ? (t[selectedCategory.id] || selectedCategory.name) : 'Radio')}
                </span>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.05em] flex items-center gap-2">
                        {language === 'ru' ? 'СЕЙЧАС СЛУШАЕТ' : 'LISTENING NOW'}
                        <span className="text-sm">{getCountryFlag(detectedLocation?.countryCode || Object.keys(countryStats)[0] || 'KZ')}</span>
                        <span className="text-primary">*{ (detectedLocation?.country || getCountryName(Object.keys(countryStats)[0] || 'KZ', language)).toUpperCase() }*</span>
                        <span className="text-white/10">-</span> 
                        {language === 'ru' ? 'ОНЛАЙН' : 'ONLINE'} {onlineStats.totalOnline || 1}
                    </span>
                </div>
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
              {/* Online Counter - Smart Ticker Mode Removed/Consolidated */}
            </div>
          </div>
          
          <div className="flex items-center shrink-0 gap-1 md:gap-4">
            {/* Language Switcher - Hidden on mobile, Visible on desktop */}
            <div className="hidden sm:flex items-center bg-white/5 rounded-full p-1 border border-white/5 gap-1">
                {(['en', 'ru', 'es', 'fr', 'zh', 'de'] as Language[]).map((lang) => (
                    <button 
                        key={lang}
                        onClick={() => setLanguage(lang)} 
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-full transition-all ${language === lang ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title={lang.toUpperCase()}
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Online Counter moved elsewhere */}

            {/* Super-chat label with arrow */}
            <button 
                onClick={() => setToolsOpen(!toolsOpen)} 
                className={`p-2 rounded-full relative hover:scale-110 transition-transform shrink-0 z-50 ${toolsOpen ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : 'text-slate-400 hover:text-white'}`}
                title={t.tools}
            >
                <RocketIcon className="w-6 h-6" />
            </button>

            <button 
                onClick={() => setFeedbackOpen(true)} 
                className={`p-2 rounded-full relative hover:scale-110 transition-transform shrink-0 z-50 ${feedbackOpen ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
                title={t.feedback}
            >
                <EnvelopeIcon className="w-6 h-6" />
            </button>

            {!chatOpen && (
                <div className="flex items-center gap-1 animate-pulse -mr-1 md:mr-0 z-40 pointer-events-none">
                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Super-chat</span>
                    <div className="text-primary text-xs">→</div> 
                </div>
            )}
            <button 
                onClick={() => setChatOpen(!chatOpen)} 
                aria-label="Toggle Chat"
                className="p-2 rounded-full relative text-primary hover:scale-110 transition-transform shrink-0 z-50"
            >
                <ChatBubbleIcon className="w-6 h-6" />
                {pendingKnocksCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e293b] animate-pulse">
                        {pendingKnocksCount}
                    </span>
                )}
            </button>
          </div>
        </header>

        <div ref={mainContentRef} className={`flex-1 overflow-y-auto px-6 md:px-10 no-scrollbar transition-all duration-500 ${isIdleView ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <Routes>
                <Route path="/" element={renderHome()} />
                <Route path="/:lang" element={<LanguageWrapper>{renderHome()}</LanguageWrapper>} />
                <Route path="/radio/:slug" element={<DynamicRadioHub setLanguage={setLanguage} onPlay={handlePlayStation} currentStation={currentStation} favorites={favorites} toggleFavorite={toggleFavorite} language={language} />} />
                <Route path="/:lang/radio/:slug" element={<DynamicRadioHub setLanguage={setLanguage} onPlay={handlePlayStation} currentStation={currentStation} favorites={favorites} toggleFavorite={toggleFavorite} language={language} />} />
                <Route path="/favorites" element={
                    <>
                        <Helmet>
                            <title>My Favorite Radio Stations – AU RadioChat</title>
                            <meta name="description" content="Access your personally curated list of global radio stations. Your favorite jazz, rock Park, and electronic streams in one place." />
                        </Helmet>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-32">
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[1.2] rounded-[2rem] skeleton-loader"></div>) : (
                                visibleStations.map((station, index) => (
                                    <StationCard key={station.stationuuid} station={station} index={index} isSelected={currentStation?.stationuuid === station.stationuuid} isFavorite={favorites.includes(station.stationuuid)} onPlay={handlePlayStation} onToggleFavorite={toggleFavorite} />
                                ))
                            )}
                            {visibleStations.length === 0 && !isLoading && (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">No favorites yet</p>
                                    <Link to="/" className="px-6 py-3 bg-primary/20 text-primary rounded-xl font-black uppercase tracking-tighter hover:bg-primary/30 transition-all">Explore Stations</Link>
                                </div>
                            )}
                        </div>
                    </>
                } />
                <Route path="/about" element={<AboutPage language={language} />} />
                <Route path="/privacy-policy" element={<PrivacyPage language={language} />} />
                <Route path="/contact" element={<ContactPage language={language} />} />
                <Route path="/genres" element={<GenresPage language={language} />} />
                <Route path="/jazz-radio" element={<JazzRadioPage language={language} />} />
                <Route path="/rock-radio" element={<RockRadioPage language={language} />} />
                <Route path="/electronic-radio" element={<ElectronicRadioPage language={language} />} />
                <Route path="/hip-hop-radio" element={<HipHopRadioPage language={language} />} />
                <Route path="/directory" element={<DirectoryPage language={language} />} />
            </Routes>
                <footer className="w-full pb-64 pt-20 flex flex-col items-center justify-center gap-10 opacity-80 z-0 relative border-t border-white/5 mt-20">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <Link to="/about" className="hover:text-white transition-colors">{t.aboutAU}</Link>
                            <span className="text-slate-800">•</span>
                            <Link to="/genres" className="hover:text-white transition-colors">{t.genresText}</Link>
                            <span className="text-slate-800">•</span>
                            <Link to="/privacy-policy" className="hover:text-white transition-colors">{t.privacyPolicy}</Link>
                            <span className="text-slate-800">•</span>
                            <Link to="/contact" className="hover:text-white transition-colors">{t.contactText}</Link>
                            <span className="text-slate-800">•</span>
                            <Link to="/directory" className="hover:text-white transition-colors">{t.directoryText}</Link>
                        </div>
                        <div className="w-16 h-px bg-slate-800"></div>
                        <p className="text-[10px] text-slate-600 font-bold tracking-widest text-center px-4">
                            {t.copyRight}
                        </p>
                    </div>
                </footer>
        </div>

        {/* Idle View Removed */}

        <div className={`absolute bottom-2 md:bottom-8 left-0 right-0 px-2 md:px-10 transition-all duration-700 ease-in-out z-20 ${chatOpen ? 'md:pr-[420px] lg:pr-[470px]' : ''} ${isIdleView ? 'opacity-0 translate-y-20 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'}`}>
            <div className={`pointer-events-auto w-full md:w-full md:max-w-[1440px] mx-auto rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-6 flex flex-col md:flex-row items-center shadow-2xl border-2 border-[var(--panel-border)] transition-all duration-500 bg-[var(--player-bar-bg)]`}>
               
                {/* ROW 1: STATION INFO (Mobile Only - Logo Restored with Avatar Fallback) */}
                <div className="flex md:hidden items-center gap-3 mb-2 relative z-10 w-full pr-16 bg-black/20 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Mascot Container */}
                    <div className="w-14 h-14 shrink-0 relative transition-transform active:scale-95 group cursor-pointer" onClick={() => setSidebarOpen(true)}>
                         {/* Main Mascot Box */}
                        <div className="w-full h-full flex items-center justify-center relative z-10">
                            <DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-full h-full" visualMode={visualMode} />
                        </div>
                    </div>
                
                    {/* Info - Left Aligned */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="flex items-center">
                                <h4 className="font-black text-sm leading-tight truncate text-slate-100 uppercase tracking-wider">
                                    {selectedCategory 
                                        ? (t[selectedCategory.id] || selectedCategory.name) 
                                        : (currentStation?.tags?.[0] || (currentStation?.name ? 'Radio' : 'Stream'))}
                                </h4>
                                {/* Language Switcher - Mobile Player Bar - Bigger & Spaced */}
                                <div className="flex items-center bg-white/10 rounded-md p-0.5 border border-white/5 ml-4">
                                    <button 
                                        onClick={() => setLanguage('en')} 
                                        className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-all ${language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'}`}
                                    >
                                        EN
                                    </button>
                                    <button 
                                        onClick={() => setLanguage('ru')} 
                                        className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-all ${language === 'ru' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'}`}
                                    >
                                        RU
                                    </button>
                                </div>
                            </div>
                            {isBuffering && <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-tight mt-0.5">Buffering...</p>}
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

                {/* ROW 2.5 (Mobile Only): VISUALIZERS SCROLLABLE */}
                <div className="flex md:hidden w-full overflow-x-auto no-scrollbar gap-1 pb-2 mb-1 mask-linear-fade pr-12">
                    {VISUALIZERS_LIST.map(viz => (
                        <button
                            key={viz.id}
                            onClick={() => setVisualizerVariant(viz.id)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 border ${
                                visualizerVariant === viz.id 
                                ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            <span className={visualizerVariant === viz.id ? 'shimmering-text-active' : 'shimmering-text'}>
                                {t[viz.labelKey] || viz.id}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ROW 3: CONTROLS */}
                <div className="flex items-center justify-between w-full md:w-auto md:gap-4 z-10 px-2 md:px-0 md:mx-4">
                    
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
                            onClick={togglePlay} 
                            className={`w-14 h-14 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-black shadow-xl hover:scale-105 transition-all mx-1 duration-75 relative overflow-hidden group ${isPlaying ? 'bg-white' : 'bg-white/90'}`}
                        >
                            {isBuffering || locationStatus === 'detecting' ? (
                                <LoadingIcon className="animate-spin w-6 h-6 text-primary" />
                            ) : isPlaying ? (
                                <PauseIcon className="w-6 h-6" />
                            ) : (
                                <PlayIcon className="w-6 h-6 ml-1" />
                            )}
                            
                            {/* Location Status Indicator */}
                            {locationStatus === 'detecting' && (
                                <div className="absolute top-1 right-2 text-[8px] animate-pulse">🛰️</div>
                            )}
                            {locationStatus === 'error' && (
                                <div className="absolute top-1 right-2 text-[8px] text-red-500" title="Location detection failed - using fallback">⚠️</div>
                            )}
                        </button>
                        
                        <button onClick={handleNextStation} className="p-2 text-slate-400 hover:text-white transition-colors"><NextIcon className="w-6 h-6" /></button>
                    </div>

                    {/* RIGHT GROUP: Heart & Shuffle & More */}
                    <div className="flex items-center gap-2 md:gap-4">
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
                        
                        {/* Presets & Visualizers (Desktop Only) */}
                        <div className="hidden 2xl:flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
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
                            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
                                {VISUALIZERS_LIST.map(viz => (
                                    <button
                                        key={viz.id}
                                        onClick={() => setVisualizerVariant(viz.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                                            visualizerVariant === viz.id 
                                            ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105' 
                                            : 'text-slate-500 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span className={visualizerVariant === viz.id ? 'shimmering-text-active' : 'shimmering-text'}>
                                            {t[viz.labelKey] || viz.id}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 3: DESKTOP EXTRAS (Volume, etc) */}
                <div className="hidden md:flex flex-1 justify-end items-center gap-2 md:gap-4 z-10 pr-6 md:pr-2">
                    {/* Animated Smiley (Desktop Only, Shown when Sidebar is closed) */}
                    {!sidebarOpen && (
                        <div className="hidden md:block w-14 h-14 group cursor-pointer transition-all hover:scale-110 active:scale-95 mr-1" 
                             onClick={() => setSidebarOpen(true)}
                             title="Show Sidebar"
                        >
                            <DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-full h-full" visualMode={visualMode} />
                        </div>
                    )}
                    <button 
                         onClick={() => setShareOpen(true)}
                         className="p-2 text-slate-400 hover:text-primary transition-colors hover:scale-110"
                         title="Share"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setToolsOpen(!toolsOpen)} className={`p-2.5 text-[var(--text-base)] hover:text-primary transition-colors ${isIdleView ? 'hidden' : ''}`}><AdjustmentsIcon className="w-6 h-6" /></button>
                    <div className="flex items-center gap-3 ml-2">
                        <VolumeIcon className="w-5 h-5 text-slate-400" />
                        <VolumeDrum value={volume} onChange={setVolume} />
                    </div>
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
              autoDance={autoDance} setAutoDance={setAutoDance}
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
        <Suspense fallback={null}><LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} language={language} /></Suspense>

      </main>
      <Suspense fallback={null}>
        <ChatPanel 
            isOpen={chatOpen} 
            onClose={() => {
                setChatOpen(false);
                setIsGlobalLightsOn(false);
            }} 
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
            // Debug prop
            onRequireLogin={() => {
                console.log('[App] Passing location to ChatPanel:', detectedLocation);
                setShowLoginModal(true);
            }}
            onLightsToggle={setIsGlobalLightsOn}
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