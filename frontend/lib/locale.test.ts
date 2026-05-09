import { describe, expect, it } from 'vitest';
import { detectLocale } from './locale';

describe('detectLocale', () => {
  it('should return "es" for Accept-Language: es-ES,es;q=0.9', () => {
    expect(detectLocale('es-ES,es;q=0.9')).toBe('es');
  });

  it('should return "en" for Accept-Language: en-US', () => {
    expect(detectLocale('en-US')).toBe('en');
  });

  it('should return "de" for Accept-Language: de-DE,de;q=0.9', () => {
    expect(detectLocale('de-DE,de;q=0.9')).toBe('de');
  });

  it('should return "pt" for Accept-Language: pt-BR,pt;q=0.9', () => {
    expect(detectLocale('pt-BR,pt;q=0.9')).toBe('pt');
  });

  it('should return "en" for Accept-Language: en-GB', () => {
    expect(detectLocale('en-GB')).toBe('en');
  });

  it('should return the default locale for an unsupported language', () => {
    expect(detectLocale('fr-FR,fr;q=0.9')).toBe('en');
  });

  it('should return the default locale for an empty string', () => {
    expect(detectLocale('')).toBe('en');
  });

  it('should respect quality weights and pick the highest-weighted supported locale', () => {
    // fr is not supported, so falls through to es
    expect(detectLocale('fr;q=1,es;q=0.8')).toBe('es');
  });
});
