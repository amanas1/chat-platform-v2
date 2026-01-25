const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

/**
 * Simple JSON storage utility
 */
const storage = {
    /**
     * Loads data from a JSON file
     * @param {string} key - Filename without extension
     * @param {any} defaultValue - Return if file doesn't exist
     */
    load(key, defaultValue = []) {
        const filePath = path.join(DATA_DIR, `${key}.json`);
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error(`[STORAGE] Error loading ${key}:`, error);
        }
        return defaultValue;
    },

    /**
     * Saves data to a JSON file
     * @param {string} key - Filename without extension
     * @param {any} data - Content to save
     */
    save(key, data) {
        const filePath = path.join(DATA_DIR, `${key}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`[STORAGE] Error saving ${key}:`, error);
        }
    }
};

module.exports = storage;
