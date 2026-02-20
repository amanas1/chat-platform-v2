
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GENRES, COUNTRIES_DATA } from '../constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority: dist/ (if it exists after build), then public/
const DIST_DIR = path.join(__dirname, '../dist');
const PUB_DIR = path.join(__dirname, '../public');
const TARGET_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : PUB_DIR;

const BASE_URL = 'https://auradiochat.com';

const STATIC_ROUTES = [
    '',
    '/about',
    '/privacy-policy',
    '/contact',
    '/genres',
    '/directory'
];

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ru', 'zh'];

function generateSitemap() {
    console.log('Generating sitemaps...');

    // 1. sitemap-main.xml (Static + Genres + Countries)
    let mainXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Routes
    STATIC_ROUTES.forEach(route => {
        mainXml += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        // Multilingual variations for static routes
        LANGUAGES.forEach(lang => {
            if (route === '') { // Homepage
                mainXml += `
  <url>
    <loc>${BASE_URL}/${lang}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
            }
        });
    });

    // Genres
    GENRES.forEach(genre => {
        mainXml += `
  <url>
    <loc>${BASE_URL}/radio/${genre.id}-radio</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
         LANGUAGES.forEach(lang => {
            mainXml += `
  <url>
    <loc>${BASE_URL}/${lang}/radio/${genre.id}-radio</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
         });
    });

    // Countries
    COUNTRIES_DATA.forEach(country => {
        const slug = country.name.toLowerCase().replace(/\s+/g, '-');
        mainXml += `
  <url>
    <loc>${BASE_URL}/radio/radio-${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    mainXml += '\n</urlset>';
    fs.writeFileSync(path.join(TARGET_DIR, 'sitemap-main.xml'), mainXml);
    console.log(` - sitemap-main.xml (Static, Genres, Countries) created in ${TARGET_DIR}`);

    // 2. sitemap-combos.xml (Top Genre + Top Country)
    let combosXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Select top countries for combinations to avoid massive sitemap
    const TOP_COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Japan', 'Brazil', 'Russia', 'Australia', 'Netherlands'];
    const targetCountries = COUNTRIES_DATA.filter(c => TOP_COUNTRIES.includes(c.name));
    // Top Genres
    const topGenres = GENRES.slice(0, 12); // First 12 genres

    topGenres.forEach(genre => {
        targetCountries.forEach(country => {
            const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
            const urlSlug = `${genre.id}-radio-${countrySlug}`;
            
            combosXml += `
  <url>
    <loc>${BASE_URL}/radio/${urlSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
            
            // Multilingual (Limit to main ones to save space/crawl budget for now)
            ['en', 'es'].forEach(lang => {
                 combosXml += `
  <url>
    <loc>${BASE_URL}/${lang}/radio/${urlSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
            });
        });
    });
    combosXml += '\n</urlset>';
    fs.writeFileSync(path.join(TARGET_DIR, 'sitemap-combos.xml'), combosXml);
    console.log(` - sitemap-combos.xml created in ${TARGET_DIR}`);

    // 3. sitemap.xml (Index)
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-main.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-combos.xml</loc>
  </sitemap>
</sitemapindex>`;
    
    fs.writeFileSync(path.join(TARGET_DIR, 'sitemap.xml'), indexXml);
    console.log(` - sitemap.xml (Index) created in ${TARGET_DIR}`);
}

generateSitemap();
