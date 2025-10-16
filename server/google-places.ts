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
    
    // Format 1: ftid parameter (actual Place ID)
    if (urlObj.searchParams.has('ftid')) {
      return { placeId: urlObj.searchParams.get('ftid')! };
    }
    
    // Format 2: CID parameter
    if (urlObj.searchParams.has('cid')) {
      return { placeId: `cid:${urlObj.searchParams.get('cid')}` };
    }
    
    // Format 3: Extract from data parameter (may be hex geocode, not Place ID)
    const dataParam = urlObj.searchParams.get('data');
    if (dataParam) {
      // Try to find actual Place ID (ChIJ format)
      const placeIdMatch = dataParam.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        return { placeId: placeIdMatch[1] };
      }
      
      // If hex geocode found, extract place name and coords instead
      const hexMatch = dataParam.match(/!1s0x[0-9a-f]+:0x[0-9a-f]+/);
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
    
    // Format 4: Direct Place ID in path
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
    // Handle special cases (CID, short URLs)
    if (placeId.startsWith('cid:') || placeId.startsWith('shorturl:')) {
      throw new Error('This URL format requires additional lookup. Please use a direct Google Maps link with the full restaurant name visible.');
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
  // Extract place ID or name/coords from URL
  const extracted = extractPlaceIdFromUrl(googleLink);
  
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
