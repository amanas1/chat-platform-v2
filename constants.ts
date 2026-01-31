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

// Blocked countries - not allowed to access chat (all countries NOT in COUNTRIES_DATA are blocked)
export const BLOCKED_COUNTRIES = [
  'North Korea', 'DPRK', 'Democratic People\'s Republic of Korea',
  // Countries explicitly blocked regardless of the allowed list
  'Afghanistan', 'Syria', 'Iran', 'Iraq', 'Yemen',
  // Central African countries
  'Central African Republic', 'Chad', 'Cameroon', 'Republic of the Congo', 'Democratic Republic of the Congo',
  'Equatorial Guinea', 'Gabon', 'São Tomé and Príncipe',
  'Burundi', 'Rwanda', 'Uganda', 'South Sudan', 'Sudan',
  'Eritrea', 'Djibouti', 'Somalia',
  'Mali', 'Niger', 'Burkina Faso', 'Mauritania',
  'Liberia', 'Sierra Leone', 'Guinea', 'Guinea-Bissau',
  'Nigeria', 'Kenya', 'Ethiopia', 'Ghana',
  // Pacific Islands
  'Tuvalu', 'Nauru', 'Palau', 'Marshall Islands', 'Micronesia', 
  'Kiribati', 'Tonga', 'Samoa', 'Vanuatu', 'Solomon Islands',
  'Fiji', 'Papua New Guinea',
  // Other blocked regions
  'Guatemala', 'Honduras', 'Nicaragua', 'Panama',
  'Colombia', 'Ecuador', 'Peru', 'Bolivia', 'Paraguay', 'Argentina', 'Uruguay',
  'Mexico', 'Jamaica', 'Trinidad and Tobago', 'Dominican Republic',
  'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Bhutan', 'Myanmar',
  'Indonesia', 'Philippines',
  'Algeria', 'Tunisia', 'Libya', 'Egypt',
];

// Map country names from various languages to standard English names used in COUNTRIES_DATA
// This helps match geolocation API responses (which may be in Russian or local language)
export const COUNTRY_NAME_ALIASES: Record<string, string> = {
  // Kazakhstan
  'казахстан': 'Kazakhstan',
  'қазақстан': 'Kazakhstan',
  'kz': 'Kazakhstan',
  
  // Russia
  'россия': 'Russia',
  'российская федерация': 'Russia',
  'russian federation': 'Russia',
  'ru': 'Russia',
  
  // Ukraine
  'украина': 'Ukraine',
  'україна': 'Ukraine',
  'ua': 'Ukraine',
  
  // Belarus
  'беларусь': 'Belarus',
  'белоруссия': 'Belarus',
  'беларусія': 'Belarus',
  'by': 'Belarus',
  
  // Uzbekistan
  'узбекистан': 'Uzbekistan',
  'oʻzbekiston': 'Uzbekistan',
  'uz': 'Uzbekistan',
  
  // Kyrgyzstan
  'кыргызстан': 'Kyrgyzstan',
  'киргизия': 'Kyrgyzstan',
  'кыргызстан республикасы': 'Kyrgyzstan',
  'kg': 'Kyrgyzstan',
  
  // Turkmenistan
  'туркменистан': 'Turkmenistan',
  'türkmenistan': 'Turkmenistan',
  'tm': 'Turkmenistan',
  
  // Azerbaijan
  'азербайджан': 'Azerbaijan',
  'azərbaycan': 'Azerbaijan',
  'az': 'Azerbaijan',
  
  // Armenia
  'армения': 'Armenia',
  'հայdelays': 'Armenia',
  'am': 'Armenia',
  
  // Georgia
  'грузия': 'Georgia',
  'საქართველო': 'Georgia',
  'ge': 'Georgia',
  
  // Mongolia
  'монголия': 'Mongolia',
  'монгол улс': 'Mongolia',
  'mn': 'Mongolia',
  
  // Turkey
  'турция': 'Turkey',
  'türkiye': 'Turkey',
  'tr': 'Turkey',
  
  // Germany
  'германия': 'Germany',
  'deutschland': 'Germany',
  'de': 'Germany',
  
  // France
  'франция': 'France',
  'fr': 'France',
  
  // Italy
  'италия': 'Italy',
  'italia': 'Italy',
  'it': 'Italy',
  
  // Spain
  'испания': 'Spain',
  'españa': 'Spain',
  'es': 'Spain',
  
  // Poland
  'польша': 'Poland',
  'polska': 'Poland',
  'pl': 'Poland',
  
  // UK
  'великобритания': 'UK',
  'соединённое королевство': 'UK',
  'united kingdom': 'UK',
  'england': 'UK',
  'великобританія': 'UK',
  'gb': 'UK',
  
  // USA
  'сша': 'USA',
  'соединённые штаты америки': 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  'us': 'USA',
  
  // China
  'китай': 'China',
  '中国': 'China',
  'cn': 'China',
  
  // Japan
  'япония': 'Japan',
  '日本': 'Japan',
  'jp': 'Japan',
  
  // South Korea
  'южная корея': 'South Korea',
  '한국': 'South Korea',
  'republic of korea': 'South Korea',
  'kr': 'South Korea',
  
  // Israel
  'израиль': 'Israel',
  'ישראל': 'Israel',
  'il': 'Israel',
  
  // UAE
  'оаэ': 'UAE',
  'объединённые арабские эмираты': 'UAE',
  'united arab emirates': 'UAE',
  'ae': 'UAE',
  
  // Thailand
  'таиланд': 'Thailand',
  'ประเทศไทย': 'Thailand',
  'th': 'Thailand',
  
  // Czech Republic
  'чехия': 'Czech Republic',
  'česko': 'Czech Republic',
  'czech': 'Czech Republic',
  'cz': 'Czech Republic',
  
  // Austria
  'австрия': 'Austria',
  'österreich': 'Austria',
  'at': 'Austria',
  
  // Netherlands
  'нидерланды': 'Netherlands',
  'голландия': 'Netherlands',
  'nederland': 'Netherlands',
  'nl': 'Netherlands',
  
  // Belgium
  'бельгия': 'Belgium',
  'belgië': 'Belgium',
  'belgique': 'Belgium',
  'be': 'Belgium',
  
  // Sweden
  'швеция': 'Sweden',
  'sverige': 'Sweden',
  'se': 'Sweden',
  
  // Norway
  'норвегия': 'Norway',
  'norge': 'Norway',
  'no': 'Norway',
  
  // Finland
  'финляндия': 'Finland',
  'suomi': 'Finland',
  'fi': 'Finland',
  
  // Denmark
  'дания': 'Denmark',
  'danmark': 'Denmark',
  'dk': 'Denmark',
  
  // Portugal
  'португалия': 'Portugal',
  'pt': 'Portugal',
  
  // Greece
  'греция': 'Greece',
  'ελλάδα': 'Greece',
  'gr': 'Greece',
  
  // Hungary
  'венгрия': 'Hungary',
  'magyarország': 'Hungary',
  'hu': 'Hungary',
  
  // Romania
  'румыния': 'Romania',
  'românia': 'Romania',
  'ro': 'Romania',
  
  // Bulgaria
  'болгария': 'Bulgaria',
  'българия': 'Bulgaria',
  'bg': 'Bulgaria',
  
  // Serbia
  'сербия': 'Serbia',
  'србија': 'Serbia',
  'rs': 'Serbia',
  
  // Croatia
  'хорватия': 'Croatia',
  'hrvatska': 'Croatia',
  'hr': 'Croatia',
  
  // Slovakia
  'словакия': 'Slovakia',
  'slovensko': 'Slovakia',
  'sk': 'Slovakia',
  
  // Slovenia
  'словения': 'Slovenia',
  'slovenija': 'Slovenia',
  'si': 'Slovenia',
  
  // Switzerland
  'швейцария': 'Switzerland',
  'schweiz': 'Switzerland',
  'suisse': 'Switzerland',
  'ch': 'Switzerland',
  
  // Canada
  'канада': 'Canada',
  'ca': 'Canada',
  
  // Australia
  'австралия': 'Australia',
  'au': 'Australia',
  
  // New Zealand
  'новая зеландия': 'New Zealand',
  'nz': 'New Zealand',
  
  // Singapore
  'сингапур': 'Singapore',
  'sg': 'Singapore',
  
  // Malaysia
  'малайзия': 'Malaysia',
  'my': 'Malaysia',
  
  // Vietnam
  'вьетнам': 'Vietnam',
  'việt nam': 'Vietnam',
  'vn': 'Vietnam',
  
  // Saudi Arabia
  'саудовская аравия': 'Saudi Arabia',
  'sa': 'Saudi Arabia',
  
  // Qatar
  'катар': 'Qatar',
  'qa': 'Qatar',
  
  // Ireland
  'ирландия': 'Ireland',
  'éire': 'Ireland',
  'ie': 'Ireland',
  
  // Lithuania
  'литва': 'Lithuania',
  'lietuva': 'Lithuania',
  'lt': 'Lithuania',
  
  // Latvia
  'латвия': 'Latvia',
  'latvija': 'Latvia',
  'lv': 'Latvia',
  
  // Estonia
  'эстония': 'Estonia',
  'eesti': 'Estonia',
  'ee': 'Estonia',
  
  // Cyprus
  'кипр': 'Cyprus',
  'κύπρος': 'Cyprus',
  'cy': 'Cyprus',
  
  // Malta
  'мальта': 'Malta',
  'mt': 'Malta',
  
  // Luxembourg
  'люксембург': 'Luxembourg',
  'lu': 'Luxembourg',
  
  // Iceland
  'исландия': 'Iceland',
  'ísland': 'Iceland',
  'is': 'Iceland',
  
  // Maldives
  'мальдивы': 'Maldives',
  'mv': 'Maldives',
  
  // Cambodia
  'камбоджа': 'Cambodia',
  'kh': 'Cambodia',
  
  // Laos
  'лаос': 'Laos',
  'la': 'Laos',
  
  // Taiwan
  'тайвань': 'Taiwan',
  '台灣': 'Taiwan',
  'tw': 'Taiwan',
  
  // Moldova
  'молдова': 'Moldova',
  'молдавия': 'Moldova',
  'md': 'Moldova',
  
  // Brazil
  'бразилия': 'Brazil',
  'brasil': 'Brazil',
  'br': 'Brazil',
};

// Helper function to normalize country names
export function normalizeCountryName(name: string): string {
  if (!name) return 'Unknown';
  
  const lowercaseName = name.toLowerCase().trim();
  
  // Check if it's in our aliases
  if (COUNTRY_NAME_ALIASES[lowercaseName]) {
    return COUNTRY_NAME_ALIASES[lowercaseName];
  }
  
  // Check if it directly matches any country in COUNTRIES_DATA (case-insensitive)
  const directMatch = COUNTRIES_DATA.find(c => 
    c.name.toLowerCase() === lowercaseName
  );
  if (directMatch) {
    return directMatch.name;
  }
  
  // Return original name capitalized if no match found
  return name;
}

export const COUNTRIES_DATA = [
  // Europe (EU + approved)
  { name: 'Austria', lat: 47.51, lon: 14.55, cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'] },
  { name: 'Belgium', lat: 50.50, lon: 4.46, cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'] },
  { name: 'Bulgaria', lat: 42.73, lon: 25.48, cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse'] },
  { name: 'Croatia', lat: 45.10, lon: 15.20, cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'] },
  { name: 'Cyprus', lat: 35.12, lon: 33.42, cities: ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos'] },
  { name: 'Czech Republic', lat: 49.81, lon: 15.47, cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec'] },
  { name: 'Czechia', lat: 49.81, lon: 15.47, cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec'] },
  { name: 'Denmark', lat: 56.26, lon: 9.50, cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'] },
  { name: 'Estonia', lat: 58.59, lon: 25.01, cities: ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve'] },
  { name: 'Finland', lat: 61.92, lon: 25.74, cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'] },
  { name: 'France', lat: 46.22, lon: 2.21, cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'] },
  { name: 'Germany', lat: 51.16, lon: 10.45, cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig'] },
  { name: 'Greece', lat: 39.07, lon: 21.82, cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'] },
  { name: 'Hungary', lat: 47.16, lon: 19.50, cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'] },
  { name: 'Ireland', lat: 53.14, lon: -7.69, cities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'] },
  { name: 'Italy', lat: 41.87, lon: 12.56, cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence'] },
  { name: 'Latvia', lat: 56.87, lon: 24.60, cities: ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala'] },
  { name: 'Lithuania', lat: 55.16, lon: 23.88, cities: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys'] },
  { name: 'Luxembourg', lat: 49.81, lon: 6.12, cities: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange'] },
  { name: 'Malta', lat: 35.93, lon: 14.37, cities: ['Valletta', 'Birkirkara', 'Qormi', 'Sliema', 'Mosta'] },
  { name: 'Netherlands', lat: 52.13, lon: 5.29, cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'] },
  { name: 'North Macedonia', lat: 41.51, lon: 21.74, cities: ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo'] },
  { name: 'Norway', lat: 60.47, lon: 8.46, cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen'] },
  { name: 'Poland', lat: 51.91, lon: 19.14, cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin'] },
  { name: 'Portugal', lat: 39.39, lon: -8.22, cities: ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga'] },
  { name: 'Romania', lat: 45.94, lon: 24.96, cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'] },
  { name: 'Serbia', lat: 44.01, lon: 21.00, cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'] },
  { name: 'Slovakia', lat: 48.66, lon: 19.69, cities: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica'] },
  { name: 'Slovenia', lat: 46.15, lon: 14.99, cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Koper'] },
  { name: 'Spain', lat: 40.46, lon: -3.74, cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma'] },
  { name: 'Sweden', lat: 60.12, lon: 18.64, cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'] },
  { name: 'Switzerland', lat: 46.81, lon: 8.22, cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'] },
  
  // Non-EU Europe (approved)
  { name: 'Armenia', lat: 40.06, lon: 45.03, cities: ['Yerevan', 'Gyumri', 'Vanadzor', 'Hrazdan', 'Abovyan'] },
  { name: 'Azerbaijan', lat: 40.14, lon: 47.57, cities: ['Baku', 'Ganja', 'Sumgait', 'Mingachevir', 'Lankaran'] },
  { name: 'Georgia', lat: 42.31, lon: 43.35, cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi'] },
  { name: 'Russia', lat: 61.52, lon: 105.31, cities: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Yekaterinburg', 'Chelyabinsk', 'Samara', 'Krasnodar'] },
  { name: 'Turkey', lat: 38.96, lon: 35.24, cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'] },
  { name: 'Ukraine', lat: 48.37, lon: 31.16, cities: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Lviv', 'Zaporizhzhia', 'Kryvyi Rih'] },
  { name: 'UK', lat: 55.37, lon: -3.43, cities: ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Manchester', 'Leeds', 'Bristol', 'Edinburgh'] },
  { name: 'United Kingdom', lat: 55.37, lon: -3.43, cities: ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Manchester', 'Leeds', 'Bristol', 'Edinburgh'] },
  
  // CIS / Central Asia (approved)
  { name: 'Kazakhstan', lat: 48.01, lon: 66.92, cities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau'] },
  { name: 'Kyrgyzstan', lat: 41.20, lon: 74.76, cities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Naryn', 'Tokmok'] },
  { name: 'Mongolia', lat: 46.86, lon: 103.84, cities: ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan'] },
  { name: 'Turkmenistan', lat: 38.96, lon: 59.55, cities: ['Ashgabat', 'Türkmenabat', 'Daşoguz', 'Mary', 'Balkanabat'] },
  { name: 'Uzbekistan', lat: 41.37, lon: 64.58, cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan', 'Fergana'] },
  
  // Asia (approved)
  { name: 'Cambodia', lat: 12.56, lon: 104.99, cities: ['Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville'] },
  { name: 'China', lat: 35.86, lon: 104.19, cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Xi\'an', 'Hangzhou'] },
  { name: 'Israel', lat: 31.04, lon: 34.85, cities: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva'] },
  { name: 'Japan', lat: 36.20, lon: 138.25, cities: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Yokohama', 'Kobe', 'Kyoto'] },
  { name: 'Laos', lat: 19.85, lon: 102.49, cities: ['Vientiane', 'Pakse', 'Savannakhet', 'Luang Prabang'] },
  { name: 'Malaysia', lat: 4.21, lon: 101.97, cities: ['Kuala Lumpur', 'Johor Bahru', 'George Town', 'Ipoh', 'Kuching'] },
  { name: 'Maldives', lat: 3.20, lon: 73.22, cities: ['Malé', 'Addu City', 'Fuvahmulah'] },
  { name: 'Qatar', lat: 25.35, lon: 51.18, cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal'] },
  { name: 'Saudi Arabia', lat: 23.88, lon: 45.07, cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Taif'] },
  { name: 'Singapore', lat: 1.35, lon: 103.81, cities: ['Singapore', 'Jurong East', 'Tampines', 'Woodlands', 'Ang Mo Kio'] },
  { name: 'South Korea', lat: 35.90, lon: 127.76, cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan'] },
  { name: 'Taiwan', lat: 23.69, lon: 120.96, cities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu'] },
  { name: 'Thailand', lat: 15.87, lon: 100.99, cities: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket', 'Hat Yai', 'Nakhon Ratchasima'] },
  { name: 'UAE', lat: 23.42, lon: 53.84, cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah'] },
  { name: 'United Arab Emirates', lat: 23.42, lon: 53.84, cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah'] },
  { name: 'Vietnam', lat: 14.05, lon: 108.27, cities: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang'] },
  
  // Americas (approved)
  { name: 'Brazil', lat: -14.23, lon: -51.92, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba'] },
  { name: 'Canada', lat: 56.13, lon: -106.34, cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg'] },
  { name: 'Chile', lat: -35.67, lon: -71.54, cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta'] },
  { name: 'Cuba', lat: 21.52, lon: -77.78, cities: ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara'] },
  { name: 'El Salvador', lat: 13.79, lon: -88.89, cities: ['San Salvador', 'Santa Ana', 'San Miguel', 'Mejicanos'] },
  { name: 'USA', lat: 37.09, lon: -95.71, cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Miami'] },
  { name: 'United States', lat: 37.09, lon: -95.71, cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Miami'] },
  { name: 'Venezuela', lat: 6.42, lon: -66.58, cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay'] },
  
  // Africa (approved)
  { name: 'Madagascar', lat: -18.76, lon: 46.86, cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa'] },
  { name: 'Morocco', lat: 31.79, lon: -7.09, cities: ['Casablanca', 'Rabat', 'Fez', 'Marrakesh', 'Tangier', 'Agadir'] },
  { name: 'South Africa', lat: -30.56, lon: 22.93, cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'] },
  
  // Oceania (approved)
  { name: 'Australia', lat: -25.27, lon: 133.77, cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle'] },
  { name: 'New Zealand', lat: -40.90, lon: 174.88, cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin'] },
].sort((a, b) => a.name.localeCompare(b.name));

// Country verification data for Trust Score system
export const COUNTRY_VERIFICATION_DATA: Record<string, { 
  timezones: string[]; 
  locales: string[];
  utcOffsetRange: [number, number]; // min and max UTC offset in hours
}> = {
  'Argentina': { timezones: ['America/Argentina'], locales: ['es-AR', 'es'], utcOffsetRange: [-3, -3] },
  'Australia': { timezones: ['Australia/'], locales: ['en-AU'], utcOffsetRange: [8, 11] },
  'Austria': { timezones: ['Europe/Vienna'], locales: ['de-AT', 'de'], utcOffsetRange: [1, 2] },
  'Belgium': { timezones: ['Europe/Brussels'], locales: ['nl-BE', 'fr-BE', 'de-BE'], utcOffsetRange: [1, 2] },
  'Brazil': { timezones: ['America/Sao_Paulo', 'America/Fortaleza', 'America/Manaus'], locales: ['pt-BR', 'pt'], utcOffsetRange: [-5, -2] },
  'Canada': { timezones: ['America/Toronto', 'America/Vancouver', 'America/Montreal', 'America/Edmonton'], locales: ['en-CA', 'fr-CA'], utcOffsetRange: [-8, -3] },
  'China': { timezones: ['Asia/Shanghai', 'Asia/Chongqing'], locales: ['zh-CN', 'zh'], utcOffsetRange: [8, 8] },
  'Denmark': { timezones: ['Europe/Copenhagen'], locales: ['da-DK', 'da'], utcOffsetRange: [1, 2] },
  'Egypt': { timezones: ['Africa/Cairo'], locales: ['ar-EG', 'ar'], utcOffsetRange: [2, 2] },
  'Finland': { timezones: ['Europe/Helsinki'], locales: ['fi-FI', 'fi'], utcOffsetRange: [2, 3] },
  'France': { timezones: ['Europe/Paris'], locales: ['fr-FR', 'fr'], utcOffsetRange: [1, 2] },
  'Germany': { timezones: ['Europe/Berlin'], locales: ['de-DE', 'de'], utcOffsetRange: [1, 2] },
  'Greece': { timezones: ['Europe/Athens'], locales: ['el-GR', 'el'], utcOffsetRange: [2, 3] },
  'India': { timezones: ['Asia/Kolkata', 'Asia/Calcutta'], locales: ['hi-IN', 'en-IN', 'ta-IN', 'te-IN', 'bn-IN'], utcOffsetRange: [5.5, 5.5] },
  'Italy': { timezones: ['Europe/Rome'], locales: ['it-IT', 'it'], utcOffsetRange: [1, 2] },
  'Japan': { timezones: ['Asia/Tokyo'], locales: ['ja-JP', 'ja'], utcOffsetRange: [9, 9] },
  'Kazakhstan': { timezones: ['Asia/Almaty', 'Asia/Aqtobe'], locales: ['kk-KZ', 'ru-KZ', 'kk', 'ru'], utcOffsetRange: [5, 6] },
  'Kyrgyzstan': { timezones: ['Asia/Bishkek'], locales: ['ky-KG', 'ru-KG', 'ky', 'ru'], utcOffsetRange: [6, 6] },
  'Mexico': { timezones: ['America/Mexico_City', 'America/Tijuana'], locales: ['es-MX', 'es'], utcOffsetRange: [-8, -5] },
  'Netherlands': { timezones: ['Europe/Amsterdam'], locales: ['nl-NL', 'nl'], utcOffsetRange: [1, 2] },
  'Norway': { timezones: ['Europe/Oslo'], locales: ['nb-NO', 'nn-NO', 'no'], utcOffsetRange: [1, 2] },
  'Poland': { timezones: ['Europe/Warsaw'], locales: ['pl-PL', 'pl'], utcOffsetRange: [1, 2] },
  'Portugal': { timezones: ['Europe/Lisbon'], locales: ['pt-PT', 'pt'], utcOffsetRange: [0, 1] },
  'Russia': { timezones: ['Europe/Moscow', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok'], locales: ['ru-RU', 'ru'], utcOffsetRange: [2, 12] },
  'Saudi Arabia': { timezones: ['Asia/Riyadh'], locales: ['ar-SA', 'ar'], utcOffsetRange: [3, 3] },
  'South Korea': { timezones: ['Asia/Seoul'], locales: ['ko-KR', 'ko'], utcOffsetRange: [9, 9] },
  'Spain': { timezones: ['Europe/Madrid'], locales: ['es-ES', 'ca-ES', 'es'], utcOffsetRange: [1, 2] },
  'Sweden': { timezones: ['Europe/Stockholm'], locales: ['sv-SE', 'sv'], utcOffsetRange: [1, 2] },
  'Switzerland': { timezones: ['Europe/Zurich'], locales: ['de-CH', 'fr-CH', 'it-CH'], utcOffsetRange: [1, 2] },
  'Turkey': { timezones: ['Europe/Istanbul'], locales: ['tr-TR', 'tr'], utcOffsetRange: [3, 3] },
  'UAE': { timezones: ['Asia/Dubai'], locales: ['ar-AE', 'ar'], utcOffsetRange: [4, 4] },
  'UK': { timezones: ['Europe/London'], locales: ['en-GB', 'en'], utcOffsetRange: [0, 1] },
  'Ukraine': { timezones: ['Europe/Kiev', 'Europe/Kyiv'], locales: ['uk-UA', 'ru-UA', 'uk'], utcOffsetRange: [2, 3] },
  'USA': { timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'], locales: ['en-US'], utcOffsetRange: [-10, -4] },
  'Uzbekistan': { timezones: ['Asia/Tashkent', 'Asia/Samarkand'], locales: ['uz-UZ', 'ru-UZ', 'uz', 'ru'], utcOffsetRange: [5, 5] },
};

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
        speed: 'Speed', react: 'React', bright: 'Bright', performanceMode: 'Visualizer Mode', accentColor: 'Accent Color', reset: 'Reset',
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
        speed: 'Скорость', react: 'Реакция', bright: 'Яркость', performanceMode: 'Режим визуализации', accentColor: 'Акцент', reset: 'Сброс',
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