
import { RadioStation } from '../types';
import { RADIO_BROWSER_MIRRORS } from '../constants';

const CACHE_KEY_PREFIX = 'streamflow_station_cache_v15_strict_dedupe_'; // Strict dedupe bump
const CACHE_TTL_MINUTES = 30;

interface CacheEntry {
    data: RadioStation[];
    timestamp: number; 
}

// HQ Hardcoded Fallback (128k+)
const HARDCODED_STATIONS: RadioStation[] = [];

// Islamic Stations (Checked for 128k quality)
const HARDCODED_ISLAMIC: RadioStation[] = [
    {
        changeuuid: 'mohammed-ayyub-001',
        stationuuid: 'mohammed-ayyub-001',
        name: '..mohammed_ayyub',
        url: 'https://backup.qurango.net/radio/mohammed_ayyub',
        url_resolved: 'https://backup.qurango.net/radio/mohammed_ayyub',
        homepage: '',
        favicon: '',
        tags: 'islamic,quran',
        country: 'Saudi Arabia',
        state: '',
        language: 'Arabic',
        votes: 85000,
        codec: 'MP3',
        bitrate: 128
    },
    {
        changeuuid: 'tarateel-quran-001',
        stationuuid: 'tarateel-quran-001',
        name: '. quran',
        url: 'https://backup.qurango.net/radio/tarateel',
        url_resolved: 'https://backup.qurango.net/radio/tarateel',
        homepage: '',
        favicon: '',
        tags: 'islamic,quran',
        country: 'Saudi Arabia',
        state: '',
        language: 'Arabic',
        votes: 80000,
        codec: 'MP3',
        bitrate: 128
    },
    {
        changeuuid: 'maher-al-muaiqly-001',
        stationuuid: 'maher-al-muaiqly-001',
        name: 'إذاعة ماهر المعيقلي .',
        url: 'https://backup.qurango.net/radio/maher',
        url_resolved: 'https://backup.qurango.net/radio/maher',
        homepage: '',
        favicon: '',
        tags: 'islamic,quran',
        country: 'Saudi Arabia',
        state: '',
        language: 'Arabic',
        votes: 88000,
        codec: 'MP3',
        bitrate: 128
    },
    {
        changeuuid: 'beautiful-recitation-001',
        stationuuid: 'beautiful-recitation-001',
        name: 'beautiful recitation',
        url: 'https://backup.qurango.net/radio/mix',
        url_resolved: 'https://backup.qurango.net/radio/mix',
        homepage: '',
        favicon: '',
        tags: 'islamic,quran',
        country: 'Global',
        state: '',
        language: 'Arabic',
        votes: 70000,
        codec: 'MP3',
        bitrate: 128
    }
];

const MOVED_TO_ISLAMIC_NAMES = [
    "..mohammed_ayyub",
    ". quran",
    "إذاعة ماهر المعيقلي .",
    "beautiful recitation"
];

const WORLD_MUSIC_TAGS = ['vietnamese', 'vietnam', 'japanese', 'russian', 'spanish', 'italian', 'french', 'kazakh', 'kyrgyz', 'kavkaz', 'oriental', 'chinese'];

const getFromCache = (key: string): RadioStation[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();
            if (now - entry.timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
                return entry.data;
            }
            localStorage.removeItem(CACHE_KEY_PREFIX + key);
        }
    } catch (e) {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
    }
    return null;
};

const setToCache = (key: string, data: RadioStation[]) => {
    try {
        const entry: CacheEntry = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (e) {}
};

const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
        let rejectedCount = 0;
        const errors: any[] = [];
        if (promises.length === 0) {
            return reject(new Error("No promises provided"));
        }
        promises.forEach((p, i) => {
            p.then(resolve).catch(err => {
                errors[i] = err;
                rejectedCount++;
                if (rejectedCount === promises.length) {
                    reject(new Error("All mirrors failed"));
                }
            });
        });
    });
};

const fetchAcrossMirrorsFast = async (path: string, urlParams: string): Promise<RadioStation[]> => {
    const query = urlParams ? `?${urlParams}` : '';
    
    const fetchPromises = RADIO_BROWSER_MIRRORS.map(async (baseUrl) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 

        try {
            const response = await fetch(`${baseUrl}/${path}${query}`, {
                mode: 'cors',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('Mirror status not OK');
            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    });

    try {
        return await promiseAny(fetchPromises);
    } catch (e) {
        console.warn("All fast mirrors failed, trying fallback...");
        throw new Error("Station source unavailable");
    }
};

const filterStations = (data: RadioStation[], currentTag?: string) => {
    if (!Array.isArray(data)) return [];
    
    const uniqueStations = new Map();
    const len = data.length;

    // Blocklist based on user request to remove specific stations
    const BLOCKED_NAMES = [
        "تفسير بن عثيمين رحمه الله",
        "صور из жизни сподвижников",
        "Classic Vinyl HD",
        "Adroit Jazz Underground",
        "Спокойное радио",
        "PerfectMoods",
        "Easy FM",
        "106.5 Kiss FM",
        "Pure Ibiza Radio",
        "HappyHardcore.com",
        "Test",
        "Stream",
        "My Radio",
        "Radio Marca",
        "Abdulbasit",
        "Test Stream",
        "Generic Radio",
        ".977 Smooth Jazz",
        "Exclusively Led Zeppelin",
        "Sunshine Live - Die 90er",
        "Sunshine Live - Techno",
        "Mixadance FM",
        "90s90s HipHop & Rap",
        "Comedy Radio new link",
        "RTL2",
        "Mix (Medellín) 89.9 FM",
        "the wave - relaxing radio",
        "Islom.uz",
        "Radio Felicidad",
        "80s80s",
        "90s90s Hits",
        "90s90s Dance HQ",
        "MIX Ciudad de México",
        "Sunshine Live - Classics",
        "KISS FM",
        "Kiss FM",
        "Sunshine Live - Focus",
        "Bons Tempos FM",
        "Technolovers - PSYTRANCE",
        "Radio Caprice - Dark Psytrance",
        "DrGnu - Metallica",
        "80s80s Dark Wave"
    ];

    const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const isWorldMusic = currentTag && WORLD_MUSIC_TAGS.includes(currentTag);
    const isVietnamese = currentTag === 'vietnamese' || currentTag === 'vietnam';
    const isKyrgyz = currentTag === 'kyrgyz';
    
    for (let i = 0; i < len; i++) {
      const station = data[i];
      if (!station || !station.url_resolved) continue;

      // 1. HIGH QUALITY CHECK: Bitrate
      // Strict filter: Reject anything below 128kbps to ensure "Studio Quality" or at least standard HQ.
      // We prioritize 192kbps+ in sorting later.
      if (station.bitrate > 0 && station.bitrate < 128) continue;

      // 2. QUALITY CHECK: Test Streams & Bad Names
      const nameLower = station.name.toLowerCase();
      if (nameLower.includes('test') || nameLower.length < 3) continue;

      // 3. Permanent Blocklist
      if (BLOCKED_NAMES.some(n => station.name.includes(n))) continue;

      // 4. Strict Religious Filtering (Applied to ALL categories)
      const t = (station.tags || '').toLowerCase();
      const n = station.name.toLowerCase();

      // Extended Religious Keyword List - blocks all religious content
      const RELIGIOUS_KEYWORDS = [
          'islam', 'quran', 'koran', 'muslim', 'sheikh', 'imam', 'allah', 'prophet', 'hadith', 'sunnah', 'mecca', 'medina', // Islamic
          'religio', 'catholic', 'christian', 'church', 'bible', 'vatican', 'gospel', 'jesus', 'christ', 'pastor', // Christian
          'worship', 'prayer', 'spirit', 'orthodox', 'chant', 'sermon', 'messianic', 'torah', 'synagogue', 'buddhist', 'hindu', // Other religious
          'radio maria', 'esperance', 'ewtn', 'благовест', 'радонеж', 'вера', 'православ' // Specific stations
      ];

      if (RELIGIOUS_KEYWORDS.some(kw => t.includes(kw) || n.includes(kw))) {
          console.log(`[FILTER] Blocking religious content in '${currentTag}': ${station.name}`);
          continue;
      }     // Strict Arabic Character Check for non-Oriental categories
          if (currentTag !== 'oriental' && ARABIC_CHAR_REGEX.test(station.name)) {
              console.log(`[FILTER] Skipping Arabic name in musical category '${currentTag}': ${station.name}`);
              continue;
          }

      // WORLD MUSIC CLEANUP (No Talk/News)
      if (isWorldMusic) {
          const t = (station.tags || '').toLowerCase();
          const n = station.name.toLowerCase();

          // Vietnamese Exception
          if (isVietnamese) {
              if (t.includes('tin tức') || n.includes('tin tức') || t.includes('news')) continue;
          } 
          // Kyrgyz Exception
          else if (isKyrgyz) {
              if ((t.includes('news') || t.includes('talk')) && !t.includes('pop') && !t.includes('music') && !t.includes('hit')) continue;
          }
          else {
              // General cleanup for other world music
              if (t.includes('news') || t.includes('talk') || t.includes('politics') || t.includes('sport')) continue;
          }
      }

      // STRICT CLEANUP FOR CLASSICAL CATEGORY (Specific non-religious talk)
      if (currentTag === 'classical') {
          const t = (station.tags || '').toLowerCase();
          if (t.includes('news') || t.includes('talk') || t.includes('speech') || t.includes('conversation') || t.includes('politics')) continue;
      }
      
      const url = station.url_resolved;
      if (url.charCodeAt(4) !== 115) continue; // Must be https
      
      const codec = (station.codec || '').toLowerCase();
      const isBrowserCompatible = 
        codec.includes('mp3') || 
        codec.includes('aac') || 
        url.includes('.mp3') || 
        url.includes('.aac') ||
        codec === '';

      if (isBrowserCompatible) {
        // 5. LOW QUALITY NOISE CHECK: No favicon + low votes (in popular categories)
        if (!station.favicon && station.votes < 50 && currentTag && ['pop', 'jazz', 'rock', 'dance', 'classical', 'relax', 'electronic'].includes(currentTag)) {
            continue;
        }

        // AGGRESSIVE DEDUPLICATION
        // 1. Normalize URL: remove protocol, www, trailing slashes, and common extensions/params
        const normalizedUrl = url.toLowerCase()
            .replace(/^https?:\/\/(www\.)?/, '')
            .split('?')[0].split('#')[0]
            .replace(/\/$/, '')
            .replace(/\.(mp3|aac|m3u8|pls|m3u)$/, '');
            
        // 2. Normalize Name: lowercase, alphanumeric only to catch "Radio One" vs "Radio 1" vs "Radio-1"
        const normalizedName = station.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Use normalized URL as primary dedupe key because it's more reliable than name
        const dedupeKey = `${normalizedUrl}`;

        const existingDedupe = uniqueStations.get(dedupeKey);
        
        // Secondary check by normalized name to catch same station on different stream providers
        let isDuplicateByName = false;
        if (!existingDedupe) {
            for (const s of uniqueStations.values()) {
                const sNormName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (sNormName === normalizedName && normalizedName.length > 3) {
                    // It's likely a duplicate by name. Keep the one with better bitrate or votes.
                    if (station.votes > s.votes || (station.bitrate > s.bitrate && station.votes > s.votes / 2)) {
                        // Current one is better, replace the old one (we need to find its key though)
                        // For simplicity in Map logic, we'll mark it to be skipped if we find a better one later
                    } else {
                        isDuplicateByName = true;
                    }
                    break;
                }
            }
        }

        if (!isDuplicateByName) {
            if (!existingDedupe || station.votes > existingDedupe.votes) {
                uniqueStations.set(dedupeKey, station);
            }
        }
      }
    }

    return Array.from(uniqueStations.values())
        .sort((a: any, b: any) => {
            // PRIMARY SORT: Bitrate (Higher is better) - "Studio Quality" preference
            const bitrateDiff = b.bitrate - a.bitrate;
            if (bitrateDiff !== 0) return bitrateDiff;
            
            // SECONDARY SORT: Popularity
            return b.votes - a.votes;
        }) as RadioStation[];
};

export const fetchStationsByTag = async (tag: string, limit: number = 30): Promise<RadioStation[]> => {
  let lowerTag = tag.toLowerCase();
  
  if (lowerTag === 'islamic' || lowerTag === 'muslim') {
      return HARDCODED_ISLAMIC;
  }

  if (lowerTag === 'vietnamese') {
      lowerTag = 'vietnam';
  }

  const cacheKey = `tag_v12_hq_${lowerTag}_l${limit}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    let data: RadioStation[] = [];
    const fetchLimit = Math.max(20, Math.ceil(limit * 4));
    
    // REQUEST HQ: Add lastcheckok=1 and bitrateMin=128 for HARD cleanup
    const urlParams = `limit=${fetchLimit}&order=votes&reverse=true&hidebroken=true&bitrateMin=128&lastcheckok=1`;

    if (lowerTag === 'vietnam') {
        const [countryData, musicData, radioData] = await Promise.all([
            fetchAcrossMirrorsFast(`bycountry/vietnam`, urlParams),
            fetchAcrossMirrorsFast(`byname/âm nhạc`, urlParams), 
            fetchAcrossMirrorsFast(`byname/đài`, urlParams)      
        ]);
        data = [...countryData, ...musicData, ...radioData];
    } 
    else if (lowerTag === 'kyrgyz') {
        const [countryData, nameData, bishkekData, obonData] = await Promise.all([
            fetchAcrossMirrorsFast(`bycountry/kyrgyzstan`, urlParams),
            fetchAcrossMirrorsFast(`byname/кыргыз`, urlParams),
            fetchAcrossMirrorsFast(`byname/bishkek`, urlParams),
            fetchAcrossMirrorsFast(`byname/obon`, urlParams)
        ]);
        data = [...countryData, ...nameData, ...bishkekData, ...obonData];
    }
    else {
        data = await fetchAcrossMirrorsFast(`bytag/${lowerTag}`, urlParams);
    }
    
    let result = filterStations(data, lowerTag).slice(0, limit);
    
    const hardcoded = HARDCODED_STATIONS.filter(s => s.tags.includes(lowerTag) || (lowerTag === 'nature' && s.name.includes('Nature')));
    if (hardcoded.length > 0) {
        const newStations = hardcoded.filter(h => !result.some(r => r.url_resolved === h.url_resolved));
        result = [...newStations, ...result];
    }
    
    if (result.length > 0) {
        setToCache(cacheKey, result);
    }
    return result;
  } catch (error) {
    const hardcoded = HARDCODED_STATIONS.filter(s => s.tags.includes(lowerTag));
    if (hardcoded.length > 0) return hardcoded;
    
    return [];
  }
};

export const fetchStationsByUuids = async (uuids: string[]): Promise<RadioStation[]> => {
    if (uuids.length === 0) return [];
    const cacheKey = `uuids_v12_hq_${uuids.sort().join('_')}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return cachedData;

    try {
        const fetchPromises = uuids.slice(0, 15).map(uuid => 
            fetchAcrossMirrorsFast(`byuuid/${uuid}`, '')
        );
        const results = await Promise.all(fetchPromises);
        const result = filterStations(results.flat());
        
        const allHardcoded = [...HARDCODED_STATIONS, ...HARDCODED_ISLAMIC];
        const hardcodedFavs = allHardcoded.filter(s => uuids.includes(s.stationuuid));
        
        if (hardcodedFavs.length > 0) {
             const combined = [...hardcodedFavs, ...result.filter(r => !hardcodedFavs.some(h => h.url_resolved === r.url_resolved))];
             setToCache(cacheKey, combined);
             return combined;
        }

        setToCache(cacheKey, result);
        return result;
    } catch (error) {
        const allHardcoded = [...HARDCODED_STATIONS, ...HARDCODED_ISLAMIC];
        const hardcodedFavs = allHardcoded.filter(s => uuids.includes(s.stationuuid));
        if (hardcodedFavs.length > 0) return hardcodedFavs;
        return [];
    }
};
