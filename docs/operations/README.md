# KES Operational Runbook & Maintenance Guide

This runbook documents the canonical operational commands, maintenance procedures, Brevo email authentication, and backup procedures for the KIIT Electrical Society (KES) website platform.

---

## 1. Operational Command Index

All operational scripts reside in `scripts/operational/` and are executed via npm scripts:

| Command | Purpose | When to Run | Destructive? |
| :--- | :--- | :--- | :---: |
| `npm run env:check` | Validates environment variable presence, shape, and syntax | Before deployment, after rotating credentials | **No** |
| `npm run production:check` | Automated 7-phase pre-flight verification pipeline | Prior to merging, tagging, or deploying | **No** |
| `npm run production:init` | Safe, idempotent initialization of MongoDB collections, indexes, and CMS | Initial setup, index verification, disaster recovery | **No** |
| `npm run admin:provision` | Interactive terminal wizard to provision or reset administrator accounts | Onboarding leadership, rotating admin access | **No** |
| `npm run jobs:process` | Runs durable email notification dispatch worker | Periodically, after recruitment campaigns | **No** |
| `npm run migrate-content` | Idempotently synchronizes the 17 projects and society records to MongoDB | Content updates, schema synchronizations | **No** |
| `npm run recruitment:cycle` | Opens, closes, or inspects recruitment cycles | Managing active application windows | **No** |

---

## 2. Command Runbooks

### 2.1 Environment Validation (`npm run env:check`)
Validates that all necessary configuration variables exist and adhere to expected cryptographic or URI formats.
- **Safety guarantee:** Never echoes, logs, or prints secret values or connection strings.
- **Output:** Reports status per variable (`configured`, `optional / unset`, or `MISSING / INVALID`).

```bash
npm run env:check
```

### 2.2 Pre-Flight Production Check (`npm run production:check`)
Runs a comprehensive automated verification gate:
1. **Secret Scanning:** Scans all source files for leaked API keys, tokens, or private credentials.
2. **Boundary Integrity:** Verifies server-only enforcement and prevents frontend bundle contamination.
3. **Project Catalogue Integrity:** Verifies all 17 projects exist with required fields, images, and categories.
4. **Code Quality:** Runs ESLint across the repository (0 errors).
5. **Unit Tests:** Executes the complete 82-test Node.js TAP test suite.
6. **Database Suite:** Runs replica set integration tests (`npm run test:mongo`).
7. **Production Build:** Validates that `next build` compiles cleanly with complete tree shaking.

```bash
npm run production:check
```

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

### 2.4 Administrator Provisioning (`npm run admin:provision`)
Interactive CLI wizard for creating or updating administrator and domain reviewer accounts.
- Prompts for: Full Name, Institutional Email (`@kiit.ac.in`), Role (`admin` or `reviewer`), Domain assignment (if reviewer), and password (hidden).
- Hashes passwords using **Argon2id** (memory cost 65536 KB, time cost 3, parallelism 1).

```bash
npm run admin:provision
```

### 2.5 Durable Notification Job Processor (`npm run jobs:process`)
Processes queued email notification jobs stored in the `notification_jobs` collection:
- Fetches jobs in `pending` status where `runAt <= now`.
- Delivers via Brevo SMTP over STARTTLS (port 587).
- Updates status to `delivered` upon SMTP receipt or `failed` with exponential retry backoff.

```bash
npm run jobs:process
```

### 2.6 Content Synchronization (`npm run migrate-content`)
Reads authoritative project catalogue entries (`lib/projects/catalogue.mjs`) and society records (`lib/content.js`) and upserts them into MongoDB CMS collections with `published: true`.
- Preserves all 17 projects, descriptions, categories, team credits, and media references.
- Safe to run repeatedly; uses deterministic slug-based upserts.

```bash
npm run migrate-content
```

### 2.7 Recruitment Cycle Management (`npm run recruitment:cycle`)
Inspects or modifies recruitment cycles without manual database manipulation.

```bash
# Check current active recruitment cycle
node --conditions=react-server --env-file-if-exists=.env.local scripts/operational/recruitment-cycle.mjs status

# Open a new recruitment cycle
node --conditions=react-server --env-file-if-exists=.env.local scripts/operational/recruitment-cycle.mjs open --id 2026-27 --name "Recruitment 2026–27"

# Close an active recruitment cycle
node --conditions=react-server --env-file-if-exists=.env.local scripts/operational/recruitment-cycle.mjs close --id 2026-27
```

---

## 3. Brevo Email Domain Authentication (SPF, DKIM, DMARC)

To eliminate the *"via brevosend.com"* notice in recipient inboxes when emails are dispatched from `KIIT Electrical Society <24161010@kiit.ac.in>`:

### 3.1 Obtaining the Exact DNS Records from Brevo
1. Log in to [Brevo](https://app.brevo.com/) -> **Senders, Domains & Dedicated IPs** -> **Domains**.
2. Click **Add a domain** -> enter `electrical.kiit.ac.in` (or `kiit.ac.in`).
3. Brevo will display the exact TXT records required:
   - **TXT (Domain Verification):** Unique verification hash.
   - **TXT (DKIM):** `mail._domainkey.electrical.kiit.ac.in` with public key `k=rsa; p=...`.
   - **TXT (SPF):** `v=spf1 include:spf.brevo.com ~all`.
   - **TXT (DMARC):** `_dmarc.electrical.kiit.ac.in` with `v=DMARC1; p=none; ...`.

### 3.2 KIIT ICT Request Template
Submit this request to the university network administrators:

```text
Subject: Request for DNS Configuration for KES Official Email Relay (Brevo)

Dear KIIT ICT Team,

The KIIT Electrical Society (KES) is configuring institutional email notifications (applicant acknowledgements, interview invites, and announcements) through our SMTP service (Brevo).

To ensure deliverability and eliminate phishing warnings in recipient inboxes, we kindly request the addition of the following DNS records for electrical.kiit.ac.in (or kiit.ac.in):

[Insert the exact values generated from Brevo Dashboard]:
1. TXT Record for Domain Ownership Verification
   - Host: @ (or electrical.kiit.ac.in)
   - Value: [Brevo verification code]

2. TXT Record for DKIM (Email Signature)
   - Host: mail._domainkey.electrical.kiit.ac.in
   - Value: [Brevo DKIM Public Key]

3. TXT Record for SPF (Sender Authorization)
   - Host: electrical.kiit.ac.in
   - Value: "v=spf1 include:spf.brevo.com ~all"

4. TXT Record for DMARC
   - Host: _dmarc.electrical.kiit.ac.in
   - Value: "v=DMARC1; p=none; rua=mailto:24161010@kiit.ac.in"

Thank you,
KIIT Electrical Society (KES)
```

---

## 4. MongoDB Backup & Disaster Recovery

### 4.1 Production (MongoDB Atlas)
- Enable **Continuous Cloud Backups (PITR)** with a 7-day retention window under Atlas Backup settings.
- Configure daily snapshots retained for 30 days with multi-region redundancy.

### 4.2 Manual / Self-Hosted Backup (`mongodump`)
```bash
# Backup all collections with gzip compression and oplog consistency
mongodump --uri="${MONGODB_URI}" --db="${MONGODB_DB:-kes}" --gzip --out="/var/backups/mongodb/kes_$(date +%Y%m%d)"

# Restore in disaster recovery scenario
mongorestore --uri="${MONGODB_URI}" --db="${MONGODB_DB:-kes}" --gzip --drop "/var/backups/mongodb/kes_YYYYMMDD/kes"
```
