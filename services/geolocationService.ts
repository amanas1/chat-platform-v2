/**
 * Geolocation Service
 * Handles browser geolocation, IP-based fallback, and location validation
 */

import { normalizeCountryName } from '../types/constants';

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
   * Uses our own backend proxy to avoid CORS and Mixed Content issues
   */
  async getIPLocation(): Promise<LocationData> {
    try {
        console.log('[GEO] 🌍 Requesting location from backend proxy...');
        
        // STRICT PRODUCTION BACKEND URL
        const backendUrl = import.meta.env.VITE_SOCKET_URL;
        if (!backendUrl) {
            console.error("🚨 CRITICAL: VITE_SOCKET_URL is missing in this environment!");
            return { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${backendUrl}/api/location`, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Backend returned ${response.status}`);

        const data = await response.json();
        console.log('[GEO] ✅ Backend proxy detected location:', data);

        return {
            country: normalizeCountryName(data.country || 'Unknown'),
            city: data.city || 'Unknown',
            countryCode: data.countryCode,
            ip: data.ip
        };

    } catch (err) {
        console.error('[GEO] ❌ Backend proxy failed:', err);
        return { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
    }
  }

  /**
   * Universal location detection
   * Simpler logic: Try Browser Internal -> Fallback to Backend Proxy
   */
  async detectLocation(): Promise<LocationData | null> {
    // 1. Try Backend Proxy Directly (Recommended for consistency)
    return await this.getIPLocation(); 
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
        country: normalizeCountryName(address.country || 'Unknown'),
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
}

// Export singleton instance
export const geolocationService = new GeolocationService();
