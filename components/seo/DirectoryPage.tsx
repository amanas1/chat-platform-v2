
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GENRES, COUNTRIES_DATA, TRANSLATIONS } from '../../constants';
import { PAGE_TRANSLATIONS } from '../../translations/pageTranslations';
import { Language } from '../../types';

interface DirectoryPageProps {
    language?: Language;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ language = 'en' }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    const ui = TRANSLATIONS[language] || TRANSLATIONS.en;
    
    // Top 20 Countries by population/interest
    const topCountries = COUNTRIES_DATA.slice(0, 20);
    
    // Top Genres
    const topGenres = GENRES.slice(0, 15);

    // Helper to translate country names
    const getCountryName = (name: string) => {
        const key = name.toLowerCase().replace(/\s+/g, '');
        // Special case for United States to USA and UK
        let lookupKey = key;
        if (key === 'unitedstates') lookupKey = 'usa';
        if (key === 'unitedkingdom') lookupKey = 'uk';
        if (key === 'czechrepublic') lookupKey = 'czech';
        
        return ui[lookupKey] || name;
    };

    return (
        <div className="py-20 px-6 md:px-20 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
            <Helmet>
                <title>{t.directoryMetaTitle}</title>
                <meta name="description" content={t.directoryMetaDesc} />
            </Helmet>

            <header className="mb-16 text-center">
                <Link 
                    to="/" 
                    className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:underline"
                >
                    {t.backToRadio}
                </Link>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic">
                    {t.directoryTitle}
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    {t.directoryIntro}
                </p>
            </header>

            {/* Genres Section */}
            <section className="mb-20">
                <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4 uppercase tracking-widest">
                    {t.browseByGenre}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {topGenres.map(genre => (
                        <Link 
                            key={genre.id} 
                            to={`/radio/${genre.id}-radio`}
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-105 group"
                        >
                            <h3 className="font-bold text-slate-200 group-hover:text-primary">
                                {ui[genre.id] || genre.name}
                            </h3>
                            <span className="text-xs text-slate-500 uppercase">{t.radioLabel}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Countries Section */}
            <section className="mb-20">
                <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4 uppercase tracking-widest">
                    {t.browseByCountry}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {topCountries.map(country => {
                        const slug = country.name.toLowerCase().replace(/\s+/g, '-');
                        return (
                            <Link 
                                key={country.name} 
                                to={`/radio/radio-${slug}`}
                                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-105 group"
                            > 
                                <span className="text-2xl block mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    🌍
                                </span>
                                <h3 className="font-bold text-slate-200 group-hover:text-primary text-sm">
                                    {getCountryName(country.name)}
                                </h3>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Popular Combinations */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4 uppercase tracking-widest">
                    {t.featuredCombos}
                </h2>
                <div className="flex flex-wrap gap-4">
                    <Link to="/radio/jazz-radio-usa" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.jazzUSA}</Link>
                    <Link to="/radio/electronic-radio-germany" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.technoGermany}</Link>
                    <Link to="/radio/classical-radio-uk" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.classicalUK}</Link>
                    <Link to="/radio/hip-hop-radio-france" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.hiphopFrance}</Link>
                    <Link to="/radio/rock-radio-australia" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.rockAustralia}</Link>
                    <Link to="/radio/pop-radio-japan" className="px-5 py-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-primary transition-colors text-sm font-bold">{t.jPopJapan}</Link>
                </div>
            </section>
        </div>
    );
};
