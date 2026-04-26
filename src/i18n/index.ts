import en from './en.json';
import uk from './uk.json';

export type Locale = 'en' | 'uk';
export type Strings = typeof en;

const dict: Record<Locale, Strings> = { en, uk: uk as Strings };

export function t(locale: Locale): Strings {
  return dict[locale] ?? dict.en;
}

export const locales: Locale[] = ['en', 'uk'];
export const defaultLocale: Locale = 'en';

export function localePath(locale: Locale, path: string = ''): string {
  const cleaned = path.startsWith('/') ? path.slice(1) : path;
  return locale === defaultLocale ? `/${cleaned}` : `/${locale}/${cleaned}`;
}

export function altLocale(locale: Locale): Locale {
  return locale === 'en' ? 'uk' : 'en';
}
