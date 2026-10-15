# KES Member Portal — Phase 1

The portal is a frontend demonstration inside the existing Next.js App Router project. The public website and its design files are unchanged. No dependencies, database, authentication provider, email service or backend endpoints were added.

## Preview

Open `/portal/login`. Use the supplied fictional email format and select a demo role. “Try new member onboarding” starts the four-step flow. The workspace banner identifies fictional records and provides the role switcher.

All sample people, project records, dated activities, announcements and membership identifiers are fictional. KHAOS OF CIRCUIT 2.0 is an unscheduled concept using the supplied Day 1 engineering challenge and Day 2 project expo descriptions. It has no confirmed date, time, venue, eligibility, rules or prizes. Dated activities elsewhere are explicitly fictional demo fixtures.

## Routes and boundaries

- `/portal/login`, `/portal/onboarding`, `/portal`: access demonstration and dashboard.
- `/portal/profile`, `/portal/membership`: profile editing and downloadable front-card SVG, plus interactive front/back preview.
- `/portal/domains` and `/portal/domains/[slug]`: configured domain directory and tabbed workspaces.
- Overview contains My Projects: apply to a fictional project brief, add a new or previous build, list collaborators, link LinkedIn profiles/posts and edit your own records. Applying automatically assigns the current member as owner.
- `/portal/announcements`: audience-aware search, details, read states, pinning, creation and editing.
- `/portal/events` and `/portal/events/[slug]`: concept/sample event hub with reversible local demo registration.
- The sidebar contains only Overview, Domains, Announcements, Events, Calendar, Membership ID card, Notifications, My profile and Settings. Old task and directory URLs redirect to Overview.
- `/portal/calendar`: month/week views, filters and detail dialogs using shared project dates, events and activity records.
- `/portal/notifications`, `/portal/settings`: audience-aware local notification states, appearance/accessibility preferences, demo sign-out and confirmed reset.

## Shared architecture

- `lib/portal/config.mjs`: domain configuration derived from the public society list, roles, permissions, selectors and date formatting. Marketing and Event Management remain one configured domain.
- `lib/portal/data.mjs`: one set of fictional fixtures.
- `lib/portal/service.mjs`: pure frontend operations, validation, derived search/calendar data and saved-session recovery. Replace this layer with backend APIs in a later phase.
- `components/portal/PortalProvider.js`: centralized React state and optional tab-local `sessionStorage` persistence.
- `components/portal/PortalShell.js`: navigation, access demonstration, mobile drawer, search, notification/profile menus and demo role selection.
- `components/portal/ui.js`: reusable accessible fields, native modal dialogs, buttons, tabs, badges, avatars and skeletons.
- Other portal components group member, project, domain, communication and calendar screens.
- `app/portal/portal.css`: styles scoped to portal classes, using the existing KES palette and fonts.

Members own and edit their project records, with automatic current-member assignment. Named society collaborators can see shared builds. Co-leads and leads can view the relevant domain project register; Vice Presidents and Presidents can view the society register. Leads also manage domain announcements. Faculty, Alumni and System Administrator roles have limited previews with their future-specific functionality clearly labeled.

These are UX permissions only. Route redirects, role switches and browser storage are **not authentication or security**. All authorization and identity verification must be enforced by a future server implementation. The membership card is marked as a demo and does not perform QR verification.

## Local data behavior

Profile names and LinkedIn links propagate to project teams and the membership experience. Project dates appear on the calendar; project updates also appear in notifications and workspace search. Announcement audiences also filter associated notifications and search results. Notification preferences control generated in-app demo notifications.

Profile photographs are local data-URL previews (maximum 2 MB). Announcements/resources explicitly label file delivery as future work. The downloadable card embeds its local logo and photo and is an SVG design artifact, not an official credential.

Use Settings → Reset demo records to restore the fixtures. If session storage is unavailable, the portal continues with in-memory state; refresh then resets that state. Closing the browser tab normally clears session-local persistence.

## Validation

Run `node --test tests/portal-projects.test.mjs` and `npm run build`.

Regression coverage includes the exact nine-section navigation, automatic owner assignment, project applications and duplicate prevention, past project recording, owner-only edits, collaborator visibility, LinkedIn validation, date validation, shared calendar/search data, project notifications, old-session migration and retained event/announcement behavior.

Browser verification covers the retained member experience and the revised My Projects flows: applying, adding previous builds, collaborators and LinkedIn links, editing, filters, domain workspaces, calendar links and mobile layouts.
