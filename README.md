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

1. In the Vercel dashboard → your project → **Storage** tab → **Browse Marketplace** → choose **Redis** (by Upstash) → create a database and connect it to this project. This auto-adds `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars to your project. (Vercel's own "KV" product is deprecated — Upstash Redis is the replacement and works the same way.)
2. Add two more env vars under **Settings → Environment Variables**:
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`
   - `ADMIN_SECRET` — generate the same way; keep this private, it's your admin password for creating accounts
3. Redeploy.

### Adding a new CR / faculty account

After someone messages you on WhatsApp and you've confirmed they're a CR or
faculty member, create their login by calling the admin endpoint once
(from your terminal, Postman, etc.):

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
