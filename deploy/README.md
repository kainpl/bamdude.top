# Deploy

The site is built **on the production server itself** by a self-hosted GitHub Actions runner that listens for `main`-branch pushes, then rsync's the static build into the nginx web root. Cloudflare sits in front of nginx (proxied DNS, `Full (Strict)` SSL).

No SSH key in GH Secrets, no `ssh-keyscan` round-trip — the runner is already on the host, so the deploy is a local file copy. PR validation runs separately on `ubuntu-latest` so external builds never touch the production box.

## Pipeline

```
push to main → .github/workflows/deploy.yml
              └─ self-hosted runner (label: www-deploy)
                 ├─ checkout
                 ├─ npm ci
                 ├─ npm run typecheck
                 ├─ npm run lint
                 ├─ npm run test
                 ├─ npm run build           # -> ./dist
                 ├─ rsync -a --delete ./dist/ → $DEPLOY_PATH
                 └─ purge Cloudflare cache  # optional, only if CF secrets are set

push to dev  ┐
PR to main   ┼→ .github/workflows/ci.yml
PR to dev    ┘  └─ ubuntu-latest (GitHub-hosted)
                 └─ npm ci → typecheck → lint → test → build (no deploy)
```

## Required GitHub secrets

Set under **Repo → Settings → Secrets and variables → Actions** (Repository secrets).

| Secret | Required | Description |
| --- | --- | --- |
| `DEPLOY_PATH` | yes | Absolute path on the server where the static build lands (rsync target). E.g. `/var/www/bamdude.top`. The runner user must own this path so rsync can write without sudo. |
| `PUBLIC_GA_ID` | optional | Google Analytics 4 measurement ID (`G-XXXXXXXXXX`). Without it, gtag.js never loads even after the user accepts the cookie banner. The site still ships fine; just no analytics. |
| `CLOUDFLARE_ZONE_ID` | optional | Cloudflare zone ID for `bamdude.top` — needed only for the cache-purge step. Skip both CF secrets to leave caching to TTL expiry (HTML is `max-age=300` so a stale page clears within 5 minutes anyway). |
| `CLOUDFLARE_API_TOKEN` | optional | API token scoped to **Zone → Cache Purge → Purge** for the same zone. |

## One-time server setup

If you already have the docs.bamdude.top runner set up, most of this is the same shape — you just need a *second* runner registered against this repo with a different label. The runner user can be the same (`bamdude-runner`) or new; a single user with multiple registered runners is fine.

### 1. Site directory

```bash
sudo mkdir -p /var/www/bamdude.top
# nginx (www-data) reads it; the runner user (created/reused in step 2) writes it.
sudo chown -R bamdude-runner:www-data /var/www/bamdude.top
sudo chmod -R 750 /var/www/bamdude.top
```

### 2. Self-hosted runner

Run the runner under an unprivileged user — never `root`, and never your personal account. If you already created `bamdude-runner` for the docs deploy, reuse it.

```bash
# Skip if the user already exists from the docs setup.
sudo useradd --system --create-home --shell /bin/bash bamdude-runner
sudo -u bamdude-runner -i

# Use a different directory so it doesn't clash with the docs runner's
# actions-runner/ folder.
mkdir runner-www && cd runner-www
```

Get the latest runner release URL from **Repo → Settings → Actions → Runners → New self-hosted runner** — the page shows the exact `curl` + `tar` + `./config.sh` commands for your OS, including a one-time registration token. The token is repo-scoped, so you can't reuse the docs token here.

```bash
# Example — replace VERSION + REGISTRATION_TOKEN with values from the
# repo's runner-add page.
curl -o actions-runner.tar.gz -L \
  https://github.com/actions/runner/releases/download/vVERSION/actions-runner-linux-x64-VERSION.tar.gz
tar xzf ./actions-runner.tar.gz

# Add the www-deploy label so the workflow's `runs-on` selector targets
# this runner specifically. Linux + self-hosted are added by default.
./config.sh \
  --url https://github.com/kainpl/bamdude.top \
  --token REGISTRATION_TOKEN \
  --name www-deploy-prod \
  --labels www-deploy \
  --unattended
```

Install as a systemd service so it survives reboots. The svc.sh installer derives the unit name from the runner config in the current directory, so two runners under the same user end up as two distinct services as long as they live in different folders:

```bash
exit  # leave bamdude-runner shell — svc.sh install needs root
cd /home/bamdude-runner/runner-www
sudo ./svc.sh install bamdude-runner
sudo ./svc.sh start
sudo ./svc.sh status   # should show "active (running)"
```

The runner now appears as **Idle** under **Repo → Settings → Actions → Runners**.

### 3. Node on the runner

`actions/setup-node` provisions Node 20 into the runner's tool cache on first run (downloads from `actions/node-versions`, works out of the box on Linux distros with `glibc 2.31+` — covers Ubuntu 20.04+ / Debian 11+). **You usually don't need to do anything on the server.** The first workflow run fetches Node and caches it for subsequent runs.

The `cache: npm` option in setup-node persists `~/.npm` between runs, so subsequent `npm ci` invocations pull from the local cache instead of the registry — typical CI run after the first is ~10 s of dep-install vs ~60 s.

### 4. nginx server block

The repo ships a tested `deploy/nginx.conf`. Copy it in:

```bash
sudo cp /path/to/clone/deploy/nginx.conf /etc/nginx/sites-available/bamdude.top
sudo ln -s /etc/nginx/sites-available/bamdude.top /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The config expects the Cloudflare Origin CA cert at `/etc/ssl/cloudflare-origin/bamdude.top.{pem,key}` — see the next section for issuing it. If you'd rather use Let's Encrypt, swap the `ssl_certificate` lines for the LE paths.

## Cloudflare settings

DNS:
- `A` record for `bamdude.top` → server IP, **Proxied (orange cloud)**.
- `CNAME` for `www` → `bamdude.top`, also **Proxied**.

SSL/TLS:
- Encryption mode: **Full (strict)** — requires a valid origin cert. Use the **Cloudflare Origin CA cert** (Dashboard → SSL/TLS → Origin Server) for a free 15-year cert that chains to a CF root only Cloudflare trusts. Save the cert + key into `/etc/ssl/cloudflare-origin/bamdude.top.{pem,key}` (the paths the nginx config expects).
- Always Use HTTPS: **on**.
- Automatic HTTPS Rewrites: **on**.
- TLS 1.3: **on**.

Caching:
- Browser Cache TTL: **Respect Existing Headers** (the nginx block already sets sensible per-asset headers).
- A cache rule for `/_astro/*` with `Edge Cache TTL: 1 month` is enough — html stays at the default short TTL set by the nginx headers.

## Cache-purge token (optional)

The cache-purge step in `deploy.yml` skips itself when `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_API_TOKEN` aren't set. To enable:

1. Cloudflare Dashboard → My Profile → API Tokens → **Create Token**.
2. Use the **Zone → Cache Purge** template; restrict to the `bamdude.top` zone only.
3. Copy the generated token into the `CLOUDFLARE_API_TOKEN` GH secret.
4. Zone ID is on the zone overview page (right sidebar) — copy it into `CLOUDFLARE_ZONE_ID`.

Without these the html short-TTL (5 min, see nginx block) gets a stale page out within a few minutes anyway. CF purge just skips that wait.

## First deploy

The runner has to be Idle on the server before the first `main` push will land. After the runner is registered + the `DEPLOY_PATH` secret is set:

- **Trigger manually** — Repo → Actions → `deploy` → Run workflow → branch `main`.
- **Or push** — `git checkout main && git merge --ff-only dev && git push` runs the workflow automatically.

## Promoting `dev` → `main`

```bash
git checkout main
git merge --ff-only dev
git push
```

The `deploy` workflow runs on the `main` push and the runner copies the freshly-built site into `DEPLOY_PATH`. If `--ff-only` fails, rebase `dev` on `main` first.

## Manual deploy fallback

If the runner is offline and you need to ship a hotfix from a developer machine:

```bash
npm ci
npm run typecheck && npm run lint && npm run test && npm run build
rsync -avz --delete dist/ deploy@server:/var/www/bamdude.top/
```

## Security notes

- **The runner trusts whatever is in `main`.** Don't accept PRs into `main` from external contributors without review — anything that lands triggers a build that runs on your server. Self-hosted runners + public PRs is a known footgun. PRs land in `dev` first; only manual promotion (`merge --ff-only dev`) reaches `main`.
- **The runner user does NOT need sudo.** rsync writes inside `DEPLOY_PATH` which the runner user owns; nginx reads via group permissions (`www-data` group on the directory). Keep it that way — sudo on a runner is a privilege escalator if a workflow is ever compromised.
- **`PUBLIC_GA_ID` is intentionally a public value** — it ends up in HTML for visitors to see anyway. Storing it as a secret is just to keep it out of the repo, not because it grants any access.
- **CI runs PRs on GitHub-hosted `ubuntu-latest`**, never on the prod runner — even a malicious PR can't reach the server.
