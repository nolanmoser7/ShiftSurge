/**
 * Google Places API utilities for extracting restaurant information
 * from Google Business links
 */

interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  rating?: number;
  businessHours?: string;
  lat?: number;
  lng?: number;
}

/**
 * Detect if URL is a Google short URL that needs to be resolved
 */
function isGoogleShortUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      hostname === 'share.google' ||
      hostname === 'maps.app.goo.gl' ||
      hostname === 'goo.gl' ||
      hostname === 'g.page'
    );
  } catch {
    return false;
  }
}

/**
 * Validate that a URL is from a trusted Google domain
 */
function isTrustedGoogleDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    const trustedDomains = [
      'google.com',
      'maps.google.com',
      'www.google.com',
      'maps.app.goo.gl',
      'goo.gl',
      'g.page',
      'share.google'
    ];
    
    return trustedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Resolve a short URL by following redirects to get the full Google Maps URL
 * Handles intermediate formats like maps.app.goo.gl/?link=...
 * Only follows redirects to trusted Google domains for security (SSRF prevention)
 */
async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    let currentUrl = shortUrl;
    let maxRedirects = 10; // Prevent infinite loops
    
    while (maxRedirects > 0) {
      // Validate current URL is from trusted Google domain
      if (!isTrustedGoogleDomain(currentUrl)) {
        throw new Error('Invalid redirect to non-Google domain detected');
      }
      
      // Fetch with manual redirect handling to validate each hop
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Manual mode to inspect each redirect
      });
      
      // Handle redirects manually
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect response missing Location header');
        }
        
        // Resolve relative URLs
        const nextUrl = new URL(location, currentUrl).href;
        
        // Validate redirect target is trusted before following
        if (!isTrustedGoogleDomain(nextUrl)) {
          throw new Error('Redirect points to untrusted domain: ' + new URL(nextUrl).hostname);
        }
        
        currentUrl = nextUrl;
        maxRedirects--;
        continue;
      }
      
      // Not a redirect, check for link parameter
      const urlObj = new URL(currentUrl);
      const linkParam = urlObj.searchParams.get('link');
      
      if (linkParam) {
        // Decode the embedded link
        const decodedLink = decodeURIComponent(linkParam);
        
        // Validate decoded link is from trusted Google domain
        if (!isTrustedGoogleDomain(decodedLink)) {
          throw new Error('Link parameter points to untrusted domain');
        }
        
        // Continue resolving
        currentUrl = decodedLink;
        maxRedirects--;
        continue;
      }
      
      // Final validation before returning
      if (!isTrustedGoogleDomain(currentUrl)) {
        throw new Error('Final URL is not from a trusted Google domain');
      }
      
      // No more redirects needed
      return currentUrl;
    }
    
    throw new Error('Too many redirects while resolving Google link');
  } catch (error) {
    console.error('Error resolving short URL:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not resolve the shortened Google link. Please try using the direct Google Maps link instead.');
  }
}

/**
 * Extract Place ID from various Google Maps/Business URL formats
 * Supports formats like:
 * - https://maps.google.com/?cid=12345
 * - https://www.google.com/maps/place/Restaurant+Name/@lat,lng,zoom/data=...!1s0x...!8m2!3d...
 * - https://goo.gl/maps/xxx
 * - https://g.page/restaurant-name
 */
export function extractPlaceIdFromUrl(url: string): { placeId?: string; placeName?: string; lat?: number; lng?: number } | null {
  try {
    const urlObj = new URL(url);
    
    // Format 1: Knowledge Graph ID (from share.google links)
    if (urlObj.searchParams.has('kgmid')) {
      const kgmid = urlObj.searchParams.get('kgmid')!;
      // Knowledge Graph IDs start with /g/ (e.g., /g/11gl1y7d57)
      if (kgmid.startsWith('/g/')) {
        return { placeId: kgmid };
      }
    }
    
    // Format 2: ftid parameter (actual Place ID)
    if (urlObj.searchParams.has('ftid')) {
      return { placeId: urlObj.searchParams.get('ftid')! };
    }
    
    // Format 3: CID parameter
    if (urlObj.searchParams.has('cid')) {
      return { placeId: `cid:${urlObj.searchParams.get('cid')}` };
    }
    
    // Format 4: Extract from data parameter (may be hex geocode, not Place ID)
    const dataParam = urlObj.searchParams.get('data');
    if (dataParam) {
      // Try to find actual Place ID (ChIJ format)
      const placeIdMatch = dataParam.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        return { placeId: placeIdMatch[1] };
      }
      
      // If hex geocode found with 1s prefix, extract place name and coords instead
      const hexMatch = dataParam.match(/1s(0x[0-9a-f]+:0x[0-9a-f]+)/);
      if (hexMatch) {
        // Extract place name from URL path
        const nameMatch = urlObj.pathname.match(/\/place\/([^/@]+)/);
        const placeName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : undefined;
        
        // Extract coordinates from URL path
        const coordMatch = urlObj.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch && placeName) {
          return {
            placeName,
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2])
          };
        }
      }
    }
    
    // Format 5: Direct Place ID in path
    const pathMatch = urlObj.pathname.match(/place\/([A-Za-z0-9_-]{20,})/);
    if (pathMatch) {
      return { placeId: pathMatch[1] };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    return null;
  }
}

/**
 * Fetch restaurant details from Google Places API
 * Uses Place Details API endpoint
 */
export async function fetchGooglePlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  try {
    // CID and short URLs can't be used directly - need better error
    if (placeId.startsWith('cid:') || placeId.startsWith('shorturl:')) {
      throw new Error('Please use a Google Maps link that shows the restaurant name in the URL (e.g., google.com/maps/place/Restaurant+Name/...). Links with only "cid=" or shortened URLs cannot be processed.');
    }
    
    // Fetch place details from Google Places API
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'rating',
      'opening_hours',
      'geometry'
    ].join(',');
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(data.error_message || 'Failed to fetch place details');
    }
    
    const result = data.result;
    
    // Format business hours as JSON string
    let businessHours: string | undefined;
    if (result.opening_hours?.weekday_text) {
      businessHours = JSON.stringify(result.opening_hours.weekday_text);
    }
    
    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      phoneNumber: result.formatted_phone_number,
      rating: result.rating,
      businessHours,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
    };
  } catch (error) {
    console.error('Error fetching Google Place details:', error);
    throw error;
  }
}

/**
 * Find Place ID using Find Place From Text API
 */
async function findPlaceByNameAndLocation(
  name: string,
  lat: number,
  lng: number,
  apiKey: string
): Promise<string> {
  const input = encodeURIComponent(name);
  const location = `${lat},${lng}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&locationbias=circle:100@${location}&fields=place_id&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.candidates || data.candidates.length === 0) {
    throw new Error(`Could not find place "${name}" near the provided location`);
  }
  
  return data.candidates[0].place_id;
}

/**
 * Helper function to validate and extract place details from a Google Business link
 * This is the main function that should be called from the API endpoint
 */
export async function getRestaurantFromGoogleLink(
  googleLink: string,
  apiKey: string
): Promise<PlaceDetails> {
  // If it's a short URL, resolve it first
  let urlToProcess = googleLink;
  if (isGoogleShortUrl(googleLink)) {
    console.log('Detected short URL, resolving:', googleLink);
    urlToProcess = await resolveShortUrl(googleLink);
    console.log('Resolved to:', urlToProcess);
  }
  
  // Extract place ID or name/coords from URL
  const extracted = extractPlaceIdFromUrl(urlToProcess);
  
  if (!extracted) {
    throw new Error('Could not extract Place ID from the provided Google link. Please ensure you\'re using a valid Google Maps or Google Business link.');
  }
  
  let placeId: string;
  
  // If we have a direct Place ID, use it
  if (extracted.placeId) {
    placeId = extracted.placeId;
  }
  // Otherwise, use name and coordinates to find the Place ID
  else if (extracted.placeName && extracted.lat && extracted.lng) {
    placeId = await findPlaceByNameAndLocation(
      extracted.placeName,
      extracted.lat,
      extracted.lng,
      apiKey
    );
  } else {
    throw new Error('Could not extract enough information from the Google link');
  }
  
  // Fetch details from Google Places API
  const details = await fetchGooglePlaceDetails(placeId, apiKey);
  
  if (!details) {
    throw new Error('Could not fetch restaurant details from Google Places API.');
  }
  
  return details;
}
