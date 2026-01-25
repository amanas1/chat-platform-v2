const storage = require('./storage');

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

module.exports = {
    getFilterViolation,
    checkRateLimit,
    isUserBanned,
    applyBan,
    logViolation,
    getMutedUntil: (userId) => muteStats.get(userId)?.expiresAt || 0,
    getBanReason: (userId) => bans.get(userId)?.reason || '',
    getViolations: () => violations,
    getActiveBans: () => Object.fromEntries(bans)
};
