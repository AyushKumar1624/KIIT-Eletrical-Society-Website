# Motion and responsive refinement

Preserved the forest-green, ivory and gold theme, current fonts, verified content and exact motto “Build small, think big.” No deployment performed.

## Changes

- Removed the first-visit overlay and its timers; scrolling and the hero are immediate.
- Short, optional 150–220ms entrances with no sibling stagger. Removed the unused intro component and an obsolete About visibility gate.
- OS reduced motion always wins, including without JavaScript. Portal preferences can additionally disable animation. Static loading placeholders replace continuous shimmer.
- Gallery frames contain the full photograph, with captions beneath and DOM order matching visual order. Horizontal swipe detection excludes vertical gestures; dialog buttons, arrow keys, Escape and opener focus remain available.
- Consistent portrait columns: one on the narrowest phones, two on larger phones, three on tablets and five on desktop.
- Phone dashboard filters stack, project heading no longer reserves a 350px vertical flex basis, and calendar items have at least 44px height.
- Portal compact sidebar keeps destination names visible. Mobile drawer isolates the workspace with inert, provides dialog semantics and controls association, traps Tab in both directions, closes on active-page selection and restores appropriate focus.
- Public mobile menu isolates main/footer while open. Visible focus and generous navigation targets remain available.

## Verification

- Public viewport widths: 320, 390, 768, 1024, 1440px. No document overflow; hero opacity 1, no intro, instant scrolling and contained gallery images.
- Portal Overview: 320, 390, 768, 1000, 1001 breakpoint (browser reported 1002), 1440px; no document overflow or outlying main content.
- All nine portal sections checked at 320px; no topbar overflow. Calendar deliberately scrolls inside its labelled region.
- Project search “rover” with Building filter returns the matching fictional project. Restored filters after checking.
- Live OS preference was reduced motion; portal Reduce motion setting additionally checked and restored. Non-reduced timing verified in styles; OS settings were not changed.
- Gallery next control advances the caption; Escape closes and returns focus to the original photo button.
- Mobile portal Tab/Shift+Tab loop between brand and final link. Escape returns to Open navigation; selecting active Overview closes the drawer and focuses main.
- Compact desktop sidebar measured 180px with all nine text labels displayed; normal desktop sidebar 246px.
- Browser console error list empty. Lint, eight existing project tests and local production build with NEXT_PUBLIC_PORTAL_DEMO=true passed.
- Screenshots: previews/responsive-gallery-tablet.jpg, previews/responsive-portal-phone.jpg, previews/responsive-portraits-phone.jpg.

Responsive tests use browser viewport overrides, not physical devices. Swipe direction logic was reviewed; a physical touch-device test remains useful. Existing project photographs, stages and teams remain unsupplied as documented in projects-events-refinement.md. This chunk introduces no new content or destinations.

Run locally with `npm run dev -- --port 3110` and open http://localhost:3110/. The member workspace remains a browser-only fictional demo in development.
