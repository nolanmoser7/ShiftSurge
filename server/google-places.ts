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
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Format 1: CID parameter (can convert to place_id)
    if (urlObj.searchParams.has('cid')) {
      // CID needs to be converted via API, return special marker
      return `cid:${urlObj.searchParams.get('cid')}`;
    }
    
    // Format 2: Place ID in data parameter
    const dataParam = urlObj.searchParams.get('data');
    if (dataParam) {
      // Extract place ID from data string (format: !1s[PLACE_ID])
      const placeIdMatch = dataParam.match(/!1s([A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        return placeIdMatch[1];
      }
    }
    
    // Format 3: Short URL or g.page - need to resolve via Find Place API
    if (urlObj.hostname === 'goo.gl' || urlObj.hostname === 'g.page') {
      return `shorturl:${url}`;
    }
    
    // Format 4: Direct place ID in URL path
    const pathMatch = urlObj.pathname.match(/place\/([A-Za-z0-9_-]{10,})/);
    if (pathMatch) {
      return pathMatch[1];
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
 * Helper function to validate and extract place details from a Google Business link
 * This is the main function that should be called from the API endpoint
 */
export async function getRestaurantFromGoogleLink(
  googleLink: string,
  apiKey: string
): Promise<PlaceDetails> {
  // Extract place ID from URL
  const placeId = extractPlaceIdFromUrl(googleLink);
  
  if (!placeId) {
    throw new Error('Could not extract Place ID from the provided Google link. Please ensure you\'re using a valid Google Maps or Google Business link.');
  }
  
  // Fetch details from Google Places API
  const details = await fetchGooglePlaceDetails(placeId, apiKey);
  
  if (!details) {
    throw new Error('Could not fetch restaurant details from Google Places API.');
  }
  
  return details;
}
