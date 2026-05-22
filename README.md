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

## Features

- Roll number + session input
- Fetches latest semester result from BPUT
- Print result
- Download as PDF
- Download share card as image (with bputnotes.in watermark)
- Copy shareable link
- Mobile-first, fully responsive
