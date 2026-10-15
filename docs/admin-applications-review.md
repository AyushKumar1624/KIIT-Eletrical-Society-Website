# KES Applications Review Panel

`/admin/applications`, inside the existing administrator shell (`AdminPanel` in `components/admin/AdminAccess.js`). Frontend only: no backend, no email sending, no real applicant data.

It renders only after `adminAuth.getSession()` returns `authenticated`. Today that never happens, because no auth adapter is connected, so production shows "Service unavailable" and loads nothing. The development preview `/admin/applications/preview` (dev server only; 404 in production) runs the full panel on fictional fixtures.

## What it does

- **Overview cards:** Total Applications, New, Shortlisted, Selected, counted from the loaded dataset by exact status. Each card also filters the register by that status.
- **Register:** applicant (name, roll), school/branch and year, domains, submission date, status, and a **Review Application** button. Search covers name, roll and email; filters cover domain, year and status. Clear filters, 8 rows per page with numbered pages, and loading (skeleton), empty, no-match, error (with retry), unavailable and signed-out states. Below 900px the rows become stacked cards.
- **Review drawer:** a native modal `<dialog>` with focus contained and Esc to close.
  - Shows full applicant details, domains, motivation, experience, interests and the portfolio link. The link is clickable only if it is http(s); anything else, such as `javascript:`, shows as plain text.
  - Has status controls for New, Under Review, Shortlisted, Interview Scheduled, Selected and Not Selected.
  - Interview details (date, IST time, in person/online, venue or meeting link) are required when the status is Interview Scheduled, and stay visible afterwards if set.
  - Internal notes (up to 4,000 characters) are marked administrator-only.
  - Review history is listed chronologically.
- **Explicit Save:**
  - "Unsaved changes" shows in the header and footer, and Save is enabled only when something has changed.
  - Closing with unsaved changes (Close, ×, Esc) asks to discard or keep editing, and leaving the page also warns.
  - Validation errors move focus to the first problem.
  - Every failure keeps the edits and explains the cause: unavailable, signed out, conflict, not found or error.
- **Applicant message previews:** acknowledgement, shortlisting, interview invitation, selection and non-selection.
  - Templates fill in the applicant's first name, domains and interview details.
  - Each message is editable, marked "edited", can be reset to the template, and is saved with the review. Copy text is available.
  - The panel states that it **does not send email**, and nothing claims delivery.

## Service contract — `lib/admin/applications.mjs`

`createApplicationsService(adapter)`; the exported default `applicationsService` has no adapter, so every call resolves to `unavailable`. Adapter exceptions and malformed responses become `error` (raw errors are never shown). Reviews are validated before the adapter is called.

| Method | Request | Response status |
| --- | --- | --- |
| `listApplications()` | — | `ok` {applications[]} · `unauthenticated` · `unavailable` · `error` |
| `saveReview(id, review)` | `{version, status, notes, interview \| null, messages}` | `saved` {application} · `conflict` · `invalid` {errors} · `not-found` · `unauthenticated` · `unavailable` · `error` |
| `updateStatus(id, status, {version})` | status only (for future bulk actions; not used by the UI yet) | same as `saveReview` |

### Application record

```
{ id, version, submittedAt (ISO), status,
  fullName, email, whatsapp, roll, school, programme, year, graduation,
  domains[] (keys from lib/join/application.mjs), motivation, skills, explore, link,
  notes, interview: {date "YYYY-MM-DD", time "HH:MM" IST, mode "In person"|"Online", place} | null,
  messages: { [kind]: edited text },            // only drafts that differ from the template
  history: [{ at (ISO), by, action: "submitted"|"status"|"notes"|"interview"|"message", from?, to?, kind?, text? }] }
```

The applicant fields match `toSubmission()` from Join KES, so the same record can flow from the application endpoint into review.

## Backend integration still required

1. **Admin authentication** (see `docs/admin-access-foundation.md`), then pass a server-backed adapter to `createApplicationsService` in `AdminPanel`.
2. **Server-side authorization** on every list/save/status request, with role checks. The React session check is presentation only.
3. **Application storage:** connect Join KES submission (`app/api/join/applications`) to the same store, so applications exist to review.
4. **Server-side validation** of reviews (reuse `validateReview`), **optimistic concurrency** via `version` (`conflict` when stale), and **server-written history** (actor, timestamp). Never trust client-supplied history.
5. **Pagination/search on the server** once volume grows. The current helpers filter the loaded list in the browser.
6. **Privacy:** limit who sees contact details and notes, log access, and agree a retention period. Notes must never be exposed to applicants.
7. **Sending messages** is out of scope. If added later, it should be a separate, deliberate action with delivery status reported by the mail service, not by this panel.

## Development preview

`npm run dev`, then open `/admin/applications/preview` (also linked from `/admin/login` in development).

- Fixtures: 14 fictional records (`DEMO-` roll numbers, `fictional.*` emails), including an extra-long name, all nine domains on one record, empty optional answers and an unsafe `javascript:` link.
- **Simulate** switches the adapter between normal, slow, empty, loading fails, session ended, saving fails and save conflict. **Reload applications** applies the load modes; **Reset fixtures** restores the data.

The fixtures and adapter (`lib/admin/preview-applications.mjs`, `components/admin/ApplicationsPreview.js`) are imported only by the development-only route and are absent from production output.

## Checks

- **Lint and tests:** ESLint is clean. 38 tests pass, 9 of them new in `tests/admin-applications.test.mjs`: contract, counts, filters, pagination, review validation, links, templates and preview save/conflict.
- **Production build:** builds and the site audit passes. `/admin/applications/preview` returns 404, and `/admin/applications` shows "Service unavailable" with no records. Fixture strings are absent from production output.
- **Preview in the browser:**
  - Counts, search, combined filters, card filters, Clear filters and pagination.
  - The drawer: dirty state, discard guard, interview validation, save and history.
  - Failure modes keeping edits, message edit/reset/edited markers, the list updating after save, Esc to close, unsafe-link rendering, and loading/empty/error/signed-out states with retry.
- **Layout:** measured at 320, 768 and 1440px with no overflow, no text under 13px and no controls under 44px, including in the drawer.
- **Keyboard:** checked with dispatched events. The modal opens on Close, message tabs use roving focus (arrows, Home/End) and the tab order is logical. Real key presses and screenshots weren't available (the browser pane stopped drawing), so a manual keyboard and screen-reader pass is still worthwhile.
