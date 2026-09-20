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

// Always the canonical shape — trailing slash, the one BaseLayout's
// <link rel="canonical"> and the sitemap advertise. `build.format:
// 'directory'` makes `/why` a 301 to `/why/` on nginx, so a slash-less
// internal link hands Google a redirect for every hop; Search Console
// showed the whole site sitting in "discovered, not crawled" behind that.
export function localePath(locale: Locale, path: string = ''): string {
  const cleaned = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const base = locale === defaultLocale ? '/' : `/${locale}/`;
  return cleaned ? `${base}${cleaned}/` : base;
}

export function altLocale(locale: Locale): Locale {
  return locale === 'en' ? 'uk' : 'en';
}
