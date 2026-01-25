import { CategoryInfo, UserProfile, Achievement, PassportData } from './types';
import { CloudIcon, FireIcon, MusicNoteIcon, GlobeIcon, MoonIcon, HeartIcon } from './components/Icons';
import React from 'react';

// Radio browser API mirrors
export const RADIO_BROWSER_MIRRORS = [
    'https://all.api.radio-browser.info/json/stations',
    'https://de1.api.radio-browser.info/json/stations',
    'https://at1.api.radio-browser.info/json/stations',
    'https://nl1.api.radio-browser.info/json/stations',
    'https://fr1.api.radio-browser.info/json/stations',
    'https://uk1.api.radio-browser.info/json/stations'
];

export const DEFAULT_VOLUME = 0.5;

export const GENRES: CategoryInfo[] = [
    { id: 'jazz', name: 'Jazz', color: 'from-amber-400 to-orange-600', description: 'Smooth rhythms and improvisations.' },
    { id: 'blues', name: 'Blues', color: 'from-blue-600 to-indigo-800', description: 'Soulful rhythms and melancholic melodies.' },
    { id: 'rock', name: 'Rock', color: 'from-red-600 to-purple-900', description: 'Energetic beats and powerful guitars.' },
    { id: 'classical', name: 'Classical', color: 'from-blue-200 to-slate-400', description: 'Timeless masterpieces and symphonies.' },
    { id: 'electronic', name: 'Electronic', color: 'from-cyan-400 to-blue-600', description: 'Synthesized sounds and modern beats.' },
    { id: 'hiphop', name: 'Hip Hop', color: 'from-green-400 to-yellow-600', description: 'Rhythmic speech and street culture.' },
    { id: 'pop', name: 'Pop', color: 'from-pink-400 to-rose-600', description: 'Catchy melodies and chart-topping hits.' },
    { id: 'rnb', name: 'R&B', color: 'from-violet-500 to-fuchsia-600', description: 'Rhythm and Blues, soulful and smooth.' },
    { id: 'reggae', name: 'Reggae', color: 'from-green-500 to-yellow-500', description: 'Relaxed Jamaican rhythms and vibes.' },
    { id: 'soul', name: 'Soul', color: 'from-rose-400 to-orange-400', description: 'Deeply emotional vocal music.' },
    { id: 'islamic', name: 'Faith & Religion', color: 'from-emerald-600 to-teal-900', description: 'Spiritual readings, prayers, and religious texts.' }
];

export const ERAS: CategoryInfo[] = [
    { id: '60s', name: '60s', color: 'from-yellow-300 to-orange-500', description: 'The era of peace, love, and rock & roll.' },
    { id: '70s', name: '70s', color: 'from-orange-500 to-red-600', description: 'Disco, funk, and the rise of stadium rock.' },
    { id: '80s', name: '80s', color: 'from-fuchsia-500 to-indigo-600', description: 'Synth-pop, big hair, and MTV classics.' },
    { id: '90s', name: '90s', color: 'from-teal-400 to-blue-500', description: 'Grunge, rave culture, and the golden age of R&B.' },
    { id: '00s', name: '00s', color: 'from-slate-400 to-slate-600', description: 'The digital revolution and fusion genres.' }
];

export const MOODS: CategoryInfo[] = [
    { id: 'chill', name: 'Chill', type: 'mood', color: 'from-blue-400 to-indigo-500', description: 'Relaxing tunes for a peaceful mind.' },
    { id: 'energy', name: 'Energy', type: 'mood', color: 'from-yellow-400 to-orange-500', description: 'Upbeat tracks to get you moving.' },
    { id: 'focus', name: 'Focus', type: 'mood', color: 'from-emerald-400 to-teal-600', description: 'Background music for work and study.' },
    { id: 'romantic', name: 'Romantic', type: 'mood', color: 'from-rose-400 to-pink-600', description: 'Melodies for special moments.' },
    { id: 'dark', name: 'Club', type: 'mood', color: 'from-slate-800 to-black', description: 'Powerful beats for club enthusiasts.' },
    // World Music
    { id: 'vietnamese', name: 'Vietnamese', type: 'mood', color: 'from-red-500 to-yellow-500', description: 'Music from Vietnam.' },
    { id: 'japanese', name: 'Japanese', type: 'mood', color: 'from-red-400 to-pink-400', description: 'Music from Japan.' },
    { id: 'russian', name: 'Russian', type: 'mood', color: 'from-blue-600 to-red-600', description: 'Music from Russia.' },
    { id: 'spanish', name: 'Spanish', type: 'mood', color: 'from-yellow-400 to-red-500', description: 'Music from Spain.' },
    { id: 'italian', name: 'Italian', type: 'mood', color: 'from-green-500 to-red-500', description: 'Music from Italy.' },
    { id: 'french', name: 'French', type: 'mood', color: 'from-blue-500 to-red-500', description: 'Music from France.' },
    { id: 'kazakh', name: 'Kazakh', type: 'mood', color: 'from-cyan-400 to-yellow-300', description: 'Music from Kazakhstan.' },
    { id: 'kyrgyz', name: 'Kyrgyz', type: 'mood', color: 'from-red-500 to-yellow-400', description: 'Music from Kyrgyzstan.' },
    { id: 'kavkaz', name: 'Caucasian', type: 'mood', color: 'from-stone-500 to-stone-700', description: 'Music from the Caucasus.' },
    { id: 'oriental', name: 'Eastern', type: 'mood', color: 'from-amber-500 to-orange-600', description: 'Oriental rhythms.' },
    { id: 'chinese', name: 'Chinese', type: 'mood', color: 'from-red-600 to-yellow-400', description: 'Music from China.' },
];

export const EFFECTS: CategoryInfo[] = [
    { id: 'nature', name: 'Nature', type: 'effect', color: 'from-green-400 to-emerald-600', description: 'Pure sounds of the wild.' },
    { id: 'rain', name: 'Rain', type: 'effect', color: 'from-blue-400 to-slate-600', description: 'Soothing rain and storms.' },
    { id: 'ocean', name: 'Ocean', type: 'effect', color: 'from-cyan-400 to-blue-600', description: 'Waves and sea breeze.' },
    { id: 'forest', name: 'Forest', type: 'effect', color: 'from-emerald-600 to-green-800', description: 'Woodland ambience.' },
    { id: 'storm', name: 'Storm', type: 'effect', color: 'from-slate-600 to-purple-900', description: 'Thunder and heavy rain.' },
];

export const COUNTRIES_DATA = [
  { name: 'Argentina', lat: -38.41, lon: -63.61, cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'] },
  { name: 'Australia', lat: -25.27, lon: 133.77, cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'Austria', lat: 47.51, lon: 14.55, cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'] },
  { name: 'Belgium', lat: 50.50, lon: 4.46, cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'] },
  { name: 'Brazil', lat: -14.23, lon: -51.92, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
  { name: 'Canada', lat: 56.13, lon: -106.34, cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'] },
  { name: 'China', lat: 35.86, lon: 104.19, cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
  { name: 'Denmark', lat: 56.26, lon: 9.50, cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'] },
  { name: 'Egypt', lat: 26.82, lon: 30.80, cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'] },
  { name: 'Finland', lat: 61.92, lon: 25.74, cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'] },
  { name: 'France', lat: 46.22, lon: 2.21, cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
  { name: 'Germany', lat: 51.16, lon: 10.45, cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'] },
  { name: 'Greece', lat: 39.07, lon: 21.82, cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'] },
  { name: 'India', lat: 20.59, lon: 78.96, cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'] },
  { name: 'Italy', lat: 41.87, lon: 12.56, cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'] },
  { name: 'Japan', lat: 36.20, lon: 138.25, cities: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka'] },
  { name: 'Kazakhstan', lat: 48.01, lon: 66.92, cities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe'] },
  { name: 'Kyrgyzstan', lat: 41.20, lon: 74.76, cities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Naryn'] },
  { name: 'Mexico', lat: 23.63, lon: -102.55, cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Toluca'] },
  { name: 'Netherlands', lat: 52.13, lon: 5.29, cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'] },
  { name: 'Norway', lat: 60.47, lon: 8.46, cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum'] },
  { name: 'Poland', lat: 51.91, lon: 19.14, cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'] },
  { name: 'Portugal', lat: 39.39, lon: -8.22, cities: ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga'] },
  { name: 'Russia', lat: 61.52, lon: 105.31, cities: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Yekaterinburg'] },
  { name: 'Saudi Arabia', lat: 23.88, lon: 45.07, cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
  { name: 'South Korea', lat: 35.90, lon: 127.76, cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
  { name: 'Spain', lat: 40.46, lon: -3.74, cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'] },
  { name: 'Sweden', lat: 60.12, lon: 18.64, cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'] },
  { name: 'Switzerland', lat: 46.81, lon: 8.22, cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'] },
  { name: 'Turkey', lat: 38.96, lon: 35.24, cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'] },
  { name: 'UAE', lat: 23.42, lon: 53.84, cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman'] },
  { name: 'UK', lat: 55.37, lon: -3.43, cities: ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Manchester'] },
  { name: 'Ukraine', lat: 48.37, lon: 31.16, cities: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk'] },
  { name: 'USA', lat: 37.09, lon: -95.71, cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { name: 'Uzbekistan', lat: 41.37, lon: 64.58, cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'] },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEMO_USERS: UserProfile[] = [
    { id: 'd1', name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=11', age: 22, country: 'Kazakhstan', city: 'Almaty', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd2', name: 'Marcus', avatar: 'https://i.pravatar.cc/150?u=12', age: 28, country: 'Germany', city: 'Berlin', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd3', name: 'Sofia', avatar: 'https://i.pravatar.cc/150?u=13', age: 24, country: 'France', city: 'Paris', status: 'offline', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd4', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=14', age: 31, country: 'USA', city: 'New York', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd5', name: 'Aisha', avatar: 'https://i.pravatar.cc/150?u=15', age: 20, country: 'Kazakhstan', city: 'Astana', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd6', name: 'Liam', avatar: 'https://i.pravatar.cc/150?u=16', age: 26, country: 'UK', city: 'London', status: 'offline', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd7', name: 'Mika', avatar: 'https://i.pravatar.cc/150?u=17', age: 23, country: 'Japan', city: 'Tokyo', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } },
    { id: 'd8', name: 'Kaan', avatar: 'https://i.pravatar.cc/150?u=18', age: 29, country: 'Turkey', city: 'Istanbul', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }, chatSettings: { notificationsEnabled: true, notificationVolume: 0.8, notificationSound: 'default' } }
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
    {
        id: 'explorer',
        icon: '🌍',
        titleKey: 'Globetrotter',
        descKey: 'Visit 5 different countries',
        condition: (data: PassportData) => data.countriesVisited.length >= 5
    },
    {
        id: 'night_owl',
        icon: '🦉',
        titleKey: 'Night Owl',
        descKey: 'Listen for 60 minutes at night',
        condition: (data: PassportData) => data.nightListeningMinutes >= 60
    },
    {
        id: 'audiophile',
        icon: '🎧',
        titleKey: 'Audiophile',
        descKey: 'Listen for 1000 total minutes',
        condition: (data: PassportData) => data.totalListeningMinutes >= 1000
    },
    {
        id: 'curator',
        icon: '❤️',
        titleKey: 'Curator',
        descKey: 'Favorite 10 stations',
        condition: (data: PassportData) => data.stationsFavorited >= 10
    }
];

export const NEWS_MESSAGES: Record<string, string[]> = {
    en: [
        "🎛 PRO Tip: Mix 'HiFi Bass' and 'Loudness' in the FX tab to achieve crystal clear studio quality.",
        "🏟 Live Concert Feel: Add 20% 'Reverb' and a touch of 'City' noise to feel like you're in a concert hall.",
        "☕️ Cozy Vibe: Play some Jazz, add 40% 'Vinyl' crackle and 10% 'Fire' for the perfect evening.",
        "🎧 8D Magic: Put on headphones and enable 'Spatial Audio' — feel the music rotate around you.",
        "🔋 Low Battery? Turn on 'Energy Saver' in Visual settings to save power.",
        "🚀 Pump it up: Crank up the 'Compressor' for Electronic and Phonk tracks to get that punchy sound.",
        "🌌 Full Immersion: Double-click the visualizer to enter fullscreen mode.",
        "⚙️ Settings: Rotate phone (landscape) for more features."
    ],
    ru: [
        "🎛 PRO Совет: Смешайте 'HiFi Bass' и 'Loudness' во вкладке FX, чтобы добиться кристально чистого студийного качества.",
        "🏟 Эффект присутствия: Добавьте 20% 'Reverb' и немного шума 'City' — почувствуйте себя в центре концертного зала.",
        "☕️ Ламповая атмосфера: Включите джаз, добавьте 40% 'Vinyl' и 10% 'Fire' для идеального уютного вечера.",
        "🎧 8D Звук: Обязательно наденьте наушники и активируйте 'Spatial Audio' — музыка начнет вращаться вокруг вас.",
        "🔋 Слабая батарея? Включите 'Энергосбережение' в настройках визуала, чтобы продлить жизнь телефона.",
        "🚀 Драйв: Для электроники и фонка выкрутите 'Compressor' — это добавит плотности и кача вашим трекам.",
        "🌌 Полное погружение: Дважды кликните по визуализатору, чтобы развернуть его на весь экран.",
        "⚙️ Настройки: Поверни телефон (ландшафт) — больше функций."
    ]
};

export const TRANSLATIONS: Record<string, any> = {
    en: {
        genres: 'Genres', eras: 'Eras', moods: 'Moods', effects: 'Effects', favorites: 'Favorites',
        listeningTo: 'Listening to', loadMore: 'Load More',
        visualizer: 'Visualizer', eq: 'Equalizer', look: 'Appearance', ambience: 'Ambience', fx: 'Effects FX', sleep: 'Sleep Timer',
        vizGalaxy: 'Galaxy', resetFlat: 'Reset Flat', sleepTimer: 'Sleep Timer', turnOffTimer: 'Turn Off', alarm: 'Alarm', on: 'On', off: 'Off', alarm_set: 'Alarm set to', cardColor: 'Card Tint', developerNews: 'App Tips', interfaceLanguage: 'Language',
        findFriends: 'Find Friends', completeProfile: 'Complete Profile', displayName: 'Display Name', gender: 'Gender', male: 'Male', female: 'Female', other: 'Other', age: 'Age', country: 'Country', city: 'City', saveAndEnter: 'Save & Enter', login: 'Login', any: 'Any', search: 'Search', knock: 'Knock',
        tutorialWelcome: 'Welcome to StreamFlow', manualSection2: 'Radio Stream: The Core', manualSection3: 'Sleep Timer: Rest Easy', manualSection5: 'Ambience: Create Atmosphere', manualSection4: 'Chat: Connect Safely',
        tutorialStep1: 'Choose your vibe from Genres, Eras, or Moods.', tutorialStep2: 'Tap any station card to start listening immediately.', tutorialStep3: 'Set a sleep timer or alarm here.', tutorialStep4: 'Mix ambient sounds like rain or fire.', tutorialStep5: 'Chat securely with others listening now.',
        next: 'Next', gotIt: 'Got it', manualTitle: 'User Manual', manualIntro: 'Welcome to StreamFlow, your ultimate radio experience.', whoAreYou: 'Who are you?', createProfile: 'Create your profile to connect.', uploadPhoto: 'Upload Photo', saveProfile: 'Save Profile', joinCommunity: 'Join Community',
        downloader: 'Music Downloader', rain: 'Rain', spatialAudio: '8D Audio', spatialHint: 'Use headphones for best effect', editProfile: 'Edit Profile',
        vizStageDancer: 'Stage Dancer', vizTrioDancers: 'Trio Dancers', vizJourney: 'Journey', vizDigital: 'Digital', vizNeon: 'Neon', vizRings: 'Rings', vizBubbles: 'Bubbles',
        spatialMixer: 'Spatial Mixer',
        // Category Translations
        jazz: 'Jazz', blues: 'Blues', rock: 'Rock', classical: 'Classical', electronic: 'Electronic', hiphop: 'Hip Hop', pop: 'Pop', islamic: 'Faith & Religion', rnb: 'R&B', reggae: 'Reggae', soul: 'Soul',
        '60s': '60s', '70s': '70s', '80s': '80s', '90s': '90s', '00s': '00s',
        chill: 'Chill', energy: 'Energy', focus: 'Focus', romantic: 'Romantic', dark: 'Club',
        nature: 'Nature', storm: 'Storm', ocean: 'Ocean', forest: 'Forest',
        // World Music
        vietnamese: 'Vietnamese', japanese: 'Japanese', russian: 'Russian', spanish: 'Spanish', italian: 'Italian',
        french: 'French', kazakh: 'Kazakh', kyrgyz: 'Kyrgyz', kavkaz: 'Caucasian', oriental: 'Oriental', chinese: 'Chinese',
        // Missing Translations Added
        speed: 'Speed', react: 'React', bright: 'Bright', performanceMode: 'Performance Mode', accentColor: 'Accent Color', reset: 'Reset',
        privateChat: 'PRIVATE CHAT', authTitle: 'Communication Without Borders', authDesc: 'Connect to your personal secure hub. Chat 1-on-1 with mutual consent only. No spam, no noise.', signInGuest: 'Sign in as Guest', online: 'Online', today: 'Today', recording: 'Recording...', send: 'SEND', noUsers: 'No users found', showAll: 'Show All', knocking: 'Knocking', wantsToConnect: 'wants to connect', myDialogs: 'My Dialogs', noChats: 'No chats yet', useDiscovery: "Use 'Discovery Drum' to find people or wait for the Welcome Bot.", photoExpired: '📸 Photo expired', audioExpired: '🎤 Audio expired',
        knockSent: 'Knock Sent!', signInAlert: 'Please sign in via the Chat Panel first.',
        searching: 'Searching databases...', noTracks: 'No tracks found.', errorTracks: 'Error fetching tracks.', loading: 'Loading...', download: 'Download', searchTracks: 'Search tracks...',
        infiniteTracks: 'Infinite Tracks', noAuth: 'No Auth Required', searchLib: 'Search infinite library...', all: 'All', moodChill: 'Chill', moodEnergy: 'Energy', moodPhonk: 'Phonk', moodFocus: 'Focus', moodJazz: 'Jazz', moodParty: 'Party',
        dragRotate: 'Drag to rotate • Click name to play',
        // Feedback
        feedbackTitle: "Feedback",
        writeDev: "Write to Developer",
        rating: "Rate App",
        tellUs: "Tell us what to improve...",
        sendSuccess: "Message sent!",
        manualTooltip: "User Manual",
        showWhere: "Show location",
        helpImprove: "Help us improve StreamFlow.",
        // New
        fpsLimit: 'Save Battery (30 FPS)',
        fpsLimitDesc: 'Reduces smoothness to save battery on weak devices.',
        ecoMode: 'Eco Mode (Stars Only)',
        // Mastering
        mastering: "Mastering & Dynamics",
        compressor: "Compressor",
        threshold: "Threshold",
        ratio: "Ratio",
        hifiBass: "HiFi Bass",
        loudness: "Loudness",
        // Energy Saver
        energySaver: "Energy Saver",
        energySaverDesc: "Reduces battery and CPU usage. Audio quality remains unchanged.",
        // Global Reset
        resetApp: "Reset App to Defaults",
        resetConfirm: "Are you sure you want to reset all settings and data? This action cannot be undone."
    },
    ru: {
        genres: 'Жанры', eras: 'Эпохи', moods: 'Настроение', effects: 'Эффекты', favorites: 'Избранное',
        listeningTo: 'В эфире', loadMore: 'Загрузить еще',
        visualizer: 'Визуал', eq: 'Звук', look: 'Стиль', ambience: 'Атмосфера', fx: 'Эффекты', sleep: 'Сон',
        vizGalaxy: 'Космос', resetFlat: 'Сброс', sleepTimer: 'Режим сна', turnOffTimer: 'Отключить', alarm: 'Будильник', on: 'Вкл', off: 'Выкл', alarm_set: 'Разбудить в', cardColor: 'Оттенок блоков', developerNews: 'Советы', interfaceLanguage: 'Язык',
        findFriends: 'Поиск людей', completeProfile: 'Ваш профиль', displayName: 'Ваше имя', gender: 'Пол', male: 'Мужской', female: 'Женский', other: 'Другой', age: 'Возраст', country: 'Страна', city: 'Город', saveAndEnter: 'Войти', login: 'Логин', any: 'Неважно', search: 'Найти', knock: 'Постучаться',
        tutorialWelcome: 'Добро пожаловать', manualSection2: 'Радио: Сердце Эфира', manualSection3: 'Таймер Сна: Отдыхайте', manualSection5: 'Атмосфера: Создайте Уют', manualSection4: 'Чат: Общайтесь Безопасно',
        tutorialStep1: 'Выберите настроение, жанр или эпоху.', tutorialStep2: 'Нажмите на любую станцию, чтобы начать.', tutorialStep3: 'Здесь можно поставить таймер или будильник.', tutorialStep4: 'Смешивайте звуки дождя или огня.', tutorialStep5: 'Безопасный чат с другими слушателями.',
        next: 'Далее', gotIt: 'Понятно', manualTitle: 'Руководство', manualIntro: 'Добро пожаловать в StreamFlow — ваш идеальный радио-опыт.', whoAreYou: 'Кто вы?', createProfile: 'Создайте профиль для общения.', uploadPhoto: 'Загрузить фото', saveProfile: 'Сохранить', joinCommunity: 'Присоединиться',
        downloader: 'Загрузчик Музыки', rain: 'Дождь', spatialAudio: '8D Звук', spatialHint: 'В наушниках лучше', editProfile: 'Ред. Профиль',
        vizStageDancer: 'Танцор', vizTrioDancers: 'Трио', vizJourney: 'Полет', vizDigital: 'Цифра', vizNeon: 'Неон', vizRings: 'Кольца', vizBubbles: 'Пузыри',
        spatialMixer: 'Звуковая Сцена',
        // Category Translations
        jazz: 'Джаз', blues: 'Блюз', rock: 'Рок', classical: 'Классика', electronic: 'Электроника', hiphop: 'Хип-хоп', pop: 'Поп', islamic: 'Религия', rnb: 'R&B', reggae: 'Регги', soul: 'Соул',
        '60s': '60-е', '70s': '70-е', '80s': '80-е', '90s': '90-е', '00s': '00-е',
        chill: 'Чилл', energy: 'Энергия', focus: 'Фокус', romantic: 'Романтика', dark: 'Клуб',
        nature: 'Природа', storm: 'Шторм', ocean: 'Океан', forest: 'Лес',
        // World Music
        vietnamese: 'Вьетнамская', japanese: 'Японская', russian: 'Русская', spanish: 'Испанская', italian: 'Итальянская',
        french: 'Французская', kazakh: 'Казахская', kyrgyz: 'Кыргызская', kavkaz: 'Кавказская', oriental: 'Восточная', chinese: 'Китайская',
        // Missing Translations Added
        speed: 'Скорость', react: 'Реакция', bright: 'Яркость', performanceMode: 'Режим', accentColor: 'Акцент', reset: 'Сброс',
        privateChat: 'ЛИЧНЫЙ ЧАТ', authTitle: 'Общение без границ', authDesc: 'Ваш безопасный хаб. Общение 1-на-1 только по взаимному согласию. Без спама и шума.', signInGuest: 'Войти как Гость', online: 'Онлайн', сегодня: 'Сегодня', recording: 'Запись...', send: 'ОТПРАВИТЬ', noUsers: 'Никого не найдено', showAll: 'Показать всех', knocking: 'Стучится', wantsToConnect: 'хочет общаться', myDialogs: 'Мои Диалоги', noChats: 'Пока нет чатов', useDiscovery: "Используйте 'Барабан Открытий' или ждите приветствия.", photoExpired: '📸 Фото истекло', audioExpired: '🎤 Аудио истекло',
        knockSent: 'Отправлено!', signInAlert: 'Пожалуйста, сначала войдите через панель чата.',
        searching: 'Поиск в базах...', noTracks: 'Треки не найдены.', errorTracks: 'Ошибка загрузки.', loading: 'Загрузка...', download: 'Скачать', searchTracks: 'Поиск треков...',
        infiniteTracks: 'Бесконечные Треки', noAuth: 'Без регистрации', searchLib: 'Поиск в библиотеке...', all: 'Все', moodChill: 'Чилл', moodEnergy: 'Энергия', moodPhonk: 'Фонк', moodFocus: 'Фокус', moodJazz: 'Джаз', moodParty: 'Вечеринка',
        dragRotate: 'Тяни для вращения • Клик для игры',
        // Feedback
        feedbackTitle: "Отзывы",
        writeDev: "Написать разработчику",
        rating: "Рейтинг",
        tellUs: "Ваши пожелания и замечания...",
        sendSuccess: "Сообщение отправлено!",
        manualTooltip: "Мануал",
        showWhere: "Показать где",
        helpImprove: "Помогите нам улучшить StreamFlow.",
        // New
        fpsLimit: 'Экономия (30 FPS)',
        fpsLimitDesc: 'Снижает плавность для слабых устройств.',
        ecoMode: 'Эко Режим (Звезды)',
        // Mastering
        mastering: "Мастеринг и Динамика",
        compressor: "Компрессор",
        threshold: "Порог",
        ratio: "Сжатие",
        hifiBass: "HiFi Бас",
        loudness: "Глубина (Loud)",
        // Energy Saver
        energySaver: "Энергосбережение",
        energySaverDesc: "Снижает нагрузку на батарею и CPU. Качество звука не меняется.",
        // Global Reset
        resetApp: "Сброс настроек (Reset)",
        resetConfirm: "Вы уверены, что хотите сбросить все настройки и данные приложения? Это действие нельзя отменить."
    }
};