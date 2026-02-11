const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/api/moderate-avatar';

async function testModeration(imagePath, label) {
    console.log(`\n--- Testing: ${label} ---`);
    if (!fs.existsSync(imagePath)) {
        console.error(`File not found: ${imagePath}`);
        return;
    }

    const form = new FormData();
    form.append('avatar', fs.createReadStream(imagePath));
    form.append('fingerprint', 'test-runner-fp');

    try {
        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('Result: APPROVED');
        console.log('URL:', response.data.url);
    } catch (error) {
        if (error.response) {
            console.log('Result: REJECTED');
            console.log('Reason:', error.response.data.reason);
            console.log('Code:', error.response.data.errorCode);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    console.log('Starting automated tests for moderation system...');
    console.log('Make sure the server is running on http://localhost:3001');

    const assetsDir = '/Users/manasabduldaev/.gemini/antigravity/brain/6d445851-8edb-48c3-9626-4283c91768a2';
    
    await testModeration(path.join(assetsDir, 'test_selfie_valid_1770745102148.png'), 'Real Selfie');
    await testModeration(path.join(assetsDir, 'test_group_photo_1770745120515.png'), 'Group Photo');
    await testModeration(path.join(assetsDir, 'test_animal_only_1770745132764.png'), 'Animal Only');
    await testModeration(path.join(assetsDir, 'test_ai_anime_art_v2_1770745148259.png'), 'Anime/Art');
}

runTests();
