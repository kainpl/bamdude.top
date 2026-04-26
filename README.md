# bamdude.top

Marketing landing for [BamDude](https://github.com/kainpl/bamdude) — self-hosted print management for Bambu Lab 3D printers.

## Stack

- Astro 6 (SSG) + React islands
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
- `npm run lighthouse` — Lighthouse CI gate (CI / production-URL audits; local under-scores)

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
- [ ] Real Telegram-bot screenshot is in place at `public/images/screenshot-telegram.png` (the initial commit ships a placeholder copied from the mobile screenshot)
- [ ] Open Graph: `view-source: /` shows `og:image` pointing to `/og/en.png`; same for UK
- [ ] JSON-LD validates at https://validator.schema.org/
- [ ] Disable JS in DevTools → page still renders all content (graceful degradation)
- [ ] `npm run lighthouse` — all 4 categories meet thresholds (run on Linux CI / production URL for stable scores)

## Project structure

```
src/
  pages/                 # / and /uk/
  layouts/BaseLayout.astro
  components/            # static .astro sections
    islands/             # React TSX islands (theme/lang/tabs/accordion/cookies)
  content/               # typed JSON content (en/, uk/)
  i18n/                  # JSON labels and loader
  lib/                   # github.ts, analytics.ts
  styles/globals.css
public/                  # static assets, robots.txt, og/
deploy/                  # nginx.conf, deploy README
```

## License

AGPL-3.0 — same as BamDude.
