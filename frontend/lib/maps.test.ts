import { describe, expect, it } from 'vitest';
import { getGoogleMapsUrl } from './maps';

describe('getGoogleMapsUrl', () => {
  it('should build a Google Maps search link for an address', () => {
    expect(getGoogleMapsUrl('Colosseum')).toBe('https://www.google.com/maps/search/?api=1&query=Colosseum');
  });

  it('should encode spaces, commas, accents and ampersands so the whole address is the query', () => {
    expect(getGoogleMapsUrl('Café & Bar, Praça do Comércio 1')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20%26%20Bar%2C%20Pra%C3%A7a%20do%20Com%C3%A9rcio%201',
    );
  });

  it('should ignore spaces around the address', () => {
    expect(getGoogleMapsUrl('  Via Roma 1  ')).toBe('https://www.google.com/maps/search/?api=1&query=Via%20Roma%201');
  });

  it('should give no link for a missing or blank address', () => {
    expect(getGoogleMapsUrl(null)).toBeNull();
    expect(getGoogleMapsUrl(undefined)).toBeNull();
    expect(getGoogleMapsUrl('   ')).toBeNull();
  });
});
