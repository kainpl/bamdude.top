# BamDude — brand assets

**Slogan:** One printer or a hundred. Your data. Your rules.

## Colors
| Token | Hex | Use |
|---|---|---|
| Ink (dark theme) | `#F4F6F0` | mark + wordmark on dark |
| Ink (light theme) | `#12150F` | mark + wordmark on light |
| Accent (dark theme) | `#58AA4D` | middle layer, "Dude", cloud badge (original Bambu Lab green) |
| Accent (light theme) | `#3F8035` | same, darkened for contrast on light |
| Surface dark | `#0B0D0A` / `#12150F` | app background, tiles, social images |
| Surface light | `#F4F6F0` | light theme background |
| Muted | `#8A9179` (dark) / `#5A6150` (light) | tagline, captions |

## Type
- **Space Grotesk** — wordmark: 700, letter-spacing −0.045em. "Cloud" suffix: 400, muted color.
- **JetBrains Mono** — tagline and all technical labels, letter-spacing 0.1em.
Both are open-licensed (OFL / Apache 2.0).

## Files

```
brand/
  favicon.ico                      16 / 32 / 48 / 64 / 128 / 256 px in one file (dark bars)
  favicon-on-dark.ico              same sizes, white bars (dark UI / dark browser chrome)
  cloud-favicon.ico                Cloud mark, same six sizes (dark bars)
  cloud-favicon-on-dark.ico        Cloud mark, white bars
  app-icon.ico                     16 → 256 px, dark tile (desktop app)
  browserconfig.xml                Windows tile config
  site.webmanifest                 PWA manifest (BamDude)
  site.cloud.webmanifest           PWA manifest (BamDude Cloud)
  svg/
    mark-adaptive.svg              follows prefers-color-scheme — best <link rel="icon">
    mark-on-light.svg  mark-on-dark.svg
    mark-mono-black.svg  mark-mono-white.svg     single-color (print, stickers, laser)
    mark-tile.svg                  rounded dark tile + white mark
    safari-pinned-tab.svg          solid black, Safari pinned tab
    lockup-on-light.svg  lockup-on-dark.svg      mark + name + tagline (live text)
    lockup-compact-on-light.svg  lockup-compact-on-dark.svg
                                   mark + name, NO tagline — app headers, sign-in, overlays;
                                   text already converted to outlines (no font needed)
    lockup-compact-adaptive.svg    same, follows prefers-color-scheme
    cloud-*.svg                    all of the above, Cloud variant (cloud badge)
  png/
    mark-on-light-{16..512}.png    transparent, dark bars
    mark-on-dark-{16..512}.png     transparent, white bars
    icon-tile-{64,120,152,167,180,192,256,512,1024}.png    iOS / Android / desktop
    maskable-{192,512}.png         Android adaptive (full-bleed, safe zone respected)
    apple-touch-icon.png           180 px
    avatar-{400,460,512}.png       GitHub org / Discord / social avatars
    mstile-{70,150,310,310x150}.png  Windows tiles (browserconfig.xml)
    app-icon-256.png               desktop app icon source
    lockup-on-{light,dark}.png     1800×520 @2x
    lockup-compact-on-{light,dark}-{64,128,256}.png    transparent, height in px
    cloud-*.png                    Cloud variants of all of the above
  social/
    og-dark-1200x630.png           Open Graph / Twitter card (default)
    og-light-1200x630.png
    og-cloud-1200x630.png          BamDude Cloud
    github-social-1280x640.png     GitHub repo social preview
    readme-banner-1600x400.png     README header
    x-header-1500x500.png          X / Twitter profile header
```

## HTML snippet

```html
<link rel="icon" href="/brand/svg/mark-adaptive.svg" type="image/svg+xml">
<link rel="icon" href="/brand/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/brand/png/apple-touch-icon.png">
<link rel="manifest" href="/brand/site.webmanifest">
<meta name="theme-color" content="#12150F">
<meta property="og:image" content="/brand/social/og-dark-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="mask-icon" href="/brand/svg/safari-pinned-tab.svg" color="#58AA4D">
<meta name="msapplication-config" content="/brand/browserconfig.xml">
```

## Rules
- Clear space around the mark = height of one bar (8 units of the 64 grid).
- Minimum sizes: mark 16 px, compact lock-up 24 px tall, lock-up with tagline 120 px wide; below that use the mark alone.
- The middle (green) bar is the only accent — never recolor the other bars.
- Cloud badge sits bottom-right, its bottom aligned with the spine, its right edge with the middle bar. Do not use it below 20 px.
- Mono versions for one-color printing; never add shadows, gradients, or outlines.

## SVG lock-ups and fonts
`svg/*lockup*.svg` use live `<text>` with Space Grotesk / JetBrains Mono — convert text to outlines
(Inkscape: Path → Object to Path) if the font is not available where the file is used.
The PNG lock-ups are already rendered with the correct fonts.
The compact lock-ups (`*lockup-compact*`) are outlined already and need no font. Their geometry is the OG-card
construction from the design source (Export Sheet, `#og-dark`): a centred flex row of the 96 px mark, a 14 px gap and the
wordmark at 76 px / Space Grotesk 700 / −0.045 em / line-height 1 — on the 64-unit grid that is font-size 50.67, text box
from x = 73.33, baseline ≈ 49.5 (on the bottom bar). " Cloud" at 400 in `#8A9179` (dark) / `#6E7663` (light).
Regenerate rather than hand-edit.

## Changes
- 2026-09-06 — `mark-adaptive.svg` / `cloud-mark-adaptive.svg` shipped without their `<style>` block and rendered
  invisible (root `fill="none"`, classes undefined); fixed. Added compact lock-ups (SVG outlined + PNG 64/128/256,
  light/dark, BamDude + Cloud) and the two Cloud `.ico` files.
