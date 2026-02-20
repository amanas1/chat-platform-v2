import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../../types';
import { PAGE_TRANSLATIONS } from '../../translations/pageTranslations';

interface SEOContentProps {
    language: Language;
}

const SEOContent: React.FC<SEOContentProps> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;

    return (
        <section className="w-full mt-20 pt-20 border-t border-white/5 opacity-80 pb-20">
            <div className="max-w-4xl mx-auto space-y-10 px-4 text-slate-400">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight">
                        {t.seoTitle}
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-500">
                        {t.seoIntro}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t.seoJazzTitle}</h3>
                        <p className="text-sm leading-relaxed">
                            {t.seoJazzBody}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t.seoGlobalTitle}</h3>
                        <p className="text-sm leading-relaxed">
                            {t.seoGlobalBody}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white text-center uppercase tracking-wide">{t.seoWhyTitle}</h3>
                    <p className="text-sm leading-relaxed">
                        {t.seoWhyBody1}
                    </p>
                    <p className="text-sm leading-relaxed">
                        {t.seoWhyBody2}
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-6">
                    <Link to="/jazz-radio" className="px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-slate-300">{t.genresJazz} Radio</Link>
                    <Link to="/rock-radio" className="px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-slate-300">{t.genresRock} Radio</Link>
                    <Link to="/electronic-radio" className="px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-slate-300">{t.genresElectronic} Radio</Link>
                    <Link to="/hip-hop-radio" className="px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-slate-300">{t.genresHiphop} Radio</Link>
                </div>
            </div>
        </section>
    );
};

export default SEOContent;
