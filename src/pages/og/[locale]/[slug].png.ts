// Per-(locale, slug) Open Graph image route. Generates one card per page so
// that social shares of /why, /features, /install, /faq, /compare carry a
// page-specific preview instead of the home-page card.
//
// The legacy /og/[locale].png route still exists for backward compatibility
// with shares that already cached the older URL.

import type { APIRoute } from 'astro';
import { generateOpenGraphImage } from 'astro-og-canvas';
import { t, locales, type Locale } from '../../../i18n';

// Slugs map 1:1 to BaseLayout's `pageKey` prop. A new pageKey value without
// a card here renders 404 for the OG image (most clients tolerate it). A new
// slug here without a matching pageKey wastes build time but breaks nothing.
const slugs = ['home', 'why', 'features', 'install', 'faq', 'compare'] as const;
type Slug = (typeof slugs)[number];

// Per-(locale, slug) headline + subline shown on the social card. The page's
// <meta og:title>/<meta og:description> are configured separately in
// BaseLayout — keep these intentionally distinct so the card and the text
// shown beside it complement instead of duplicating.
function cardCopy(locale: Locale, slug: Slug): { title: string; description: string } {
  const i = t(locale);
  switch (slug) {
    case 'home':     return { title: i.hero.title, description: 'bamdude.top · self-hosted · AGPL-3.0' };
    case 'why':      return { title: i.pages.why.title, description: i.pages.why.subtitle };
    case 'features': return { title: i.pages.features.title, description: i.pages.features.subtitle };
    case 'install':  return { title: i.pages.install.title, description: i.pages.install.subtitle };
    case 'faq':      return { title: i.pages.faq.title, description: i.pages.faq.subtitle };
    case 'compare':  return { title: i.pages.compare.title, description: i.pages.compare.subtitle };
  }
}

// Pre-merged Latin + Cyrillic TTFs so a single typeface covers both scripts
// — see /og/[locale].png.ts header comment for the merging recipe.
const FONTS = ['./public/fonts/inter-400.ttf', './public/fonts/inter-800.ttf'];

export function getStaticPaths() {
  const paths: { params: { locale: string; slug: string } }[] = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      paths.push({ params: { locale, slug } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const locale = params.locale as Locale;
  const slug = params.slug as Slug;
  const copy = cardCopy(locale, slug);
  const body = await generateOpenGraphImage({
    title: copy.title,
    description: copy.description,
    bgGradient: [[10, 10, 10], [0, 90, 30]],
    border: { color: [0, 174, 66], width: 8, side: 'inline-start' },
    padding: 80,
    fonts: FONTS,
    font: {
      title: { families: ['Inter ExtraBold'], weight: 'Normal', color: [255, 255, 255] },
      description: { families: ['Inter'], weight: 'Normal', color: [200, 200, 200] },
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'image/png' } });
};
