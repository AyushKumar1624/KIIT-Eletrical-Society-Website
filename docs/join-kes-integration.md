# Join KES — email verification and integration

`/join` verifies that an applicant owns a KIIT institutional email with a one-time code, then collects a membership application.

| Part | State |
| --- | --- |
| Email verification | **Connected** — Next.js route handlers in `app/api/join/verification/*`, sending through SMTP. Live once the environment variables below are set. |
| Application submission | **Not connected** — `app/api/join/applications` checks the verification token, then answers `unavailable`. The page tells applicants this up front. |

Without configuration, production fails closed: the page says online applications aren't open and the API answers `503 unavailable`. Nothing is ever claimed as sent, verified or received.

## Turning it on

Set these where the site runs (`.env.local` for a local `next start`, or the hosting provider's environment settings). See `.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `JOIN_SECRET` | Yes | 32+ random characters; signs codes and tokens. Changing it invalidates codes in flight. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Yes | Port 465 → `SMTP_SECURE=true`; port 587 → `false` (STARTTLS). |
| `SMTP_USER`, `SMTP_PASS` | Usually | For Gmail/Google Workspace use an **App Password**, never the account password. |
| `JOIN_EMAIL_FROM` | Yes | e.g. `KIIT Electrical Society <kiitelectricalsociety@gmail.com>`; must be an address the SMTP account may send as. |
| `JOIN_EMAIL_REPLY_TO` | No | Reply address for the code email. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | On serverless | Shared store for codes and limits. **Required on Vercel or any multi-instance host** — in-memory storage is per instance there, so codes would fail to verify. |

`/join` reads the settings on each request, so no rebuild is needed after changing them; restart the server.

For heavy volume, a transactional provider (Resend, Brevo, Amazon SES, Postmark) over SMTP delivers more reliably than a personal Gmail account (about 500 messages a day). Set up SPF/DKIM for the sending domain to keep codes out of spam.

## How verification works

1. `POST /api/join/verification/request` `{ email }` — `checkInstitutionalEmail()` (exact allowlist), then a 6-digit code from `crypto.randomInt` is emailed. Only an HMAC of the code is stored, for 10 minutes. A new code replaces the old one.
2. `POST /api/join/verification/confirm` `{ email, code }` — 5 guesses per code, counted atomically before comparison (timing-safe). A correct code is single-use and returns a signed token bound to the email, valid 30 minutes.
3. `POST /api/join/applications` `{ token, application }` — the token must be valid and match `application.email`.

Limits: 60 s between codes to one address; 5 codes per address and 20 requests per client per hour. Cross-site browser requests (mismatched `Origin`) are rejected. The client address comes from `X-Forwarded-For`, so behind no proxy it can be spoofed; the per-address limits still apply.

No password is ever requested or accepted.

### Responses

| Endpoint | `status` values |
| --- | --- |
| request | `sent` {resendAfter, expiresIn} · `ineligible` · `rate_limited` {retryAfter} (HTTP 429) · `unavailable` (503) · `error` |
| confirm | `verified` {token} · `invalid` {attemptsLeft?} · `expired` · `locked` · `ineligible` · `unavailable` · `error` |
| applications | `unauthorized` (401) · `unavailable` (503) — future: `submitted` {reference?} · `invalid` {errors} · `duplicate` |

## Connecting application submission (next step)

Implement it in `app/api/join/applications/route.js` after the token check:

1. Re-run `validateApplication()` on `body.application` and require both confirmations.
2. Store or forward it (database, or an email to the recruitment inbox), refusing duplicates per email.
3. Return `{ status: "submitted", reference }`.
4. In `app/join/page.js`, set `applications: true` so the up-front notice disappears.

Submitting must not create a member account, grant membership or return community links.

## Files

| File | Role |
| --- | --- |
| `lib/join/eligibility.mjs` | Domain allowlist and `checkInstitutionalEmail()` (client and server). |
| `lib/join/application.mjs` | Steps, options and validation (client and server). |
| `lib/join/server/config.mjs` | Environment settings and limits. |
| `lib/join/server/verifier.mjs` | Codes, attempts, rate limits and tokens. |
| `lib/join/server/store.mjs` | In-memory or Upstash Redis store. |
| `lib/join/server/mailer.mjs` | SMTP sender and the code email. |
| `app/api/join/**/route.js` | HTTP endpoints. |
| `lib/join/service.js` | Client calls to the endpoints (`NEXT_PUBLIC_JOIN_API_URL` overrides the base). |
| `lib/join/preview-service.js` | Developer preview only; never bundled in production. |
| `components/join/JoinFlow.js`, `app/join/*` | Interface and route. |

## Development

- `npm run dev` without SMTP settings: real codes are generated and **printed in the server console** (marked "no email was sent"); the page notes this. Production never does this.
- `/join?preview=1` on the dev server: simulated service with a toolbar (available/unavailable/failing, jump to any screen, sample answers). Code `246810` verifies, `000000` is expired.
- `npm test` covers the allowlist, form validation and the verifier (expiry, attempts, cooldowns, single use, token tampering).

## Still to confirm with KES

- The sending account and, ideally, a society domain for `JOIN_EMAIL_FROM`.
- Where applications should go once submission is connected, and the wording of "How your details are used".
- Year-of-study options and whether an official school/programme list should replace the free-text fields.
