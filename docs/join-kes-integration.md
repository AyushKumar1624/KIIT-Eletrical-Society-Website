# Join KES — verification and application storage

See [Phase 1 backend](backend-phase-1.md) for shared setup, secrets, origins, the OTP store and admin authentication. This document covers the Join flow end to end (Phase 2).

| Part | State |
| --- | --- |
| Email verification | Implemented (SMTP, MongoDB or Upstash challenge store). Success sets a short-lived HttpOnly applicant cookie. |
| Application submission | **Implemented.** Strict validation, MongoDB persistence in a transaction with notification jobs, per-cycle uniqueness, idempotent retries. |
| Recruitment cycle | Operator-controlled open/closed state with optional dates. `/join` accepts applications only while the current cycle is open. |
| Notification delivery | **Not implemented.** Jobs are recorded as `pending`; no worker sends them yet. |

Production fails closed: missing configuration, an unreachable database or a closed cycle all show applications as not open and return `unavailable`.

## Setup

1. Configure the Phase 1 variables (`MONGODB_URI`, `MONGODB_DB`, `APP_ORIGINS`, `JOIN_SECRET`, SMTP, `JOIN_STORE`). **MongoDB must be a replica set or Atlas cluster**: submission uses a multi-document transaction. A standalone `mongod` rejects submissions (returns unavailable).
2. `npm run backend:setup` — creates/updates validators and indexes, including the application collections. Re-run after upgrading.
3. Open a recruitment cycle from a private terminal:

```sh
npm run recruitment:cycle -- open --id 2026-27 --closes 2026-11-05T23:59:00+05:30
npm run recruitment:cycle -- status
npm run recruitment:cycle -- close
```

`open` makes that cycle the single current one (a partial unique index enforces this); earlier cycles and their applications are kept. `--opens`/`--closes` are optional bounds checked on every request.

`/join` is rendered per request. It shows the form as submittable only when verification is configured **and** the database answers **and** the current cycle is open. Working SMTP alone never opens applications.

## Flow and contracts

1. `POST /api/join/verification/request {email}` — unchanged (allowlist of 22 domains, exact match, rate limits).
2. `POST /api/join/verification/confirm {email, code}` → `{status: "verified", email, expiresIn: 1800}` plus `Set-Cookie: __Host-kes-join=…; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800` (`kes-join` without `Secure` in development). The token is **not** in the JSON. The cookie name is separate from the admin session (`__Host-kes-admin`). Submission and confirmation both require the same origin; a cross-origin `NEXT_PUBLIC_JOIN_API_URL` will not carry the cookie and is unsupported.
3. `POST /api/join/applications {application}`:

| Response | HTTP | When |
| --- | --- | --- |
| `submitted {reference, submittedAt}` | 201 | Persisted, or an identical retry of an already-persisted submission |
| `invalid {errors}` | 400 | Shape, type, size or content errors (`errors.form` for an unreadable payload) |
| `unauthorized` | 401 | Missing, forged or expired verification, or `application.email` differs from the verified address |
| `duplicate` | 409 | Same email or same roll number already applied in this cycle with different content |
| `unavailable {reason: "closed"}` | 503 | No current cycle, closed, before `opensAt` or after `closesAt` |
| `unavailable` | 503 | Not configured, database or transaction failure |
| `error` | 403 | Cross-site or unapproved origin |

A successful submission clears the applicant cookie.

### Validation (server)

`lib/join/server/submission.mjs` runs before the shared rules in `lib/join/application.mjs`:

- Body must be exactly `{application}`; the application may contain only `fullName, email, whatsapp, roll, school, programme, year, graduation, domains, motivation, skills, explore, link, confirmAccurate, consentContact`. Anything else, including `status`, `notes`, `history`, `role` or `reference`, is rejected.
- Strings are type-checked and length-bounded before trimming; confirmations must be booleans and `true`; `domains` must be a non-empty array of known keys (`robotics, embedded, ai, web, design, media, outreach, events, writing`) with **no unknown or repeated entries**. The shared rule was corrected: previously one valid key plus an unknown one passed.
- `link` is optional and must be `http(s)` without embedded credentials.
- The stored email comes **only** from the verified cookie. A different `application.email` returns `unauthorized`.

### Storage (`lib/join/server/applications.mjs`)

| Collection | Contents | Indexes |
| --- | --- | --- |
| `recruitment_cycles` | `_id`, name, open, current, opensAt/closesAt, updatedAt | unique partial `current: true` |
| `join_applications` | server `_id`, `reference`, `cycleId`, the 15 form fields (email from the session), `rollNormalized` (trimmed, upper-case), `digest`, `status: "New"`, empty notes/interview/messages, `version`, `submittedAt`, `history: [submitted]` | unique `(cycleId, email)`, unique `(cycleId, rollNormalized)`, unique `reference`, `(cycleId, submittedAt)` |
| `notification_jobs` | `kind` (`applicant-acknowledgement`, `admin-new-application`), `applicationId`, `status: pending`, attempts, createdAt, availableAt | unique `(kind, applicationId)`, `(status, availableAt)` |

The application and both jobs are written in one transaction: either all three exist or none do. References are random `KES-XXXX-XXXX` (Crockford base32), regenerated on the unlikely collision. JSON-schema validators restrict status and domain values and require both confirmations to be `true`.

**Idempotency and concurrency.** The `digest` is a SHA-256 of the normalized submission. A resubmission from the same verified email with the same content returns the existing reference (network retry, double click, lost response). Different content, or the same roll number under another email, returns `duplicate`. The unique indexes are authoritative, so concurrent submissions cannot both be stored; a request that loses the race re-reads the winner and answers accordingly. A new cycle accepts the same applicant again and leaves earlier records untouched.

## Frontend changes

- `lib/join/service.js`: `verifyCode` expects `{email}`; `submitApplication(application)` sends no credential.
- `components/join/JoinFlow.js`: opens the form on `verified` + email (no token); shows the server reference and submission time only after a `submitted` response; handles `unavailable {reason: "closed"}`.
- **Automatic sessionStorage drafts were removed.** Answers live only in component memory: they survive validation, service errors and re-verification on the page, but not a reload. A leftover `kes-join-draft` from the old version is deleted on load. No credential is stored in browser storage.
- The developer preview (`/join?preview=1`, dev server only) follows the new contract.

Submitting an application does not create an account, grant membership or reveal community links. The confirmation says so.

## Remaining setup and follow-up

1. A MongoDB replica set/Atlas cluster, `npm run backend:setup`, and an opened cycle (above).
2. **Notification worker**: process `pending` jobs (acknowledgement to the applicant, alert to an administrator address that KES still has to choose), with retries/backoff and `sent`/`failed` states. Until then nobody is emailed about a submission.
3. **Admin review persistence**: `/api/admin/applications` still returns unavailable after authorization; it should read `join_applications` and write review changes with the existing `version` for optimistic concurrency.
4. Privacy wording, retention period and access policy for stored applications (approved by KES).
5. Consider a per-IP/per-email submission rate limit if abuse appears; verification already gates every submission.

## Checks

- `npm test`: 12 Join application tests. They cover all 22 domains and lookalikes; missing, forged and expired verification; email substitution; unknown and client-controlled fields; wrong types; oversized values; empty, mixed and repeated domains; unsafe links; closed and date-bounded cycles; references and jobs; idempotent and whitespace-only retries; changed-content and same-roll duplicates; concurrent identical and conflicting submissions; database and job-creation failure; the cookie format and token absence; and the full HTTP envelope.
- `npm run test:mongo`: on a temporary local replica set it checks the real indexes, the single current cycle, 12 parallel identical submissions sharing one record and reference, a roll-number race with exactly one winner, validator rejection of a client-style status, transaction rollback when the job insert fails, and a new cycle preserving history.
