# Phase 1 backend

Implemented against reviewed baseline `d4ecc550b4a0aa302b9aca465a99d6469bb8885d` (the checkout had no newer changes). Next.js App Router, JavaScript ES modules, the public design and existing routes are preserved. No deployment or real account provisioning was performed.

## Scope

MongoDB infrastructure, atomic Join email verification, and administrator authentication are implemented. Application submission and review persistence remain unavailable. No member accounts, membership IDs, Member Portal or KHAOS registration backend were added. Fictional admin previews remain development-only and are excluded from the production build.

## Secure setup

Use Node 22 or 24. Install with `npm ci`. Copy `.env.example` to `.env.local`; never commit populated environment files. Configure:

1. `MONGODB_URI`: a real MongoDB connection URI; use TLS, a restricted network allowlist and an account scoped to the KES database. `MONGODB_DB`: the database name (letters, numbers, underscore or hyphen). Admins always require MongoDB, even when OTPs use Redis.
2. `APP_ORIGINS`: exact comma-separated approved origins. Production requires HTTPS. `ADMIN_RESET_ORIGIN`: one of those origins, used to construct recovery links. For local development use `http://localhost:3110` for both. Never derive trusted origins from request Host or forwarded-host headers.
3. Two independently generated secrets, `ADMIN_SECRET` and `JOIN_SECRET`, each at least 32 random characters. For each, run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in a private terminal and store the output securely. Do not use example passwords or checked-in values.
4. `JOIN_STORE=mongodb` (recommended default) or `upstash`. For Upstash supply both HTTPS `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. An explicit selection is authoritative; outages never trigger fallback to another store or process memory.
5. `JOIN_DELIVERY=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `JOIN_EMAIL_FROM`, and normally `SMTP_USER`/`SMTP_PASS`. Credentials must be supplied together. Port 465 uses TLS; port 587 uses required STARTTLS. Configure a permitted sender, SPF/DKIM and optionally `JOIN_EMAIL_REPLY_TO`. The same transport sends verification and recovery messages. Do not disable certificate checks. Use a provider credential or app password, not a personal mailbox password.
6. Only on actual Vercel hosting, set `TRUST_PROXY=vercel`; its platform-provided `VERCEL=1` is also required. Only one syntactically valid IP from the platform-overwritten `X-Forwarded-For` is accepted. All other hosts ignore forwarded headers and use a shared `unknown` IP bucket. Before enabling independent per-client limits elsewhere, implement and test that host's trusted gateway and prevent direct untrusted access. Never set `VERCEL` to bypass this boundary.

Then run in a private terminal:

```sh
npm run backend:setup
npm run admin:provision
npm run dev -- --port 3110
```

Setup pings MongoDB and creates/updates validators and indexes repeatably; it needs createCollection, collMod and createIndex permissions. Use a separate migration identity if the runtime identity lacks these rights. Run setup before accepting traffic. Provisioning is interactive, accepts no credential arguments, hides password entry and requires a 15–128 character password with confirmation. It refuses to run after an administrator exists; a fixed unique bootstrap ID prevents parallel first-admin creation. No public bootstrap/signup endpoint exists. Never place passwords in shell arguments or environment variables. Additional approved administrators require a later private account-management process.

For local OTP experiments only, explicitly set `JOIN_STORE=memory` and `JOIN_DELIVERY=console` under `next dev`; a configured `JOIN_SECRET` and local origin are still required. Console delivery prints a development code with the recipient redacted and explicitly says no email was sent. Production rejects these modes. Configuration readiness is not a network health check: runtime MongoDB, Redis and SMTP failures return unavailable.

## Collections and indexes

`lib/backend/mongo.mjs` uses the official driver, server-only imports, a reused connection promise, bounded connection/socket timeouts, majority writes and no raw exception logging. Rejected connection promises are removed so later requests can reconnect. `lib/backend/indexes.mjs` owns repeatable validators and explicit indexes. Every collection has MongoDB's unique `_id` index.

| Collection | Stored fields | Additional indexes |
| --- | --- | --- |
| `admin_accounts` | String `_id`, normalized email, display name, Argon2id `passwordHash`, `role: admin`, active flag, authVersion, createdAt; optional recovery digest and expiry | Unique email; unique partial recovery.digest where string |
| `admin_sessions` | SHA-256 token digest as `_id`, string adminId, authVersion, createdAt, idle expiresAt, absoluteExpiresAt | TTL expiresAt (0 seconds); adminId |
| `rate_limits` | Purpose/account/IP HMAC or OTP limit key as `_id`, count, expiresAt | TTL expiresAt (0 seconds) |
| `join_challenges` | Versioned email key as `_id`; value contains random id, HMAC hash, sentAt/expiresAt milliseconds, attempts, consumed; outer expiresAt is BSON Date | TTL expiresAt (0 seconds) |

Validators enforce required field names and core BSON types. Application code validates request shapes and constrains roles and account changes. No collection stores raw passwords, OTPs, session tokens or recovery tokens. Email addresses are necessarily present in account/challenge records; protect backups and database access accordingly. TTL is housekeeping only: every authentication/challenge query checks expiry immediately, independently of background deletion.

## OTP consistency and limits

The original `lib/join/server/*` implementation is extended. Codes remain six digits, expire after 600 seconds, allow five guesses and enforce a 60-second resend cooldown. Institutional email eligibility and 30-minute signed email verification tokens are preserved. Limits remain five requests per address and twenty per client bucket per hour.

`reserve` atomically enforces cooldown and replaces a challenge. `confirm` atomically checks challenge identity, expiry, consumption and attempt budget, increments the attempt count, and consumes a matching code. Exactly one concurrent confirmation succeeds. A consumed tombstone remains until expiry so immediate resend cannot bypass cooldown. Older SMTP failure cleanup deletes only the matching challenge ID. SMTP delivery is outside the database operation; a delayed old message can arrive after replacement, but its old code cannot verify the new challenge.

MongoDB uses conditional single-document updates/upsert with unique-key collision handling; no multi-document transaction is required. Upstash uses one Lua EVAL per reservation, confirmation, conditional deletion or increment-with-expiry. Redis errors returned inside HTTP 200 are failures too. No read/delete sequence grants verification. The memory adapter exists only for explicit development and isolated tests.

The `join:v2:` key namespace deliberately invalidates old in-flight challenges on upgrade and avoids legacy counters missing TTL. Users must request a fresh code after rollout. Old Redis keys may remain until their original TTL; audit and remove legacy `join:` keys without TTL using a private operator process after the old deployment is retired. Never run old and new code simultaneously against a public verification endpoint during the upgrade.

## HTTP contracts

All JSON responses use no-store/private and nosniff. Mutating routes require a configured, exact Origin and reject cross-site fetch metadata. JSON bodies are capped at **20,000 actual streamed bytes**, even with absent or false Content-Length; malformed JSON/shape returns 400, excess size 413 and unsupported content type 415. No CORS credential access is enabled. Rate-limited responses expose Retry-After where appropriate. Public errors contain status vocabulary, never database/SMTP messages or secrets.

| Route | Request | Responses |
| --- | --- | --- |
| POST `/api/join/verification/request` | email | sent; ineligible; rate_limited (429); invalid/error (4xx); unavailable (503) |
| POST `/api/join/verification/confirm` | email, six-digit code | verified + email-bound token; invalid; expired; locked; ineligible; unavailable (503) |
| POST `/api/join/applications` | application (applicant cookie) | Phase 2: see `join-kes-integration.md` (submitted 201, invalid 400, unauthorized 401, duplicate 409, unavailable 503) |
| POST `/api/admin/auth/sign-in` | email, password | authenticated + safe session DTO, HttpOnly cookie; rejected (401/429); invalid (400); unavailable (503) |
| GET `/api/admin/auth/session` | cookie | authenticated + safe session DTO; unauthenticated; unavailable (503) |
| POST `/api/admin/auth/logout` | cookie | unauthenticated + cleared cookie after confirmed deletion; unavailable (503) |
| POST `/api/admin/auth/recovery` | email | generic recovery-requested; invalid (400); unavailable (503) if service/email configuration is absent |
| POST `/api/admin/auth/reset` | token, password | unauthenticated + passwordReset: true after successful reset; invalid (400); rejected (401/429); unavailable (503) |
| GET `/api/admin/applications` | cookie | unauthenticated (401) without authorization; unavailable (503) after authorization because applicant persistence is postponed |

`lib/admin/auth.mjs` remains the browser-safe factory, now with a same-origin HTTP adapter using cookies, plus `resetPassword(token, password)`. Explicit `createAdminAuthService(null)` still models an unconfigured integration. Raw session tokens never enter JSON or browser storage. Frontend state is presentation only; server page access and `requireAdminRequest` enforce active administrator status and authVersion on every protected read. Future applicant APIs must reuse the guard and implement their own authorized persistence; the shell does not authorize anything by itself.

## Administrator security

Passwords use Argon2id (64 MiB, three iterations, parallelism one). A bounded local work queue limits expensive hashing. Unknown accounts use a dummy Argon2 hash during login and the same generic rejection. Persistent MongoDB counters enforce 15-minute login limits (10/account, 50/client), recovery (3/account, 15/client; generic acknowledgements when throttled), and reset (100 global, 15/client). Account/IP identifiers in admin limiter keys use ADMIN_SECRET HMACs. Apply infrastructure request/concurrency limits as well before public production traffic.

Sessions are 32 random bytes, base64url encoded, with only SHA-256 digests stored. Idle expiry is 30 minutes; absolute expiry is eight hours. Protected access slides idle expiry, capped at the absolute deadline. Production uses `__Host-kes-admin; Secure; HttpOnly; SameSite=Strict; Path=/` without Domain. Development uses `kes-admin` for local HTTP. Logout deletes the stored session. Disabling an account or changing authVersion revokes existing sessions on their next access. A password reset atomically increments authVersion and invalidates recovery so prior sessions cannot survive even if cleanup fails. Cookie Max-Age does not extend the server's absolute expiry.

Recovery tokens are random, digest-only in the database, valid for twenty minutes and single-use. New requests replace the earlier token. Links use the configured trusted origin and a URL fragment to keep the token out of access logs and Referer headers. `/admin/reset-password` immediately removes that fragment from browser history, keeps it only in component memory and sends it in a bounded same-origin POST. Invalid/missing tokens never produce a success claim. SMTP failure conditionally clears only that request's recovery token. Generic recovery acknowledgement does not assert delivery or reveal whether an account exists; SMTP delivery timing is not guaranteed to be identical between known and unknown accounts. For stricter timing isolation, add a durable mail outbox in a later phase.

## Logging, operations and checks

Only static allowlisted event codes reach error logs. Raw exceptions, connection URIs, passwords, codes, tokens, email addresses and IPs are not logged by these server modules. Do not enable request-body or credential logging at the proxy/provider. Restart workers after changing environment configuration. Rotate credentials privately; rotating JOIN_SECRET invalidates email tokens/codes, while ADMIN_SECRET rotation resets limiter key identity and should accompany deliberate session revocation if compromise is suspected. Back up account data using restricted access and confirm restore procedures before production use.

```sh
npm test
npm run test:mongo
npm run lint
npm run build
npm audit --omit=dev
```

The default tests use injected clocks, repositories, mailers and stores. The opt-in MongoDB suite starts an isolated local MongoDB engine through mongodb-memory-server, exercises real validators/indexes/atomic updates, then shuts it down. It never reads or modifies MONGODB_URI; its first run may download a MongoDB binary. Tests run with the react-server condition so server-only markers work in Node. The provisioning CLI intentionally requires human interactive input and is not run against a real database during checks.

Before enabling real service, separately verify the supplied MongoDB network/TLS/permissions, SMTP sender authentication/delivery, optional Upstash credentials and Lua support, real HTTPS cookies, trusted deployment origins and proxy boundary. No production credentials or live external accounts were supplied here. Application persistence/privacy/audit controls and additional-admin lifecycle remain later work.

Production dependency audit passed with zero vulnerabilities during implementation. The full audit reports an existing development lint-tool dependency chain through braces/micromatch; no compatible patched braces release was available. Do not force npm's suggested downgrade of eslint-config-next to an incompatible major version; track the upstream fix.

Verified results: `npm test` passed 62 tests (one opt-in Mongo test skipped); `npm run test:mongo` passed that real MongoDB test separately; lint and production build passed. A temporary production server returned 200 for login/reset pages, 404 for the development-only admin preview, 503/no-store for unconfigured session/applicant APIs, and 403 for untrusted-origin login/OTP requests. Browser inspection was blocked by the browser tool's URL policy, so no new visual verification is claimed. Existing public styling was preserved. External MongoDB/SMTP/Upstash services were not configured or contacted by these tests.

Primary implementation references: [MongoDB compound operations](https://www.mongodb.com/docs/drivers/node/current/crud/compound-operations/), [Upstash EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval), [node-argon2](https://github.com/ranisalt/node-argon2), [Vercel request headers](https://vercel.com/docs/headers/request-headers).
