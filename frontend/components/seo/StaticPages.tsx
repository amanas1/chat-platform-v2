import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Language } from '../../types';
import { TRANSLATIONS as PAGE_TRANSLATIONS } from '../../types/constants';

const PageWrapper: React.FC<{ title: string; description: string; children: React.ReactNode; backText: string }> = ({ title, description, children, backText }) => (
    <div className="py-20 px-6 md:px-20 max-w-5xl mx-auto min-h-screen animate-in fade-in duration-700">
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
        </Helmet>
        <Link to="/" className="inline-flex items-center text-primary text-sm font-bold uppercase tracking-widest mb-10 hover:translate-x-[-4px] transition-transform">
            {backText}
        </Link>
        {children}
    </div>
);

export const AboutPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.aboutMetaTitle} 
            description={t.aboutMetaDesc}
            backText={t.backToRadio}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.aboutTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200 leading-relaxed font-medium">
                    {t.aboutHero}
                </p>
                <p>
                    {t.aboutBody1}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.aboutTechTitle}</h2>
                <p>
                    {t.aboutTechBody1}
                </p>
                <p>
                    {t.aboutTechBody2}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.aboutCommunityTitle}</h2>
                <p>
                    {t.aboutCommunityBody1}
                </p>
                <p>
                    {t.aboutCommunityBody2}
                </p>
            </div>
        </PageWrapper>
    );
};

export const PrivacyPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.privacyMetaTitle} 
            description={t.privacyMetaDesc}
            backText={t.backToRadio}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.privacyTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p>
                    {t.privacyIntro}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.privacyDataTitle}</h2>
                <p>
                    {t.privacyDataIntro}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    {t.privacyDataList.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.privacyUsageTitle}</h2>
                <p>
                    {t.privacyUsageBody}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.privacySecurityTitle}</h2>
                <p>
                    {t.privacySecurityBody}
                </p>
                <p>
                    {t.privacyContact} <a href="mailto:privacy@auradiochat.com" className="text-primary hover:underline">privacy@auradiochat.com</a>.
                </p>
            </div>
        </PageWrapper>
    );
};

export const ContactPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.contactMetaTitle} 
            description={t.contactMetaDesc}
            backText={t.backToRadio}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.contactTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200">
                    {t.contactIntro}
                </p>
                <p>
                    {t.contactBody1}
                </p>
                <div className="grid md:grid-cols-2 gap-10 pt-10">
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">{t.contactGeneral}</h3>
                        <p className="text-sm">{t.contactGeneralDesc}</p>
                        <a href="mailto:hello@auradiochat.com" className="text-primary font-bold text-lg mt-4 block underline">hello@auradiochat.com</a>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">{t.contactTech}</h3>
                        <p className="text-sm">{t.contactTechDesc}</p>
                        <a href="mailto:support@auradiochat.com" className="text-primary font-bold text-lg mt-4 block underline">support@auradiochat.com</a>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-10">{t.contactLocationTitle}</h2>
                <p>
                    {t.contactLocationBody}
                </p>
            </div>
        </PageWrapper>
    );
};

export const GenresPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.genresMetaTitle} 
            description={t.genresMetaDesc}
            backText={t.backToRadio}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.genresTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400 leading-relaxed">
                <p className="text-xl text-slate-200">
                    {t.genresIntro}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
                    <Link to="/jazz-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresJazz}</h3>
                        <p className="text-xs">{t.genresJazzDesc}</p>
                    </Link>
                    <Link to="/rock-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresRock}</h3>
                        <p className="text-xs">{t.genresRockDesc}</p>
                    </Link>
                    <Link to="/electronic-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresElectronic}</h3>
                        <p className="text-xs">{t.genresElectronicDesc}</p>
                    </Link>
                    <Link to="/hip-hop-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresHiphop}</h3>
                        <p className="text-xs">{t.genresHiphopDesc}</p>
                    </Link>
                    <Link to="/radio/world-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresWorld}</h3>
                        <p className="text-xs">{t.genresWorldDesc}</p>
                    </Link>
                     <Link to="/radio/classical-radio" className="bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <h3 className="text-white font-bold text-xl mb-2">{t.genresClassical}</h3>
                        <p className="text-xs">{t.genresClassicalDesc}</p>
                    </Link>
                </div>
                <p className="pt-10">
                    {t.genresFooter}
                </p>
            </div>
        </PageWrapper>
    );
};
