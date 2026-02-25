import { useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { ChatAction } from '../state/chatReducer';

/**
 * useDiscoveryEngine
 * 
 * Implements a fair global distribution algorithm for the "Online Users" feed.
 * 
 * 1. Filter out stale users (lastActiveAt > 5 mins). Note: We proxy this by just taking active array for now, 
 *    in a real scale the server does the TTL. Here we trust the array given by server.
 * 2. Group online users by Country.
 * 3. Calculate fair quota per country (e.g. 100 max results / 40 countries = 2-3 per country).
 * 4. Pick randomly within the country up to the quota.
 * 5. Shuffle the final array with a daily seed, or random shuffle so the feed feels dynamic but fair.
 */
export function useDiscoveryEngine(
  onlineUsers: UserProfile[],
  currentUser: UserProfile | null,
  dispatch: React.Dispatch<ChatAction>,
  maxResults: number = 100
) {

  const discoveryFeed = useMemo(() => {
    if (!onlineUsers || onlineUsers.length === 0) return [];
    
    // 0. Filter out ourselves
    const others = onlineUsers.filter(u => u.id !== currentUser?.id);
    
    // 1. Group by country
    const countryGroups: Record<string, UserProfile[]> = {};
    others.forEach(user => {
      const c = user.country || 'Unknown';
      if (!countryGroups[c]) countryGroups[c] = [];
      countryGroups[c].push(user);
    });

    const validCountries = Object.keys(countryGroups);
    if (validCountries.length === 0) return [];

    // 2. Base Quota
    // If we have 10 countries and maxResults is 100, quota is 10 per country.
    // If a country has only 2 people, we grab 2. The remaining 8 quota spills over.
    const baseQuota = Math.floor(maxResults / validCountries.length);
    
    let finalSelection: UserProfile[] = [];
    let remainder = maxResults;
    let unsatisfiedCountries = [...validCountries];

    // Distribute logic
    while (unsatisfiedCountries.length > 0 && remainder > 0) {
      const currentQuota = Math.ceil(remainder / unsatisfiedCountries.length);
      const nextUnsatisfied: string[] = [];

      for (const c of unsatisfiedCountries) {
        if (remainder <= 0) break;
        
        const group = countryGroups[c];
        if (group.length <= currentQuota) {
          // Take all from this country
          finalSelection.push(...group);
          remainder -= group.length;
          countryGroups[c] = []; // Empty it
        } else {
          // Take `currentQuota` random users from this country
          const shuffled = group.sort(() => 0.5 - Math.random());
          const selection = shuffled.slice(0, currentQuota);
          finalSelection.push(...selection);
          remainder -= selection.length;
          countryGroups[c] = group.slice(currentQuota); // Keep remainder for potential next pass
          nextUnsatisfied.push(c);
        }
      }
      unsatisfiedCountries = nextUnsatisfied;
    }

    // 3. Final Shuffle to mix countries up in the feed
    return finalSelection.sort(() => 0.5 - Math.random());

  }, [onlineUsers, currentUser?.id, maxResults]);

  // Dispatch to state anytime the calculated feed changes
  useEffect(() => {
    dispatch({ type: 'DISCOVERY_RESULTS_UPDATED', payload: discoveryFeed });
  }, [discoveryFeed, dispatch]);

  return discoveryFeed;
}
