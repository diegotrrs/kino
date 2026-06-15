import { describe, expect, it } from 'vitest';
import { addPendingUrl, removePendingUrl } from './pending-links';

describe('addPendingUrl', () => {
  it('should add a new URL to an empty list', () => {
    expect(addPendingUrl([], 'https://example.com')).toEqual(['https://example.com']);
  });

  it('should add a new URL to a non-empty list', () => {
    const result = addPendingUrl(['https://a.com'], 'https://b.com');
    expect(result).toEqual(['https://a.com', 'https://b.com']);
  });

  it('should not add a duplicate URL', () => {
    const urls = ['https://example.com'];
    expect(addPendingUrl(urls, 'https://example.com')).toBe(urls);
  });

  it('should not add a blank URL', () => {
    const urls = ['https://example.com'];
    expect(addPendingUrl(urls, '')).toBe(urls);
  });

  it('should not add a whitespace-only URL', () => {
    const urls: string[] = [];
    expect(addPendingUrl(urls, '   ')).toBe(urls);
  });

  it('should trim whitespace before adding', () => {
    expect(addPendingUrl([], '  https://example.com  ')).toEqual(['https://example.com']);
  });

  it('should not mutate the original array', () => {
    const original = ['https://a.com'];
    addPendingUrl(original, 'https://b.com');
    expect(original).toEqual(['https://a.com']);
  });
});

describe('removePendingUrl', () => {
  it('should remove an existing URL', () => {
    const result = removePendingUrl(['https://a.com', 'https://b.com'], 'https://a.com');
    expect(result).toEqual(['https://b.com']);
  });

  it('should return the same list when URL is not found', () => {
    const urls = ['https://a.com'];
    const result = removePendingUrl(urls, 'https://nothere.com');
    expect(result).toEqual(['https://a.com']);
  });

  it('should return an empty list when removing the only URL', () => {
    expect(removePendingUrl(['https://a.com'], 'https://a.com')).toEqual([]);
  });

  it('should not mutate the original array', () => {
    const original = ['https://a.com', 'https://b.com'];
    removePendingUrl(original, 'https://a.com');
    expect(original).toEqual(['https://a.com', 'https://b.com']);
  });
});
