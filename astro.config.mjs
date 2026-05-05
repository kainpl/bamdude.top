// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
      // Per-page priority + changefreq guides crawl budget. lastmod is set
      // to the build timestamp so a fresh build signals "this content was
      // touched today" — Google compares against its own last-crawl.
      serialize(item) {
        const buildTime = new Date().toISOString();
        item.lastmod = buildTime;
        const path = new URL(item.url).pathname.replace(/\/uk(\/|$)/, '/').replace(/\/$/, '');
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
