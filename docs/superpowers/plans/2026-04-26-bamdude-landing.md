# BamDude Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, bilingual (EN/UK) marketing landing for BamDude at `bamdude.top` with system-first theming, GA4 + Consent Mode v2, full Open Graph / sitemap / robots.txt, and self-host deployment behind Cloudflare.

**Architecture:** Astro 5.x SSG with React islands. Static output to `dist/`, deployed via rsync to a system nginx on the user's server. Cloudflare in front as proxied DNS + CDN. Tailwind v4 for styling (matches the main BamDude app). i18n via Astro's built-in routing, default locale (en) at `/`, secondary (uk) at `/uk/`. Interactive bits — theme toggle, lang toggle, screenshot tabs, FAQ accordion, cookie banner — are isolated React islands.

**Tech Stack:** Astro 5, React 18, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `@astrojs/sitemap`, `@astrojs/react`, `astro-og-canvas`, Vitest + `@testing-library/react` + jsdom for island tests, ESLint, Prettier.

**Spec:** `docs/superpowers/specs/2026-04-26-bamdude-landing-design.md` (commit `7af59a0`)

---

## Conventions

- Working directory throughout: `D:/Development/bamdude.top` (Windows, bash shell). All commands assume `pwd` = project root unless otherwise noted.
- Every task ends with a commit. Commit messages use conventional prefix: `feat:`, `chore:`, `test:`, `style:`, `docs:`, `fix:`.
- TDD for islands (logic-bearing components). Static `.astro` components are validated by `astro check` + manual visual review + Lighthouse — no unit tests for them.
- Branch: `dev` (current). User merges to `main` themselves when done.

---

## Phase 0 — Project setup

### Task 1: Scaffold Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, `.prettierrc`, `.eslintrc.cjs`, `.editorconfig`
- Create: `src/pages/index.astro` (placeholder)

- [ ] **Step 1: Init pnpm and Astro**

```bash
npm init -y
npm pkg set name="bamdude-landing" type="module" private=true
npm install --save-exact astro@^5
npm install --save-exact @astrojs/react@^4 react@^18 react-dom@^18 @types/react@^18 @types/react-dom@^18
npm install --save-exact @astrojs/sitemap@^3
npm install --save-exact @tailwindcss/vite@^4 tailwindcss@^4
npm install --save-exact lucide-react@^0.460.0
npm install --save-exact astro-og-canvas@^0.7.0 canvaskit-wasm@^0.39.1
npm install --save-dev --save-exact typescript@^5 @types/node@^22 prettier@^3 prettier-plugin-astro@^0.14
npm install --save-dev --save-exact eslint@^9 @typescript-eslint/parser@^8 @typescript-eslint/eslint-plugin@^8 eslint-plugin-astro@^1
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://bamdude.top',
  trailingSlash: 'never',
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
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 4: Write `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_ID: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_GITHUB_REPO: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
```

- [ ] **Step 5: Write `.prettierrc`, `.eslintrc.cjs`, `.editorconfig`**

`.prettierrc`:
```json
{ "singleQuote": true, "semi": true, "printWidth": 100, "plugins": ["prettier-plugin-astro"], "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }] }
```

`.eslintrc.cjs`:
```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:astro/recommended'],
  overrides: [{ files: ['*.astro'], parser: 'astro-eslint-parser', parserOptions: { parser: '@typescript-eslint/parser', extraFileExtensions: ['.astro'] } }],
  ignorePatterns: ['dist', 'node_modules', '.astro'],
};
```

`.editorconfig`:
```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 6: Write minimal placeholder `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en"><head><title>BamDude</title></head><body><h1>BamDude</h1></body></html>
```

- [ ] **Step 7: Add npm scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "lint": "eslint . --ext .ts,.tsx,.astro,.js,.cjs,.mjs",
    "format": "prettier --write ."
  }
}
```

- [ ] **Step 8: Verify it builds**

```bash
npm run typecheck
npm run build
```

Expected: build succeeds, `dist/index.html` exists with the placeholder body.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/env.d.ts src/pages/index.astro .prettierrc .eslintrc.cjs .editorconfig
echo "node_modules/\ndist/\n.astro/\n.env\n.env.local" >> .gitignore
git add .gitignore
git commit -m "feat: scaffold Astro project with React, Tailwind v4, sitemap"
```

---

### Task 2: Configure Tailwind v4 with bambu theme tokens

**Files:**
- Create: `src/styles/globals.css`
- Modify: `src/pages/index.astro` to import the stylesheet

- [ ] **Step 1: Write `src/styles/globals.css`**

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-bambu-green: #00ae42;
  --color-bambu-green-light: #00c64d;
  --color-bambu-green-dark: #009438;

  --color-bambu-bg: var(--bg-primary);
  --color-bambu-bg-secondary: var(--bg-secondary);
  --color-bambu-bg-tertiary: var(--bg-tertiary);
  --color-bambu-text: var(--text-primary);
  --color-bambu-text-secondary: var(--text-secondary);
  --color-bambu-text-muted: var(--text-muted);
  --color-bambu-border: var(--border-color);

  --font-sans: 'Inter', system-ui, sans-serif;
}

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --text-primary: #0a0a0a;
  --text-secondary: #4a4a4a;
  --text-muted: #6b6b6b;
  --border-color: #d4d4d4;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dark {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1f1f1f;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #808080;
  --border-color: #2a2a2a;
}

html { background: var(--bg-primary); color: var(--text-primary); }
body { margin: 0; min-height: 100vh; }

/* Smooth anchor scroll without javascript */
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

- [ ] **Step 2: Update `src/pages/index.astro` to import globals**

```astro
---
import '../styles/globals.css';
---
<!doctype html>
<html lang="en"><head><title>BamDude</title></head><body><h1 class="text-4xl font-extrabold text-bambu-green">BamDude</h1></body></html>
```

- [ ] **Step 3: Verify build and visual**

```bash
npm run build
npm run preview
```

Expected: open `http://localhost:4321/`, see "BamDude" in bambu green, Inter font.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css src/pages/index.astro
git commit -m "style: add Tailwind v4 config with bambu green theme tokens"
```

---

### Task 3: Add brand assets

**Files:**
- Create: `public/favicon.ico`, `public/apple-touch-icon.png`, `public/android-chrome-192x192.png`, `public/android-chrome-512x512.png`
- Create: `public/images/logo-dark.png`, `public/images/logo-light.png`, `public/images/logo-dark-transparent.png`, `public/images/screenshot-desktop.png`, `public/images/screenshot-mobile.png`

- [ ] **Step 1: Copy assets from main bamdude repo**

```bash
mkdir -p public/images
cp /d/Development/bamdude/static/img/favicon.png public/favicon.ico
cp /d/Development/bamdude/static/img/apple-touch-icon.png public/apple-touch-icon.png
cp /d/Development/bamdude/static/img/android-chrome-192x192.png public/android-chrome-192x192.png
cp /d/Development/bamdude/static/img/android-chrome-512x512.png public/android-chrome-512x512.png
cp /d/Development/bamdude/static/img/bamdude_logo_dark.png public/images/logo-dark.png
cp /d/Development/bamdude/static/img/bamdude_logo_light.png public/images/logo-light.png
cp /d/Development/bamdude/static/img/bamdude_logo_dark_transparent.png public/images/logo-dark-transparent.png
cp /d/Development/bamdude/static/img/screenshot-desktop.png public/images/screenshot-desktop.png
cp /d/Development/bamdude/static/img/screenshot-mobile.png public/images/screenshot-mobile.png
```

- [ ] **Step 2: Verify the files exist and have non-zero size**

```bash
ls -la public/ public/images/
```

Expected: each file > 0 bytes.

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "chore: import brand assets from bamdude main repo"
```

---

### Task 4: Test runner setup (Vitest + RTL + jsdom)

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (add test scripts and deps)

- [ ] **Step 1: Install test deps**

```bash
npm install --save-dev --save-exact vitest@^2 @vitest/coverage-v8@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': '/src' } },
});
```

(`@vitejs/plugin-react` is needed for the test transform; install: `npm install --save-dev --save-exact @vitejs/plugin-react@^4`)

- [ ] **Step 3: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
});
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

- [ ] **Step 5: Smoke test — write `src/test/smoke.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('smoke', () => {
  it('renders react components', () => {
    render(<div>hello</div>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run smoke test**

```bash
npm run test
```

Expected: 1 test passed.

- [ ] **Step 7: Delete the smoke test (it has served its purpose)**

```bash
rm src/test/smoke.test.tsx
```

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "test: configure Vitest with RTL and jsdom for island tests"
```

---

## Phase 1 — Layout, i18n, base structure

### Task 5: i18n labels module

**Files:**
- Create: `src/i18n/en.json`, `src/i18n/uk.json`, `src/i18n/index.ts`

- [ ] **Step 1: Write `src/i18n/en.json`**

```json
{
  "nav": {
    "features": "Features",
    "screenshots": "Screenshots",
    "how": "How it works",
    "faq": "FAQ",
    "docs": "Docs",
    "github": "GitHub"
  },
  "hero": {
    "title": "One printer or a hundred. Your data. Your rules.",
    "subtitle": "Self-hosted command center for Bambu Lab — friendly enough to start with one printer, powerful enough to run a print farm.",
    "ctaPrimary": "Quick start",
    "ctaSecondary": "Star on GitHub"
  },
  "trust": {
    "label": "Compatible with",
    "license": "MIT licensed",
    "stars": "GitHub stars"
  },
  "how": {
    "title": "Up and running in 5 minutes",
    "steps": [
      { "title": "Pull the Docker image", "body": "One container, SQLite by default, Postgres optional." },
      { "title": "Add your printers", "body": "Auto-discover via SSDP or paste in IP and access code." },
      { "title": "Print from web or Telegram", "body": "Queue, monitor, and react to events from anywhere." }
    ]
  },
  "why": { "title": "Built for print farms, not a single printer" },
  "faq": { "title": "Questions you probably have" },
  "cta": {
    "title": "Get started in 5 minutes",
    "subtitle": "Free, open source, MIT licensed. No cloud lock-in. Ever."
  },
  "footer": {
    "product": "Product",
    "community": "Community",
    "legal": "Legal",
    "telegram": "Telegram: BamDude Friends Forum",
    "issues": "Report an issue",
    "license": "License",
    "privacy": "Privacy",
    "cookies": "Cookie settings",
    "rights": "All rights reserved.",
    "disclaimer": "Bambu Lab is a trademark of Bambu Lab Co., Ltd. BamDude is an independent project, not affiliated with Bambu Lab."
  },
  "theme": { "system": "System", "light": "Light", "dark": "Dark", "label": "Theme" },
  "lang": { "label": "Language", "en": "English", "uk": "Українська" },
  "cookie": {
    "title": "We use a cookie for analytics",
    "body": "Google Analytics 4 helps us understand which features get used. Loaded only after you accept.",
    "accept": "Accept",
    "reject": "Reject",
    "customize": "Customize",
    "analyticsLabel": "Analytics (Google Analytics 4)",
    "save": "Save preferences"
  }
}
```

- [ ] **Step 2: Write `src/i18n/uk.json`** (mirror, Ukrainian copy)

```json
{
  "nav": { "features": "Можливості", "screenshots": "Скриншоти", "how": "Як це працює", "faq": "FAQ", "docs": "Документація", "github": "GitHub" },
  "hero": {
    "title": "Один принтер або сотня. Твої дані. Твої правила.",
    "subtitle": "Self-hosted командний центр для Bambu Lab — простий для одного принтера, потужний для цілої принт-ферми.",
    "ctaPrimary": "Швидкий старт",
    "ctaSecondary": "Зірка на GitHub"
  },
  "trust": { "label": "Підтримує", "license": "MIT-ліцензія", "stars": "Зірок на GitHub" },
  "how": {
    "title": "Запуск за 5 хвилин",
    "steps": [
      { "title": "Підняти Docker-образ", "body": "Один контейнер, SQLite за замовчанням, Postgres опціонально." },
      { "title": "Додати принтери", "body": "Автопошук через SSDP або вручну: IP + access code." },
      { "title": "Друкуй з вебу або Telegram", "body": "Черга, моніторинг, реакції на події — звідусіль." }
    ]
  },
  "why": { "title": "Зроблено для принт-ферм, а не одного принтера" },
  "faq": { "title": "Питання, які зазвичай виникають" },
  "cta": { "title": "Запусти за 5 хвилин", "subtitle": "Безкоштовно, open source, MIT. Ніякого cloud-lock-in. Ніколи." },
  "footer": {
    "product": "Продукт", "community": "Спільнота", "legal": "Юридичне",
    "telegram": "Telegram: BamDude Friends Forum",
    "issues": "Повідомити про баг", "license": "Ліцензія", "privacy": "Приватність", "cookies": "Налаштування cookies",
    "rights": "Всі права захищено.",
    "disclaimer": "Bambu Lab — торгова марка Bambu Lab Co., Ltd. BamDude — незалежний проект, не пов'язаний з Bambu Lab."
  },
  "theme": { "system": "Системна", "light": "Світла", "dark": "Темна", "label": "Тема" },
  "lang": { "label": "Мова", "en": "English", "uk": "Українська" },
  "cookie": {
    "title": "Ми використовуємо cookie для аналітики",
    "body": "Google Analytics 4 допомагає зрозуміти, які фічі використовуються. Вантажиться тільки після твоєї згоди.",
    "accept": "Прийняти", "reject": "Відхилити", "customize": "Налаштувати",
    "analyticsLabel": "Аналітика (Google Analytics 4)", "save": "Зберегти"
  }
}
```

- [ ] **Step 3: Write `src/i18n/index.ts` (type-safe loader)**

```ts
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
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n labels for EN and UK with type-safe loader"
```

---

### Task 6: BaseLayout with no-flash theme + lang scripts

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/globals.css';
import type { Locale } from '../i18n';
import { altLocale, defaultLocale } from '../i18n';

interface Props {
  title: string;
  description: string;
  locale: Locale;
  ogImage?: string;
}

const { title, description, locale, ogImage = '/og/home-en.png' } = Astro.props;
const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://bamdude.top';
const path = Astro.url.pathname;
const canonical = `${siteUrl}${path}`;
const alt = altLocale(locale);
const altPath = locale === defaultLocale ? `/${alt}${path === '/' ? '/' : path}` : path.replace(`/${locale}`, alt === defaultLocale ? '' : `/${alt}`);
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang={locale} href={canonical} />
    <link rel="alternate" hreflang={alt} href={`${siteUrl}${altPath}`} />
    <link rel="alternate" hreflang="x-default" href={`${siteUrl}/`} />

    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={`${siteUrl}${ogImage}`} />
    <meta property="og:locale" content={locale === 'en' ? 'en_US' : 'uk_UA'} />
    <meta property="og:locale:alternate" content={alt === 'en' ? 'en_US' : 'uk_UA'} />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Consent Mode v2 default-deny stub. Loaded BEFORE any analytics. -->
    <script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        wait_for_update: 500
      });
    </script>

    <!-- No-flash theme. Reads localStorage → prefers-color-scheme → dark fallback. -->
    <script is:inline>
      (function () {
        try {
          var stored = localStorage.getItem('theme'); // 'system' | 'light' | 'dark' | null
          var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          var resolved = (!stored || stored === 'system') ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) : stored;
          if (resolved === 'dark') document.documentElement.classList.add('dark');
        } catch (e) {
          document.documentElement.classList.add('dark'); // dark fallback on errors
        }
      })();
    </script>

    <!-- First-visit lang redirect (only on /, only if no preference stored) -->
    <script is:inline define:vars={{ currentLocale: locale }}>
      (function () {
        if (currentLocale !== 'en') return;
        if (window.location.pathname !== '/') return;
        try {
          if (localStorage.getItem('lang')) return;
          var nav = (navigator.language || 'en').toLowerCase();
          if (nav.indexOf('uk') === 0) {
            localStorage.setItem('lang', 'uk');
            window.location.replace('/uk/');
          }
        } catch (e) { /* noop */ }
      })();
    </script>
  </head>
  <body class="font-sans bg-bambu-bg text-bambu-text antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Verify build still works**

```bash
npm run typecheck
npm run build
```

Expected: build passes; `dist/index.html` contains the inline scripts.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayout with no-flash theme, lang redirect, OG, hreflang"
```

---

### Task 7: EN homepage shell + section placeholders

**Files:**
- Create: `src/components/Section.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Section.astro`**

```astro
---
interface Props { id: string; ariaLabel: string; class?: string; }
const { id, ariaLabel, class: extra = '' } = Astro.props;
---
<section id={id} aria-label={ariaLabel} class={`relative py-20 sm:py-24 lg:py-28 ${extra}`}>
  <div class="mx-auto max-w-6xl px-6">
    <slot />
  </div>
</section>
```

- [ ] **Step 2: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Section from '../components/Section.astro';
import { t } from '../i18n';
const locale = 'en' as const;
const i = t(locale);
---
<BaseLayout title="BamDude — Self-hosted print management for Bambu Lab" description={i.hero.subtitle} locale={locale}>
  <Section id="hero" ariaLabel="Introduction">
    <h1 class="text-5xl font-extrabold tracking-tight">{i.hero.title}</h1>
  </Section>
  <Section id="trust" ariaLabel="Trust"><p>{i.trust.label}</p></Section>
  <Section id="features" ariaLabel="Features"><h2 class="text-3xl font-bold">Features</h2></Section>
  <Section id="screenshots" ariaLabel="Screenshots"><h2 class="text-3xl font-bold">Screenshots</h2></Section>
  <Section id="how" ariaLabel="How it works"><h2 class="text-3xl font-bold">{i.how.title}</h2></Section>
  <Section id="why" ariaLabel="Why fork from Bambuddy"><h2 class="text-3xl font-bold">{i.why.title}</h2></Section>
  <Section id="faq" ariaLabel="FAQ"><h2 class="text-3xl font-bold">{i.faq.title}</h2></Section>
  <Section id="cta" ariaLabel="Final call to action"><h2 class="text-3xl font-bold">{i.cta.title}</h2></Section>
</BaseLayout>
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
npm run build
npm run preview
```

Expected: page renders all section headings, dark mode auto-applies if system prefers dark.

- [ ] **Step 4: Commit**

```bash
git add src/components/Section.astro src/pages/index.astro
git commit -m "feat: homepage shell with section placeholders"
```

---

## Phase 2 — Static sections

### Task 8: Nav with anchor links and toggles slot

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/pages/index.astro` (use Nav)

- [ ] **Step 1: Write `src/components/Nav.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t, localePath, altLocale } from '../i18n';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const repo = import.meta.env.PUBLIC_GITHUB_REPO || 'https://github.com/kainpl/bamdude';
const docs = 'https://docs.bamdude.top';
---
<header class="sticky top-0 z-40 backdrop-blur bg-bambu-bg/80 border-b border-bambu-border">
  <nav class="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
    <a href={localePath(locale)} class="flex items-center gap-2 font-extrabold text-lg tracking-tight">
      <img src="/images/logo-dark-transparent.png" alt="BamDude" class="h-8 w-auto" width="32" height="32" />
      <span>BamDude</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm">
      <a href="#features" class="hover:text-bambu-green">{i.nav.features}</a>
      <a href="#screenshots" class="hover:text-bambu-green">{i.nav.screenshots}</a>
      <a href="#how" class="hover:text-bambu-green">{i.nav.how}</a>
      <a href="#faq" class="hover:text-bambu-green">{i.nav.faq}</a>
      <a href={docs} class="hover:text-bambu-green">{i.nav.docs}</a>
      <a href={repo} class="hover:text-bambu-green">{i.nav.github}</a>
    </div>
    <div class="flex items-center gap-2" data-toggles>
      <slot name="toggles" />
    </div>
  </nav>
</header>
```

- [ ] **Step 2: Add `<Nav>` to `src/pages/index.astro`** above the first `<Section>`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Section from '../components/Section.astro';
import Nav from '../components/Nav.astro';
import { t } from '../i18n';
const locale = 'en' as const;
const i = t(locale);
---
<BaseLayout title="BamDude — Self-hosted print management for Bambu Lab" description={i.hero.subtitle} locale={locale}>
  <Nav locale={locale} />
  <!-- rest unchanged -->
</BaseLayout>
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run build && npm run preview
```

Expected: header with logo, links, anchors scroll smoothly.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro src/pages/index.astro
git commit -m "feat: sticky nav with anchor links"
```

---

### Task 9: Hero section

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro` (use Hero)

- [ ] **Step 1: Write `src/components/Hero.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const repo = import.meta.env.PUBLIC_GITHUB_REPO || 'https://github.com/kainpl/bamdude';
const docs = 'https://docs.bamdude.top';
---
<section id="hero" aria-label="Introduction" class="relative overflow-hidden">
  <!-- Gradient background -->
  <div class="absolute inset-0 -z-10">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,66,0.45)_0%,rgba(0,58,22,0.4)_45%,transparent_75%)]"></div>
    <div class="absolute inset-0 bg-bambu-bg"></div>
  </div>
  <!-- Blurred product mockup -->
  <div class="absolute right-[-10%] top-1/4 hidden lg:block opacity-50 blur-2xl pointer-events-none">
    <img src="/images/screenshot-desktop.png" alt="" width="800" height="500" class="rounded-2xl" />
  </div>
  <div class="mx-auto max-w-6xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40 relative">
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.05]">
      {i.hero.title}
    </h1>
    <p class="mt-6 text-lg sm:text-xl text-bambu-text-secondary max-w-2xl leading-relaxed">
      {i.hero.subtitle}
    </p>
    <div class="mt-10 flex flex-wrap gap-3">
      <a href={`${docs}/getting-started/quick-start/`}
         class="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold bg-bambu-green text-white shadow-[0_0_32px_rgba(0,174,66,0.5)] hover:bg-bambu-green-light transition">
        {i.hero.ctaPrimary}
      </a>
      <a href={repo}
         class="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold border border-bambu-border bg-bambu-bg-secondary hover:border-bambu-green transition">
        ★ {i.hero.ctaSecondary}
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Replace placeholder in `src/pages/index.astro`**

```astro
import Hero from '../components/Hero.astro';
// ...
<Hero locale={locale} />
```

(remove the `<Section id="hero">` placeholder block)

- [ ] **Step 3: Verify visual**

```bash
npm run build && npm run preview
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat: hero section with gradient background and CTAs"
```

---

### Task 10: TrustStrip with build-time GitHub stars

**Files:**
- Create: `src/lib/github.ts`, `src/components/TrustStrip.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/lib/github.ts`**

```ts
export async function fetchStars(repo: string): Promise<number | null> {
  // Build-time only. Cached by Astro for the duration of the build.
  try {
    const url = `https://api.github.com/repos/${repo}`;
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Write `src/components/TrustStrip.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
import { fetchStars } from '../lib/github.ts';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const printers = ['A1', 'A1 mini', 'P1S', 'P1P', 'X1C', 'X1E'];
const stars = await fetchStars('kainpl/bamdude');
---
<section id="trust" aria-label="Compatibility and trust" class="border-y border-bambu-border bg-bambu-bg-secondary">
  <div class="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-6">
    <div class="flex items-center gap-4">
      <span class="text-xs uppercase tracking-widest text-bambu-text-muted">{i.trust.label}</span>
      <div class="flex flex-wrap gap-3">
        {printers.map((p) => (
          <span class="text-sm font-medium px-2.5 py-1 rounded-md border border-bambu-border bg-bambu-bg">{p}</span>
        ))}
      </div>
    </div>
    <div class="flex items-center gap-4 text-sm">
      {stars !== null && (
        <span class="inline-flex items-center gap-1.5">
          <span aria-hidden="true">★</span>
          <span class="font-semibold">{stars.toLocaleString(locale)}</span>
          <span class="text-bambu-text-muted">{i.trust.stars}</span>
        </span>
      )}
      <span class="px-2 py-0.5 text-xs font-semibold border border-bambu-green text-bambu-green rounded">
        {i.trust.license}
      </span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Use in page**

Replace `<Section id="trust">` with `<TrustStrip locale={locale} />` (and import).

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: log shows fetched stars (e.g., `★ 142`) baked into HTML. If GitHub is unreachable, stars hide gracefully.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/components/TrustStrip.astro src/pages/index.astro
git commit -m "feat: trust strip with supported printers and live GH stars"
```

---

### Task 11: Features grid with content collection

**Files:**
- Create: `src/content/config.ts`, `src/content/en/features.json`, `src/content/uk/features.json`, `src/components/Features.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const featureItem = z.object({
  icon: z.string(), // lucide icon name
  title: z.string(),
  body: z.string(),
});

const features = defineCollection({
  type: 'data',
  schema: z.object({ items: z.array(featureItem) }),
});

const faqItem = z.object({ q: z.string(), a: z.string() });
const faq = defineCollection({
  type: 'data',
  schema: z.object({ items: z.array(faqItem) }),
});

const whyForkItem = z.object({ category: z.string(), bambuddy: z.string(), bamdude: z.string() });
const whyFork = defineCollection({
  type: 'data',
  schema: z.object({ items: z.array(whyForkItem) }),
});

export const collections = { features, faq, whyFork };
```

- [ ] **Step 2: Write `src/content/en/features.json`**

```json
{
  "items": [
    { "icon": "archive", "title": "Print archive", "body": "Every 3MF, photo, and timelapse stored locally with full-text search and source-hash chain of custody." },
    { "icon": "send", "title": "Telegram bot", "body": "Control printers, manage queues, get actionable notifications — multi-chat with role-based permissions." },
    { "icon": "list-ordered", "title": "Multi-printer queue", "body": "Background dispatch picks the right idle printer based on filament, model, and AMS mapping." },
    { "icon": "video", "title": "Camera & streaming", "body": "Live snapshots, MJPEG/RTSP/USB camera support, OBS overlay built in." },
    { "icon": "wrench", "title": "Maintenance reminders", "body": "Per-printer counters with overdue alerts in UI and Telegram. Mark done from anywhere." },
    { "icon": "server", "title": "Self-hosted", "body": "Your data on your hardware. SQLite or Postgres. No cloud account required, ever." }
  ]
}
```

- [ ] **Step 3: Write `src/content/uk/features.json`**

```json
{
  "items": [
    { "icon": "archive", "title": "Архів друку", "body": "Кожен 3MF, фото і timelapse зберігаються локально, з повнотекстовим пошуком і source-hash chain of custody." },
    { "icon": "send", "title": "Telegram-бот", "body": "Керування принтерами, черга, інтерактивні нотифікації — мультичат із роле-базованими правами." },
    { "icon": "list-ordered", "title": "Черга багатьох принтерів", "body": "Фоновий диспатчер вибирає вільний принтер за пластиком, моделлю і AMS-мапінгом." },
    { "icon": "video", "title": "Камера і стрімінг", "body": "Live-знімки, підтримка MJPEG/RTSP/USB-камер, готовий OBS-overlay." },
    { "icon": "wrench", "title": "Нагадування про обслуговування", "body": "Лічильники на принтер з алертами в UI та Telegram. Зробив — позначив будь-де." },
    { "icon": "server", "title": "Self-hosted", "body": "Дані на твоєму залізі. SQLite або Postgres. Без хмарного акаунта. Назавжди." }
  ]
}
```

- [ ] **Step 4: Write `src/components/Features.astro`**

```astro
---
import type { Locale } from '../i18n';
import { getEntry } from 'astro:content';
import { Archive, Send, ListOrdered, Video, Wrench, Server } from 'lucide-react';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const entry = await getEntry('features', locale);
const items = entry?.data.items ?? [];

const iconMap: Record<string, any> = { archive: Archive, send: Send, 'list-ordered': ListOrdered, video: Video, wrench: Wrench, server: Server };
---
<section id="features" aria-label="Features" class="py-24">
  <div class="mx-auto max-w-6xl px-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <div class="rounded-2xl border border-bambu-border bg-bambu-bg-secondary p-6 hover:border-bambu-green transition">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-bambu-green/10 text-bambu-green mb-4">
              {Icon && <Icon size={22} strokeWidth={2} />}
            </div>
            <h3 class="font-bold text-xl tracking-tight">{item.title}</h3>
            <p class="mt-2 text-bambu-text-secondary leading-relaxed">{item.body}</p>
          </div>
        );
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Use in page** (replace placeholder), add import.

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run build && npm run preview
```

Expected: 6 feature cards render with correct lucide icons.

- [ ] **Step 7: Commit**

```bash
git add src/content/ src/components/Features.astro src/pages/index.astro
git commit -m "feat: features grid with typed content collection"
```

---

### Task 12: How-it-works section

**Files:**
- Create: `src/components/HowItWorks.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/HowItWorks.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
---
<section id="how" aria-label="How it works" class="py-24 bg-bambu-bg-secondary border-y border-bambu-border">
  <div class="mx-auto max-w-6xl px-6">
    <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-center max-w-3xl mx-auto">{i.how.title}</h2>
    <ol class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {i.how.steps.map((s, idx) => (
        <li class="rounded-2xl border border-bambu-border bg-bambu-bg p-6">
          <div class="text-bambu-green font-extrabold text-3xl">{String(idx + 1).padStart(2, '0')}</div>
          <h3 class="mt-2 font-bold text-lg">{s.title}</h3>
          <p class="mt-2 text-bambu-text-secondary leading-relaxed">{s.body}</p>
        </li>
      ))}
    </ol>
    <pre class="mt-10 rounded-2xl border border-bambu-border bg-black/80 text-green-300 p-6 overflow-x-auto text-sm font-mono"><code>$ docker compose up -d bamdude</code></pre>
  </div>
</section>
```

- [ ] **Step 2: Use in page** (replace placeholder), add import.

- [ ] **Step 3: Verify, commit**

```bash
npm run build && npm run preview
git add src/components/HowItWorks.astro src/pages/index.astro
git commit -m "feat: how-it-works section with three steps and docker snippet"
```

---

### Task 13: WhyFork section with content collection

**Files:**
- Create: `src/content/en/why-fork.json`, `src/content/uk/why-fork.json`, `src/components/WhyFork.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/content/en/why-fork.json`**

```json
{
  "items": [
    { "category": "Telegram bot",       "bambuddy": "—",                   "bamdude": "Full bot: control, queue, maintenance, calibration" },
    { "category": "Multi-chat auth",    "bambuddy": "Single chat",         "bamdude": "Per-chat roles with granular permissions" },
    { "category": "Languages",          "bambuddy": "EN",                  "bamdude": "EN + UK (extensible JSON i18n)" },
    { "category": "Print farm queue",   "bambuddy": "—",                   "bamdude": "Background dispatch with AMS mapping" },
    { "category": "Maintenance UI",     "bambuddy": "Manual tracking",     "bamdude": "Counters, overdue alerts, mark-done from bot" },
    { "category": "Notification editor","bambuddy": "Plain text",          "bamdude": "MarkdownV2 with formatting toolbar" },
    { "category": "Calibration UI",     "bambuddy": "—",                   "bamdude": "Bed level, vibration, motor noise, nozzle offset" },
    { "category": "License",            "bambuddy": "MIT",                 "bamdude": "MIT" }
  ]
}
```

- [ ] **Step 2: Write `src/content/uk/why-fork.json`**

```json
{
  "items": [
    { "category": "Telegram-бот",                 "bambuddy": "—",              "bamdude": "Повний бот: керування, черга, обслуговування, калібровка" },
    { "category": "Мультичат-авторизація",        "bambuddy": "Один чат",        "bamdude": "Ролі на чат з гранулярними правами" },
    { "category": "Мови",                          "bambuddy": "EN",             "bamdude": "EN + UK (розширювана JSON-локалізація)" },
    { "category": "Черга для принт-ферми",        "bambuddy": "—",              "bamdude": "Фоновий диспатчер з AMS-мапінгом" },
    { "category": "Обслуговування в UI",          "bambuddy": "Вручну",         "bamdude": "Лічильники, алерти, відмітити з бота" },
    { "category": "Редактор нотифікацій",         "bambuddy": "Простий текст",   "bamdude": "MarkdownV2 з тулбаром форматування" },
    { "category": "Калібровка в UI",              "bambuddy": "—",              "bamdude": "Стіл, вібрації, шум, nozzle offset" },
    { "category": "Ліцензія",                      "bambuddy": "MIT",            "bamdude": "MIT" }
  ]
}
```

- [ ] **Step 3: Write `src/components/WhyFork.astro`**

```astro
---
import type { Locale } from '../i18n';
import { getEntry } from 'astro:content';
import { t } from '../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const entry = await getEntry('whyFork', locale);
const items = entry?.data.items ?? [];
---
<section id="why" aria-label="Why fork from Bambuddy" class="py-24">
  <div class="mx-auto max-w-6xl px-6">
    <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">{i.why.title}</h2>
    <div class="mt-12 overflow-x-auto rounded-2xl border border-bambu-border">
      <table class="w-full text-sm">
        <thead class="bg-bambu-bg-secondary">
          <tr>
            <th class="text-left px-4 py-3 font-semibold"></th>
            <th class="text-left px-4 py-3 font-semibold">Bambuddy</th>
            <th class="text-left px-4 py-3 font-semibold text-bambu-green">BamDude</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr class="border-t border-bambu-border">
              <td class="px-4 py-3 font-medium">{row.category}</td>
              <td class="px-4 py-3 text-bambu-text-muted">{row.bambuddy}</td>
              <td class="px-4 py-3">{row.bamdude}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Use in page, verify, commit**

```bash
npm run build && npm run preview
git add src/content/en/why-fork.json src/content/uk/why-fork.json src/components/WhyFork.astro src/pages/index.astro
git commit -m "feat: why-fork comparison table"
```

---

### Task 14: Final CTA section

**Files:**
- Create: `src/components/FinalCTA.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/FinalCTA.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const repo = import.meta.env.PUBLIC_GITHUB_REPO || 'https://github.com/kainpl/bamdude';
const docs = 'https://docs.bamdude.top';
---
<section id="cta" aria-label="Final call to action" class="py-24 relative overflow-hidden">
  <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,174,66,0.35)_0%,transparent_70%)]"></div>
  <div class="mx-auto max-w-3xl px-6 text-center">
    <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">{i.cta.title}</h2>
    <p class="mt-6 text-lg text-bambu-text-secondary">{i.cta.subtitle}</p>
    <div class="mt-10 flex flex-wrap justify-center gap-3">
      <a href={`${docs}/getting-started/quick-start/`} class="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold bg-bambu-green text-white shadow-[0_0_32px_rgba(0,174,66,0.5)] hover:bg-bambu-green-light transition">{i.hero.ctaPrimary}</a>
      <a href={repo} class="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold border border-bambu-border hover:border-bambu-green transition">★ {i.hero.ctaSecondary}</a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Use in page, verify, commit**

```bash
npm run build && npm run preview
git add src/components/FinalCTA.astro src/pages/index.astro
git commit -m "feat: final CTA section with gradient"
```

---

### Task 15: Footer with three columns

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Footer.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const repo = import.meta.env.PUBLIC_GITHUB_REPO || 'https://github.com/kainpl/bamdude';
const docs = 'https://docs.bamdude.top';
const tg = 'https://t.me/+3KQl2uNtOwo3NTgy';
const year = new Date().getFullYear();
---
<footer class="border-t border-bambu-border bg-bambu-bg-secondary">
  <div class="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
    <div>
      <div class="flex items-center gap-2 font-extrabold tracking-tight">
        <img src="/images/logo-dark-transparent.png" alt="BamDude" class="h-7 w-auto" width="28" height="28" />
        <span>BamDude</span>
      </div>
      <p class="mt-3 text-bambu-text-muted leading-relaxed">{i.footer.disclaimer}</p>
    </div>
    <div>
      <h4 class="font-bold text-bambu-text">{i.footer.product}</h4>
      <ul class="mt-3 space-y-2">
        <li><a href="#features" class="hover:text-bambu-green">{i.nav.features}</a></li>
        <li><a href={docs} class="hover:text-bambu-green">{i.nav.docs}</a></li>
        <li><a href={`${repo}/blob/main/CHANGELOG.md`} class="hover:text-bambu-green">Changelog</a></li>
      </ul>
    </div>
    <div>
      <h4 class="font-bold text-bambu-text">{i.footer.community}</h4>
      <ul class="mt-3 space-y-2">
        <li><a href={tg} class="hover:text-bambu-green">{i.footer.telegram}</a></li>
        <li><a href={repo} class="hover:text-bambu-green">GitHub</a></li>
        <li><a href={`${repo}/issues`} class="hover:text-bambu-green">{i.footer.issues}</a></li>
      </ul>
    </div>
    <div>
      <h4 class="font-bold text-bambu-text">{i.footer.legal}</h4>
      <ul class="mt-3 space-y-2">
        <li><a href={`${repo}/blob/main/LICENSE`} class="hover:text-bambu-green">MIT {i.footer.license}</a></li>
        <li><button type="button" data-cookie-settings class="hover:text-bambu-green">{i.footer.cookies}</button></li>
      </ul>
    </div>
  </div>
  <div class="border-t border-bambu-border">
    <div class="mx-auto max-w-6xl px-6 py-6 text-xs text-bambu-text-muted flex justify-between flex-wrap gap-2">
      <span>© {year} BamDude. {i.footer.rights}</span>
      <span>Built with Astro · MIT</span>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Use in page, verify, commit**

```bash
npm run build && npm run preview
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: footer with 4 columns and cookie settings hook"
```

---

## Phase 3 — Interactive islands (TDD)

### Task 16: ThemeToggle island (TDD)

**Files:**
- Create: `src/components/islands/ThemeToggle.tsx`, `src/components/islands/ThemeToggle.test.tsx`
- Modify: `src/components/Nav.astro` (mount island in `toggles` slot)

- [ ] **Step 1: Write the failing test `src/components/islands/ThemeToggle.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  document.documentElement.className = '';
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('renders a button labelled by the current mode', () => {
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    expect(screen.getByRole('button', { name: /Theme/ })).toBeInTheDocument();
  });

  it('cycles system → light → dark → system on click', async () => {
    const u = userEvent.setup();
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    const btn = screen.getByRole('button', { name: /Theme/ });
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('light');
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('system');
  });

  it('reads existing localStorage value on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- ThemeToggle
```

Expected: cannot resolve `./ThemeToggle`.

- [ ] **Step 3: Implement `src/components/islands/ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';

type Mode = 'system' | 'light' | 'dark';
const ORDER: Mode[] = ['system', 'light', 'dark'];

interface Labels { system: string; light: string; dark: string; label: string; }

function resolve(mode: Mode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

function apply(mode: Mode) {
  const r = resolve(mode);
  document.documentElement.classList.toggle('dark', r === 'dark');
}

export function ThemeToggle({ labels }: { labels: Labels }) {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Mode | null) ?? 'system';
    setMode(stored);
    apply(stored);

    if (stored === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => apply('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, []);

  const next = () => {
    const idx = ORDER.indexOf(mode);
    const n = ORDER[(idx + 1) % ORDER.length];
    setMode(n);
    localStorage.setItem('theme', n);
    apply(n);
  };

  const Icon = mode === 'system' ? Monitor : mode === 'light' ? Sun : Moon;
  const labelText = mode === 'system' ? labels.system : mode === 'light' ? labels.light : labels.dark;

  return (
    <button type="button" onClick={next} aria-label={`${labels.label}: ${labelText}`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-bambu-border hover:border-bambu-green transition">
      <Icon size={18} />
    </button>
  );
}
```

- [ ] **Step 4: Run tests — expect 3 passing**

```bash
npm run test -- ThemeToggle
```

- [ ] **Step 5: Mount in Nav** — modify `src/components/Nav.astro`

In the frontmatter, add:
```ts
import { ThemeToggle } from './islands/ThemeToggle';
```

In the `toggles` slot area replace the bare `<slot name="toggles" />` with:

```astro
    <div class="flex items-center gap-2">
      <ThemeToggle client:load labels={i.theme} />
      <slot name="toggles" />
    </div>
```

(In TSX-island JSX inside Astro, the `class` attribute works; if linting complains use `className`.)

- [ ] **Step 6: Verify build + visual**

```bash
npm run typecheck && npm run build && npm run preview
```

Expected: button in nav, click cycles modes, theme persists across reload.

- [ ] **Step 7: Commit**

```bash
git add src/components/islands/ThemeToggle.tsx src/components/islands/ThemeToggle.test.tsx src/components/Nav.astro
git commit -m "feat(island): ThemeToggle with system/light/dark cycling"
```

---

### Task 17: LangToggle island (TDD)

**Files:**
- Create: `src/components/islands/LangToggle.tsx`, `src/components/islands/LangToggle.test.tsx`
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/islands/LangToggle.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangToggle } from './LangToggle';

const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  // @ts-expect-error mutable test setup
  delete window.location;
  // @ts-expect-error
  window.location = { ...originalLocation, pathname: '/', assign: vi.fn(), replace: vi.fn() };
});

describe('LangToggle', () => {
  it('renders the alternate locale code', () => {
    render(<LangToggle currentLocale="en" labelLang="Language" labelEn="English" labelUk="Українська" />);
    expect(screen.getByRole('button', { name: /Language/ })).toHaveTextContent(/UK/);
  });

  it('navigates to /uk/ from / on click and saves preference', async () => {
    const u = userEvent.setup();
    render(<LangToggle currentLocale="en" labelLang="Language" labelEn="English" labelUk="Українська" />);
    await u.click(screen.getByRole('button', { name: /Language/ }));
    expect(window.location.assign).toHaveBeenCalledWith('/uk/');
    expect(localStorage.getItem('lang')).toBe('uk');
  });

  it('navigates from /uk/ to / when current is uk', async () => {
    // @ts-expect-error
    window.location.pathname = '/uk/';
    const u = userEvent.setup();
    render(<LangToggle currentLocale="uk" labelLang="Language" labelEn="English" labelUk="Українська" />);
    await u.click(screen.getByRole('button', { name: /Language/ }));
    expect(window.location.assign).toHaveBeenCalledWith('/');
    expect(localStorage.getItem('lang')).toBe('en');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- LangToggle
```

- [ ] **Step 3: Implement**

```tsx
// src/components/islands/LangToggle.tsx
import { Languages } from 'lucide-react';

interface Props { currentLocale: 'en' | 'uk'; labelLang: string; labelEn: string; labelUk: string; }

export function LangToggle({ currentLocale, labelLang }: Props) {
  const target = currentLocale === 'en' ? 'uk' : 'en';
  const targetPath = target === 'en'
    ? window?.location?.pathname?.replace(/^\/uk\/?/, '/') || '/'
    : window?.location?.pathname?.startsWith('/uk') ? window.location.pathname : `/uk${window?.location?.pathname || '/'}`;

  const onClick = () => {
    const path = target === 'en'
      ? window.location.pathname.replace(/^\/uk\/?/, '/') || '/'
      : window.location.pathname.startsWith('/uk') ? window.location.pathname : `/uk${window.location.pathname === '/' ? '/' : window.location.pathname}`;
    localStorage.setItem('lang', target);
    window.location.assign(path);
  };

  return (
    <button type="button" onClick={onClick}
      aria-label={`${labelLang}: ${target === 'en' ? 'EN' : 'UK'}`}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-bambu-border hover:border-bambu-green transition text-xs font-semibold">
      <Languages size={16} />
      <span>{target.toUpperCase()}</span>
    </button>
  );
}
```

- [ ] **Step 4: Run tests — expect 3 passing**

```bash
npm run test -- LangToggle
```

- [ ] **Step 5: Mount in Nav**

Add to imports:
```ts
import { LangToggle } from './islands/LangToggle';
```

In the toggles div:
```astro
<LangToggle client:load currentLocale={locale} labelLang={i.lang.label} labelEn={i.lang.en} labelUk={i.lang.uk} />
<ThemeToggle client:load labels={i.theme} />
```

- [ ] **Step 6: Verify visual**

```bash
npm run build && npm run preview
```

Expected: button shows "UK" on EN page, "EN" on UK page; click navigates.

- [ ] **Step 7: Commit**

```bash
git add src/components/islands/LangToggle.tsx src/components/islands/LangToggle.test.tsx src/components/Nav.astro
git commit -m "feat(island): LangToggle with URL switching and persistence"
```

---

### Task 18: Screenshots tabs (TDD)

**Files:**
- Create: `src/components/islands/ScreenshotsTabs.tsx`, `src/components/islands/ScreenshotsTabs.test.tsx`, `src/components/Screenshots.astro`
- Capture: `public/images/screenshot-telegram.png` (manually via running app)
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Capture Telegram screenshot**

User has main bamdude app running at `http://localhost:5173/`. Open Telegram, find the bot, take a screenshot of a chat with status / queue / actionable notification. Save to `public/images/screenshot-telegram.png`. If unavailable, place a 800×500 placeholder PNG (will be re-shot before launch).

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/islands/ScreenshotsTabs.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenshotsTabs } from './ScreenshotsTabs';

const tabs = [
  { id: 'web', label: 'Web', src: '/a.png', alt: 'Web UI' },
  { id: 'tg', label: 'Telegram', src: '/b.png', alt: 'Telegram bot' },
  { id: 'mobile', label: 'Mobile', src: '/c.png', alt: 'Mobile' },
];

describe('ScreenshotsTabs', () => {
  it('renders all tabs and shows the first by default', () => {
    render(<ScreenshotsTabs tabs={tabs} />);
    expect(screen.getByAltText('Web UI')).toBeInTheDocument();
  });

  it('switches image on tab click', async () => {
    const u = userEvent.setup();
    render(<ScreenshotsTabs tabs={tabs} />);
    await u.click(screen.getByRole('tab', { name: 'Telegram' }));
    expect(screen.getByAltText('Telegram bot')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', async () => {
    const u = userEvent.setup();
    render(<ScreenshotsTabs tabs={tabs} />);
    await u.click(screen.getByRole('tab', { name: 'Mobile' }));
    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Web' })).toHaveAttribute('aria-selected', 'false');
  });
});
```

- [ ] **Step 3: Run — expect failure**

```bash
npm run test -- ScreenshotsTabs
```

- [ ] **Step 4: Implement**

```tsx
// src/components/islands/ScreenshotsTabs.tsx
import { useState } from 'react';

export interface Tab { id: string; label: string; src: string; alt: string; }

export function ScreenshotsTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex gap-2 justify-center mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${
              active === tab.id
                ? 'bg-bambu-green text-white border-bambu-green'
                : 'border-bambu-border hover:border-bambu-green'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden border border-bambu-border shadow-[0_0_64px_rgba(0,174,66,0.15)]">
        <img src={current.src} alt={current.alt} loading="lazy" className="w-full h-auto block" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — expect passing**

- [ ] **Step 6: Write `src/components/Screenshots.astro`**

```astro
---
import type { Locale } from '../i18n';
import { t } from '../i18n';
import { ScreenshotsTabs } from './islands/ScreenshotsTabs';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);

const tabs = [
  { id: 'web', label: 'Web', src: '/images/screenshot-desktop.png', alt: 'BamDude web dashboard' },
  { id: 'tg', label: 'Telegram', src: '/images/screenshot-telegram.png', alt: 'BamDude Telegram bot chat' },
  { id: 'mobile', label: 'Mobile', src: '/images/screenshot-mobile.png', alt: 'BamDude on mobile' },
];
---
<section id="screenshots" aria-label="Screenshots" class="py-24">
  <div class="mx-auto max-w-5xl px-6">
    <ScreenshotsTabs client:visible tabs={tabs} />
  </div>
</section>
```

- [ ] **Step 7: Use in page, verify, commit**

```bash
npm run build && npm run preview
git add src/components/islands/ScreenshotsTabs.tsx src/components/islands/ScreenshotsTabs.test.tsx src/components/Screenshots.astro src/pages/index.astro public/images/screenshot-telegram.png
git commit -m "feat(island): ScreenshotsTabs with three tabs"
```

---

### Task 19: FAQ accordion (TDD)

**Files:**
- Create: `src/content/en/faq.json`, `src/content/uk/faq.json`, `src/components/islands/FAQAccordion.tsx`, `src/components/islands/FAQAccordion.test.tsx`, `src/components/FAQ.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/content/en/faq.json`**

```json
{
  "items": [
    { "q": "Is it really free?", "a": "Yes. MIT-licensed, self-hosted, no paid tier. The only thing you pay for is your own server (or run it on a Raspberry Pi)." },
    { "q": "Which printers are supported?", "a": "Bambu Lab A1, A1 mini, P1S, P1P, X1C, X1E. Anything that exposes the standard Bambu MQTT and FTP endpoints with Developer Mode enabled." },
    { "q": "Do I need to expose it to the internet?", "a": "No. The web UI runs on your local network. The Telegram bot reaches Telegram's API outbound — no inbound port required." },
    { "q": "Can I migrate from Bambuddy?", "a": "Yes — BamDude is schema-compatible up to its forking point. The upgrade guide in the docs walks you through migrations." },
    { "q": "Cloud or local?", "a": "Strictly local. BamDude talks to your printers over your LAN using Developer Mode. No cloud calls except optional Obico AI failure detection (opt-in)." },
    { "q": "Does it support PostgreSQL?", "a": "Yes. SQLite is the default for the easy path; switch to Postgres via DATABASE_URL when your archive grows." },
    { "q": "Will my Telegram chat get spammed?", "a": "You configure per-chat notification settings, quiet hours, and event types. Defaults are conservative." }
  ]
}
```

- [ ] **Step 2: Write `src/content/uk/faq.json`**

```json
{
  "items": [
    { "q": "Це справді безкоштовно?", "a": "Так. MIT-ліцензія, self-host, без платних тарифів. Єдине, за що платиш — свій сервер (або Raspberry Pi)." },
    { "q": "Які принтери підтримуються?", "a": "Bambu Lab A1, A1 mini, P1S, P1P, X1C, X1E — все, що має стандартні Bambu MQTT і FTP з увімкненим Developer Mode." },
    { "q": "Чи треба виставляти у мережу?", "a": "Ні. Веб-UI живе у локальній мережі. Telegram-бот ходить на Telegram API назовні — вхідний порт не потрібен." },
    { "q": "Чи можна мігрувати з Bambuddy?", "a": "Так — BamDude схемо-сумісний до точки форку. У документації є гайд по апгрейду з усіма міграціями." },
    { "q": "Хмара чи локально?", "a": "Тільки локально. BamDude спілкується з принтерами по LAN через Developer Mode. Жодних cloud-викликів, окрім опціонального Obico (за згодою)." },
    { "q": "Чи підтримує PostgreSQL?", "a": "Так. SQLite за замовчанням; перемикаєшся на Postgres через DATABASE_URL, коли архів виростає." },
    { "q": "Чи не засипле мене Telegram-бот?", "a": "Налаштовуєш типи подій, тихі години, частоту — на кожен чат окремо. Дефолти консервативні." }
  ]
}
```

- [ ] **Step 3: Write the failing test**

```tsx
// src/components/islands/FAQAccordion.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FAQAccordion } from './FAQAccordion';

const items = [
  { q: 'Q1', a: 'A1' },
  { q: 'Q2', a: 'A2' },
];

describe('FAQAccordion', () => {
  it('starts with all answers hidden', () => {
    render(<FAQAccordion items={items} />);
    expect(screen.queryByText('A1')).not.toBeVisible();
  });

  it('expands on click', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    await u.click(screen.getByRole('button', { name: 'Q1' }));
    expect(screen.getByText('A1')).toBeVisible();
  });

  it('collapses on second click', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    const btn = screen.getByRole('button', { name: 'Q1' });
    await u.click(btn);
    await u.click(btn);
    expect(screen.queryByText('A1')).not.toBeVisible();
  });

  it('allows multiple open at the same time', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    await u.click(screen.getByRole('button', { name: 'Q1' }));
    await u.click(screen.getByRole('button', { name: 'Q2' }));
    expect(screen.getByText('A1')).toBeVisible();
    expect(screen.getByText('A2')).toBeVisible();
  });
});
```

- [ ] **Step 4: Run — expect failure**

```bash
npm run test -- FAQAccordion
```

- [ ] **Step 5: Implement**

```tsx
// src/components/islands/FAQAccordion.tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem { q: string; a: string; }

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <ul className="divide-y divide-bambu-border rounded-2xl border border-bambu-border bg-bambu-bg-secondary overflow-hidden">
      {items.map((it, idx) => {
        const isOpen = open.has(idx);
        return (
          <li key={idx}>
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${idx}`}
              className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-bambu-bg transition"
            >
              <span className="font-semibold">{it.q}</span>
              <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              id={`faq-panel-${idx}`}
              hidden={!isOpen}
              className="px-6 pb-5 text-bambu-text-secondary leading-relaxed"
            >
              {it.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 6: Run tests — expect passing**

- [ ] **Step 7: Write `src/components/FAQ.astro`**

```astro
---
import type { Locale } from '../i18n';
import { getEntry } from 'astro:content';
import { t } from '../i18n';
import { FAQAccordion } from './islands/FAQAccordion';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const i = t(locale);
const entry = await getEntry('faq', locale);
const items = entry?.data.items ?? [];
---
<section id="faq" aria-label="FAQ" class="py-24 bg-bambu-bg-secondary border-y border-bambu-border">
  <div class="mx-auto max-w-3xl px-6">
    <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">{i.faq.title}</h2>
    <div class="mt-12">
      <FAQAccordion client:visible items={items} />
    </div>
  </div>
</section>
```

- [ ] **Step 8: Use in page, verify, commit**

```bash
npm run build && npm run preview
git add src/content/en/faq.json src/content/uk/faq.json src/components/islands/FAQAccordion.tsx src/components/islands/FAQAccordion.test.tsx src/components/FAQ.astro src/pages/index.astro
git commit -m "feat(island): FAQ accordion with content collection"
```

---

### Task 20: Cookie banner + analytics (TDD)

**Files:**
- Create: `src/lib/analytics.ts`, `src/components/islands/CookieBanner.tsx`, `src/components/islands/CookieBanner.test.tsx`
- Modify: `src/layouts/BaseLayout.astro` (mount banner)

- [ ] **Step 1: Write `src/lib/analytics.ts`**

```ts
declare global { interface Window { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[]; } }

export const CONSENT_KEY = 'consent';

export type Consent = 'granted' | 'denied';

export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === 'granted' || v === 'denied' ? v : null;
}

export function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
  window.gtag?.('consent', 'update', { analytics_storage: value });
  if (value === 'granted') loadGtag();
}

export function loadGtag() {
  const id = import.meta.env.PUBLIC_GA_ID;
  if (!id) return;
  if (document.querySelector('script[data-gtag]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  s.setAttribute('data-gtag', '');
  document.head.appendChild(s);
  window.gtag?.('js', new Date());
  window.gtag?.('config', id, { anonymize_ip: true });
}
```

- [ ] **Step 2: Write the failing tests**

```tsx
// src/components/islands/CookieBanner.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieBanner } from './CookieBanner';

const labels = {
  title: 'We use a cookie',
  body: 'Body',
  accept: 'Accept',
  reject: 'Reject',
  customize: 'Customize',
  analyticsLabel: 'Analytics',
  save: 'Save',
};

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
  // mock gtag spy
  (window as any).gtag = vi.fn();
  document.head.querySelectorAll('script[data-gtag]').forEach((n) => n.remove());
});

describe('CookieBanner', () => {
  it('shows when no consent stored', () => {
    render(<CookieBanner labels={labels} />);
    expect(screen.getByText('We use a cookie')).toBeInTheDocument();
  });

  it('hides when consent already granted', () => {
    localStorage.setItem('consent', 'granted');
    render(<CookieBanner labels={labels} />);
    expect(screen.queryByText('We use a cookie')).not.toBeInTheDocument();
  });

  it('on Accept stores granted, calls gtag(consent, update, granted), and (when GA_ID set) injects gtag script', async () => {
    vi.stubEnv('PUBLIC_GA_ID', 'G-TEST');
    const u = userEvent.setup();
    render(<CookieBanner labels={labels} />);
    await u.click(screen.getByRole('button', { name: 'Accept' }));
    expect(localStorage.getItem('consent')).toBe('granted');
    expect((window as any).gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' });
    expect(document.querySelector('script[data-gtag]')).not.toBeNull();
  });

  it('on Reject stores denied and does not inject gtag', async () => {
    vi.stubEnv('PUBLIC_GA_ID', 'G-TEST');
    const u = userEvent.setup();
    render(<CookieBanner labels={labels} />);
    await u.click(screen.getByRole('button', { name: 'Reject' }));
    expect(localStorage.getItem('consent')).toBe('denied');
    expect(document.querySelector('script[data-gtag]')).toBeNull();
  });

  it('reopens via window event "cookie:settings"', () => {
    localStorage.setItem('consent', 'denied');
    render(<CookieBanner labels={labels} />);
    expect(screen.queryByText('We use a cookie')).not.toBeInTheDocument();
    window.dispatchEvent(new Event('cookie:settings'));
    expect(screen.getByText('We use a cookie')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run — expect failure**

- [ ] **Step 4: Implement**

```tsx
// src/components/islands/CookieBanner.tsx
import { useEffect, useState } from 'react';
import { setConsent, getConsent } from '../../lib/analytics';

interface Labels {
  title: string; body: string; accept: string; reject: string;
  customize: string; analyticsLabel: string; save: string;
}

export function CookieBanner({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setOpen(getConsent() === null);
    const onSettings = () => { setOpen(true); setCustomizing(true); };
    window.addEventListener('cookie:settings', onSettings);
    return () => window.removeEventListener('cookie:settings', onSettings);
  }, []);

  if (!open) return null;

  const accept = () => { setConsent('granted'); setOpen(false); };
  const reject = () => { setConsent('denied'); setOpen(false); };
  const save = () => { setConsent(analytics ? 'granted' : 'denied'); setOpen(false); };

  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-2xl border border-bambu-border bg-bambu-bg-secondary shadow-2xl p-5">
      <h3 className="font-bold">{labels.title}</h3>
      <p className="mt-2 text-sm text-bambu-text-secondary">{labels.body}</p>
      {customizing && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.currentTarget.checked)} />
          <span>{labels.analyticsLabel}</span>
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!customizing && (
          <>
            <button type="button" onClick={accept} className="rounded-md px-4 py-2 text-sm font-semibold bg-bambu-green text-white">{labels.accept}</button>
            <button type="button" onClick={reject} className="rounded-md px-4 py-2 text-sm font-semibold border border-bambu-border">{labels.reject}</button>
            <button type="button" onClick={() => setCustomizing(true)} className="rounded-md px-4 py-2 text-sm font-semibold">{labels.customize}</button>
          </>
        )}
        {customizing && (
          <button type="button" onClick={save} className="rounded-md px-4 py-2 text-sm font-semibold bg-bambu-green text-white">{labels.save}</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — expect passing**

- [ ] **Step 6: Mount in BaseLayout**

In `src/layouts/BaseLayout.astro`, before the closing `</body>`, add:

```astro
---
// add to imports
import { CookieBanner } from '../components/islands/CookieBanner';
import { t } from '../i18n';
const i = t(locale);
---
<!-- inside body, after <slot /> -->
<CookieBanner client:idle labels={i.cookie} />

<!-- and a tiny script to dispatch the cookie:settings event from the footer button -->
<script is:inline>
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.closest('[data-cookie-settings]')) {
      window.dispatchEvent(new Event('cookie:settings'));
    }
  });
</script>
```

- [ ] **Step 7: Add `.env.example`**

```bash
echo "PUBLIC_GA_ID=" > .env.example
echo "PUBLIC_SITE_URL=https://bamdude.top" >> .env.example
echo "PUBLIC_GITHUB_REPO=https://github.com/kainpl/bamdude" >> .env.example
```

- [ ] **Step 8: Verify build + visual**

```bash
npm run typecheck && npm run build && npm run preview
```

Expected: banner appears bottom-right; Accept/Reject buttons work; Footer "Cookie settings" reopens the banner.

- [ ] **Step 9: Commit**

```bash
git add src/lib/analytics.ts src/components/islands/CookieBanner.tsx src/components/islands/CookieBanner.test.tsx src/layouts/BaseLayout.astro .env.example
git commit -m "feat(island): CookieBanner with Consent Mode v2 and lazy gtag"
```

---

## Phase 4 — SEO, sitemap, robots, OG

### Task 21: robots.txt

**Files:** Create `public/robots.txt`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://bamdude.top/sitemap-index.xml
```

- [ ] **Step 2: Verify it's served at `/robots.txt`**

```bash
npm run build
ls dist/robots.txt
```

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "chore: add robots.txt with sitemap reference"
```

---

### Task 22: Sitemap (verify @astrojs/sitemap output)

The sitemap integration was added in Task 1. Verify it's working with both locales after the UK page is created (Task 25). For now, this is a no-op task — confirm config and move on.

- [ ] **Step 1: Confirm `astro.config.mjs` has the sitemap integration with i18n config (already done in Task 1)**
- [ ] **Step 2: After Task 25, run `npm run build` and inspect `dist/sitemap-0.xml` to confirm it contains both `https://bamdude.top/` and `https://bamdude.top/uk/` with hreflang annotations**

(No commit at this task — verification only.)

---

### Task 23: Open Graph image generation

**Files:**
- Create: `src/pages/og/[locale].png.ts`
- Modify: `src/layouts/BaseLayout.astro` (use generated path)

- [ ] **Step 1: Write `src/pages/og/[locale].png.ts`**

```ts
import { OGImageRoute } from 'astro-og-canvas';
import { t, locales } from '../../i18n';

const pages = Object.fromEntries(locales.map((l) => [l, {
  title: l === 'en' ? 'BamDude — Self-hosted print management for Bambu Lab' : 'BamDude — Self-host для Bambu Lab',
  description: t(l).hero.subtitle,
}]));

export const { getStaticPaths, GET } = OGImageRoute({
  pages,
  param: 'locale',
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[10, 10, 10], [0, 90, 30]],
    border: { color: [0, 174, 66], width: 8, side: 'inline-start' },
    padding: 80,
    font: {
      title: { families: ['Inter'], weight: 'ExtraBold', color: [255, 255, 255] },
      description: { families: ['Inter'], weight: 'Normal', color: [200, 200, 200] },
    },
  }),
});
```

- [ ] **Step 2: Update `BaseLayout.astro` `ogImage` default**

Change `ogImage = '/og/home-en.png'` → make it locale-aware:

```ts
const { title, description, locale, ogImage = `/og/${locale}.png` } = Astro.props;
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
ls dist/og/
```

Expected: `dist/og/en.png` and `dist/og/uk.png` exist, ~1200×630.

- [ ] **Step 4: Commit**

```bash
git add src/pages/og/ src/layouts/BaseLayout.astro
git commit -m "feat(seo): generate per-locale Open Graph images at build"
```

---

### Task 24: JSON-LD Schema.org SoftwareApplication

**Files:** Modify `src/layouts/BaseLayout.astro` to inject JSON-LD.

- [ ] **Step 1: Add to `BaseLayout.astro` head, before consent script**

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BamDude',
  description,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Linux, Docker',
  url: siteUrl,
  license: 'https://opensource.org/license/mit',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  inLanguage: locale,
})}></script>
```

- [ ] **Step 2: Build, view source on `/`, confirm JSON-LD is present and valid**

```bash
npm run build
grep -A 1 'application/ld+json' dist/index.html
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(seo): JSON-LD SoftwareApplication for rich snippets"
```

---

## Phase 5 — UK locale page

### Task 25: UK index page

**Files:** Create `src/pages/uk/index.astro`

- [ ] **Step 1: Write `src/pages/uk/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Nav from '../../components/Nav.astro';
import Hero from '../../components/Hero.astro';
import TrustStrip from '../../components/TrustStrip.astro';
import Features from '../../components/Features.astro';
import Screenshots from '../../components/Screenshots.astro';
import HowItWorks from '../../components/HowItWorks.astro';
import WhyFork from '../../components/WhyFork.astro';
import FAQ from '../../components/FAQ.astro';
import FinalCTA from '../../components/FinalCTA.astro';
import Footer from '../../components/Footer.astro';
import { t } from '../../i18n';
const locale = 'uk' as const;
const i = t(locale);
---
<BaseLayout title="BamDude — Self-host для Bambu Lab" description={i.hero.subtitle} locale={locale}>
  <Nav locale={locale} />
  <Hero locale={locale} />
  <TrustStrip locale={locale} />
  <Features locale={locale} />
  <Screenshots locale={locale} />
  <HowItWorks locale={locale} />
  <WhyFork locale={locale} />
  <FAQ locale={locale} />
  <FinalCTA locale={locale} />
  <Footer locale={locale} />
</BaseLayout>
```

- [ ] **Step 2: Refactor `src/pages/index.astro` similarly** (now uses all proper section components)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import TrustStrip from '../components/TrustStrip.astro';
import Features from '../components/Features.astro';
import Screenshots from '../components/Screenshots.astro';
import HowItWorks from '../components/HowItWorks.astro';
import WhyFork from '../components/WhyFork.astro';
import FAQ from '../components/FAQ.astro';
import FinalCTA from '../components/FinalCTA.astro';
import Footer from '../components/Footer.astro';
import { t } from '../i18n';
const locale = 'en' as const;
const i = t(locale);
---
<BaseLayout title="BamDude — Self-hosted print management for Bambu Lab" description={i.hero.subtitle} locale={locale}>
  <Nav locale={locale} />
  <Hero locale={locale} />
  <TrustStrip locale={locale} />
  <Features locale={locale} />
  <Screenshots locale={locale} />
  <HowItWorks locale={locale} />
  <WhyFork locale={locale} />
  <FAQ locale={locale} />
  <FinalCTA locale={locale} />
  <Footer locale={locale} />
</BaseLayout>
```

- [ ] **Step 3: Verify both routes**

```bash
npm run build && npm run preview
```

Open `/` and `/uk/` — both render fully, hreflang links cross-reference each other.

- [ ] **Step 4: Verify sitemap includes both**

```bash
cat dist/sitemap-0.xml
```

Expected: entries for `bamdude.top/` and `bamdude.top/uk/` with `<xhtml:link hreflang>` annotations.

- [ ] **Step 5: Commit**

```bash
git add src/pages/uk/index.astro src/pages/index.astro
git commit -m "feat: UK locale page with full section composition"
```

---

## Phase 6 — Build, deploy, polish

### Task 26: Lighthouse CI gate

**Files:**
- Create: `lighthouserc.cjs`
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
npm install --save-dev --save-exact @lhci/cli@^0.14
```

- [ ] **Step 2: Write `lighthouserc.cjs`**

```js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/index.html', 'http://localhost/uk/index.html'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
  },
};
```

- [ ] **Step 3: Add script**

```json
{ "scripts": { "lighthouse": "lhci autorun" } }
```

- [ ] **Step 4: Run**

```bash
npm run build && npm run lighthouse
```

Expected: 4 categories pass thresholds. If anything fails, fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.cjs package.json package-lock.json
git commit -m "test: Lighthouse CI gate (Perf 95, A11y 95, BP 95, SEO 100)"
```

---

### Task 27: nginx config + deploy README

**Files:**
- Create: `deploy/nginx.conf`, `deploy/README.md`

- [ ] **Step 1: Write `deploy/nginx.conf`**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bamdude.top www.bamdude.top;

    # Cloudflare terminates TLS; this is HTTP-only behind CF
    if ($host = www.bamdude.top) { return 301 https://bamdude.top$request_uri; }

    root /var/www/bamdude.top;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml;
    gzip_min_length 1024;

    brotli on;
    brotli_types text/plain text/css application/javascript application/json image/svg+xml application/xml;

    # Hashed assets — long cache
    location ~* ^/_astro/.*$ {
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # OG images — long cache
    location ~* ^/og/.*\.png$ {
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }

    # HTML — no cache
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
    }

    # Sitemap and robots
    location = /robots.txt   { try_files /robots.txt =404; }
    location = /sitemap-index.xml { try_files /sitemap-index.xml =404; }

    # Default: try the request, then a fallback
    location / {
        try_files $uri $uri/ $uri.html /index.html =404;
    }
}
```

- [ ] **Step 2: Write `deploy/README.md`**

````markdown
# Deploying bamdude.top

Static Astro build deployed to a system nginx behind Cloudflare (proxied DNS).

## First-time setup on the server

1. Install nginx with brotli module (e.g., `nginx-extras` on Debian).
2. Create web root: `sudo mkdir -p /var/www/bamdude.top && sudo chown -R deploy:deploy /var/www/bamdude.top`.
3. Copy `deploy/nginx.conf` into `/etc/nginx/sites-available/bamdude.top`, symlink into `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`.
4. Cloudflare: A record `bamdude.top` → server IP, **Proxied**. SSL: Full (strict) with origin certificate installed in nginx (or Flexible if origin is HTTP only — adjust accordingly).
5. CNAME `www` → `bamdude.top`, also Proxied.

## Each deploy

From a developer machine:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run lighthouse
rsync -avz --delete dist/ deploy@server:/var/www/bamdude.top/
```

## Cache busting

Astro hashes all `_astro/*` filenames, so changes to JS/CSS auto-invalidate. HTML is `no-cache`, so users always get the latest. After a deploy, optionally purge Cloudflare cache for `*.html` and `/og/*.png`:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://bamdude.top/","https://bamdude.top/uk/"]}'
```

## Rollback

Each `rsync` is full-replace. Keep previous `dist/` tarballs locally for instant rollback:

```bash
tar czf /backup/bamdude.top-$(date +%Y%m%d-%H%M%S).tgz -C /var/www bamdude.top
```
````

- [ ] **Step 3: Commit**

```bash
git add deploy/
git commit -m "docs(deploy): nginx config and operator runbook"
```

---

### Task 28: Top-level README + manual QA checklist

**Files:** Create `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# bamdude.top

Marketing landing for [BamDude](https://github.com/kainpl/bamdude) — self-hosted print management for Bambu Lab 3D printers.

## Stack

- Astro 5 (SSG) + React islands
- Tailwind CSS v4
- TypeScript (strict)
- `lucide-react`, `astro-og-canvas`, `@astrojs/sitemap`
- Vitest for island unit tests
- Lighthouse CI gate

## Local dev

```bash
cp .env.example .env  # set PUBLIC_GA_ID when you have one
npm install
npm run dev           # http://localhost:4321
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — preview prod build
- `npm run typecheck` — `astro check`
- `npm run lint` / `npm run format`
- `npm run test` / `npm run test:watch` / `npm run test:coverage`
- `npm run lighthouse` — Lighthouse CI gate

## Deploy

See `deploy/README.md`.

## Manual QA checklist (before tagging a release)

- [ ] `/` renders fully in English
- [ ] `/uk/` renders fully in Ukrainian
- [ ] hreflang links: `/` ↔ `/uk/` cross-reference correctly (view source)
- [ ] Theme: System / Light / Dark cycles correctly, persists across reload, no FOUC
- [ ] Lang toggle: button shows alternate locale code, click navigates and persists
- [ ] Cookie banner appears on first visit, Accept loads `gtag.js`, Reject does not
- [ ] Footer "Cookie settings" reopens the banner
- [ ] Mobile (375px), tablet (768px), desktop (1280px+): no horizontal scroll, all sections legible
- [ ] FAQ accordion: open/close, multi-open works
- [ ] Screenshots tabs: Web / Telegram / Mobile switch images and update aria-selected
- [ ] Open Graph: `view-source: /` shows `og:image` pointing to `/og/en.png`; same for UK
- [ ] JSON-LD validates at https://validator.schema.org/
- [ ] Disable JS in DevTools → page still renders all content (graceful degradation)
- [ ] `npm run lighthouse` — all 4 categories meet thresholds

## Project structure

```
src/
  pages/                 # / and /uk/
  layouts/BaseLayout.astro
  components/            # static .astro sections
    islands/             # React TSX islands (theme/lang/tabs/accordion/cookies)
  content/               # typed content collections (en/, uk/)
  i18n/                  # JSON labels and loader
  lib/                   # github.ts, analytics.ts
  styles/globals.css
public/                  # static assets, robots.txt, og/
deploy/                  # nginx.conf, deploy README
```

## License

MIT — same as BamDude.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: top-level README with QA checklist"
```

---

### Task 29: Full E2E manual run

- [ ] **Step 1: Build clean**

```bash
rm -rf dist .astro node_modules
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run lighthouse
```

Expected: every gate passes.

- [ ] **Step 2: Walk the manual QA checklist in `README.md`**

Open `npm run preview` URL, go through every item. Fix anything that's red. If a fix is needed, treat it as a follow-up task — do not skip the checklist.

- [ ] **Step 3: Open in mobile DevTools (iPhone 12 Pro, Pixel 5, iPad)**

Verify no horizontal scroll, no overlapping text, CTAs reachable.

- [ ] **Step 4: View `dist/sitemap-0.xml` and confirm hreflang annotations**

- [ ] **Step 5: Verify OG**

Use https://www.opengraph.xyz/ or paste a deployed URL into Slack/Telegram preview after first deploy. Confirm image, title, description.

- [ ] **Step 6: Tag the implementation as ready**

```bash
git tag -a v0.1.0-landing -m "First production-ready landing"
```

(Don't push the tag — user pushes when they choose to.)

---

## Cross-cutting expectations

- **Frequent commits:** every task ends in a commit. If a task takes longer than ~15 minutes, split it.
- **Type-safety:** `npm run typecheck` clean before each commit. Strict mode is on.
- **TDD discipline:** for every island in Phase 3, write the failing test FIRST, watch it fail, implement, watch it pass, then commit.
- **No premature abstraction:** if two sections look similar, leave them as separate components. Don't extract a generic `<SectionWithHeading />` until a third use case demands it.
- **Accessibility:** every interactive button gets `type="button"` and `aria-label` where the label isn't obvious; every section has `aria-label`.
- **Reduced motion:** the page respects `prefers-reduced-motion` (handled in `globals.css`).
- **No JS = readable:** all content above the fold and across all sections must render without JS. Only interactive niceties (theme cycling, tabs, accordion, banner) require JS.

## Out of scope (deferred)

- A/B testing, heatmaps, session recording — not now
- Multi-page (blog, changelog) — landing only
- Headless CMS — content lives in `src/content/` and `src/i18n/`
- Plausible / self-hosted analytics — GA4 chosen by user
