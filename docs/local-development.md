# KIIT Electrical Society (KES) — Local Development & Backend Guide

This guide describes how to run and verify the KES website and backend locally.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or later (tested on Node `v20.19.6`).
- **npm**: `v10.x` or later.
- **MongoDB**: Either:
  - Local **MongoDB Community Server** running locally (e.g., `mongodb://127.0.0.1:27017`), or
  - A dedicated development cluster on **MongoDB Atlas** (never use production connection strings).

---

## 2. Environment Configuration

1. Copy `.env.example` to `.env.local` in the project root:
   ```bash
   cp .env.example .env.local
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

2. Generate two distinct cryptographically secure random secrets for `ADMIN_SECRET` and `JOIN_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Update `.env.local` with your local development parameters:
   ```ini
   # MongoDB Connection
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB=kes_dev

   # Allowed Origins & Port
   APP_ORIGINS=http://localhost:3000
   ADMIN_RESET_ORIGIN=http://localhost:3000

   # Secrets (Generated above)
   ADMIN_SECRET=YOUR_GENERATED_ADMIN_SECRET_HEX_64_CHARS
   JOIN_SECRET=YOUR_GENERATED_JOIN_SECRET_HEX_64_CHARS

   # Storage & Verification
   JOIN_STORE=mongodb
   JOIN_DELIVERY=smtp

   # SMTP Configuration (For local email testing, use MailHog, Ethereal, or local credentials)
   # Or set JOIN_DELIVERY=console for terminal-only OTP printing during early UI development
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=test-user
   SMTP_PASS=test-pass
   JOIN_EMAIL_FROM=admissions@kiitelectricalsociety.org
   JOIN_EMAIL_REPLY_TO=contact@kiitelectricalsociety.org
   ADMIN_ALERT_EMAIL=alerts@kiitelectricalsociety.org
   ```

> [!IMPORTANT]
> Never commit `.env` or `.env.local`. `.gitignore` is configured to prevent committing any local environment files.

---

## 3. Database Initialization & Setup

### Step 1: Initialize Database Indexes
Run the schema and index initialization script to create all collections, unique constraints, and TTL indexes:
```bash
npm run backend:setup
```
This ensures indexes are built for:
- `join_applications`: unique `(cycleId, email)` and `(cycleId, rollNormalized)`.
- `recruitment_cycles`: unique `current` cycle constraint.
- `audit_logs`: compound index on `entity`, `entityId`, `timestamp`.
- `cms_content`: unique `(type, slug)` compound index.
- `notification_jobs`: compound index for queue polling `status + availableAt`.

### Step 2: Open an Active Recruitment Cycle
To allow applicants to register and submit applications, open a cycle:
```bash
npm run recruitment:cycle -- open --id 2026-27 --name "Recruitment 2026–27"
```
To check status:
```bash
npm run recruitment:cycle -- status
```

### Step 3: Populate Initial CMS Content (Idempotent)
Migrate the existing 17-project catalogue, milestones, faculty, events, and leadership into MongoDB without overwriting or inventing fake data:
```bash
npm run content:migrate
```

### Step 4: Provision the Initial Administrator
Provision the first administrator interactively. Passwords are typed interactively without echo and hashed with Argon2id:
```bash
npm run admin:provision
```
Follow the interactive prompts:
```
Administrator email: admin@kiitelectricalsociety.org
Administrator display name: Faculty Advisor
Password (15–128 characters; hidden):
Confirm password (hidden):
```

---

## 4. Running the Development Server

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- Public site: `http://localhost:3000`
- Join / Apply: `http://localhost:3000/join`
- Admin Login: `http://localhost:3000/admin/login`
- Admin Applications Review: `http://localhost:3000/admin/applications`

---

## 5. Processing Notification Jobs

Notification jobs are durably enqueued in the `notification_jobs` collection. To process pending jobs or retries:
```bash
npm run jobs:process
```
*Note: In development, each new submission and reviewer trigger also performs an immediate non-blocking dispatch attempt.*

---

## 6. Running Tests

Run the full automated test suite (including unit, regression, optimistic concurrency, and E2E flows):
```bash
npm test
```

Run ESLint:
```bash
npm run lint
```

Run Next.js Production Build:
```bash
npm run build
```
