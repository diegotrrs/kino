import { English, Spanish, TranslationKey, getTranslatedText } from './index';

describe('getTranslatedText', () => {
  it('returns the translated text for a given key and language', () => {
    const translatedText = getTranslatedText(TranslationKey.Calendar_Days_Monday, Spanish);
    expect(translatedText).toBe('Lunes');
  });

  it('returns the default language translation if language is not provided', () => {
    const translatedText = getTranslatedText(TranslationKey.Calendar_Days_Monday);
    expect(translatedText).toBe('Monday');
  });
});
