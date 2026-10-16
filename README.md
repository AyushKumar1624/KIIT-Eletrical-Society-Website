# KIIT Electrical Society

A static Next.js/React public website for KES. Projects, events, team profiles, galleries, search, filters and dialogs run in the browser. No registration, member portal, admin panel, API routes, database or email service is included.

## Local development

Use Node.js 20.9 or newer.

```sh
npm ci
npm run dev -- --port 3110
```

Open http://localhost:3110/. To preview the production export:

```sh
npm run build
npm start -- --port 3110
npm run audit -- http://localhost:3110
```

`npm start` is a local static-file preview. Production serves the generated `out/` directory directly; no Node.js server is required at runtime. Unknown URLs must return `404.html` with HTTP 404 rather than redirecting to the homepage.

## Checks

```sh
npm test
npm run lint
npm run build
```

The optional `.env.example` setting `NEXT_PUBLIC_SITE_URL` is a public, build-time canonical URL used by metadata, robots and sitemap. Set it to the deployed address before building; changing it requires rebuilding. No secrets are required.

## Public content

- `lib/content.js`: society, navigation, events, people, contact links and media registry.
- `lib/projects/catalogue.mjs`: the 17 engineering projects, categories, descriptions and optional verified photographs/metadata.
- `lib/showcase.mjs`: ancillary documented work.
- `public/media/`: prepared public photographs. Keep alt text, credits and image dimensions with content records.
- `components/projects/`: project cards, filters, detail dialog and image viewer.

Keep unverified project photographs, team details, dates and results unspecified. Public social/contact destinations remain links; the website does not collect applications or messages.

## Deployment

Use the normal Next.js build command (`npm run build`) and publish `out/`. Static export is enabled in `next.config.mjs`. Image assets use their existing local files without a runtime image-optimization endpoint. Fonts are downloaded during the build and served locally in the export.

After deploying this change, remove obsolete database, SMTP and authentication variables from the hosting project's settings if they are no longer used elsewhere. Code removal does not delete previously stored applications, revoke credentials or shut down external services. Handle those separately if required.

See `docs/verification.md` for this change's checks and `docs/project-showcase.md` for project content guidance.
