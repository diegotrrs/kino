import { defaultLocale, locales, type Locale } from '@/i18n/routing';

/**
 * Parse an Accept-Language header and return the best matching supported locale.
 * Falls back to the default locale if no match is found.
 *
 * --- Accept-Language format ---
 * Each entry is a language tag with an optional quality weight (q), ranging from
 * 0 (not acceptable) to 1 (most preferred). A missing q defaults to 1.0.
 * The browser generates these weights automatically from the user's language
 * preference list (OS or browser settings) — assigning 1.0 to the first choice,
 * 0.9 to the second, 0.8 to the third, and so on.
 *
 * Example A — phone set to Spanish (Spain) as primary, English as fallback:
 *   "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7"
 *   → "es"  (es-ES is q=1.0, matches supported locale "es")
 *
 * Example B — browser set to Portuguese (Brazil) as primary, German as fallback:
 *   "pt-BR,pt;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6"
 *   → "pt"  (pt-BR is q=1.0, matches supported locale "pt")
 */
export const detectLocale = (acceptLanguage: string): Locale => {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  // Parse "lang;q=weight" pairs, sorted by weight descending
  const candidates = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.trim().toLowerCase(), weight: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.weight - a.weight);

  for (const { lang } of candidates) {
    // Exact match (e.g. "en")
    const exact = locales.find((l) => l === lang);
    if (exact) {
      return exact;
    }
    // Prefix match (e.g. "es-ES" → "es")
    const prefix = locales.find((l) => lang.startsWith(`${l}-`) || lang.startsWith(l));
    if (prefix) {
      return prefix;
    }
  }

  return defaultLocale;
};
