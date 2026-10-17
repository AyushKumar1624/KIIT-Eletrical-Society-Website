# Team Ownership & Code Responsibility Guide

To enable parallel collaboration between Frontend and Backend engineers without merge conflicts or security regressions, the codebase defines the following area boundaries.

---

## 1. Team Responsibilities

```text
┌───────────────────────────────────────────────────────────────┐
│                     FRONTEND TEAM OWNERSHIP                   │
├───────────────────────────────────────────────────────────────┤
│ • app/page.js, app/layout.js, app/error.js, app/not-found.js  │
│ • app/*.css (tokens, navigation-hero, projects-events, etc.)  │
│ • components/ (SignalFlowHero, KesTimeline, SiteHeader, etc.) │
│ • public/ (icons, media images, webp assets)                  │
│ • lib/content.js (Public layout registry & media references)  │
│ • Accessibility, animations, responsive design, touch targets │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     BACKEND TEAM OWNERSHIP                    │
├───────────────────────────────────────────────────────────────┤
│ • app/api/ (All route handlers under /api/join, /api/admin)   │
│ • lib/backend/ (MongoDB pooling, schemas, indexes, HTTP)      │
│ • lib/admin/server/ (Argon2id, session CAS, RBAC, CSV export) │
│ • lib/join/server/ (OTP, institutional domains, application)  │
│ • lib/notifications/ (Durable jobs, SMTP mailer, runner)      │
│ • lib/cms/ (CMS MongoDB collections and published queries)    │
│ • scripts/operational/ (Job processor, DB setup, admin CLI)   │
│ • tests/ (Unit, integration, e2e, and security suites)        │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Invariant Rules for Both Teams

1. **Frontend Rule:** Frontend components must never connect to MongoDB or send emails directly. All data access must pass through public API routes (`/api/content/[type]`, `/api/join/*`, `/api/admin/*`).
2. **Backend Rule:** Backend API routes must never return unverified or internal-only data (such as passwords, HMAC hashes, unpublished drafts, or admin notes) to public endpoints.
3. **Shared Contracts:** Changes to payload schemas (e.g., in `/api/join/applications` or `/api/admin/applications`) require sign-off from both frontend and backend leads.
4. **Zero Secret Leakage:** Never commit secrets, `.env.local` files, or production credentials to Git. Run `npm run production:check` before any commit.
