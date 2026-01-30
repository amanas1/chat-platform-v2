
import fetch from 'node-fetch';

const RADIO_BROWSER_MIRRORS = [
    'https://all.api.radio-browser.info/json/stations',
    'https://de1.api.radio-browser.info/json/stations',
    'https://at1.api.radio-browser.info/json/stations',
    'https://nl1.api.radio-browser.info/json/stations',
    'https://fr1.api.radio-browser.info/json/stations',
    'https://uk1.api.radio-browser.info/json/stations'
];

const GENRES = ['jazz', 'blues', 'rock', 'classical', 'electronic', 'hiphop', 'pop', 'rnb', 'reggae', 'soul', 'islamic'];
const ERAS = ['60s', '70s', '80s', '90s', '00s'];
const MOODS = ['chill', 'energy', 'focus', 'romantic', 'dark', 'vietnam', 'japan', 'russian', 'spanish', 'italian', 'french', 'kazakhstan', 'kyrgyzstan'];

async function checkUrl(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        const response = await fetch(url, {
            method: 'GET', // Some servers don't support HEAD correctly for streams
            signal: controller.signal,
            headers: { 
                'Range': 'bytes=0-100', // Only fetch a tiny bit
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
            }
        });
        clearTimeout(timeout);
        return response.ok || response.status === 206; // 206 means Partial Content is supported
    } catch (e) {
        clearTimeout(timeout);
        return false;
    }
}

async function scanCategory(category) {
    console.log(`\n--- Scanning Category: ${category} ---`);
    const baseUrl = RADIO_BROWSER_MIRRORS[0]; 
    const url = `${baseUrl}/bytag/${category}?limit=15&order=votes&reverse=true&hidebroken=true&bitrateMin=128&lastcheckok=1`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const stations = await response.json();
        
        const results = [];
        for (const station of stations) {
            process.stdout.write(`Checking: ${station.name.substring(0, 30).padEnd(30)}... `);
            const isAlive = await checkUrl(station.url_resolved);
            if (isAlive) {
                console.log("✅ OK");
            } else {
                console.log("❌ DEAD");
                results.push({ name: station.name, url: station.url_resolved, uuid: station.stationuuid });
            }
        }
        return results;
    } catch (e) {
        console.error(`Error scanning ${category}: ${e.message}`);
        return [];
    }
}

async function main() {
    const allDead = [];
    const categories = [...GENRES, ...ERAS, ...MOODS];
    
    for (const cat of categories) {
        const dead = await scanCategory(cat);
        allDead.push(...dead);
    }
    
    console.log("\n\n=== SCAN COMPLETE ===");
    console.log(`Total dead stations found: ${allDead.length}`);
    
    if (allDead.length > 0) {
        console.log("\nDead station names for blacklist:");
        const uniqueNames = [...new Set(allDead.map(s => s.name))];
        console.log(JSON.stringify(uniqueNames, null, 2));
    }
}

main();
