# Frontend-only cleanup — 16 October 2026

Reviewed the repository at main commit `f1334edebc5a8a1252e77aee6efd7901e2bd7c2a`, including MongoDB storage, Join KES email verification and application handling, admin authentication/recovery/application review, and the dormant member portal.

## Result

Removed those routes, components, services, credentials/configuration examples, dependencies, provisioning scripts and obsolete feature tests/documentation. Removed recruitment links from the header, footer and Contact area. The About heading now says “What we build together.” The 404 page keeps its existing appearance through dedicated not-found classes.

The public site builds into `out/` with Next.js static export. No runtime API, database, authentication, SMTP or image-optimization endpoint is required. Project filters/details/gallery, event disclosures, public navigation and existing content/media remain in the frontend. The 17-project catalogue and its optional verified metadata are unchanged.

## Checks performed

- Six project catalogue tests passed, covering unique records, category counts, content boundaries, search, unknown metadata and gallery helpers.
- ESLint passed without warnings after the configuration cleanup.
- Production static build passed with the deployed public URL set. The build generated the homepage, 404, icons, social images, robots and sitemap; no dynamic routes remain. A single build worker was used in this environment (`CIRCLE_NODE_TOTAL=2`).
- HTTP smoke check passed against the exported files: seven public routes, 12 removed routes returning HTTP 404, all seven section anchors, 17 rendered project cards and 15 linked CSS/JavaScript/font assets.
- All 60 registered public media assets exist and have alt descriptions. Their files were preserved.
- Dependency lockfile consistency passed `npm ci --dry-run --ignore-scripts`. Removed backend libraries are absent from package.json and package-lock.json.
- `git diff --check` passed.

The cloud browser could not reach this execution environment's localhost (connection refused), so no new visual/responsive or keyboard interaction pass is claimed. Earlier public UI observations are recorded as historical in the other design notes.

## Deployment and external services

Publish `out/` and preserve HTTP 404 handling for unknown URLs. Set `NEXT_PUBLIC_SITE_URL` before the production build. This code change does not delete existing database records, revoke credentials, remove hosting environment variables or stop external services. Those remain separate administrative actions. Content changes now require editing the central datasets and rebuilding; there is no admin editor.
