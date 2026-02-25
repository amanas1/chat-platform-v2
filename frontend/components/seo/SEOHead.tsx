
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useParams } from 'react-router-dom';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../types/constants';

interface SEOHeadProps {
    language: Language;
    title?: string;
    description?: string;
    image?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ language, title, description, image }) => {
    const location = useLocation();
    const { stationId, genreId } = useParams();
    
    const baseUrl = 'https://auradiochat.com';
    const currentPath = location.pathname;
    const canonicalUrl = `${baseUrl}${currentPath === '/' ? '' : currentPath}`;
    
    // Default Fallbacks
    const defaultTitle = 'AU RadioChat – Global Online Radio Streaming Player';
    const defaultDescription = 'AU RadioChat – Global Online Radio Streaming Platform. Listen to jazz, rock, electronic, hip-hop and world radio stations live. Free international internet radio player with smart chat.';
    const defaultImage = `${baseUrl}/og-image.jpg`;

    const metaTitle = title || defaultTitle;
    const metaDesc = description || defaultDescription;
    const metaImage = image || defaultImage;

    return (
        <Helmet>
            <title>{metaTitle}</title>
            <meta name="description" content={metaDesc} />
            <link rel="canonical" href={canonicalUrl} />
            
            {/* Open Graph */}
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDesc} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:locale" content={language} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDesc} />
            <meta name="twitter:image" content={metaImage} />
            
            {/* Language Alternates (x-default is handled by sitemap, but good for SEO) */}
            <link rel="alternate" href={`${baseUrl}/en${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="en" />
            <link rel="alternate" href={`${baseUrl}/es${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="es" />
            <link rel="alternate" href={`${baseUrl}/fr${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="fr" />
            <link rel="alternate" href={`${baseUrl}/de${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="de" />
            <link rel="alternate" href={`${baseUrl}/ru${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="ru" />
            <link rel="alternate" href={`${baseUrl}/zh${currentPath.replace(/^\/[a-z]{2}/, '')}`} hrefLang="zh" />
        </Helmet>
    );
};
