import en from '../content/homepage/en.json';
import zh from '../content/homepage/zh.json';

const messages = { en, zh } as const;

export type Locale = 'en' | 'zh';

export function t(lang: Locale, key: string): string {
  // Try exact key match first (for flat keys like "slides.title")
  const exact = (messages[lang] as Record<string, unknown>)[key];
  if (typeof exact === 'string') return exact;

  const keys = key.split('.');
  let value: unknown = messages[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      let fallback: unknown = messages.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          // Loud fallback: warn in dev so missing keys surface instead of
          // leaking the key string as user-visible text. The caller still
          // gets the key as a last resort (prevents empty-string bugs in
          // production rendering).
          if (typeof console !== 'undefined') {
            console.warn(`[i18n] missing key "${key}" for locale "${lang}" — falling back to key string`);
          }
          return key;
        }
      }
      if (typeof fallback === 'string') {
        if (typeof console !== 'undefined' && lang !== 'en') {
          console.warn(`[i18n] missing key "${key}" for locale "${lang}" — fell back to English`);
        }
        return fallback;
      }
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}
