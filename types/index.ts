
export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  type?: 'genre' | 'era' | 'mood' | 'effect';
  description?: string;
}

export type ViewMode = 'genres' | 'eras' | 'moods' | 'effects' | 'favorites'; 

export type VisualizerVariant = 'segmented' | 'rainbow-lines' | 'galaxy' | 'mixed-rings' | 'bubbles' | 'stage-dancer' | 'trio-dancers' | 'viz-journey';

export type VisualMode = 'high' | 'medium' | 'low';

export interface VisualizerSettings {
  scaleX: number;
  scaleY: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  opacity: number;
  speed: number;
  autoIdle: boolean;
  performanceMode: boolean;
  danceArmIntensity?: number;
  danceLegIntensity?: number;
  danceHeadIntensity?: number;
  fpsLimit?: boolean;
  isDisabled?: boolean; // Deprecated in favor of energySaver, kept for compatibility if needed
  energySaver: boolean; // New Energy Saver Mode
  barDensity?: number; // 0.5 to 2.0 multiplier
  vizAlignment?: 'center' | 'bottom';
  glowIntensity?: number; // 0 to 2
  bgOpacity?: number; // 0 to 0.8
}

export interface FxSettings {
  reverb: number; // 0 to 1
  speed: number; // 0.8 to 1.2
}

export interface AudioProcessSettings {
  compressorEnabled: boolean;
  compressorThreshold: number; // -100 to 0
  compressorRatio: number; // 1 to 20
  bassBoost: number; // 0 to 20 (dB)
  loudness: number; // 0 to 20 (dB)
}

export type ThemeName = 
  | 'default' 
  | 'emerald' 
  | 'midnight' 
  | 'cyber' 
  | 'volcano' 
  | 'ocean' 
  | 'sakura' 
  | 'gold' 
  | 'frost' 
  | 'forest';

export type BaseTheme = 'dark' | 'light' | 'auto';
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'zh' | 'de';

export interface ChatSettings {
  notificationsEnabled: boolean;
  notificationVolume: number; // 0.0 – 1.0
  notificationSound: 'default' | 'soft' | 'alert';
  bannerNotificationsEnabled: boolean;
  voiceNotificationsEnabled: boolean;
  notificationVoice: 'female' | 'male';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  age: number;
  country?: string; 
  city?: string;
  approxRegion?: string; // Internal privacy-first region hint
  hideFromSearch?: boolean; // Privacy setting: Hide from global search/list
  gender: 'male' | 'female';
  status: 'online' | 'offline';
  intentStatus?: string;
  voiceIntro?: string; // Base64 encoded voice snippet (5-7s)
  voiceIntroTimestamp?: number;
  lastSeen?: number;
  safetyLevel: 'green' | 'yellow' | 'red';
  blockedUsers: string[];
  bio: string;
  hasAgreedToRules: boolean;
  isAuthenticated?: boolean; 
  sentInvites?: { timestamp: number, toUserId: string }[];
  // User Management
  role?: 'early_user' | 'regular';
  early_access?: boolean;
  free_until?: number | null;
  accountStatus?: 'active' | 'warning' | 'blocked';
  email?: string;
  deletionRequestedAt?: number;
  filters: {
    minAge: number;
    maxAge: number;
    countries: string[];
    languages: string[];
    genders: (string | 'any')[];
    soundEnabled: boolean;
  };
  chatSettings: ChatSettings;
  // Geolocation & Anti-Chaos tracking
  detectedCountry?: string;
  detectedCity?: string;
  detectedIP?: string;
  deviceId?: string;
  registrationTimestamp?: number;
  canDeleteAfter?: number;
  // Trust Score system
  trustScore?: number;
  trustLevel?: 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK';
  trustFlags?: string[];
  locationFingerprint?: {
    browserTimezone: string;
    browserLocale: string;
    browserUtcOffset: number;
    userAgent: string;
    platform: string;
  };
  fingerprint?: string; // Device fingerprint for security tracking
}

export interface ChatMessage {
  id: string;
  sessionId: string; 
  senderId: string;
  text?: string;
  image?: string;
  audioBase64?: string;
  timestamp: number;
  read: boolean;
  isSystem?: boolean;
}

export interface ChatSession {
  id: string; 
  participants: string[]; 
  lastMessage: ChatMessage | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // Mandatory 56s timer
  isBridge: boolean; // Always true for this model
  isClosed?: boolean;
}

export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
  message?: string; 
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string; 
  coverUrl: string; 
  duration: number; 
  tags: string[];
}

export interface AmbienceState {
  rainVolume: number;
  rainVariant: 'soft' | 'roof'; 
  fireVolume: number;
  cityVolume: number;
  vinylVolume: number;
  is8DEnabled: boolean;
  spatialSpeed: number; 
}

export interface PassportData {
  countriesVisited: string[];
  totalListeningMinutes: number;
  nightListeningMinutes: number;
  stationsFavorited: number;
  unlockedAchievements: string[];
  level: number;
}

export interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  condition: (data: PassportData) => boolean;
}

export interface BottleMessage {
  id: string;
  text: string;
  senderName: string;
  senderCountry: string;
  timestamp: number;
  isFound: boolean;
}

export interface AlarmConfig {
  enabled: boolean;
  time: string; 
  days: number[]; 
}

export type KnockState = 'idle' | 'sending' | 'received' | 'accepted' | 'rejected' | 'expired';

export interface LocationData {
  country: string;
  city: string;
  countryCode: string;
  region?: string;
  lat?: number;
  lon?: number;
  ip?: string;
}
