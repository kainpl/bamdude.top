# BamDude bug-report relay

Tiny Fastify service that sits behind `https://bamdude.top/api/bug-report` and forwards in-app bug reports from BamDude instances to GitHub Issues on `kainpl/bamdude`.

## Why a relay?

The in-app **Report a Bug** button shipped with BamDude (the floating red bubble bottom-right of every page) collects:

- a description (required),
- an optional reporter email,
- an optional screenshot (canvas-compressed to 1920px max, JPEG q=0.7),
- support info (app version, OS, integration status, **sanitized** — printer names / serials / IPs / access codes / passwords / API keys / hostnames / usernames are stripped),
- the last 200 sanitized log lines.

It POSTs that payload to whatever `BUG_REPORT_RELAY_URL` is configured on the BamDude side. The relay needs a GitHub PAT to create issues — and shipping a PAT in the BamDude image would mean every self-hoster gets one (impossible to revoke selectively, blast radius if leaked = full repo access). The asymmetry is the whole point: the BamDude instance never holds the PAT, the relay does.

## Architecture

```
BamDude instance (LAN)
  ↓ POST https://bamdude.top/api/bug-report
Cloudflare (proxied)
  ↓
nginx on bamdude.top
  ├─ static / → /var/www/bamdude.top
  ├─ /api/bug-report → 127.0.0.1:3001 (this relay)
  └─ /bug-attachments/<uuid>.jpg → /opt/bamdude-relay/screenshots/...
       ↓
       Fastify relay (this directory)
         ├─ writes screenshot to /opt/bamdude-relay/screenshots/<uuid>.jpg
         └─ POST https://api.github.com/repos/kainpl/bamdude/issues  (with PAT)
```

## Endpoints

### `POST /api/bug-report`

Request body (JSON, max 12 MB):

```json
{
  "description": "string (required, ≤8000 chars)",
  "reporter_email": "string | null (≤320 chars)",
  "screenshot_base64": "string | null (raw base64, no data URI prefix; ≤8 MB after decode)",
  "support_info": { ... }
}
```

Success response (200):

```json
{
  "success": true,
  "issue_number": 1234,
  "issue_url": "https://github.com/kainpl/bamdude/issues/1234"
}
```

Failure modes (BamDude UI shows generic "couldn't submit" toast):

- `400` — schema validation failure (e.g. missing description).
- `400` `{success:false, message:"Screenshot too large."}` — base64 payload OK but decoded > 8 MB.
- `429` — rate-limited (per-IP, 10/hour by default).
- `502` `{success:false, message:"GitHub API is unavailable."}` — upstream GitHub call failed.

### `GET /health`

Returns `{ok: true, repo: "<GITHUB_REPO>"}`. Wire to your monitoring of choice.

## Local development

```bash
cd relay
npm ci
cp .env.example .env
# Edit .env — at minimum set GITHUB_PAT.
node --env-file=.env src/index.js
```

Smoke-test with curl:

```bash
curl -fsS -X POST http://127.0.0.1:3001/api/bug-report \
  -H 'Content-Type: application/json' \
  -d '{"description":"smoke test from curl","reporter_email":null,"screenshot_base64":null,"support_info":null}'
```

## Production deploy

The relay rides alongside the landing site on the same host. The site's self-hosted GitHub Actions runner builds + deploys the relay on every push to `main` that touches `relay/` (or any push if the workflow is run manually).

### One-time server setup

1. **Create the screenshots directory:**

   ```bash
   sudo -u bamdude-runner mkdir -p /opt/bamdude-relay/screenshots
   sudo chgrp www-data /opt/bamdude-relay/screenshots
   sudo chmod 750 /opt/bamdude-relay/screenshots
   ```

   nginx (`www-data`) reads it via group; the runner user (`bamdude-runner`) writes through the relay process. Sits inside the install dir so the whole relay tree (code + state) is under `/opt/bamdude-relay`. The deploy workflow's rsync excludes `screenshots` so subsequent deploys don't wipe uploaded images.

2. **Drop the env file:**

   ```bash
   sudo install -m 0600 -o bamdude-runner -g bamdude-runner /dev/stdin /etc/bamdude-relay.env <<'EOF'
   GITHUB_PAT=ghp_your_fine_grained_token_here
   GITHUB_REPO=kainpl/bamdude
   HOST=127.0.0.1
   PORT=3001
   SCREENSHOT_DIR=/opt/bamdude-relay/screenshots
   SCREENSHOT_PUBLIC_BASE=https://bamdude.top/bug-attachments
   MAX_BODY_BYTES=12582912
   RATE_LIMIT_MAX=10
   RATE_LIMIT_WINDOW_MIN=60
   LOG_LEVEL=info
   EOF
   ```

3. **Install the systemd unit:**

   ```bash
   sudo cp /path/to/clone/relay/deploy/relay.service /etc/systemd/system/bamdude-relay.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now bamdude-relay
   sudo systemctl status bamdude-relay
   ```

4. **Grant the runner passwordless restart of just `bamdude-relay`** — without this, the deploy workflow's `sudo systemctl restart bamdude-relay` step fails with `a password is required`:

   ```bash
   sudo install -m 0440 /dev/stdin /etc/sudoers.d/bamdude-relay <<'EOF'
   bamdude-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart bamdude-relay
   bamdude-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart bamdude-relay.service
   bamdude-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl is-active bamdude-relay
   bamdude-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl is-active bamdude-relay.service
   bamdude-runner ALL=(ALL) NOPASSWD: /bin/systemctl restart bamdude-relay
   bamdude-runner ALL=(ALL) NOPASSWD: /bin/systemctl restart bamdude-relay.service
   bamdude-runner ALL=(ALL) NOPASSWD: /bin/systemctl is-active bamdude-relay
   bamdude-runner ALL=(ALL) NOPASSWD: /bin/systemctl is-active bamdude-relay.service
   EOF
   sudo visudo -c -f /etc/sudoers.d/bamdude-relay  # expect: parsed OK
   ```

   Sudoers compares paths *literally*, so both `/usr/bin/systemctl` and `/bin/systemctl` are listed — modern Debian/Ubuntu after usrmerge have `/bin` as a symlink to `/usr/bin`, but the sudoers rule still has to spell out the exact resolved path that's in the runner's `PATH` at deploy time. Listing both covers either resolution. Verify the rule works:

   ```bash
   sudo -u bamdude-runner sudo -n systemctl restart bamdude-relay
   sudo systemctl is-active bamdude-relay  # active
   ```

   Both commands should succeed with no password prompt; if either prompts, double-check `which systemctl` and the file you wrote.

5. **Wire nginx:** the existing `deploy/nginx.conf` shipped with this repo gained a `location /api/bug-report` block + a `location /bug-attachments/` block. Reload after deploy:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **Cloudflare Cache Rule** — explicitly bypass cache for `/api/bug-report*` so retries don't hit a stale 502 response. Bypass for `/bug-attachments/*` is not strictly required (GitHub fetches the image via the public URL when rendering the issue, then caches it on its own CDN — Cloudflare can cache the image freely thereafter).

7. **Nightly screenshot pruning** (optional but recommended — issues stay open for months, image files grow):

   ```bash
   echo '0 4 * * * root find /opt/bamdude-relay/screenshots -type f -mtime +90 -delete' \
     | sudo tee /etc/cron.d/bamdude-relay-prune
   ```

### Subsequent updates

The deploy workflow rebuilds + restarts the relay automatically on every push to `main`. Manual override:

```bash
sudo systemctl restart bamdude-relay
```

### Logs

```bash
sudo journalctl -u bamdude-relay -f
```

## Generating the GitHub PAT

Use a **fine-grained** token, not a classic PAT:

1. GitHub → Settings → Developer settings → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Resource owner:** `kainpl`.
3. **Repository access:** "Only select repositories" → `kainpl/bamdude`.
4. **Permissions** → **Repository permissions** → **Issues**: `Read and write`. Everything else stays "No access".
5. **Expires:** 1 year (calendar reminder for renewal).
6. Copy the token into `/etc/bamdude-relay.env` as `GITHUB_PAT`.

If the token leaks (e.g. you accidentally committed `.env`), revoke it from the token list page and issue a new one — blast radius is limited to the issues API on a single repo.

## Operational hygiene

- **Rate limiting** is per-IP via `@fastify/rate-limit`. The default 10/hour absorbs honest retries (the BamDude client-side limit is 5/hour) without leaving the door wide open. Behind Cloudflare with `trustProxy: true`, Fastify reads the original IP from `CF-Connecting-IP` / `X-Forwarded-For`.
- **CORS** is unrestricted by default — every BamDude install runs on a different LAN/VPN URL so origin isn't a useful auth signal. The PAT scope (issues only, single repo) is the actual blast-radius control.
- **No PII written to disk** outside the optional screenshot. The relay does not log request bodies (Fastify's default `info` level only logs request/response metadata + status). Screenshots are fire-and-forget — no DB, no metadata file, no link back from the image to the issue beyond what's embedded in the issue body itself.
- **Privacy contract with BamDude:** the support_info structure is sanitized client-side; the relay does not re-sanitize. If you ever notice an issue body containing data that should have been stripped, fix the sanitization in BamDude (`backend/app/api/routes/support.py::_get_recent_sanitized_logs` + `_collect_support_info`), not in the relay.
