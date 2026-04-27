import { OGImageRoute } from 'astro-og-canvas';
import { t, locales } from '../../i18n';

// The OG image and the og:title / og:description meta-tags are shown
// side-by-side in social previews (Telegram, Twitter, etc.). If the
// image text mirrors the meta-tags the card looks like the same line
// printed twice. So image carries the brand slogan; meta-tags
// (BaseLayout ← pages.home.*) carry the SEO/feature description.
const pages = Object.fromEntries(locales.map((l) => [l, {
  title: t(l).hero.title,
  description: 'bamdude.top · self-hosted · AGPL-3.0',
}]));

// We need Latin + Cyrillic in one face at each weight. fontsource ships
// per-subset .ttfs and CanvasKit's FontMgr can't fall back across typefaces
// inside a single family — it picks one and renders ".notdef" for any glyph
// it doesn't have. So we ship pre-merged TTFs (Latin + Cyrillic glyphs in
// one file per weight) under public/fonts/, generated once via:
//   pip install fonttools
//   python -c "from fontTools.merge import Merger; \
//     Merger().merge(['lat-400.ttf','cyr-400.ttf']).save('inter-400.ttf')"
// Source files are fontsource's `cdn.jsdelivr.net/fontsource/fonts/inter@latest/{latin,cyrillic}-{400,800}-normal.ttf`.
const FONTS = [
  './public/fonts/inter-400.ttf',
  './public/fonts/inter-800.ttf',
];

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'locale',
  getSlug: (path) => path,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[10, 10, 10], [0, 90, 30]],
    border: { color: [0, 174, 66], width: 8, side: 'inline-start' },
    padding: 80,
    fonts: FONTS,
    // Fontsource encodes weight in the family name for non-400 weights
    // (the 800 .ttf reports family "Inter ExtraBold", not "Inter"), so the
    // title family is "Inter ExtraBold" and the weight axis stays Normal
    // — that typeface is already extra-bold visually.
    font: {
      title: { families: ['Inter ExtraBold'], weight: 'Normal', color: [255, 255, 255] },
      description: { families: ['Inter'], weight: 'Normal', color: [200, 200, 200] },
    },
  }),
});
