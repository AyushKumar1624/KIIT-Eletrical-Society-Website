# KIIT Electrical Society (KES) — Official Web Platform

The official web platform and administrative portal for the **KIIT Electrical Society (KES)**, School of Electrical Engineering, KIIT Deemed to be University, Bhubaneswar.

> **Motto:** *Build small, think big.*  
> **Visual Identity:** Deep laboratory green, warm brushed brass, institutional technical parchment, and orthogonal circuit diagrams.

---

## 1. Architecture & Technology Stack

- **Framework:** Next.js (App Router) v16.4.0 with React 19.
- **Runtime Environment:** Serverless Node.js 20.x on Vercel Edge/Serverless.
- **Database:** MongoDB Atlas (M0/M10 replica set) with cached connection pooling and strict indexes.
- **Authentication:** Administrator password hashing via **Argon2id** (`@node-rs/argon2`), stateless HMAC session cookies, and CAS version invalidation.
- **Applicant Identity:** Institutional email allowlist (22 KIIT domains) with atomic 6-character Crockford base32 OTP verification.
- **Email Delivery:** Durable MongoDB notification queue with background dispatch via **Brevo SMTP** (STARTTLS :587).
- **Styling & Motion:** Modern CSS tokens (`app/tokens.css`), responsive layouts, orthogonal canvas circuit graphics (`components/SignalFlowHero.js`), and full `prefers-reduced-motion` compliance.

---

## 2. Quick Start for Developers

### Prerequisites
- Node.js 20.x or 22.x LTS
- npm 10+
- Access to a MongoDB database (or Atlas cluster)
- SMTP credentials (e.g. Brevo)

### Local Setup
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Configure local environment variables
cp .env.example .env.local
# (Edit .env.local with your test MongoDB URI and test SMTP credentials)

# 3. Verify environment configuration
npm run env:check

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Automated Operational & Pre-Flight Commands

The platform includes automated scripts to eliminate manual operational errors:

```bash
# Pre-flight production readiness check (runs secret scanning, boundary audits, 17 projects, lint, 82 unit tests, smoke checks, and build)
npm run production:check

# Validate configuration without printing secret values
npm run env:check

# Safe, idempotent initialization of MongoDB collections, indexes, and published CMS seed
npm run production:init

# Interactive CLI wizard to provision or reset administrator / reviewer accounts
npm run admin:provision

# Process queued email notification jobs (applicant acknowledgements, alerts)
npm run jobs:process

# Synchronize 17 projects and society records to MongoDB CMS collections
npm run migrate-content

# Inspect or open/close recruitment application windows
npm run recruitment:cycle status
```

---

## 4. Codebase Navigation

```text
├── app/                  # Next.js App Router (Public routes, /join, /admin, /api)
├── components/           # UI Components (Hero canvas, 17 projects, Join wizard, Admin)
│   ├── admin/            # Admin review workspace & login
│   ├── join/             # Recruitment application wizard
│   ├── projects/         # 17-project catalogue, detail modals, image stages
│   ├── SignalFlowHero.js # Interactive orthogonal circuit canvas
│   ├── KesTimeline.js    # Technical society milestones
│   └── SiteHeader.js     # Responsive navigation & mobile section index drawer
├── lib/                  # Business Logic & Infrastructure (Backend, Auth, CMS)
│   ├── admin/server/     # Admin authentication, session cookies, RBAC, CSV export
│   ├── backend/          # MongoDB connection pool, collection schemas, indexes
│   ├── cms/              # Hybrid CMS service, MongoDB sync, static fallback
│   ├── join/server/      # OTP generation, application storage, institutional mailer
│   ├── notifications/    # Durable email jobs runner, retry scheduler, templates
│   ├── projects/         # Authoritative 17-project catalogue data
│   └── content.js        # Public society records, leadership, events, media registry
├── scripts/              # Operational and development automation
│   ├── operational/      # Production scripts (production-check, check-env, provision-admin, etc.)
│   ├── dev-mongo.mjs     # In-memory MongoDB for local offline development
│   └── test-mongo.mjs    # Real MongoDB replica set integration test runner
├── tests/                # Automated Node.js TAP test suite (82 specifications)
└── docs/                 # Engineering, deployment, and security documentation
```

For detailed team guidelines, see:
- [Codebase Map & Team Ownership](docs/architecture/CODEBASE_MAP.md)
- [Architecture Overview](docs/architecture/README.md)
- [Local Development Workflow](docs/development/README.md)
- [Production Deployment Guide](docs/deployment/README.md)
- [Operational Runbook & Brevo Setup](docs/operations/README.md)
- [Security Architecture & Threat Model](docs/security/README.md)

---

## 5. Verification & Testing

Run the automated test suite locally at any time:

```bash
# Run unit tests (82 specifications)
npm test

# Run MongoDB replica set integration tests
npm run test:mongo

# Run ESLint
npm run lint

# Compile production bundle
npm run build
```

---

## 6. Production Safety Invariants

1. **Zero Secret Exposure:** Credentials, connection strings, and private keys are never committed, printed, or exposed in client bundles.
2. **Server-Only Isolation:** All database drivers, cryptographic signers, and administrative services enforce `import "server-only";`.
3. **No Fake Success:** Recruitment submissions and email dispatches require atomic database commits and durable job creation before returning HTTP 200.
4. **Factual Integrity:** All 17 projects, executive office bearers, faculty mentors, and historical milestones reflect verified society records.