# BamDude landing page — design spec

**Date:** 2026-04-26
**Working directory:** `D:\Development\bamdude.top`
**Domain:** `bamdude.top`
**Status:** brainstorming complete; pending implementation plan

## Context

BamDude is a self-hosted print archive, management, and automation system for Bambu Lab 3D printers (hard fork of Bambuddy). Stack of the main app: Python/FastAPI + React 19/Tailwind 4. Documentation lives at `docs.bamdude.top` (mkdocs). This project is the marketing landing at the apex domain.

Audience is intentionally broad — beginners with one printer to IT pros running print farms. Tone is friendly + technically credible.

## Goals

- Convert visitors into Quick-Start / GitHub stargazers
- Rank well on Google for queries like "bambu lab self-host", "bambu lab telegram bot", "bambu print farm management"
- Be readable and shareable — clean Open Graph, fast page load, accessible UI
- Render EN and UK fully (not a client-only language switch)

## Non-goals

- No SSR / runtime server (static only)
- No headless CMS (content lives in the repo)
- No A/B testing or heatmaps (not yet)
- Not a docs site (docs live at `docs.bamdude.top`)

## Stack

- **Framework:** Astro 5.x with React islands
- **Styling:** Tailwind CSS v4 (matches the main app's setup), CSS variables for theming
- **Icons:** `lucide-react`
- **Fonts:** Inter (matches main app)
- **Language:** TypeScript

## Brand

- Primary accent: `#00ae42` (bambu green); light `#00c64d`, dark `#009438`
- Logo / favicons / `screenshot-desktop.png` / `screenshot-mobile.png` / printer icons reused from `D:/Development/bamdude/static/img/`
- New asset to capture: Telegram-bot screenshot. Captured manually via the bot at runtime (main app dev server runs at `http://localhost:5173/`); placed under `public/images/screenshot-telegram.png`

## Visual style

Bold / Marketing direction (validated 2026-04-26):
- Hero with radial gradient in bambu-green, blurred product mockup, glow on primary CTA
- Subsequent sections alternate between neutral background and accent-tinted section dividers
- Generous whitespace, large headings (`tracking-tight`, `font-extrabold`), Inter throughout

## Theming

- Default behaviour: `localStorage.theme` → `prefers-color-scheme` → **dark fallback**
- Three-state user toggle (System / Light / Dark) via `lucide` icons (`Monitor` / `Sun` / `Moon`)
- Implementation: class-based dark mode (`<html class="dark">`), Tailwind v4 `@custom-variant dark`
- No-flash: inline `<script>` in `<head>` runs before paint, sets the class synchronously

## i18n

- Astro built-in i18n: `defaultLocale: 'en'`, `locales: ['en', 'uk']`, `routing.prefixDefaultLocale: false`
- URLs: `/` (English) and `/uk/` (Ukrainian); confirmed 2026-04-26
- First-visit behaviour: inline script reads `localStorage.lang`. If missing and on `/`, checks `navigator.language` — if it starts with `uk`, redirects to `/uk/`. Otherwise stays. Persisted in `localStorage.lang`
- `<html lang>` set per locale. `<link rel="alternate" hreflang>` pairs en/uk plus `x-default` → `/`
- Content sources:
  - Long-form copy (features, FAQ, why-fork bullets): `src/content/<lang>/<file>.json` via Astro Content Collections (typed)
  - Short UI labels (button text, nav, footer): `src/i18n/<lang>.json` with type-safe loader
- Language toggle island in nav and footer: switches URL preserving the current path's language counterpart, persists choice

## Page structure

Single-page, anchor navigation. Sections (id / `aria-label`):

1. **Hero** (`#hero`) — logo + nav (Features, Docs, GitHub, lang/theme), H1 "One printer or a hundred. Your data. Your rules.", sub-copy (~25 words), two CTAs ("Quick start" → docs quickstart, "★ Star on GitHub" → repo). Background: gradient + blurred `screenshot-desktop.png`
2. **Trust strip** (`#trust`) — "Compatible with" + supported printer list (A1, A1 mini, P1S, P1P, X1C, X1E). GitHub stars (fetched at build time) and MIT badge
3. **Features grid** (`#features`) — six cards: Print Archive, Telegram bot, Multi-printer queue, Camera & Streaming, Maintenance reminders, Self-hosted. Layout 3×2 desktop, 2×3 tablet, 1×6 mobile. Each card: lucide icon + title + 2-line description
4. **Screenshots tabs** (`#screenshots`) — tab switcher: Web UI / Telegram / Mobile. Single large hero image per tab with subtle glow
5. **How it works** (`#how`) — three numbered steps: pull docker image → add printers → print from web/Telegram. Code block with `docker compose up -d`
6. **Why fork (vs Bambuddy)** (`#why`) — heading "Built for print farms, not a single printer". Two-column comparison table: 6–8 differentiators (Telegram bot, multi-chat auth, UA locale, maintenance UI, print-farm queue, etc.)
7. **FAQ** (`#faq`) — accordion, 6–8 questions: "Is it really free?", "What printers are supported?", "Do I need to expose it to the internet?", "Can I migrate from Bambuddy?", "Cloud or local?", "Does it support PostgreSQL?"
8. **Final CTA** (`#cta`) — gradient background, large "Get started in 5 minutes", dual CTA, links to docs / Telegram / GitHub
9. **Footer** — three columns: Product (Features, Docs, Changelog), Community (Telegram "BamDude Friends Forum" — `https://t.me/+3KQl2uNtOwo3NTgy`, GitHub `github.com/kainpl/bamdude`, Issues), Legal (License, Privacy, Cookie settings). © 2026, dup lang/theme toggle

## Interactive islands

Everything else is static HTML. Islands:
- `<ThemeToggle client:load>` — needs to run before paint sync work, but the inline no-flash script handles the first-paint correctness
- `<LangToggle client:load>` — switches URL on click
- `<ScreenshotsTabs client:visible>` — tab state
- `<FAQAccordion client:visible>` — open/close
- `<CookieBanner client:idle>` — consent gating for analytics

## SEO

- `<SEO>` Astro component injects: `<title>`, `<meta name="description">`, canonical, OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `og:locale:alternate`), Twitter Card (`summary_large_image`), `<link rel="alternate" hreflang>` for en + uk + `x-default`
- `@astrojs/sitemap` integration generates `sitemap-index.xml` covering both locales with hreflang annotations
- `public/robots.txt`: allow all; `Sitemap: https://bamdude.top/sitemap-index.xml`
- Open Graph images: `astro-og-canvas` builds `og/home-en.png` and `og/home-uk.png` at 1200×630 with logo, headline, gradient — one per locale
- Schema.org JSON-LD `SoftwareApplication` block with name, description, applicationCategory `DeveloperApplication`, operatingSystem `Linux/Docker`, url, license `MIT` — embedded in BaseLayout

## Analytics + consent

GDPR/EU traffic requires explicit consent before GA4 loads.

- `<head>` ships only the **Google Consent Mode v2 stub** with `default { analytics_storage: 'denied' }`. No `gtag.js` script tag yet
- `<CookieBanner client:idle>` reads `localStorage.consent`. If unset, banner appears with Accept / Reject / Customize
- On Accept: store `consent='granted'`, call `gtag('consent', 'update', { analytics_storage: 'granted' })`, dynamically inject `gtag.js?id=G-XXXX`
- On Reject: store `consent='denied'`, do nothing else (banner stays dismissed)
- Customize: opens a sub-panel with one current toggle (Analytics) — extensible for Marketing/Functional later
- Footer "Cookie settings" link reopens the panel
- Measurement ID lives in `.env` as `PUBLIC_GA_ID`. Repo ships `.env.example` only

## Build & deploy

- `npm run dev` — Astro dev server (port 4321)
- `npm run build` — static output to `dist/`, including hashed `_astro/`, `og/`, `sitemap-index.xml`
- `npm run preview` — sanity-check production build
- `npm run typecheck` — `astro check`
- `npm run lint` — ESLint with Astro plugin
- `npm run test` — Vitest for island components (`ThemeToggle`, `FAQAccordion`, `CookieBanner` consent flow)
- `npm run lighthouse` — local Lighthouse CI gate (Perf ≥ 95, SEO 100, A11y ≥ 95, Best Practices ≥ 95)

**Hosting:** self-host (validated 2026-04-26 — option B: plain static + system nginx, not Docker). Operator deploys via `rsync dist/ user@host:/var/www/bamdude.top/`. Production nginx config lives in `deploy/nginx.conf`:
- gzip + brotli enabled
- `_astro/*` cache `public, max-age=31536000, immutable`
- `*.html` cache `no-cache, must-revalidate`
- `www → apex` redirect
- HTTPS via Cloudflare origin certificate

**CDN:** Cloudflare in front, proxied DNS. SSL: Full (strict). Auto-minify off (Astro already minifies). Cache rule: Standard.

## File layout

```
bamdude.top/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── .env.example                   # PUBLIC_GA_ID, PUBLIC_SITE_URL
├── README.md
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── robots.txt
│   ├── og/
│   │   ├── home-en.png            # generated at build
│   │   └── home-uk.png
│   └── images/
│       ├── logo-dark.png
│       ├── logo-light.png
│       ├── screenshot-desktop.png
│       ├── screenshot-mobile.png
│       └── screenshot-telegram.png
├── src/
│   ├── pages/
│   │   ├── index.astro            # /
│   │   └── uk/index.astro         # /uk/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── TrustStrip.astro
│   │   ├── Features.astro
│   │   ├── Screenshots.astro
│   │   ├── HowItWorks.astro
│   │   ├── WhyFork.astro
│   │   ├── FAQ.astro
│   │   ├── FinalCTA.astro
│   │   ├── Footer.astro
│   │   ├── Nav.astro
│   │   ├── SEO.astro
│   │   └── islands/
│   │       ├── ThemeToggle.tsx
│   │       ├── LangToggle.tsx
│   │       ├── ScreenshotsTabs.tsx
│   │       ├── FAQAccordion.tsx
│   │       └── CookieBanner.tsx
│   ├── content/
│   │   ├── config.ts              # Astro Content Collections schema
│   │   ├── en/
│   │   │   ├── features.json
│   │   │   ├── faq.json
│   │   │   └── why-fork.json
│   │   └── uk/                    # mirror of en/
│   ├── i18n/
│   │   ├── en.json
│   │   ├── uk.json
│   │   └── index.ts
│   ├── lib/
│   │   ├── analytics.ts           # gtag wrapper, no-op until consent
│   │   ├── github.ts              # build-time GH stars fetch (cached)
│   │   └── theme.ts
│   └── styles/
│       └── globals.css
├── scripts/
│   └── generate-og.mjs            # OG image build step (if astro-og-canvas needs CLI hookup)
└── deploy/
    ├── nginx.conf
    └── README.md
```

## Testing & verification

- TypeScript / Astro check on every build
- ESLint on every commit (pre-commit hook optional, plain `npm run lint` in CI)
- Vitest unit tests for islands with state (theme persistence, accordion open/close, consent state machine)
- Lighthouse CI local gate
- Manual QA checklist in `README.md`:
  - English at `/`, Ukrainian at `/uk/` (both languages render fully)
  - System / Light / Dark theme switching, no flash on reload
  - Mobile (375px), tablet (768px), desktop (1280px+)
  - Cookie banner: accept loads GA4; reject does not
  - JS disabled: page still renders all content (graceful degradation)

## Open questions / deferred

- `PUBLIC_GA_ID` — operator provides at deploy time; placeholder in `.env.example`
- Telegram-bot screenshot capture — produced during implementation against the running main-app dev server
- Schema.org details (exact `applicationSubCategory`, screenshot URL list) — finalised during implementation
