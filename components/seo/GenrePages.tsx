import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Language } from '../../types';
import { PAGE_TRANSLATIONS } from '../../translations/pageTranslations';

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

export const JazzRadioPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.jazzPageMetaTitle} 
            description={t.jazzPageMetaDesc}
            backText={t.backToPlayer}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.jazzPageTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200">
                    {t.jazzPageIntro}
                </p>
                <p>
                    {t.jazzPageBody1}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.jazzPageLegacyTitle}</h2>
                <p>
                    {t.jazzPageLegacyBody1}
                </p>
                <p>
                    {t.jazzPageLegacyBody2}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.jazzPageWhyTitle}</h2>
                <ul className="list-disc pl-6 space-y-2">
                    {t.jazzPageWhyList.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
                <p className="pt-6">
                    {t.jazzPageFooter}
                </p>
            </div>
        </PageWrapper>
    );
};

export const RockRadioPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.rockPageMetaTitle} 
            description={t.rockPageMetaDesc}
            backText={t.backToPlayer}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.rockPageTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200">
                    {t.rockPageIntro}
                </p>
                <p>
                    {t.rockPageBody1}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.rockPageSubTitle}</h2>
                <p>
                    {t.rockPageSubBody}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    {t.rockPageList.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
                <p className="pt-6">
                    {t.rockPageFooter}
                </p>
                <p>
                    {t.rockPageEnd}
                </p>
            </div>
        </PageWrapper>
    );
};

export const ElectronicRadioPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.electronicPageMetaTitle} 
            description={t.electronicPageMetaDesc}
            backText={t.backToPlayer}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.electronicPageTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200">
                    {t.electronicPageIntro}
                </p>
                <p>
                    {t.electronicPageBody1}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.electronicPageSubTitle}</h2>
                <p>
                    {t.electronicPageSubBody}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    {t.electronicPageList.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
                <p>
                    {t.electronicPageFooter}
                </p>
                <p>
                    {t.electronicPageEnd}
                </p>
            </div>
        </PageWrapper>
    );
};

export const HipHopRadioPage: React.FC<{ language: Language }> = ({ language }) => {
    const t = PAGE_TRANSLATIONS[language] || PAGE_TRANSLATIONS.en;
    return (
        <PageWrapper 
            title={t.hiphopPageMetaTitle} 
            description={t.hiphopPageMetaDesc}
            backText={t.backToPlayer}
        >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">{t.hiphopPageTitle}</h1>
            <div className="prose prose-invert max-w-none space-y-6 text-slate-400">
                <p className="text-xl text-slate-200">
                    {t.hiphopPageIntro}
                </p>
                <p>
                    {t.hiphopPageBody1}
                </p>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide pt-6">{t.hiphopPageSubTitle}</h2>
                <p>
                    {t.hiphopPageSubBody}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    {t.hiphopPageList.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
                <p>
                    {t.hiphopPageFooter}
                </p>
                <p>
                    {t.hiphopPageEnd}
                </p>
            </div>
        </PageWrapper>
    );
};
