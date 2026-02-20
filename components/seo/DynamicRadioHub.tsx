import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GENRES, COUNTRIES_DATA, TRANSLATIONS } from '../../constants';
import { RadioStation, Language } from '../../types';
import { fetchStationsByTag, fetchStationsByCountry } from '../../services/radioService';
import { HeartIcon } from '../../components/Icons';
import { PAGE_TRANSLATIONS } from '../../translations/pageTranslations';

interface DynamicHubProps {
    setLanguage: (lang: any) => void;
    onPlay: (station: RadioStation) => void;
    currentStation: RadioStation | null;
    favorites: string[];
    toggleFavorite: (id: string) => void;
    language: Language;
}

const DynamicRadioHub: React.FC<DynamicHubProps> = ({ setLanguage, onPlay, currentStation, favorites, toggleFavorite, language }) => {
    const { lang: urlLang, slug } = useParams<{ lang?: string; slug?: string }>();
    const navigate = useNavigate();
    
    // Stations State
    const [stations, setStations] = React.useState<RadioStation[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Normalize Language from URL or prop
    useEffect(() => {
        if (urlLang && ['en', 'es', 'fr', 'de', 'ru', 'zh'].includes(urlLang)) {
            setLanguage(urlLang);
        }
    }, [urlLang, setLanguage]);

    const activeLanguage = (urlLang as Language) || language || 'en';
    const t = PAGE_TRANSLATIONS[activeLanguage] || PAGE_TRANSLATIONS.en;
    const ui = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

    // Parse Slug Strategy
    const pageContext = useMemo(() => {
        if (!slug) return null;
        
        const cleanSlug = slug.toLowerCase();
        
        // 1. Check Genre
        const genre = GENRES.find(g => cleanSlug.includes(g.id) || cleanSlug.includes(g.id.replace('-', '')));
        
        // 2. Check Country
        const country = COUNTRIES_DATA.find(c => {
            const countrySlug = c.name.toLowerCase().replace(/\s+/g, '-');
            return cleanSlug.includes(countrySlug);
        });

        return { genre, country, originalSlug: slug };
    }, [slug]);

    // Helper to translate country names (reusing logic from DirectoryPage)
    const getCountryName = (name: string) => {
        const key = name.toLowerCase().replace(/\s+/g, '');
        let lookupKey = key;
        if (key === 'unitedstates') lookupKey = 'usa';
        if (key === 'unitedkingdom') lookupKey = 'uk';
        if (key === 'czechrepublic') lookupKey = 'czech';
        return ui[lookupKey] || name;
    };

    const getGenreName = (genreId: string) => ui[genreId] || genreId;

    // Fetch Data
    useEffect(() => {
        const loadStations = async () => {
            if (!pageContext) return;
            setIsLoading(true);
            try {
                let fetched: RadioStation[] = [];
                const apiCountryName = pageContext.country ? pageContext.country.name : '';
                
                if (pageContext.genre && pageContext.country) {
                    let searchTag = pageContext.genre.id;
                    const byTag = await fetchStationsByTag(searchTag);
                    fetched = byTag.filter(s => {
                        const c = (s.country || '').toLowerCase();
                        const target1 = pageContext.country!.name.toLowerCase();
                        return c.includes(target1) || (target1 === 'usa' && c.includes('united states')) || (target1 === 'uk' && c.includes('united kingdom'));
                    });

                    if (fetched.length < 5) {
                        const byCountry = await fetchStationsByCountry(apiCountryName);
                        const genreId = pageContext.genre.id.toLowerCase();
                        const genreName = pageContext.genre.name.toLowerCase();
                        const extra = byCountry.filter(s => {
                            const tags = (s.tags || '').toLowerCase();
                            return tags.includes(genreId) || tags.includes(genreName) || (genreId === 'world' && (tags.includes('folk') || tags.includes('ethnic')));
                        });
                        fetched = [...fetched, ...extra];
                        if (fetched.length === 0) fetched = byCountry.slice(0, 10);
                    }
                } else if (pageContext.genre) {
                    fetched = await fetchStationsByTag(pageContext.genre.id);
                    if (fetched.length === 0 && pageContext.genre.id === 'world') {
                         const folk = await fetchStationsByTag('folk');
                         const ethnic = await fetchStationsByTag('ethnic');
                         fetched = [...folk.slice(0, 25), ...ethnic.slice(0, 25)];
                    }
                } else if (pageContext.country) {
                    fetched = await fetchStationsByCountry(apiCountryName);
                }

                const unique = Array.from(new Map(fetched.map(item => [item.stationuuid, item])).values());
                setStations(unique.slice(0, 48));
            } catch (e) {
                console.error("SEO Page Fetch Error", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadStations();
    }, [pageContext]);

    if (!pageContext) {
        return (
            <div className="py-20 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404 - Not Found</h1>
                <Link to="/" className="text-primary hover:underline">{ui.back || 'Back'}</Link>
            </div>
        );
    }

    const displayGenre = pageContext.genre ? getGenreName(pageContext.genre.id) : '';
    const displayCountry = pageContext.country ? getCountryName(pageContext.country.name) : '';
    
    // Localization of dynamic titles and descriptions
    const localizedData = useMemo(() => {
        const isBoth = pageContext.genre && pageContext.country;
        const isGenre = !!pageContext.genre;
        
        const titles: Record<Language, string> = {
            en: isBoth ? `${displayGenre} Radio in ${displayCountry}` : isGenre ? `Best ${displayGenre} Radio` : `Radio in ${displayCountry}`,
            ru: isBoth ? `${displayGenre} радио ${displayCountry}` : isGenre ? `Лучшее ${displayGenre} радио` : `Радио ${displayCountry}`,
            es: isBoth ? `Radio ${displayGenre} en ${displayCountry}` : isGenre ? `Mejor Radio ${displayGenre}` : `Radio en ${displayCountry}`,
            fr: isBoth ? `Radio ${displayGenre} en ${displayCountry}` : isGenre ? `Meilleure Radio ${displayGenre}` : `Radio en ${displayCountry}`,
            zh: isBoth ? `${displayCountry}的${displayGenre}广播` : isGenre ? `最佳${displayGenre}广播` : `${displayCountry}的广播`,
            de: isBoth ? `${displayGenre} Radio in ${displayCountry}` : isGenre ? `Bestes ${displayGenre} Radio` : `Radio in ${displayCountry}`
        };

        const descriptions: Record<Language, string> = {
            en: `Listen to ${displayGenre} ${displayCountry} radio stations live. Best online radio streaming player.`,
            ru: `Слушайте ${displayGenre} ${displayCountry} радио онлайн. Лучший плеер для интернет-радио.`,
            es: `Escucha radio ${displayGenre} ${displayCountry} en vivo. El mejor reproductor de radio online.`,
            fr: `Écoutez la radio ${displayGenre} ${displayCountry} en direct. Le meilleur lecteur radio en ligne.`,
            zh: `在线收听${displayCountry}${displayGenre}广播。最佳在线广播播放器。`,
            de: `Hören Sie ${displayGenre} ${displayCountry} Radio live. Bester Online-Radio-Streaming-Player.`
        };

        return { 
            title: titles[activeLanguage] || titles.en, 
            desc: descriptions[activeLanguage] || descriptions.en 
        };
    }, [activeLanguage, displayGenre, displayCountry, pageContext]);

    const canonicalUrl = `https://auradiochat.com/radio/${pageContext.originalSlug}`;

    return (
        <div className="min-h-screen pb-32 pt-10 px-4 md:px-10 animate-in fade-in duration-700">
            <Helmet>
                <title>{localizedData.title} | AU RadioChat</title>
                <meta name="description" content={localizedData.desc} />
                <link rel="canonical" href={canonicalUrl} />
            </Helmet>

            <nav className="text-xs text-slate-500 mb-8 uppercase tracking-widest flex items-center gap-2">
                <Link to="/" className="hover:text-white">{ui.back || 'Home'}</Link> 
                <span>/</span>
                <span className="text-slate-300">{displayGenre} {displayCountry}</span>
            </nav>

            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic">
                    {displayGenre} <span className="text-primary">{displayCountry || ''}</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
                    {localizedData.desc}
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                 {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="aspect-[1.2] rounded-[2rem] skeleton-loader bg-white/5" />
                 )) : stations.map((station) => (
                    <div 
                        key={station.stationuuid}
                        onClick={() => onPlay(station)}
                        className={`group relative rounded-[2rem] p-5 cursor-pointer transition-all border-2 
                            ${currentStation?.stationuuid === station.stationuuid ? 'border-primary bg-primary/10' : 'border-white/5 bg-black/40 hover:border-white/20 hover:bg-black/60'}`}
                    >
                        <div className="flex justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                                {station.favicon ? (
                                    <img src={station.favicon} alt={station.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <span className="text-xs">📻</span>
                                )}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(station.stationuuid); }}
                                className={`text-slate-500 hover:text-red-500 ${favorites.includes(station.stationuuid) ? 'text-red-500' : ''}`}
                            >
                                <HeartIcon className="w-5 h-5" filled={favorites.includes(station.stationuuid)} />
                            </button>
                        </div>
                        <h3 className="font-bold text-white truncate">{station.name}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{station.country} • {station.bitrate || 128}k</p>
                    </div>
                 ))}
            </div>
            
            {!isLoading && stations.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[3rem]">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">{ui.noTracks || 'No stations found'}</p>
                </div>
            )}

            <article className="mt-24 prose prose-invert prose-lg max-w-4xl mx-auto text-slate-400">
                <h2>{localizedData.title}</h2>
                <p>
                    {activeLanguage === 'ru' ? (
                        `Добро пожаловать в раздел ${displayGenre} радио${displayCountry ? ` в ${displayCountry}` : ''}. Здесь вы найдете лучшие онлайн-трансляции, доступные в высоком качестве без регистрации. Наслаждайтесь любимой музыкой в прямом эфире на AU RadioChat.`
                    ) : (
                        `Welcome to the ${displayGenre} radio section ${displayCountry ? `in ${displayCountry}` : ''}. Here you will find the best online broadcasts available in high quality without registration. Enjoy your favorite music live on AU RadioChat.`
                    )}
                </p>
            </article>
        </div>
    );
};

export default DynamicRadioHub;
