// Renders the two docs cards in the landing's OG style so docs.bamdude.top
// shares the identity without pulling cairo into its build.
//   npm run og:docs -- ../docs.bamdude.top/docs/assets
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { generateOpenGraphImage } from 'astro-og-canvas';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const outDir = resolve(process.argv[2] ?? './dist/og-docs');
mkdirSync(outDir, { recursive: true });

// style.ts is TypeScript; the same values are inlined here on purpose so the
// script runs with bare `node`. Keep the two in step. Paths are resolved
// against the repo root (not process.cwd()) so this script works when
// invoked from another directory.
const style = {
  bgGradient: [[11, 13, 10]],
  border: { color: [88, 170, 77], width: 8, side: 'inline-start' },
  padding: 80,
  logo: { path: resolve(ROOT, 'public/brand/png/mark-on-dark-256.png'), size: [96] },
  fonts: [resolve(ROOT, 'public/fonts/inter-400.ttf'), resolve(ROOT, 'public/fonts/inter-800.ttf')],
  font: {
    title: { families: ['Inter ExtraBold'], weight: 'Normal', color: [244, 246, 240] },
    description: { families: ['Inter'], weight: 'Normal', color: [138, 145, 121] },
  },
};

const cards = {
  en: { title: 'BamDude Documentation', description: 'docs.bamdude.top · self-hosted · AGPL-3.0' },
  uk: { title: 'Документація BamDude', description: 'docs.bamdude.top · self-hosted · AGPL-3.0' },
};

for (const [lang, copy] of Object.entries(cards)) {
  const png = await generateOpenGraphImage({ ...copy, ...style });
  writeFileSync(resolve(outDir, `og-${lang}.png`), png);
  console.log(`og-${lang}.png`);
}
