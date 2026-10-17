# KES Codebase Map & Developer Handoff Guide

This guide enables new frontend, backend, and full-stack contributors to immediately navigate, understand, and safely modify the codebase.

---

## 1. Quick Navigation Sitemap

```text
KIIT-Eletrical-Society-Website/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes, Global Styles)
│   ├── admin/            # Admin workspace pages (/admin/login, /admin/applications, /admin/reset-password)
│   ├── api/              # Backend API Route Handlers (/api/join/*, /api/admin/*, /api/content/*)
│   ├── join/             # Recruitment application page (/join)
│   ├── portal/           # Reserved member portal (unreachable in production via *.prod.js)
│   ├── error.js          # Global 500 error boundary
│   ├── not-found.js      # Global 404 open-circuit page
│   ├── layout.js         # Root HTML layout, SEO metadataBase, theme provider
│   └── page.js           # Public KES Homepage
├── components/           # Reusable UI Components
│   ├── admin/            # Admin applications workspace, login form, review controls
│   ├── join/             # Join KES recruitment wizard & verification flow
│   ├── projects/         # 17-Project catalogue, project dialog, detail viewer, image stage
│   ├── SignalFlowHero.js # Orthogonal circuit canvas visual
│   ├── KesTimeline.js    # Chronology of technical milestones
│   ├── SiteHeader.js     # Desktop horizontal navigation & mobile Section Index drawer
│   └── SiteFooter.js     # Institutional footer & legal credits
├── lib/                  # Business Logic & Infrastructure (Backend, Auth, CMS, Shared)
│   ├── admin/server/     # Admin authentication, session cookies, RBAC, CSV export
│   ├── backend/          # MongoDB connection pool, collection schemas, indexes, HTTP utils
│   ├── cms/              # Hybrid CMS service, MongoDB sync, static fallback
│   ├── join/server/      # OTP generation/HMAC verification, application storage, mailer
│   ├── notifications/    # Durable email jobs runner, retry scheduler, message templates
│   ├── projects/         # Authoritative 17-project catalogue data & categories
│   └── content.js        # Public factual society records, leadership, events, media registry
├── scripts/              # Automation & Tooling
│   ├── operational/      # Production operations (admin provisioning, DB setup, job processing, env check)
│   └── verify/           # Operational smoke checks (10 automated security & concurrency scenarios)
├── tests/                # Automated Node.js Test Suite (82 specifications)
├── docs/                 # Architectural, deployment, security, and operational documentation
└── public/               # Static assets, WebP event photography, and icons
```

---

## 2. Where to Edit What

### Frontend Developers
| Task | Target Files |
| :--- | :--- |
| **Homepage Layout & Sections** | `app/page.js` |
| **Hero Visual / Circuit Canvas** | `components/SignalFlowHero.js` |
| **Milestone Timeline** | `components/KesTimeline.js` |
| **Header, Nav Links, Drawer** | `components/SiteHeader.js` |
| **Project Catalogue Cards/Modal** | `components/projects/` |
| **Join KES Application Form** | `components/join/JoinFlow.js` |
| **Design Tokens & Palette** | `app/tokens.css` |
| **Component Stylesheets** | `app/navigation-hero.css`, `app/projects-events.css`, `app/project-catalogue.css`, `app/join/join.css` |

### Backend Developers
| Task | Target Files |
| :--- | :--- |
| **API Endpoints** | `app/api/join/`, `app/api/admin/`, `app/api/content/` |
| **MongoDB Connection & Pool** | `lib/backend/mongo.mjs` |
| **Database Schemas & Indexes**| `lib/backend/indexes.mjs` |
| **Admin Authentication & RBAC**| `lib/admin/server/service.mjs`, `lib/admin/server/http.mjs` |
| **Password Hashing (Argon2id)**| `lib/admin/server/passwords.mjs` |
| **OTP Generation & Verification**| `lib/join/server/verifier.mjs`, `lib/join/server/store.mjs` |
| **Application Persistence & Rules**| `lib/join/server/applications.mjs`, `lib/join/server/submission.mjs` |
| **Brevo SMTP & Email Delivery**| `lib/join/server/mailer.mjs`, `lib/notifications/runner.mjs` |
| **Email Templates & Selection Links**| `lib/notifications/jobs.mjs` |
| **CMS Publishing Service** | `lib/cms/service.mjs` |

---

## 3. Key Architectural Boundaries
1. **Never import `lib/backend` or `lib/*/server` in a client component.** Any file under `server/` is marked `import "server-only";` and will trigger a build error if bundled into the client.
2. **Never expose secrets.** Private environment variables (`ADMIN_SECRET`, `JOIN_SECRET`, `SMTP_PASS`, `MONGODB_URI`) must never have the `NEXT_PUBLIC_` prefix.
3. **Preserve factual content.** Society motto ("Build small, think big."), 17-project catalogue, and historical milestones must remain exact.
