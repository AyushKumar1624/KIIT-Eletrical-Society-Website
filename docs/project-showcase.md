# Engineering project showcase

Implemented in the existing Next.js application without additional dependencies or a backend. Changes are limited to Projects, its catalogue, detail/image-viewer components. Existing typography, forest green, ivory and restrained gold are reused. No deployment was performed.

## Public experience

The homepage Projects section presents exactly 17 unique builds, with categories and titles supplied in the brief. Counts are derived from the catalogue: Robotics & Automation 5; UAV & Aerospace 6; IoT, Electronics & Embedded Systems 4; Artificial Intelligence & Intelligent Systems 2. All Projects shows 17.

Each entire card is one semantic button with a complete title, category, 24–27-word purpose, neutral cover and Explore Project affordance. Categories combine with a case-insensitive search. An empty result has a clear reset action. Selected filters and search survive opening and closing details.

Every project has 180–200 words across its introduction, overview, working principle, technical exploration, potential applications and takeaway. General principles are labelled separately from documented functionality. Medical, assistive and safety descriptions remain prototype/concept explorations. No performance, deployment, team, date or completion claims were added.

Details use a native dialog with internal scrolling, sticky close control, initial focus, explicit Tab wrapping, Escape/backdrop closing, inert background and scroll locking. Closing restores the originating card and saved page position. Three/two/one-column grids adapt to desktop/tablet/phone; long categories and titles wrap without truncation. Optional animation is 160–180ms with no stagger and reduced-motion support.

Gallery components support a cover photograph and multiple gallery images, thumbnail selection, enlargement, previous/next and arrow keys, image counters, 100–300% zoom, fit reset, keyboard panning with Shift + arrows, fullscreen requests and a graceful unsupported-browser message. Nested viewer Escape/backdrop closes only the image layer before the detail layer. Image loading failures use the same neutral fallback. Actual photographs use next/image with stable frames and responsive sizes.

## Content and photographs still needed

No available asset could be reliably associated with a specific named project in the supplied catalogue. Consequently all 17 covers are explicitly neutral placeholders and all gallery arrays are empty. Existing workshop/event/creative photographs were preserved under a separate disclosure; none has been relabelled as evidence for an individual build.

For each project, supply verified photographs with clear association, alt descriptions, captions and credits. Optional verified team members, development year, current status, implementation details and supporting references can then be added. Unknown optional metadata is null in the dataset and omitted from public views.

The 12 older project records were carefully matched through legacy titles and retained as editorial provenance. Renamed matches include Line Follower → Advanced Line Follower Robot, Surveillance Drone → Autonomous Surveillance Drone, Smart Helmet → Smart Helmet System, Alcohol Detection Ignition Lock → Alcohol Detection System, Hydroponic Plant Monitor → Hydroponic Plant Monitoring System, Wireless Power Transfer → Wireless Power Transfer System and Anti-Sleep Monitor → Anti-Sleep Monitoring System. Old component/model/algorithm assertions were not promoted to verified public implementation facts without supporting documentation. The Arduino platform is named only for the project whose supplied title establishes it; the board model remains unspecified.

To add a photograph, update coverImage and/or gallery with `{src, alt, caption?, credit?}` in lib/projects/catalogue.mjs. Cover/gallery duplicates are removed while retaining gallery captions. Keep catalogue photographs separate from unrelated event coverage.

## Files

Updated:

- app/page.js — Projects heading and introduction only.
- components/FeaturedProjects.js — new catalogue, preserved ancillary documentation and existing domain-link helper.
- lib/showcase.mjs — ancillary work records only; removed the unused duplicate member-project presentation mapping.

Added:

- lib/projects/catalogue.mjs — authoritative 17 records, category counts, search, gallery helpers and legacy matches.
- components/projects/ProjectCatalogue.js — reusable card and category filters, search and selected detail state.
- components/projects/ProjectDetail.js — engineering detail dialog and optional metadata.
- components/projects/ProjectGallery.js — thumbnail gallery and layered image viewer.
- components/projects/ProjectMedia.js — responsive photograph/fallback frames.
- components/projects/dialog.js — shared keyboard focus wrapping.
- app/project-catalogue.css — scoped catalogue and dialog styles.
- tests/projects-catalogue.test.mjs — six catalogue/content/gallery tests.
- docs/project-showcase.md and docs/previews/project-*.jpg — implementation notes and rendered previews.

The public Events and leadership content was preserved. Join KES, authentication and administrator functionality were subsequently removed in the frontend-only cleanup. Existing domain-to-work anchors still open the ancillary disclosure. No unrelated assets were removed.

## Historical showcase verification

These checks describe the earlier showcase implementation. The isolated development viewer fixture has since been removed. See verification.md for current cleanup checks.

- Lint, all 44 existing/new tests and production build passed. A concurrent high-worker build hit the machine's memory limit; the final build used process-local CIRCLE_NODE_TOTAL=2 (one Next worker), with no configuration-file change.
- Exactly 17 unique titles/IDs, correct category assignments, derived counts, 20–30-word card copy, 150–250-word details and explicit unknown metadata are covered by tests.
- Browser testing opened every one of the 17 cards and checked its detail title. Category filtering, combined search, empty-state reset and persistent selection were verified.
- Checked 320, 390, 768 and 1440px catalogue layouts: no document/filter overflow; grid columns 1/1/2/3. Checked long-title phone detail and gallery controls without internal horizontal overflow.
- Keyboard Tab containment, initial close-button focus, Escape and originating-card focus were verified. Desktop page scroll was exactly 3732 before/open/after; narrow-phone scroll was exactly 5134.4 before/after, with the search retained.
- Nested gallery tests used development-only logo fixtures. Verified thumbnail selection, previous/next, arrow navigation, 150% zoom, zoom out, reset to 100%, keyboard pan by 80px, correct counters, image fallback and two-stage Escape/backdrop behaviour. Fullscreen was unavailable in the in-app browser; the accessible fallback message appeared and the viewer stayed usable. Physical touch-device and supported-browser fullscreen testing remain useful.
- Live OS reduced motion was active; computed detail animation was none. Image-viewer caption colour was checked after correcting inheritance from the detail body.
- The public catalogue had no console errors/warnings before fixture testing. The deliberately missing fixture produced an expected image error only in the isolated development test. Fixture text and missing-image URL are absent from production output, and its generated route status is 404.
- Existing navigation and domain documentation anchors were inspected; viewports were reset after testing.

Run `npm run dev -- --port 3110`, then open http://localhost:3110/#projects.
