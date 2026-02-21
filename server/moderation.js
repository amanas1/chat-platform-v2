const storage = require('./storage');
const vision = require('@google-cloud/vision');
const exifParser = require('exif-parser');
require('dotenv').config();

// Initialize Google Vision client
const client = new vision.ImageAnnotatorClient();

// ============================================
// CONFIGURATION
// ============================================

const RATE_LIMIT_THRESHOLD = 5; // messages
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const INITIAL_MUTE_DURATION = 60000; // 60 seconds starting mute

// ============================================
// DICTIONARIES & REGEX
// ============================================

const DICTIONARIES = {
    profanity: [
        /хуй/i, /пизд/i, /бля/i, /сук/i, /еба/i, /fuck/i, /bitch/i, /shit/i
    ],
    threat: [
        /убью/i, /прикончу/i, /расправлюсь/i, /kill you/i, /death to/i, /я тебя найду/i
    ],
    violence: [
        /насилие/i, /пытки/i, /torture/i, /violence/i, /изнасилование/i
    ],
    extremism: [
        /игил/i, /isis/i, /терроризм/i, /terrorism/i, /экстремизм/i
    ]
};

// ============================================
// STATE
// ============================================

const bans = new Map(Object.entries(storage.load('bans', {}))); // userId -> { type, expiresAt, reason }
const violations = storage.load('violations', []); // ViolationLog[]: { userId, type, timestamp, messagePreview }
const messageHistory = new Map(); // userId -> timestamp[]
const muteStats = new Map(); // userId -> { expiresAt, violationCount }

// ============================================
// ENGINE
// ============================================

/**
 * Checks if text contains prohibited content and returns why
 * @returns {string|null} reason or null
 */
function getFilterViolation(text) {
    if (!text) return null;
    for (const [reason, regexes] of Object.entries(DICTIONARIES)) {
        if (regexes.some(regex => regex.test(text))) {
            return reason;
        }
    }
    return null;
}

/**
 * Checks and updates rate limit for a user with increasing mutes
 * @returns {boolean} true if rate limited (muted)
 */
function checkRateLimit(userId) {
    const now = Date.now();
    
    // 1. Check current mute status
    const stats = muteStats.get(userId) || { expiresAt: 0, violationCount: 0 };
    if (now < stats.expiresAt) return true;

    // 2. Track message history
    if (!messageHistory.has(userId)) {
        messageHistory.set(userId, []);
    }
    const history = messageHistory.get(userId);
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Filter old entries
    const recent = history.filter(ts => ts > windowStart);
    recent.push(now);
    messageHistory.set(userId, recent);

    // 3. Trigger Mute if threshold exceeded
    if (recent.length > RATE_LIMIT_THRESHOLD) {
        stats.violationCount++;
        // Multiply duration by number of violations (e.g. 60s, 120s, 180s...)
        const duration = INITIAL_MUTE_DURATION * stats.violationCount;
        stats.expiresAt = now + duration;
        muteStats.set(userId, stats);
        
        logViolation(userId, 'spam', `Rate limit exceeded. Count: ${stats.violationCount}`);
        return true;
    }

    return false;
}

function getMutedUntil(userId) {
    return muteStats.get(userId)?.expiresAt || 0;
}

/**
 * Logging engine
 */
function logViolation(userId, type, messagePreview) {
    const log = {
        userId,
        type,
        timestamp: Date.now(),
        messagePreview: (messagePreview || '').substring(0, 100)
    };
    violations.push(log);
    storage.save('violations', violations);
    console.log(`[VIOLATION] ${userId} | ${type} | ${log.messagePreview}`);
}

/**
 * Ban logic
 */
function applyBan(userId, durationType, reason) {
    // durationType: '1h', '1d', 'perm'
    let duration = 0;
    if (durationType === '1h') duration = 60 * 60 * 1000;
    else if (durationType === '1d') duration = 24 * 60 * 60 * 1000;
    else if (durationType === 'perm') duration = -1;

    const expiresAt = duration === -1 ? -1 : Date.now() + duration;
    bans.set(userId, { expiresAt, reason, type: durationType });
    storage.save('bans', Object.fromEntries(bans));
    logViolation(userId, `ban:${durationType}`, reason);
}

function isUserBanned(userId) {
    const ban = bans.get(userId);
    if (!ban) return false;
    if (ban.expiresAt === -1) return true;
    if (Date.now() > ban.expiresAt) {
        bans.delete(userId);
        return false;
    }
    return true;
}

/**
 * Moderate an image using Google Vision API and heuristic AI detection
 * @param {Buffer} imageBuffer - Buffer of the image to moderate
 * @returns {Promise<{approved: boolean, reason?: string}>}
 */
async function moderateImage(imageBuffer) {
    try {
        const [result] = await client.annotateImage({
            image: { content: imageBuffer },
            features: [
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'FACE_DETECTION' },
                { type: 'LABEL_DETECTION' },
                { type: 'TEXT_DETECTION' },
                { type: 'WEB_DETECTION' }
            ]
        });

        const safeSearch = result.safeSearchAnnotation;
        const faces = result.faceAnnotations || [];
        const labels = result.labelDetection || [];
        const textAnnotations = result.textAnnotations || [];
        const webDetection = result.webDetection || {};

        // 1. NSFW CHECK (Strict — catch borderline content too)
        const strictNsfwLevels = ['LIKELY', 'VERY_LIKELY'];
        const moderateNsfwLevels = ['POSSIBLE', 'LIKELY', 'VERY_LIKELY'];
        
        if (strictNsfwLevels.includes(safeSearch.adult) || strictNsfwLevels.includes(safeSearch.racy)) {
            return { approved: false, reason: 'NSFW content detected (Adult/Racy)', errorCode: 'ERR_NSFW' };
        }
        if (strictNsfwLevels.includes(safeSearch.violence)) {
            return { approved: false, reason: 'Violence detected in photo.', errorCode: 'ERR_VIOLENCE' };
        }
        if (strictNsfwLevels.includes(safeSearch.medical)) {
            return { approved: false, reason: 'Medical/graphic content detected.', errorCode: 'ERR_MEDICAL' };
        }

        // 2. TEXT / AD DETECTION
        if (textAnnotations.length > 0) {
            const fullText = textAnnotations[0].description || '';
            if (fullText.length > 50 || fullText.includes('www.') || fullText.includes('.com')) {
                 return { approved: false, reason: 'Promotional content or banner detected.', errorCode: 'ERR_TEXT' };
            }
        }

        // 3. FACE COUNT & IDENTITY
        if (faces.length === 0) {
            return { approved: false, reason: 'Please use a real photo of a face.', errorCode: 'ERR_NO_FACE' };
        }
        if (faces.length > 1) {
            return { approved: false, reason: 'The photo should have one person.', errorCode: 'ERR_GROUP_PHOTO' };
        }

        // 4. LABEL-BASED CONTENT FILTERING
        const blockLabels = {
            animals: ['dog', 'cat', 'pet', 'animal', 'bird', 'horse', 'kitten', 'puppy', 'fish', 'snake', 'rabbit', 'hamster', 'parrot'],
            children: ['child', 'baby', 'infant', 'toddler'],
            gestures: ['middle finger', 'offensive gesture'],
            nudity: ['swimwear', 'underwear', 'lingerie', 'bikini', 'shirtless', 'bare chest', 'topless', 'nudity', 'naked', 'brassiere', 'bathing suit'],
            objects: ['car', 'vehicle', 'automobile', 'motorcycle', 'truck', 'food', 'dish', 'meal', 'building', 'architecture', 'landscape', 'scenery', 'nature', 'mountain', 'beach', 'ocean', 'sunset', 'flower', 'plant', 'tree', 'furniture', 'electronics', 'phone', 'computer', 'guitar', 'piano', 'weapon', 'gun', 'knife', 'money', 'cash', 'toy', 'game', 'sport equipment'],
            memes: ['meme', 'screenshot', 'cartoon', 'drawing', 'painting', 'poster', 'logo', 'banner', 'collage', 'comic']
        };

        const labelReasons = {
            animals: 'Please upload a photo of yourself, not animals.',
            children: 'Photo does not meet safety rules.',
            gestures: 'Offensive gestures are not allowed.',
            nudity: 'Please upload a clothed photo (shirt/t-shirt required).',
            objects: 'Please upload a photo of your face, not objects or scenery.',
            memes: 'Please upload a real photo of yourself.'
        };

        for (const [category, keywords] of Object.entries(blockLabels)) {
            const match = labels.find(l => keywords.some(k => l.description.toLowerCase().includes(k)) && l.score > 0.80);
            if (match) {
                const errorCode = `ERR_${category.toUpperCase()}`;
                const reason = labelReasons[category] || 'Photo does not meet safety rules.';
                console.log(`[MODERATION] Blocked label: ${match.description} (${match.score}) → ${category}`);
                return { approved: false, reason, errorCode };
            }
        }

        // 5. CELEBRITY & WEB DETECTION (Block actors, singers, famous people)
        if (webDetection.webEntities) {
            const celebrityKeywords = [
                'actor', 'actress', 'singer', 'celebrity', 'model', 'politician',
                'athlete', 'footballer', 'basketball player', 'musician', 'rapper',
                'influencer', 'youtuber', 'tiktoker', 'public figure', 'star',
                'president', 'minister', 'sportsman', 'sportswoman'
            ];
            const celebrityMatch = webDetection.webEntities.find(entity => 
                entity.description && entity.score > 0.7 && 
                celebrityKeywords.some(k => entity.description.toLowerCase().includes(k))
            );
            if (celebrityMatch) {
                console.log(`[MODERATION] Celebrity detected: ${celebrityMatch.description} (${celebrityMatch.score})`);
                return { approved: false, reason: 'Celebrity/public figure photos are not allowed. Please use your own real photo.', errorCode: 'ERR_CELEBRITY' };
            }
            
            // Also check for high visual similarity to known web images (reverse image search)
            if (webDetection.visuallySimilarImages && webDetection.visuallySimilarImages.length > 5) {
                console.log(`[MODERATION] Photo has ${webDetection.visuallySimilarImages.length} similar images online — possible stock/celebrity photo`);
                // Only block if combined with a named entity
                const namedEntity = webDetection.webEntities?.find(e => e.description && e.score > 0.5);
                if (namedEntity) {
                    return { approved: false, reason: 'This photo appears to be from the internet. Please use your own real photo.', errorCode: 'ERR_STOCK_PHOTO' };
                }
            }
        }

        // 6. AI / ANIME DETECTION (Strictly for non-human art)
        const aiLabels = ['Artificial intelligence', 'Anime', 'Manga', 'Avatar', 'CGI', 'Illustration'];
        const isLikelyArt = labels.some(l => aiLabels.some(ai => l.description.toLowerCase().includes(ai.toLowerCase()) && l.score > 0.95));
        
        if (isLikelyArt) {
            const isHumanLabel = labels.some(l => (l.description.toLowerCase().includes('human') || l.description.toLowerCase().includes('person')) && l.score > 0.9);
            if (!isHumanLabel) {
                return { approved: false, reason: 'Please use a real photo of a face.', errorCode: 'ERR_AI_ART' };
            }
        }

        return { approved: true };
    } catch (error) {
        console.error('[MODERATION] Google Vision API Error:', error);
        throw error;
    }
}

function getBanReason(userId) {
    const ban = bans.get(userId);
    return ban ? ban.reason : null;
}

function isSuspended(userId) {
    const ban = bans.get(userId);
    if (!ban) return false;
    if (ban.type === '1d' && ban.expiresAt !== -1 && Date.now() < ban.expiresAt) return true;
    return false;
}

module.exports = {
    getFilterViolation,
    checkRateLimit,
    getMutedUntil,
    isUserBanned,
    isSuspended,
    applyBan,
    logViolation,
    getBanReason,
    getActiveBans: () => Object.fromEntries(bans),
    moderateImage
};
