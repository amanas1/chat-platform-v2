
import { RadioStation } from '../types';
import { RADIO_BROWSER_MIRRORS } from '../types/constants';

const CACHE_KEY_PREFIX = 'auradiochat_station_cache_v15_strict_dedupe_'; // Strict dedupe bump
const CACHE_TTL_MINUTES = 30;

interface CacheEntry {
    data: RadioStation[];
    timestamp: number; 
}

// HQ Hardcoded Fallback (128k+)
const HARDCODED_STATIONS: RadioStation[] = [];

const WORLD_MUSIC_TAGS = ['vietnamese', 'vietnam', 'japanese', 'russian', 'spanish', 'italian', 'french', 'kazakh', 'kyrgyz', 'oriental', 'chinese'];

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

const fetchAcrossMirrorsFast = async (path: string, urlParams: string): Promise<RadioStation[]> => {
    // path is something like "bytag/jazz" or "bycountry/USA"
    const baseUrl = RADIO_BROWSER_MIRRORS[0].replace(/\/$/, ''); // Remove trailing slash if any
    const query = urlParams ? `?${urlParams}` : '';
    const url = `${baseUrl}/json/stations/${path}${query}`;
    
    console.log(`[RadioAPI] Fetching: ${url}`);
    
    const maxRetries = 2;
    const timeoutMs = 7000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs + (attempt * 2000));

        try {
            const response = await fetch(url, {
                mode: 'cors',
                signal: controller.signal,
                headers: { 
                    'Accept': 'application/json',
                    'User-Agent': 'AU-RadioChat-App/1.1 (https://auradiochat.com)'
                }
            });
            
            clearTimeout(timeoutId);

            if (response.status === 401) {
                console.error(`[RadioAPI] 401 Unauthorized for ${url}. This might be a rate limit or WAF block.`);
                throw new Error('Access denied by API load-balancer');
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }
            
            return data;
        } catch (err: any) {
            clearTimeout(timeoutId);
            const isLastAttempt = attempt === maxRetries;
            
            if (err.name === 'AbortError') {
                console.warn(`[RadioAPI] Timeout on attempt ${attempt + 1}: ${url}`);
            } else {
                console.warn(`[RadioAPI] Error on attempt ${attempt + 1}: ${err.message}`);
            }

            if (isLastAttempt) {
                console.error("[RadioAPI] All fetch attempts failed for:", url);
                throw new Error("Radio service currently unavailable.");
            }
            
            // Jittered backoff: 500ms, 1500ms
            await new Promise(resolve => setTimeout(resolve, 500 + (attempt * 1000)));
        }
    }

    return [];
};

const filterStations = (data: RadioStation[], currentTag?: string) => {
    if (!Array.isArray(data)) return [];
    
    const uniqueStations = new Map();
    const len = data.length;

    const BLOCKED_NAMES = [
        "تفسير بن عثимين رحمه الله", "صور из жизни сподвижников", "Classic Vinyl HD",
        "Adroit Jazz Underground", "Спокойное радио", "PerfectMoods", "Easy FM",
        "106.5 Kiss FM", "Pure Ibiza Radio", "HappyHardcore.com", "Test", "Stream",
        "My Radio", "Radio Marca", "Abdulbasit", "Test Stream", "Generic Radio",
        ".977 Smooth Jazz", "Exclusively Led Zeppelin", "Sunshine Live - Die 90er",
        "Sunshine Live - Techno", "Mixadance FM", "90s90s HipHop & Rap",
        "Comedy Radio new link", "RTL2", "Mix (Medellín) 89.9 FM",
        "the wave - relaxing radio", "Islom.uz", "Radio Felicidad", "80s80s",
        "90s90s Hits", "90s90s Dance HQ", "MIX Ciudad de México", "Sunshine Live - Classics",
        "KISS FM", "Kiss FM", "Sunshine Live - Focus", "Bons Tempos FM",
        "Technolovers - PSYTRANCE", "Radio Caprice - Dark Psytrance",
        "DrGnu - Metallica", "80s80s Dark Wave", "Radio RECORD", "Deeper Radio",
        "Deep Vibes Radio", "Radio ZAYCEV", "Zaycev.FM"
    ];

    const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const isWorldMusic = currentTag && WORLD_MUSIC_TAGS.includes(currentTag);
    const isVietnamese = currentTag === 'vietnamese' || currentTag === 'vietnam';
    const isKyrgyz = currentTag === 'kyrgyz';
    
    for (let i = 0; i < len; i++) {
      const station = data[i];
      if (!station || !station.url_resolved) continue;

      // 1. HQ CHECK: Bitrate & Stability
      const codec = (station.codec || '').toLowerCase();
      const isAAC = codec.includes('aac');
      const minBitrate = isAAC ? 64 : 128;
      if (station.bitrate > 0 && station.bitrate < minBitrate) continue;

      // 2. QUALITY CHECK: Test Streams & Bad Names
      const nameLower = station.name.toLowerCase();
      if (nameLower.includes('test') || nameLower.length < 3) continue;

      // 3. Permanent Blocklist
      if (BLOCKED_NAMES.some(n => station.name.includes(n))) continue;

      // 4. Strict Religious Filtering
      const t = (station.tags || '').toLowerCase();
      const n = station.name.toLowerCase();

      const RELIGIOUS_KEYWORDS = [
          'islam', 'quran', 'koran', 'muslim', 'sheikh', 'imam', 'allah', 'prophet', 'hadith', 'sunnah', 'mecca', 'medina',
          'religio', 'catholic', 'christian', 'church', 'bible', 'vatican', 'gospel', 'jesus', 'christ', 'pastor', 'shrine',
          'worship', 'prayer', 'spirit', 'orthodox', 'chant', 'sermon', 'messianic', 'torah', 'synagogue', 'buddhist', 'hindu', 'krishna',
          'radio maria', 'esperance', 'ewtn', 'благовест', 'радонеж', 'вера', 'православ', 'ислам', 'коран', 'мечеть', 'церковь', 'евангелие', 'библия',
          '佛教', '道教', '基督教', '伊斯兰教', '传教', '法会', '佛', '经', '福音',
          'phật giáo', 'công giáo', 'tin lành', 'hòa hảo', 'cao đài', 'nhà thờ', 'chùa', 'niệm phật', 'pháp sư',
          'diyanet', 'ilahiler', 'cami', 'hoca', 'müslüman', 'namaz', 'ezan',
          'قرآن', 'إسلام', 'صلاة', 'دين', 'دعاء', 'خطبة', 'شيخ', 'إمام',
          'พุทธ', 'วัด', 'ธรรมะ', 'บทสวด', 'ฟังธรรม',
          'եկեղեցի', 'աստվածաշունչ', 'քրիստոնեական', 'ეკլեսիա', 'მართლმადიდებლური', 'məscid', 'минарет', 'проповедь', 'шариат'
      ];

      const PROPAGANDA_KEYWORDS = [
          'propaganda', 'politics', 'political', 'government', 'gov', 'parliament', 'election', 'voter', 'activist',
          'пропаганда', 'политика', 'политик', 'правительство', 'выборы', 'агитация', 'патриот', 'patriot', 'military', 'army', 'война', 'war',
          'sputnik', 'rt radio', 'vesti fm', 'вести фм', 'голос америки', 'радио свобода',
          '宣传', '政治', '政府', '共产党', '军队',
          'tuyên truyền', 'chính trị', 'đảng', 'nhà nước', 'quốc hội', 'vtv', 'vov'
      ];

      const ADULT_KEYWORDS = [
          'sex', 'porn', 'xxx', 'adult', 'erotic', 'ero', 'naked', 'nudity', 'hardcore', 'hentai', 'fetish',
          'секс', 'порно', 'эротика', 'постель'
      ];

      if (RELIGIOUS_KEYWORDS.some(kw => t.includes(kw) || n.includes(kw))) continue;
      if (PROPAGANDA_KEYWORDS.some(kw => t.includes(kw) || n.includes(kw))) continue;
      if (ADULT_KEYWORDS.some(kw => t.includes(kw) || n.includes(kw))) continue;
      if (currentTag !== 'oriental' && ARABIC_CHAR_REGEX.test(station.name)) continue;

      if (isWorldMusic) {
          if (isVietnamese) {
              if (t.includes('tin tức') || n.includes('tin tức') || t.includes('news') || t.includes('talk') || t.includes('thời sự') || t.includes('phát thanh')) continue;
          } else if (isKyrgyz) {
              if ((t.includes('news') || t.includes('talk')) && !t.includes('pop') && !t.includes('music') && !t.includes('hit')) continue;
          } else {
              if (t.includes('news') || t.includes('talk') || t.includes('politics') || t.includes('sport') ||
                  t.includes('新闻') || t.includes('访谈') || t.includes('财经') || t.includes('体育') ||
                  t.includes('tin tức') || t.includes('thời sự') || t.includes('pháp luật') || t.includes('quân sự') ||
                  t.includes('haber') || t.includes('siyaset') || t.includes('konuşma') ||
                  t.includes('أخبار') || t.includes('سياسة') || t.includes('ثقافة') ||
                  t.includes('ข่าว') || t.includes('คุย') || t.includes('การเมือง')) continue;
          }
      }

      if (currentTag === 'classical') {
          if (t.includes('news') || t.includes('talk') || t.includes('speech') || t.includes('conversation') || t.includes('politics')) continue;
      }

      if (currentTag === 'love') {
          if (t.includes('news') || t.includes('talk') || t.includes('podcast') || t.includes('drama') || t.includes('story')) continue;
      }

      if (currentTag === 'slow') {
          if (t.includes('news') || t.includes('talk') || t.includes('politics') || t.includes('conversation') || t.includes('radio drama')) continue;
      }
      
      const url = station.url_resolved;
      if (url.charCodeAt(4) !== 115) continue; 

      // 5. Mixed Content Check: Favicon must be HTTPS
      if (station.favicon && station.favicon.charCodeAt(4) !== 115) {
          station.favicon = ''; // Remove non-HTTPS favicon
      }
      
      const stationCodec = (station.codec || '').toLowerCase();
      const isBrowserCompatible = stationCodec.includes('mp3') || stationCodec.includes('aac') || url.includes('.mp3') || url.includes('.aac') || stationCodec === '';

      if (isBrowserCompatible) {
        if (!station.favicon && station.votes < 50 && currentTag && ['pop', 'jazz', 'rock', 'dance', 'classical', 'relax', 'electronic'].includes(currentTag)) continue;

        const normalizedUrl = url.toLowerCase()
            .replace(/^https?:\/\/(www\.)?/, '')
            .replace(/:[0-9]+/, '')
            .split('?')[0].split('#')[0]
            .replace(/\/$/, '')
            .replace(/\/(stream|listen|high|low|mobile|radio|play|live)$/, '')
            .replace(/\.(mp3|aac|m3u8|pls|m3u)$/, '');
            
        const normalizedName = station.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dedupeKey = `${normalizedUrl}`;

        const existingByUrl = uniqueStations.get(dedupeKey);
        const existingByName = Array.from(uniqueStations.values()).find(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName);
        const existing = existingByUrl || existingByName;

        if (!existing) {
            uniqueStations.set(dedupeKey, station);
        } else {
            if (station.votes > existing.votes || (station.bitrate > existing.bitrate && station.votes > existing.votes * 0.5) || (!!station.favicon && !existing.favicon)) {
                if (existingByUrl) uniqueStations.delete(dedupeKey);
                const oldKey = Array.from(uniqueStations.keys()).find(k => uniqueStations.get(k) === existing);
                if (oldKey) uniqueStations.delete(oldKey);
                uniqueStations.set(dedupeKey, station);
            }
        }
      }
    }

    return Array.from(uniqueStations.values())
        .sort((a: any, b: any) => {
            const aCodec = (a.codec || '').toLowerCase();
            const bCodec = (b.codec || '').toLowerCase();
            const aIsAAC = aCodec.includes('aac');
            const bIsAAC = bCodec.includes('aac');
            if (aIsAAC && !bIsAAC) return -1;
            if (!aIsAAC && bIsAAC) return 1;
            const aInSweetSpot = a.bitrate >= 64 && a.bitrate <= 128;
            const bInSweetSpot = b.bitrate >= 64 && b.bitrate <= 128;
            if (aInSweetSpot && !bInSweetSpot) return -1;
            if (!aInSweetSpot && bInSweetSpot) return 1;
            const bitrateDiff = b.bitrate - a.bitrate;
            if (bitrateDiff !== 0) return bitrateDiff;
            return b.votes - a.votes;
        }) as RadioStation[];
};

export const fetchStationsByTag = async (tag: string, limit: number = 100): Promise<RadioStation[]> => {
  let lowerTag = tag.toLowerCase();
  
  if (lowerTag === 'vietnamese') {
      lowerTag = 'vietnam';
  }

  const cacheKey = `tag_v12_hq_${lowerTag}_l${limit}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    let data: RadioStation[] = [];
    const fetchLimit = Math.max(20, Math.ceil(limit * 4));
    
    const urlParams = `limit=${fetchLimit}&order=votes&reverse=true&hidebroken=true&bitrateMin=128&lastcheckok=1`;

    if (lowerTag === 'vietnam') {
        const [countryData, musicData, radioData, vpopData, boleroData] = await Promise.all([
            fetchAcrossMirrorsFast(`bycountry/vietnam`, urlParams),
            fetchAcrossMirrorsFast(`byname/${encodeURIComponent('âm nhạc')}`, urlParams), 
            fetchAcrossMirrorsFast(`bytag/v-pop`, urlParams),      
            fetchAcrossMirrorsFast(`bytag/vpop`, urlParams),      
            fetchAcrossMirrorsFast(`bytag/bolero`, urlParams)      
        ]);
        data = [...countryData, ...musicData, ...radioData, ...vpopData, ...boleroData];
    } 
    else if (lowerTag === 'kyrgyz') {
        const [countryData, nameData, bishkekData, obonData] = await Promise.all([
            fetchAcrossMirrorsFast(`bycountry/kyrgyzstan`, urlParams),
            fetchAcrossMirrorsFast(`byname/${encodeURIComponent('кыргыз')}`, urlParams),
            fetchAcrossMirrorsFast(`byname/bishkek`, urlParams),
            fetchAcrossMirrorsFast(`byname/obon`, urlParams)
        ]);
        data = [...countryData, ...nameData, ...bishkekData, ...obonData];
    }
    else if (lowerTag === 'oriental') {
        const [orientalData, turkishData, arabicData, thaiData, meData, tpopData, arabesqueData] = await Promise.all([
            fetchAcrossMirrorsFast(`bytag/oriental`, urlParams),
            fetchAcrossMirrorsFast(`bytag/turkish`, urlParams),
            fetchAcrossMirrorsFast(`bytag/arabic`, urlParams),
            fetchAcrossMirrorsFast(`bytag/thai`, urlParams),
            fetchAcrossMirrorsFast(`bytag/middle%20east`, urlParams),
            fetchAcrossMirrorsFast(`bytag/t-pop`, urlParams),
            fetchAcrossMirrorsFast(`bytag/arabesque`, urlParams)
        ]);
        data = [...orientalData, ...turkishData, ...arabicData, ...thaiData, ...meData, ...tpopData, ...arabesqueData];
    }
    else if (lowerTag === 'chinese') {
        const [tagData, cpopData, countryData, mandoData, cantoData] = await Promise.all([
            fetchAcrossMirrorsFast(`bytag/chinese`, urlParams),
            fetchAcrossMirrorsFast(`bytag/c-pop`, urlParams),
            fetchAcrossMirrorsFast(`bycountry/china`, urlParams),
            fetchAcrossMirrorsFast(`bytag/mandopop`, urlParams),
            fetchAcrossMirrorsFast(`bytag/cantopop`, urlParams)
        ]);
        data = [...tagData, ...cpopData, ...countryData, ...mandoData, ...cantoData];
    }
    else if (lowerTag === 'love') {
        const [loveData, balladData, softData, romanticData] = await Promise.all([
            fetchAcrossMirrorsFast(`bytag/love`, urlParams),
            fetchAcrossMirrorsFast(`bytag/ballads`, urlParams),
            fetchAcrossMirrorsFast(`bytag/soft`, urlParams),
            fetchAcrossMirrorsFast(`bytag/romantic`, urlParams)
        ]);
        data = [...loveData, ...balladData, ...softData, ...romanticData];
    }
    else if (lowerTag === 'slow') {
        const [slowData, chillData, calmData, acousticsData] = await Promise.all([
            fetchAcrossMirrorsFast(`bytag/slow`, urlParams),
            fetchAcrossMirrorsFast(`bytag/chill`, urlParams),
            fetchAcrossMirrorsFast(`bytag/calm`, urlParams),
            fetchAcrossMirrorsFast(`bytag/acoustic`, urlParams)
        ]);
        data = [...slowData, ...chillData, ...calmData, ...acousticsData];
    }
    else {
        data = await fetchAcrossMirrorsFast(`bytag/${encodeURIComponent(lowerTag)}`, urlParams);
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
            fetchAcrossMirrorsFast(`byuuid/${encodeURIComponent(uuid)}`, '')
        );
        const results = await Promise.all(fetchPromises);
        const result = filterStations(results.flat());
        
        const allHardcoded = [...HARDCODED_STATIONS];
        const hardcodedFavs = allHardcoded.filter(s => uuids.includes(s.stationuuid));
        
        if (hardcodedFavs.length > 0) {
             const combined = [...hardcodedFavs, ...result.filter(r => !hardcodedFavs.some(h => h.url_resolved === r.url_resolved))];
             setToCache(cacheKey, combined);
             return combined;
        }

        setToCache(cacheKey, result);
        return result;
    } catch (error) {
        const allHardcoded = [...HARDCODED_STATIONS];
        const hardcodedFavs = allHardcoded.filter(s => uuids.includes(s.stationuuid));
        if (hardcodedFavs.length > 0) return hardcodedFavs;
        return [];
    }
};

export const fetchStationsByCountry = async (country: string, limit: number = 100): Promise<RadioStation[]> => {
    const cacheKey = `country_v1_${country.toLowerCase()}_l${limit}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return cachedData;

    try {
        const urlParams = `limit=${limit}&order=votes&reverse=true&hidebroken=true&bitrateMin=96`;
        const data = await fetchAcrossMirrorsFast(`bycountry/${encodeURIComponent(country)}`, urlParams);
        
        const result = filterStations(data).slice(0, limit);
        if (result.length > 0) {
           setToCache(cacheKey, result);
        }
        return result;
    } catch (e) {
        console.error("Country Fetch Error", e);
        return [];
    }
};

