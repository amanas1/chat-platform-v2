/**
 * Geolocation Service
 * Handles browser geolocation, IP-based fallback, and location validation
 */

export interface LocationData {
  country: string;
  city: string;
  countryCode?: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
}

class GeolocationService {
  /**
   * Get user location via browser geolocation API
   * Requests permission and returns coordinates + reverse geocoded location
   */
  async getBrowserLocation(): Promise<LocationData | null> {
    if (!navigator.geolocation) {
      console.warn('[GEO] Browser geolocation not supported');
      return null;
    }

    try {
      console.log('[GEO] Requesting browser geolocation permission...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      console.log(`[GEO] ✅ Got coordinates: ${latitude}, ${longitude}`);

      // Reverse geocode to get city/country
      const location = await this.reverseGeocode(latitude, longitude);
      return { ...location, latitude, longitude };
      
    } catch (error: any) {
      if (error.code === 1) {
        console.warn('[GEO] ⚠️ Permission denied by user');
      } else if (error.code === 2) {
        console.warn('[GEO] ⚠️ Position unavailable');
      } else if (error.code === 3) {
        console.warn('[GEO] ⚠️ Timeout');
      } else {
        console.error('[GEO] ❌ Error:', error);
      }
      return null;
    }
  }

  /**
   * Get user location via IP address (fallback method)
   * Uses ipapi.co free service (no API key needed)
   */
  /**
   * Get user location via IP address (fallback method)
   * Uses our own backend proxy to avoid CORS and Mixed Content issues
   */
  async getIPLocation(): Promise<LocationData> {
    try {
        console.log('[GEO] 🌍 Requesting location from backend proxy...');
        
        // Determine backend URL (production or localhost)
        const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://streamflow-production.up.railway.app');
        // Remove trailing slash if present
        const cleanUrl = backendUrl.replace(/\/$/, '');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${cleanUrl}/api/location`, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Backend returned ${response.status}`);

        const data = await response.json();
        console.log('[GEO] ✅ Backend proxy detected location:', data);

        return {
            country: data.country || 'Unknown',
            city: data.city || 'Unknown',
            countryCode: data.countryCode,
            ip: data.ip
        };

    } catch (err) {
        console.error('[GEO] ❌ Backend proxy failed, trying direct fallback...', err);
        
        // Fallback: Try one direct HTTPS API that might work (ipapi.co is often blocked, try ip-api.io)
        try {
             const response = await fetch('https://ip-api.io/api/json');
             const data = await response.json();
             return {
                country: data.country_name || 'Unknown',
                city: data.city || 'Unknown',
                countryCode: data.country_code,
                ip: data.ip
             };
        } catch (e) {
             console.warn('[GEO] Direct fallback also failed');
        }

        return { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
    }
  }

  /**
   * Reverse geocode coordinates to city/country
   * Uses Nominatim (OpenStreetMap) API - free, no key needed
   */
  async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AU RadioChat/1.0' // Required by Nominatim
        }
      });
      
      if (!response.ok) throw new Error('Nominatim API failed');
      
      const data = await response.json();
      const address = data.address || {};
      
      return {
        country: address.country || 'Unknown',
        city: address.city || address.town || address.village || 'Unknown',
        countryCode: address.country_code?.toUpperCase()
      };
      
    } catch (error) {
      console.error('[GEO] ❌ Reverse geocoding failed:', error);
      
      // Fallback to IP location
      return await this.getIPLocation();
    }
  }

  /**
   * Validate if detected location matches claimed location
   * Returns true if match, false if suspicious mismatch
   */
  validateLocationMatch(detected: string, claimed: string): boolean {
    if (!detected || !claimed) return true; // Can't validate
    
    const normalizedDetected = detected.toLowerCase().trim();
    const normalizedClaimed = claimed.toLowerCase().trim();
    
    return normalizedDetected === normalizedClaimed;
  }

  /**
   * Generate unique device ID for duplicate registration detection
   * Uses browser fingerprinting (not 100% accurate but good enough)
   */
  getDeviceId(): string {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!navigator.cookieEnabled
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `device_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if user registered today (client-side check)
   * Server will also validate for security
   */
  hasRegisteredToday(): boolean {
    try {
      const lastReg = localStorage.getItem('lastRegistrationDate');
      if (!lastReg) return false;
      
      const lastDate = new Date(parseInt(lastReg));
      const today = new Date();
      
      // Same day check
      return lastDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }

  /**
   * Mark user as registered today
   */
  markRegisteredToday(): void {
    try {
      localStorage.setItem('lastRegistrationDate', Date.now().toString());
    } catch (error) {
      console.warn('[GEO] Failed to save registration timestamp:', error);
    }
  }

  /**
   * Cache detected location to avoid repeated lookups
   */
  saveLocationToCache(location: LocationData): void {
    try {
      if (!location || !location.country || location.country === 'Unknown') return;
      localStorage.setItem('auradiochat_last_detected_location', JSON.stringify(location));
    } catch (e) {}
  }

  /**
   * Get cached location
   */
  getCachedLocation(): LocationData | null {
    try {
      const saved = localStorage.getItem('auradiochat_last_detected_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
  /**
   * Get location from our own server proxy
   * Bypasses CORS and AdBlockers
   */
  async getServerLocation(): Promise<LocationData | null> {
      try {
          // In production, use relative path. In dev, might need full URL if ports differ.
          // Assuming relative path works with proxy setup or same origin
          const apiUrl =  window.location.hostname === 'localhost' 
            ? 'http://localhost:3002/api/location' // Default backend port
            : '/api/location';

          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error('Server geo-lookup failed');
          return await response.json();
      } catch (e) {
          console.warn('[GEO] Server proxy failed:', e);
          return null;
      }
  }

  /**
   * Universal location detection
   * Tries Server Proxy first (most reliable), then IP fallback
   */
  async detectLocation(): Promise<LocationData | null> {
    try {
      // 1. Try Server Proxy (Best for reliability & CORS)
      const serverLoc = await this.getServerLocation();
      if (serverLoc) {
          console.log('[GEO] ✅ Server-side detection successful:', serverLoc);
          return serverLoc;
      }

      // 2. Fallback to client-side IP APIs
      return await this.getIPLocation();
    } catch (error) {
      console.error('[GEO] Silent detect location error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
