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
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
