import CryptoJS from 'crypto-js';

/**
 * Simple E2EE Mock using AES-256
 * NOTE: This is a simplified implementation for demonstration.
 * For production, use proper E2EE protocols like Signal Protocol or Matrix's Olm/Megolm
 */

class EncryptionService {
  private sessionKeys: Map<string, string> = new Map();
  
  /**
   * Generate a session key for a chat session
   * In real E2EE, this would involve key exchange (e.g., Diffie-Hellman)
   */
  generateSessionKey(sessionId: string): string {
    // Deterministic key generation based on sessionId
    // This allows both participants to generate the same key without a handshake (Simulating Key Exchange)
    const key = CryptoJS.SHA256(sessionId).toString();
    this.sessionKeys.set(sessionId, key);
    return key;
  }
  
  /**
   * Set a pre-shared session key (simulating key exchange)
   */
  setSessionKey(sessionId: string, key: string) {
    this.sessionKeys.set(sessionId, key);
  }
  
  /**
   * Encrypt a message
   */
  encrypt(text: string, sessionId: string): string {
    try {
      const key = this.generateSessionKey(sessionId);
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plaintext (not recommended in production)
    }
  }
  
  /**
   * Decrypt a message
   */
  decrypt(encryptedText: string, sessionId: string): string {
    try {
      // Ensure we have the key (derive it deterministically)
      const key = this.generateSessionKey(sessionId);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Decryption failed]';
    }
  }
  
  /**
   * Encrypt binary data (for images/audio)
   */
  encryptBinary(dataUrl: string, sessionId: string): string {
    try {
      const key = this.generateSessionKey(sessionId);
      const encrypted = CryptoJS.AES.encrypt(dataUrl, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Binary encryption error:', error);
      return dataUrl;
    }
  }
  
  /**
   * Decrypt binary data
   */
  decryptBinary(encryptedDataUrl: string, sessionId: string): string {
    try {
      const key = this.generateSessionKey(sessionId);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedDataUrl, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Binary decryption error:', error);
      return '';
    }
  }
  
  /**
   * Clear session key (e.g., when chat ends)
   */
  clearSessionKey(sessionId: string) {
    this.sessionKeys.delete(sessionId);
  }
  
  /**
   * Clear all keys
   */
  clearAllKeys() {
    this.sessionKeys.clear();
  }
}

export const encryptionService = new EncryptionService();
