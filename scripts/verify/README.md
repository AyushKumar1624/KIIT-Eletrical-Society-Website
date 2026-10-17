# KES Website — Operational Verification Suite

This directory contains standalone operational verification and smoke-testing scripts for the KIIT Electrical Society (KES) website backend.

Unlike offline unit tests, these checks run against a **live running instance** (Next.js server on `http://localhost:3000`) and the configured **MongoDB database** (`.env.local`), providing empirical end-to-end assurance of security controls, race conditions, and real-time database transactions.

---

## Prerequisites

1. **MongoDB**:
   Ensure MongoDB (either local or MongoDB Atlas) is connected via `.env.local`.
2. **Next.js Server**:
   Ensure the development or production server is running on `http://localhost:3000`:
   ```bash
   npm run dev
   ```

---

## Running the Verification Suite

### Run All Checks Sequentially
```bash
npm run verify:all
```
*(or `node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/run-all.mjs`)*

### Run Individual Checks
Each script can be executed independently:

```bash
# 1. Admin Server-Side Authorization (verifies 401 on unauthenticated / forged requests)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/admin-auth.mjs

# 2. Domain Reviewer RBAC Isolation (verifies reviewers cannot access other domains)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/domain-reviewer.mjs

# 3. CMS Draft / Published Content Isolation (verifies drafts are hidden from public APIs)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/cms-draft-isolation.mjs

# 4. CSV Export Formula Injection Defense (verifies sanitization of =, +, -, @ triggers)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/csv-export.mjs

# 5. Atomic OTP Verification Concurrency (30 simultaneous requests with the same code)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/otp-concurrency.mjs

# 6. Concurrent Duplicate Application Prevention (20 simultaneous duplicate submissions)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/duplicate-concurrency.mjs

# 7. Notification Job Durability & Retry Backoff (verifies persistence under SMTP downtime)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/job-durability.mjs

# 8. Complete Join KES Workflow (request OTP -> confirm -> submit application -> check Mongo)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/join-flow.mjs

# 9. Public API Sensitive Field Leakage (scans 10 public endpoints for private fields)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/public-api-leakage.mjs

# 10. Production Security Controls (verifies CSRF origin checks, payload limits, cache headers)
node --conditions=react-server --env-file-if-exists=.env.local scripts/verify/security-controls.mjs
```

---

## Retained Verification Scope

| Script | Category | Description |
|---|---|---|
| `admin-auth.mjs` | Security / RBAC | Validates that all 10 administrative API routes reject unauthenticated and forged requests. |
| `domain-reviewer.mjs` | Authorization | Asserts that domain reviewers cannot view or mutate applications outside their assigned domain. |
| `cms-draft-isolation.mjs` | Privacy / CMS | Proves unpublished CMS drafts are never returned on public content endpoints. |
| `csv-export.mjs` | Data Export | Ensures administrator CSV exports are protected against spreadsheet formula execution. |
| `otp-concurrency.mjs` | Concurrency | Verifies atomic CAS guarantees that an OTP cannot be claimed twice concurrently. |
| `duplicate-concurrency.mjs` | Integrity | Asserts that concurrent submissions for the same email or roll number produce exactly one database record. |
| `job-durability.mjs` | Reliability | Confirms notification jobs survive failures, record errors, and retry with exponential backoff. |
| `join-flow.mjs` | End-to-End | Verifies the full applicant lifecycle from OTP generation to submission and reference generation. |
| `public-api-leakage.mjs` | Data Privacy | Audits public endpoints to ensure internal notes, passwords, and candidate PII never leak. |
| `security-controls.mjs` | Hardening | Verifies CSRF origin protection (403), request size bounds (413), and cache-control headers. |
