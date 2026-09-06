// We need Latin + Cyrillic in one face at each weight. fontsource ships
// per-subset .ttfs and CanvasKit's FontMgr can't fall back across typefaces
// inside a single family — it picks one and renders ".notdef" for any glyph
// it doesn't have. So we ship pre-merged TTFs (Latin + Cyrillic glyphs in
// one file per weight) under public/fonts/, generated once via:
//   pip install fonttools
//   python -c "from fontTools.merge import Merger; \
//     Merger().merge(['lat-400.ttf','cyr-400.ttf']).save('inter-400.ttf')"
// Source files are fontsource's `cdn.jsdelivr.net/fontsource/fonts/inter@latest/{latin,cyrillic}-{400,800}-normal.ttf`.

// The pack's card construction (public/brand/README.md): ink background, one
// accent bar, mark top-left, mono tagline. Cyrillic pages need a face that
// has Cyrillic, so the wordmark face (Space Grotesk) is NOT used for titles —
// the pre-merged Inter files under public/fonts/ carry both scripts.
//
// `OGImageOptions` is exported from the package root (astro-og-canvas's
// dist/index.d.ts), so the return type is declared here rather than left
// inferred — the three call sites spread this object into `title`/
// `description`, and without the annotation a misspelled key would compile
// clean.
import type { OGImageOptions } from 'astro-og-canvas';

const INK_BG: [number, number, number] = [11, 13, 10]; // #0B0D0A
const ACCENT: [number, number, number] = [88, 170, 77]; // #58AA4D
const INK: [number, number, number] = [244, 246, 240]; // #F4F6F0
const MUTED: [number, number, number] = [138, 145, 121]; // #8A9179

export const OG_FONTS = ['./public/fonts/inter-400.ttf', './public/fonts/inter-800.ttf'];

export function ogStyle(): Omit<OGImageOptions, 'title' | 'description'> {
  return {
    bgGradient: [INK_BG],
    border: { color: ACCENT, width: 8, side: 'inline-start' },
    padding: 80,
    logo: { path: './public/brand/png/mark-on-dark-256.png', size: [96] },
    fonts: OG_FONTS,
    font: {
      title: { families: ['Inter ExtraBold'], weight: 'Normal', color: INK },
      description: { families: ['Inter'], weight: 'Normal', color: MUTED },
    },
  };
}
