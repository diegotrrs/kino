const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=';

// A Google Maps search for the address. Nothing goes to Google until someone opens the link.
export const getGoogleMapsUrl = (address: string | null | undefined): string | null => {
  const query = address?.trim();
  return query ? `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(query)}` : null;
};
