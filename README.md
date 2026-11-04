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
    schedule.json     Varsity game schedule (edit to update)
    schedule-jv.json  JV game schedule (same format)
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
1. Create a new file in the season's folder, e.g. `src/content/sponsors/2026/acme-corp.mdx`
2. Use this template:
   ```yaml
   ---
   name: "Acme Corp"
   contact: "Jane Doe"               # optional
   tier: "champion"    # elite_team | champion | game_changer | all_star | super_fan
   amount: 1000
   year: 2026                        # fall the season starts (2026 = 2026-2027)
   website: "https://acme.com/"      # optional
   description: "One or two sentences about the business."   # optional
   address: "123 Main St, Sewickley, PA 15143"               # optional
   phone: "412-555-0100"             # optional
   ---
   ```
3. Commit and push. The sponsor appears on `/sponsors` and may appear on the home page.

### Start a new sponsorship season
1. Make a new folder, e.g. `src/content/sponsors/2027/`, and add that season's sponsors.
2. Change `CURRENT_SPONSOR_YEAR` in `src/lib/sponsors.ts`. The sponsors page, donate page, and home page all follow it, and last season's sponsors get a thank-you line on `/sponsors`.

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
An optional `note` shows under the opponent (for example "Scrimmage" or "WPIAL First Round").
JV games go in `src/data/schedule-jv.json` in the same format.
For a new season, replace both files and change `SEASON_LABEL` at the top of `src/pages/schedule.astro`.
The 2026-27 games came from QV's athletics calendar on ArbiterLive (linked from qvquakers.org).

### Youth league page (/youth)
The youth page shows the next 7 days of games and practices plus JV and Varsity standings.

- **Games and standings** update themselves. `.github/workflows/youth-data.yml` runs `scripts/fetch-gamechanger.mjs` every night at 5 AM ET and every half hour from 6 to 10 PM ET on Monday and Wednesday game nights. It reads GameChanger's public league pages (no login) and commits `src/data/youth/gamechanger.json` only when something changed, which makes Vercel redeploy.
- If GameChanger can't be reached or the data looks wrong (missing teams or games), the script changes nothing, the Action run fails, and GitHub emails the repo owner. The site keeps the last good data.
- To update right away: GitHub, Actions tab, "Update youth schedule", Run workflow.
- **Practices** are edited by hand in `src/data/youth/practices.json`: one entry per weekly slot. When a slot changes, add `until` to the old entry and a new entry with a `from` date. Set `confirmed` to `false` to keep a slot off the site. `skipDates` lists days QV schools are closed.
- GameChanger league pages: JV `s0rXscDEqehF`, Varsity `O95uji7lrSjE` (set in the script).

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
