# QV Girls Basketball Boosters Website

Astro + Tailwind site for [qvgirlsbasketball.org](https://qvgirlsbasketball.org).

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:4321 to view.

## Tech Stack

- **Astro 5** with content collections (MDX for sponsors and news)
- **Tailwind CSS** with QV palette (black + PMS 1235 gold)
- **Fonts:** Oswald (display) + Inter (body) via Google Fonts
- **Hosting:** Vercel
- **Domain:** Namecheap → Vercel
- **Forms:** Formspree (contact form, free tier)

## Project Structure

```
src/
  components/      Nav.astro, Footer.astro
  content/
    config.ts      Schema for sponsors and news collections
    sponsors/      One MDX file per sponsor
    news/          Blog posts / recaps
  data/
    schedule.json  Game schedule (edit to update)
  layouts/
    Layout.astro   Base layout with nav, footer, meta tags
  pages/
    index.astro    Home
    sponsors.astro
    schedule.astro
    gallery.astro
    donate.astro
    contact.astro
    news/
      index.astro  News list
      [slug].astro Dynamic post route
  styles/
    global.css     Tailwind + global styles
public/
  images/          All images (hero, sponsors, gallery)
```

## Common Tasks

### Add a new sponsor
1. Create a new file in `src/content/sponsors/`, e.g. `acme-corp.mdx`
2. Use this template:
   ```yaml
   ---
   name: "Acme Corp"
   contact: "Jane Doe"
   tier: "champion"    # elite_team | champion | game_changer | all_star | super_fan
   amount: 1000
   year: 2026
   ---
   ```
3. Commit and push. The sponsor appears on `/sponsors` and may appear on the home page.

### Add a news post or game recap
1. Create a new file in `src/content/news/`, e.g. `vs-beaver-recap.mdx`
2. Use this template:
   ```yaml
   ---
   title: "Recap: QV vs Beaver"
   date: "2026-01-16"
   author: "Coach Lastname"
   excerpt: "One sentence summary for the news index and OG card."
   image: "/images/news/beaver-game-hero.jpg"   # optional
   draft: false
   ---

   Markdown body goes here.
   ```

### Update the schedule
Edit `src/data/schedule.json`. Each entry:
```json
{
  "date": "2026-02-05",
  "opponent": "Avonworth",
  "location": "QV High School",
  "time": "7:00 PM",
  "homeAway": "home",
  "result": "W 52-44"
}
```
Add `result` to past games. Future games (no result) auto-appear in Upcoming.

### Add gallery photos
1. Drop images in `/public/images/gallery/`
2. Edit the `photos` array in `src/pages/gallery.astro`

## Deployment

Vercel auto-deploys on push to `main`.

### First-time setup
1. Push repo to GitHub.
2. Import in Vercel (Add New → Project → import from GitHub).
3. Vercel auto-detects Astro. No config needed.
4. In Vercel project settings → Domains, add `qvgirlsbasketball.org` and `www.qvgirlsbasketball.org`.
5. In Namecheap DNS, follow Vercel's instructions (typically: A record `@` → 76.76.21.21, CNAME `www` → `cname.vercel-dns.com`).

### Contact form
1. Sign up at [formspree.io](https://formspree.io) (free tier: 50 submissions/mo).
2. Create a new form, point it to `boosters@qvgirlsbasketball.org` (or your preferred address).
3. Copy the form ID and replace `YOUR_FORM_ID` in `src/pages/contact.astro`.

### Venmo QR
Replace `/public/images/venmo-qr.png` with the actual QR code from the Venmo app (Profile → Share → Save QR). Update the handle in `src/pages/donate.astro`.

## Brand Guidelines

- **Colors:** Black (#0A0A0A) + Gold (#FFB81C, PMS 1235)
- **Fonts:** Oswald (display, all caps), Inter (body)
- **Tone:** Warm, community-focused, never corporate. No buzzwords.
- **Avoid:** Em-dashes, "leverage," "world-class," competitor mentions.

## What's Not Built Yet

- [ ] Actual hero photos (currently text-only hero with gradient)
- [ ] Real Venmo QR code and handle
- [ ] Roster page (intentionally deferred per launch scope)
- [ ] Real Instagram handle in Footer + Gallery (currently links to instagram.com)
- [ ] Real schedule (placeholder games included)
- [ ] Custom favicon and OG image
- [ ] Formspree form ID

## Maintenance Notes

This site is intended to be maintained via Claude Code rather than directly in the codebase. To make a change, open a Claude Code session in this repo and describe what you want updated. Examples:

- "Add a new sponsor: Pittsburgh Plumbing, Joe Smith, Silver tier, $500"
- "Update the schedule with the result from the Beaver game: W 52-44"
- "Add a news post about senior night with this text: ..."

Claude Code will edit the right files, run a build to verify nothing's broken, and push to main, which triggers a Vercel deploy.
