const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');
const exifParser = require('exif-parser');
const sharp = require('sharp');
require('dotenv').config();

// Initialize Google Vision client
// Credentials should be in process.env.GOOGLE_APPLICATION_CREDENTIALS or process.env.GOOGLE_CLOUD_VISION_KEY
const client = new vision.ImageAnnotatorClient();

/**
 * Moderate an image using Google Vision API and heuristic AI detection
 * @param {Buffer} imageBuffer - Buffer of the image to moderate
 * @returns {Promise<{approved: boolean, reason?: string}>}
 */
async function moderateImage(imageBuffer) {
    try {
        // 1. Perform Google Vision checks (NSFW + Face Detection)
        const [result] = await client.annotateImage({
            image: { content: imageBuffer },
            features: [
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'FACE_DETECTION' },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'LABEL_DETECTION' }
            ]
        });

        const safeSearch = result.safeSearchAnnotation;
        const faces = result.faceAnnotations || [];
        const imageProperties = result.imagePropertiesAnnotation;
        const labels = result.labelDetection || [];

        // --- NSFW CHECK ---
        const nsfwLevels = ['LIKELY', 'VERY_LIKELY'];
        if (nsfwLevels.includes(safeSearch.adult) || nsfwLevels.includes(safeSearch.racy)) {
            return { approved: false, reason: 'NSFW content detected (Adult/Racy)' };
        }

        // --- FACE DETECTION CHECK ---
        if (faces.length === 0) {
            return { approved: false, reason: 'No face detected. Please upload a clear portrait photo.' };
        }

        const mainFace = faces[0];
        
        // Basic visible face requirements
        if (mainFace.underExposedLikelihood === 'VERY_LIKELY' || mainFace.blurredLikelihood === 'VERY_LIKELY') {
            return { approved: false, reason: 'Face is too dark or too blurred. Use a better lit photo.' };
        }

        // Check if eyes/brow/mouth are covered (ballaclava/mask/hair)
        // Note: Google Vision doesn't give a direct "covered" score, but we can check detection confidence
        if (mainFace.detectionConfidence < 0.7) {
            return { approved: false, reason: 'Face is not clearly visible. Ensure your face is not covered.' };
        }

        // --- AI GENERATION DETECTION (Heuristics) ---
        
        // A. Metadata Analysis
        let metadata = null;
        try {
            const parser = exifParser.create(imageBuffer);
            metadata = parser.parse();
        } catch (e) {
            // No EXIF - common in AI gens but also in screenshots
        }

        const hasExif = metadata && metadata.tags && Object.keys(metadata.tags).length > 0;
        
        // List of software strings often added by AI tools
        const aiSoftware = ['Stable Diffusion', 'Midjourney', 'DALL-E', 'GAN', 'Generative', 'Adobe Firefly'];
        if (hasExif && metadata.tags.Software) {
            const software = metadata.tags.Software.toLowerCase();
            if (aiSoftware.some(s => software.includes(s.toLowerCase()))) {
                return { approved: false, reason: 'AI-generated image detected via metadata.' };
            }
        }

        // B. Visual Heuristics (Vision API Labels/Properties)
        // AI images often have specific labels or lack natural camera labels
        const aiLabels = ['CGI', 'Digital illustration', 'Artificial intelligence', 'Anime', 'Manga', 'Avatar'];
        const isLikelyIllust = labels.some(l => aiLabels.some(ai => l.description.toLowerCase().includes(ai.toLowerCase()) && l.score > 0.8));
        
        if (isLikelyIllust) {
            return { approved: false, reason: 'Image appears to be an illustration or AI-generated avatar.' };
        }

        // C. Skin Consistency / Asymmetry (Deep Heuristic)
        // Note: Real face detection usually has high 'joy'/'sorrow'/'surprise' confidence even if neutral.
        // AI faces sometimes have weird confidence scores on landmarks.
        // We'll also check for extremely high color saturation (common in Midjourney)
        if (imageProperties && imageProperties.dominantColors) {
            const colors = imageProperties.dominantColors.colors;
            // Check for unnaturally vibrant colors if saturation is somehow calculable? 
            // Simplified: If it's a "Portrait" but has "Digital Art" labels, reject.
            const isPortraitLabel = labels.some(l => l.description.toLowerCase().includes('portrait') || l.description.toLowerCase().includes('human'));
            const isArtLabel = labels.some(l => l.description.toLowerCase().includes('art') || l.description.toLowerCase().includes('illustration'));
            
            if (isArtLabel && !isPortraitLabel) {
                 return { approved: false, reason: 'Image appears to be art or illustration, not a photo.' };
            }
        }

        return { approved: true };
    } catch (error) {
        console.error('[MODERATION] Google Vision API Error:', error);
        throw error;
    }
}

module.exports = {
    moderateImage,
    // Keep existing exports for backward compatibility if any
};
