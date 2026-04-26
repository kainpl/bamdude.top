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
npm run lighthouse   # optional — local lhci scores undercount production; CI/Linux is canonical
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
