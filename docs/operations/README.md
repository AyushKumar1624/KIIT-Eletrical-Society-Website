# KES Operational Runbook & Tooling

This runbook documents the operational commands, maintenance procedures, and automation scripts used to manage the KIIT Electrical Society (KES) website and backend services.

---

## 1. Operational Command Index

All operational scripts reside in `scripts/operational/` and are accessible via npm scripts:

| Command | Purpose | When to Run | Destructive? |
| :--- | :--- | :--- | :---: |
| `npm run env:check` | Validates environment variable presence, shape, and syntax | Before deployment, after rotating credentials | **No** |
| `npm run production:check` | Automated 8-phase pre-flight verification pipeline | Prior to merging, tagging, or deploying | **No** |
| `npm run production:init` | Safe, idempotent initialization of MongoDB collections, indexes, and CMS | Initial serverless setup, disaster recovery | **No** |
| `npm run admin:provision` | Interactive terminal wizard to provision or reset administrator accounts | Onboarding leadership, rotating admin access | **No** |
| `npm run jobs:process` | Runs durable email notification dispatch worker | Periodically, after recruitment campaigns | **No** |
| `npm run migrate-content` | Idempotently synchronizes the 17 projects and society records to MongoDB | Content updates, schema synchronizations | **No** |
| `npm run recruitment:cycle` | Opens, closes, or inspects recruitment cycles | Managing active application windows | **No** |
| `npm run verify:all` | Executes 10 automated security and concurrency smoke checks | Post-deployment validation, CI/CD | **No** |

---

## 2. Detailed Command Runbooks

### 2.1 Environment Validation (`npm run env:check`)
Validates that all necessary configuration variables exist and adhere to expected cryptographic or URI formats.
- **Safety guarantee:** Never echoes, logs, or prints secret values or connection strings.
- **Output:** Reports status per variable (`configured`, `optional / unset`, or `MISSING / INVALID`).

```bash
npm run env:check
```

---

### 2.2 Pre-Flight Production Check (`npm run production:check`)
Runs an 8-phase automated verification gate:
1. **Secret Scanning:** Scans all source files for leaked API keys, tokens, or private credentials.
2. **Boundary Integrity:** Verifies server-only enforcement and prevents frontend bundle contamination.
3. **Project Catalogue Integrity:** Verifies all 17 projects exist with required fields, images, and categories.
4. **Code Quality:** Runs ESLint across the repository.
5. **Unit Tests:** Executes the complete 82-test Node.js TAP test suite.
6. **Database Suite:** Runs replica set integration tests against local memory replica or Atlas cluster.
7. **Operational Verification:** Runs the 10-point end-to-end security, OTP, and concurrency smoke checks.
8. **Production Build:** Validates that `next build` compiles cleanly with complete tree shaking.

```bash
npm run production:check
```

---

### 2.3 Production Database Initialization (`npm run production:init`)
Safely sets up database collections and ensures unique and TTL indexes are established:
- **Idempotent by design:** Does not drop existing collections, does not overwrite existing records, and never deletes live application submissions.
- **Ensures indexes:**
  - `administrators`: unique index on `email`.
  - `recruitment_cycles`: unique index on `code`.
  - `join_otps`: TTL index on `expiresAt`, index on `email`.
  - `applications`: compound unique index on `cycleCode + institutionalEmail`, compound unique on `cycleCode + rollNumber`, unique index on `referenceNumber`.
  - `notification_jobs`: compound index on `status + runAt`.
  - `cms_content`: compound unique on `type + slug`.

```bash
npm run production:init
```

---

### 2.4 Administrator Provisioning (`npm run admin:provision`)
Interactive CLI wizard for creating or updating administrator and domain reviewer accounts.
- Prompts for:
  1. Full Name
  2. Institutional Email (`@kiit.ac.in`)
  3. Role (`admin` or `reviewer`)
  4. Domain assignment (if `reviewer`: e.g., `web-development`, `iot-robotics`, etc.)
  5. Password (masked or private input)
- Hashes passwords using **Argon2id** (memory cost 65536 KB, time cost 3, parallelism 1).

```bash
npm run admin:provision
```

---

### 2.5 Durable Notification Job Processor (`npm run jobs:process`)
Processes queued email notification jobs stored in the `notification_jobs` collection:
- Fetches jobs in `queued` status where `runAt <= now`.
- Delivers via Brevo SMTP over STARTTLS (port 587).
- Updates status to `delivered` upon SMTP receipt or `failed` with exponential retry backoff.
- Can be run as a cron job, a manual task, or scheduled via Vercel Cron.

```bash
npm run jobs:process
```

---

### 2.6 Content Synchronization (`npm run migrate-content`)
Reads authoritative project catalogue entries (`lib/projects/catalogue.mjs`) and society records (`lib/content.js`) and upserts them into MongoDB CMS collections with `published: true`.
- Preserves all 17 projects, descriptions, categories, team credits, and media references.
- Safe to run repeatedly; uses deterministic slug-based upserts.

```bash
npm run migrate-content
```

---

### 2.7 Recruitment Cycle Management (`npm run recruitment:cycle`)
Inspects or modifies recruitment cycles without manual database manipulation.

```bash
# Check current active recruitment cycle
node scripts/operational/recruitment-cycle.mjs status

# Open a new recruitment cycle
node scripts/operational/recruitment-cycle.mjs open --code "KES-REC-2026-AUTUMN" --title "Autumn 2026 Recruitment Drive"

# Close an active recruitment cycle
node scripts/operational/recruitment-cycle.mjs close --code "KES-REC-2026-AUTUMN"
```
