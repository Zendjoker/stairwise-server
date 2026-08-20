# Deploying the Stairwise API to your VPS

## ⚠️ Read this first

**This VPS already hosts another website.** That means something is almost
certainly already using ports 80 and 443 (nginx, Apache, or another reverse
proxy, possibly in Docker). Everything below is written so it does **not**
touch that existing site or its config — the new API runs on an internal
port (`127.0.0.1:3001`) that nothing on the internet can reach directly, and
gets exposed to the world by *adding to* whatever already serves the
existing site, not replacing it.

**Ground rules for whoever runs this (Copilot, another agent, or you):**
- Never edit, delete, or overwrite a config file for the existing site.
- Never run `systemctl stop`/`restart` on nginx/Apache without testing the
  config first (`nginx -t` or `apachectl configtest`).
- Never run `docker compose down` in a directory that isn't this one — that
  would stop the *other* site's containers, not this project's.
- Before editing any existing config file, copy it first:
  `cp /etc/nginx/sites-available/whatever.conf /etc/nginx/sites-available/whatever.conf.bak`
- If genuinely unsure what something on the server does, stop and ask rather
  than guessing.

## Step 0 — Diagnose what's already running

SSH into the VPS and run these. Do not skip this — everything after depends
on the answer.

```bash
# What's listening on the web ports?
sudo ss -tlnp | grep -E ':80|:443'

# Is nginx installed and running?
systemctl status nginx 2>&1 | head -5

# Is Apache installed and running?
systemctl status apache2 2>&1 | head -5

# Are there other Docker containers already running (e.g. the existing site)?
docker ps
```

Match what you see to one of the branches below.

---

## Branch A — nginx is running natively (most common)

This is the typical setup: nginx installed via apt, existing site config in
`/etc/nginx/sites-available/`.

**1. Point the new subdomain at this server.** In your DNS provider for
gostairwise.com, add an A record: `api.gostairwise.com` → this VPS's IP.
Wait a few minutes for it to propagate.

**2. Set up the app itself** (same for every branch — see "Common steps"
below), which ends with the API running on `127.0.0.1:3001`.

**3. Add a new nginx site** — this is a *new file*, doesn't touch the
existing one:

```bash
sudo nano /etc/nginx/sites-available/api.gostairwise.com
```

```nginx
server {
    listen 80;
    server_name api.gostairwise.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.gostairwise.com /etc/nginx/sites-enabled/
sudo nginx -t          # MUST say "syntax is ok" before continuing
sudo systemctl reload nginx
```

**4. Get HTTPS for just this subdomain** (doesn't touch existing certs):

```bash
sudo apt install -y certbot python3-certbot-nginx   # skip if certbot already installed
sudo certbot --nginx -d api.gostairwise.com
```

Certbot edits only the `api.gostairwise.com` server block it just created.

**5. Verify:** `curl https://api.gostairwise.com/health` should return `{"ok":true}`.

---

## Branch B — Apache is running natively

Same idea as nginx, different syntax:

```bash
sudo nano /etc/apache2/sites-available/api.gostairwise.com.conf
```

```apache
<VirtualHost *:80>
    ServerName api.gostairwise.com
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/
</VirtualHost>
```

```bash
sudo a2enmod proxy proxy_http
sudo a2ensite api.gostairwise.com
sudo apachectl configtest    # MUST pass before continuing
sudo systemctl reload apache2
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d api.gostairwise.com
```

---

## Branch C — the existing site runs in Docker (its own reverse proxy container)

This needs one more piece of information before proceeding: what is the
existing reverse proxy container, and what Docker network is it on?

```bash
docker ps                                    # find the proxy container's name
docker inspect <proxy-container-name> | grep -A3 Networks   # find its network
```

Once you know the network name, the new `app` service needs to join it
instead of (or in addition to) being bound to a host port, so the existing
proxy can reach it by container name. Tell me the proxy's name/network and
I'll write the exact `docker-compose.yml` change and reverse-proxy config
for that specific setup — don't guess this part, wiring two separate Docker
Compose projects together depends on the specifics.

---

## Branch D — nothing is listening on 80/443 yet

If Step 0 genuinely shows nothing bound to those ports (the "existing
website" might be served some other way, e.g. only via a subdomain that
isn't live yet), it's safe to use `Caddyfile.example` — rename it to
`Caddyfile` and add a caddy service back to `docker-compose.yml` for
automatic HTTPS. Ask me and I'll restore that version. Only do this if
Step 0 is genuinely clear — if in doubt, use Branch A/B/C instead.

---

## Common steps (do this in every branch, before wiring the reverse proxy)

**1. Install Docker** (skip if `docker --version` already works):

```bash
curl -fsSL https://get.docker.com | sh
```

**2. Get the code onto the server:**

```bash
# Run this on your COMPUTER, not the VPS:
scp -r server root@<your-vps-ip>:/root/stairwise-server
```

**3. Configure secrets:**

```bash
cd /root/stairwise-server
cp .env.example .env
nano .env
```

Fill in:
- `POSTGRES_PASSWORD` — make up a strong password
- `DATABASE_URL` — same password, in the connection string
- `JWT_SECRET` — output of `openssl rand -hex 32`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — from Twilio Console
- `TWILIO_VERIFY_SERVICE_SID` — Twilio Console → Verify → Services →
  Create new → copy the SID starting with `VA`

**4. Start it:**

```bash
docker compose up -d --build
```

This builds the app image, starts Postgres, and starts the app — which
creates its database tables on boot. It does **not** touch ports 80/443 or
any other container on this server.

Confirm it's up, from inside the VPS (bypassing the reverse proxy entirely):

```bash
curl http://127.0.0.1:3001/health
```

You should see `{"ok":true}`. Only after this works, move on to the
branch-specific reverse-proxy step above.

**5. Seed sample data (optional, for testing):**

```bash
docker compose exec app npx tsx prisma/seed.ts
```

## Point the app at the real API

In the Expo project (on your computer, not the VPS):

```bash
EXPO_PUBLIC_API_URL=https://api.gostairwise.com npx expo start
```

## Updating later

```bash
cd /root/stairwise-server
# re-copy changed files (scp) or git pull if using git
docker compose up -d --build
```

This only rebuilds/restarts this project's containers — it does not affect
the existing site.
