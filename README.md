# KIIT Electrical Society — public website

Next.js (App Router) site for KIIT Electrical Society (KES). Motto: **Build small, think big.**
Theme: Edison-era engineering elegance.

## Run

```bash
npm install
npm run dev -- -p 3110
```

## Where things live

- `lib/content.js` — all copy and data: nav, projects, events, team, gallery, contact, and the `MEDIA` registry (every image with its source file).
- `app/page.js` — homepage sections: hero, about, domains, projects, events, team, gallery, contact.
- `app/join/page.js` + `components/join/JoinFlow.js` — **Join KES**: KIIT institutional email → one-time code → five-step membership application. Email verification is connected (`app/api/join`, SMTP); application submission is not yet. Setup, environment variables and server rules: `docs/join-kes-integration.md` and `.env.example`. Developer preview: `npm run dev`, then `/join?preview=1`.
- `app/portal/**/*.demo.js` — the member portal, kept for future development with fictional, browser-local records; see `docs/member-portal-phase-1.md`. Not publicly reachable.
- `app/portal/**/*.prod.js` — what every `/portal` address serves: a short noindex "not available" page pointing to Join KES (`components/PortalUnavailable.js`).

### Portal gate

`next.config.mjs` chooses the portal files with `pageExtensions`: by default — in `npm run dev` and `next build` alike — it compiles `*.prod.js`, so no portal screens or fictional records are reachable or bundled. A developer can set `NEXT_PUBLIC_PORTAL_DEMO=true` to work on the portal locally; never set it for a public build.
- `components/SiteHeader.js` — responsive header; mobile menu supports touch, Escape, focus trap and active-section highlighting.
- `components/Drawings.js` — patent-drawing SVG line art.
- `app/globals.css` — palette tokens and all styles.
- `scripts/prepare-media.mjs` — regenerates WebP copies of the local photos (Downloads, Desktop).
- `scripts/prepare-drive-media.mjs <folder>` — converts photos downloaded from the society Google Drive into `public/media`.

## Photography

40 photographs were selected from the society Drive folders (Kreative Kontrol 3.0, KES_DarkRoute, Project Expo, KES Workshop, KSHITIJ_2026), downloaded at 2400px and saved as 1600px WebP (40–280 KB each). No photograph appears twice on the site: each image slot (hero, About, project cards and their details, event rows and details, team, gallery) uses a different photo. Every file’s Drive folder and original filename is recorded in `MEDIA` in `lib/content.js`. Kreative Kontrol 3.0 camera photos are credited to @alpha.vs_. All event photographs were confirmed cleared for public use by KES on 14 Oct 2026.

## Typography & spacing system

All shared values live in `app/tokens.css` (loaded first, used by the public site and the portal). Change a value there, not in a component.

- **Typefaces by role**: `--font-display` (Cormorant Garamond) for major headings only; `--font-text` (Manrope) for body text and controls; `--font-label` (Manrope, semibold) for eyebrows, metadata and captions. No monospace font is loaded.
- **Type scale**: `--text-xs` 13px is the floor for any readable text; then `--text-sm` 14px, `--text-base` 16px (portal body), `--text-md` 17px (site body), `--text-lg`, `--text-xl`, `--text-2xl`, `--text-display`, `--text-hero`.
- **Tracking**: `--track-label` (0.06em) for labels, `--track-display` for display type. Capitals are kept only for short eyebrow labels; italics only for emphasis inside display headings and the motto.
- **Layout**: `--content-max` 1280px, `--content-text` 68ch reading measure, `--gutter` 20–56px, `--section-y` 64–112px, `--section-head-gap` (heading → content), `--grid-gap` between cards, `--space-1`…`--space-10` (4px base).
- **Surfaces**: `--card-pad`, `--radius-sm` 4px (controls), `--radius-md` 8px (cards, photos), `--radius-lg` 14px (feature panels), `--border-hair` / `--border-strong` / `--border-on-dark`.

`app/system.css` (loaded last) applies these to the shared public components; the portal applies them at the end of `app/portal/portal.css`.

## Motion

The homepage motion language is "Edison": light, current and photographic prints. All of it lives in `app/experience.css`, `components/BootSequence.js`, `components/Reveal.js` and `components/ScrollFx.js`.

- **Loading — Filament ignition (~1.7 s):** current runs in along two wires, the bulb draws, the filament flickers on, then light floods out from the bulb and the hero takes its cue. Plays on the homepage once per browser session, never when opening a section link (`/#events`). A click, scroll or key skips it. It is CSS-timed and a head-script safety net removes it after 3.5 s, so content is never held back.
- **Scrolling:** content rises in a staggered sequence as it enters; section titles reveal behind a mask while the brass kicker rule draws; photographs "develop" from sepia; gentle parallax on the hero and about photos; a brass progress line along the top edge; a back-to-top switch with a progress ring. Nothing is hidden in advance: elements animate only at the moment they enter the viewport.
- **Interaction:** cursor spotlight on cards (mouse/pen), a slight tilt of the hero photo toward the pointer, a glint across brass buttons and a firm press state.

Reduced motion (the OS setting) turns all of this off: no loading screen, no reveals, tilt or parallax. The progress line and back-to-top button stay because they carry information. For previewing on a reduced-motion machine, add `?motion=on` (or `?motion=off`) to any URL — it applies for the browser tab — and `?intro=1` replays the loading animation.

## Team

`TEAM` lists the 2026–27 office bearers announced on the society Instagram (2 Sep 2026). Portraits are cropped from the official posters by `scripts/prepare-team-portraits.mjs <folder>`; the source post and slide for each is recorded in `MEDIA`.

## Events

`EVENTS` in `lib/content.js` drives the past-events ledger. Each event has a short `summary` and a `details` object (overview, facts, programme, highlights, rules, photos, note) shown when the row is expanded. Rows are native `<details>` elements, so they work with touch, keyboard and screen readers; `/#ev-<id>` links straight to an opened event. The 2025 events, project archive, faculty mentors, alumni and contact email come from the previous site (kes-v2.vercel.app).

## Temporary content

Anything that still needs replacing or confirming is marked `temporary: true` in `lib/content.js`:

- `JOIN`: email verification works once `JOIN_SECRET` and SMTP settings are configured; application submission still needs a destination (`docs/join-kes-integration.md`). The member portal is withdrawn from public view.
- `PROJECTS`: four project streams from real events; individual write-ups, teams and photos are still to come.
- `TEAM` / `FACULTY`: confirmed office bearers and faculty only. Dr. Shubhasri Kundu is Faculty In Charge; Dr. Manoj Kumar Maharana is Founding Faculty.
- `PROJECTS`: individual project titles, teams and results.
- `EVENTS`: DarkRoute (date, format), the power-supply workshop (date, venue, speaker) and KSHITIJ 2026 (competition, result).

The original logo (`public/kes-logo.jpeg`) is kept unaltered; its wording matches the motto.

## Verification and production preview

```bash
npm run lint
npm test
npm run build
npm run start -- --port 3001
```

Then open `http://localhost:3001/` and `/join`. Without `JOIN_SECRET` and SMTP settings the join page says online applications aren't open yet (`npm run dev` instead prints codes to the server console); `/portal` shows the "not available" page. To review every join step, use `npm run dev` and open `/join?preview=1`. In another terminal, run `node scripts/audit-site.mjs http://localhost:3001` to check local page routes, registered assets and linked CSS/fonts.

See `docs/verification.md` for the responsive/accessibility audit and exact remaining content and integration requirements. Set `NEXT_PUBLIC_SITE_URL` to the approved public address before a future release; no deployment is part of this work.
