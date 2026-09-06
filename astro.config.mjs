// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// --- sitemap <lastmod> -----------------------------------------------------
// Google uses exactly one field of a sitemap entry: <lastmod> (<priority>
// and <changefreq> are documented as ignored). It also checks the value
// against what it sees on recrawl, and drops trust in a site whose lastmod
// is "always now". Ours was the build timestamp — twelve identical stamps
// per deploy — so it is derived from git instead: the last commit touching
// anything that shapes the page.
//
// "Shapes the page" = the page file, every .astro and content .json it
// imports (transitively — Nav, Footer, the layout, the content components
// and their `src/content/<locale>/*.json`), and the dictionary of its
// locale. Components import BOTH locales' content and pick at render time,
// so the other locale's files are dropped again per page. Islands (.tsx)
// and styles are left out: they carry no copy. A dictionary edit bumps
// every page of that locale; there is no key-level tracking, and a false
// "unchanged" would be the worse lie.
//
// A shallow checkout has one commit, so every file would report HEAD's
// date. Then no lastmod is written at all — omitted beats wrong, and the
// workflows check out with fetch-depth 0 precisely so this branch is not
// taken there.
const IMPORT_RE = /from\s+['"]([^'"]+\.(?:astro|json))['"]/g;

function collectSources(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const dir = dirname(file);
  for (const m of readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
    collectSources(resolve(dir, m[1]), seen);
  }
  return seen;
}

function gitIsShallow() {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true';
  } catch {
    return true; // no git at all — treat as "cannot know"
  }
}

function lastCommitIso(files) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

const canDateSources = !gitIsShallow();

// `/uk/features/` → src/pages/uk/features.astro + src/i18n/uk.json + imports.
function pageLastmod(pathname) {
  if (!canDateSources) return undefined;
  const bare = pathname.replace(/^\/+|\/+$/g, '');
  // `/why/` → why.astro; `/` and `/uk/` → index.astro of that folder.
  const page = [`${bare || 'index'}.astro`, `${bare}/index.astro`]
    .map((f) => resolve('src/pages', f))
    .find((f) => existsSync(f));
  if (!page) return undefined;
  const locale = bare === 'uk' || bare.startsWith('uk/') ? 'uk' : 'en';
  const other = locale === 'uk' ? 'en' : 'uk';
  const otherContent = resolve('src/content', other);
  const files = [...collectSources(page)].filter((f) => !f.startsWith(otherContent));
  files.push(resolve('src/i18n', `${locale}.json`));
  return lastCommitIso(files);
}

export default defineConfig({
  site: 'https://bamdude.top',
  // 'ignore' so the dev server accepts both /uk and /uk/. nginx in prod serves
  // /uk/index.html for either form already; canonical <link> in BaseLayout
  // pins SEO to one preferred shape regardless.
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uk'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', uk: 'uk' },
      },
      // Skip dynamic OG image routes — those are media, not pages, and they
      // were leaking into the sitemap as <url> entries.
      filter: (page) => !page.includes('/og/'),
      // lastmod comes from git (see pageLastmod above). priority + changefreq
      // are kept for engines that still read them; Google ignores both.
      serialize(item) {
        // Strip the protocol+host prefix to get the pathname. Avoids the
        // `URL` global which isn't whitelisted in our flat ESLint config
        // for .mjs files — same effect, one less rule to argue with.
        const pathname = item.url.replace(/^https?:\/\/[^/]+/, '');
        const lastmod = pageLastmod(pathname);
        if (lastmod) item.lastmod = lastmod;
        else delete item.lastmod;
        const path = pathname.replace(/\/uk(\/|$)/, '/').replace(/\/$/, '');
        // Map normalized path to a crawl signal.
        if (path === '' || path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (path === '/why' || path === '/features') {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (path === '/install' || path === '/compare') {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (path === '/faq') {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
