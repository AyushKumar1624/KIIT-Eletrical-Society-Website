# KES administrator access foundation

> Historical frontend foundation notes. Superseded by [Phase 1 backend](backend-phase-1.md): the default adapter now calls real server endpoints, backed by MongoDB sessions and Argon2id, with password recovery/reset and server guards. The remaining text records the earlier disconnected implementation.

Frontend-only. No administrator accounts, authentication endpoints, signup, applicant API integration or deployment were created. Join KES registration and public Projects, Achievements, Events and leadership content were not modified.

## Run and routes

Run `npm run dev -- --port 3110` and open `/admin/login`.

- `/admin/login`: labelled email/password fields, password visibility toggle, client validation, busy and error feedback, password-recovery view and public-site link.
- `/admin/applications`: retrieves the session through the auth interface. Loading, unavailable and unauthenticated states never render applicant records. An authenticated response renders the application-register shell with identity, Applications navigation and Logout.
- `/admin/applications/preview`: development-only layout preview with two explicitly fictional records. Exit preview returns to login without claiming a session was terminated. Production returns 404; its preview module and records are excluded from generated production code. This is not a mock authentication flow.

## Authentication contract

`lib/admin/auth.mjs` exports the default `adminAuth` service and `createAdminAuthService(adapter)` factory. The default has no adapter: every valid service operation resolves to `{status: "unavailable"}`. There is no fetch, browser storage, hardcoded password or fake session fallback.

Adapter methods and accepted responses:

| Method | Request | Response status |
| --- | --- | --- |
| signIn | `{email, password}` | authenticated / rejected / unavailable |
| getSession | none | authenticated / unauthenticated / unavailable |
| logout | none | unauthenticated / unavailable |
| recoverPassword | `{email}` | recovery-requested / rejected / unavailable |

Authenticated results require `{session: {user: {id, email, name?}}}`. Password whitespace is preserved. Invalid fields resolve to `{status: "invalid", errors}` before adapter invocation. Unexpected responses and exceptions become unavailable; raw service errors are not displayed. A successful recovery response is an acknowledgement, not proof of email delivery. Logout only leaves the authenticated UI after confirmed server-side session termination.

The React session checks are presentation states only. They provide no authorization and must never protect real data by themselves.

## Integrations still required

1. Select and configure administrator authentication, provision approved admin accounts privately, and wire the adapter to server-backed sign-in/session/logout/recovery operations.
2. Establish secure server-managed sessions, expiry and revocation. Prefer HttpOnly, Secure cookies with appropriate SameSite/CSRF protection; do not store credentials or admin tokens in localStorage/sessionStorage.
3. Enforce administrator roles on every server route and application API request, including direct URL access. Return unauthenticated for absent/expired sessions and reject non-admin users. No applicant data should be sent before server authorization.
4. Connect password-recovery email delivery and a server-validated expiring reset-token flow, with generic responses, rate limits and no account enumeration.
5. Connect the application register to an authorized applicant service with pagination and privacy/audit controls before enabling review actions. No Join KES application data is read by this foundation.

## Changed files

New:

- app/admin/layout.js
- app/admin/loading.js
- app/admin/admin.css
- app/admin/login/page.js
- app/admin/applications/page.js
- app/admin/applications/preview/page.js
- components/admin/AdminAccess.js
- components/admin/ApplicationsPreview.js
- lib/admin/auth.mjs
- tests/admin-auth.test.mjs
- docs/admin-access-foundation.md
- docs/previews/admin-login-desktop.jpg
- docs/previews/admin-login-phone.jpg
- docs/previews/admin-applications-desktop.jpg

Modified: app/robots.js (exclude `/admin` from crawling; metadata is also noindex/nofollow). Search directives are not access control.

## Checks

ESLint, all 29 existing/new tests and Next.js production build pass. Browser verification covers login at 320/390/768/1440px and application shell at 320/768/1440px with no document overflow. Checked required-field focus, linked validation, keyboard Tab and Enter, visible focus, password show/hide, password clearing after attempt, explicit sign-in/recovery unavailability, direct application access, preview exit, and actual OS reduced motion. Inputs are 50px high; primary actions are at least 48px. Browser console warning/error capture was empty. Viewports were reset after testing.

Production login returned HTTP 200, preview returned HTTP 404, and the login contained no preview link. Preview code, link and fictional record strings were absent from production JS/HTML/RSC output. Production console capture was empty. These checks were separate from the development preview. No real applicant information or real credentials were used.

## Applications review

The review panel built on this foundation (cards, register, review drawer, message previews, service contract and remaining integration) is documented in `docs/admin-applications-review.md`.
