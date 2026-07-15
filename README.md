# BPUT Result — result.bputnotes.in

A fast, clean result checker for BPUT students.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Add Your Banner

Replace `/public/banner.jpg` with your own college banner image.
Recommended size: **920×260px** (landscape, any college banner works).

## Update Sessions

Edit the `SESSIONS` array in `pages/index.js` when new sessions are available:

```js
const SESSIONS = [
  'Even-(2025-26)',   // ← add new sessions at the top
  'Odd-(2025-26)',
  'Even-(2024-25)',
  ...
]
```

## Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Deploy (zero config needed)
4. In Vercel project settings → **Domains** → Add `result.bputnotes.in`

## DNS Setup (at your registrar)

Add this CNAME record:

| Type  | Name   | Value            |
|-------|--------|------------------|
| CNAME | result | cname.vercel.app |

Wait 5–30 minutes for propagation.

## Project Structure

```
pages/
  index.js              ← Search page (home)
  result/[rollNo].js    ← Result page
  api/bput-result.js    ← API proxy to BPUT server
styles/
  globals.css           ← All styles
public/
  banner.jpg            ← Your banner image (replace this)
```

## Bulk Result Access (CR / Faculty only)

The solo result checker stays fully public. The bulk "Class Sweep" tool at
`/bulk` now requires login — there is **no public signup**. Accounts are
created only by the admin after verifying someone as a CR or faculty member
over WhatsApp.

### One-time setup

1. In the Vercel dashboard → your project → **Storage** tab → **Browse Storage** (or "Create Database") → **Upstash** → **Upstash for Redis** → create a database and connect it to this project. This auto-adds Redis credentials as env vars — Vercel may name them `KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` depending on the integration version; the code checks both, so either is fine. (Vercel's own "KV" product is deprecated — this Upstash integration is the replacement.)
2. Add two more env vars under **Settings → Environment Variables**:
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`
   - `ADMIN_SECRET` — generate the same way; keep this private, it's your admin password for creating accounts
3. Redeploy.

### Managing accounts — the Admin Panel

For day-to-day use (e.g. handing this off to an intern for a semester), go to:

```
https://results.bputnotes.in/admin
```

This page isn't linked anywhere in the public site — only people who know the
URL and the admin secret can reach it. On first visit it asks for the
**admin secret** (the `ADMIN_SECRET` env var); after entering it correctly,
it stays logged in for 8 hours. From there you can:

- **Add an account** — enter a username, password, and role (CR or Faculty), click Create.
- **See all existing accounts** — username, role, and when they were added.
- **Remove an account** — instantly revokes that person's bulk-checker access.

This is the intended way for someone else (e.g. an intern) to manage access
over time without needing a terminal or your admin secret shared repeatedly —
just give them the `/admin` URL and the secret once.

### Adding a new CR / faculty account via curl (fallback / scripting)

If you ever prefer the command line instead of the panel, you can still call
the endpoint directly:

```bash
curl -X POST https://result.bputnotes.in/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "adminSecret": "YOUR_ADMIN_SECRET",
    "username": "cr_cse_a_2022",
    "password": "give-them-a-strong-password",
    "role": "CR"
  }'
```

`role` must be `"CR"` or `"faculty"`. Share the username/password with them
directly (e.g. reply on the same WhatsApp thread). They log in at `/login`.

Sessions last 12 hours. There is no in-app way to change a password yet —
to reset one, just create the user again with a new password (it overwrites
via the same call only if you first delete the old one, or extend
`lib/auth.js` with an `updateUser` helper if you want a smoother reset flow).

## Features

- Roll number + session input
- Fetches latest semester result from BPUT
- Print result
- Download as PDF
- Download share card as image (with bputnotes.in watermark)
- Copy shareable link
- Mobile-first, fully responsive
