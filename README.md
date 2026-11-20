# Orderly

**A line, not a calendar.**

Orderly turns one link into a line. Visitors take a ticket, always see their place, and the host reaches each person in the app they already use: WhatsApp, Telegram, Signal, phone or email. Orderly never sends a message on the host's behalf. The Reach button opens the host's own app, and the host writes the message.

## Features

- One link per host, such as `orderly.example/<slug>`, with a live availability check when claiming it.
- Tickets that keep their place. Leaving moves everyone behind up, and nobody is renumbered.
- A host dashboard with the next person, a Reach button, Done, and Undo.
- A visitor ticket with a live place in line, a QR code, and Leave and rejoin.
- Sign-in with Google or an emailed link. No passwords.
- Contact details are blanked 30 days after a ticket closes.

## Quick start

You need either Docker or Node.js 24 or later.

**With Docker**

```bash
SESSION_SECRET=$(openssl rand -hex 32) docker compose up --build
```

Open http://localhost:3000. The container runs in production mode, so sign-in needs Google keys or an SMTP server (see [Configuration](#configuration)). For sign-in with no setup, run it without Docker.

**Without Docker**

```bash
npm install
npm run build:web
DEV_LOGIN=1 npm run dev
```

Open http://localhost:3000 and sign in with any name. `DEV_LOGIN=1` shows a development sign-in form, and the server refuses to start with it on in production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs the server and restarts it on change. |
| `npm run build` | Compiles the server to `dist/`. |
| `npm run build:web` | Builds the React app into `web/dist`. |
| `npm start` | Runs the compiled server. |
| `npm test` | Runs the test suite. |

## How it works

One Node.js process serves the JSON API under `/api`, the sign-in routes, and the built React app. All data lives in one SQLite file in WAL mode.

- **Tickets.** Each ticket gets a random token. The link carries the token, and the database stores only its SHA-256 hash, so the token is the only credential a visitor needs.
- **Accounts.** A host is matched by Google ID or by verified email, so Google and email sign-in reach the same line.
- **Email sign-in.** Each link works once and expires after 15 minutes. Only its hash is stored. Without `SMTP_URL` in development, the link is printed to the console.
- **Sessions.** Cookies are signed with HMAC-SHA256. There is no session table.
- **Rate limit.** Each IP can take 5 tickets per 10 minutes. The limit is kept in memory.
- **Cleanup.** An hourly job blanks the contact details of tickets closed more than 30 days ago. The rows stay, so counts still add up.

## Project layout

| Path | What it holds |
|---|---|
| `src/` | The server. `app.ts` sets up Express, `queue.ts` holds the line rules, `routes/api.ts` is the JSON API, `routes/auth.ts` handles Google and email sign-in, `loginlinks.ts` and `email.ts` handle the sign-in links, `db.ts` holds the schema, and `contact.ts` validates contact details and builds Reach links. |
| `web/` | The React 19 front end, built with Vite and Tailwind. `src/lib/store.tsx` talks to `/api`, and `src/screens/` has one file per screen. |
| `public/` | The stylesheet for the server-rendered `/login` page. |
| `test/` | Queue rules and an end-to-end test of the main flow. |
| `scripts/start.sh` | Container entrypoint. Adds Litestream replication when a bucket is configured. |
| `Dockerfile`, `compose.yaml`, `litestream.yml`, `fly.toml` | Container and deployment configuration. |

## Configuration

| Variable | Purpose |
|---|---|
| `BASE_URL` | The public URL. Used in sign-in links and the Google redirect. |
| `SESSION_SECRET` | Signs the session cookie. Required in production, at least 32 characters. |
| `DEV_LOGIN=1` | Shows a development sign-in form. Refused in production. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in. The redirect URI is `BASE_URL/auth/callback`. |
| `SMTP_URL`, `EMAIL_FROM` | Sends sign-in links, for example `smtp://user:pass@host:587` and `Orderly <login@example.com>`. Required in production for email sign-in. |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot check. The server verifies the token when the secret is set. |
| `TRUST_PROXY=1` | Trust one proxy hop, so the rate limit sees the real client IP. |
| `PORT`, `DB_PATH` | Port (default 3000) and database file (default `./data/doorin.db`). |
| `LITESTREAM_BUCKET`, `LITESTREAM_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Continuous backup of the database to an S3-compatible bucket. Optional. |

## Deploying to Fly.io

[fly.toml](fly.toml) runs one machine with the database on a volume. One machine is deliberate: SQLite lives on that volume, and the rate limit is in memory.

Pushes to `main` run the tests and deploy, using the `FLY_API_TOKEN` repository secret.

First-time setup:

```bash
fly apps create <name>                          # then match app and BASE_URL in fly.toml
fly volumes create data --region fra --size 1   # same region as primary_region
fly storage create                              # note the bucket name it prints
fly secrets set LITESTREAM_BUCKET=<bucket-name> SESSION_SECRET=$(openssl rand -hex 32) SMTP_URL=... EMAIL_FROM=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
fly deploy
```

## Testing

```bash
npm test
```

The tests cover the line rules (places, leaving, per-host lines), the 30-day contact cleanup, sign-in link rules (single use, expiry), slug and contact validation, and one end-to-end run through the HTTP API: a host makes a link, a visitor takes a ticket, and the host finishes it.

## License

Apache License 2.0. See [LICENSE](LICENSE).
