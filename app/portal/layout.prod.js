// Public builds: the member portal is not available, so every /portal route
// shows a short "not available" page pointing to Join KES, and no portal code
// is bundled. The portal itself is the *.demo.js files beside this one,
// compiled only with NEXT_PUBLIC_PORTAL_DEMO=true (see next.config.mjs).
export const metadata = {
  title: "Member portal", // the root layout adds "— KIIT Electrical Society"
  description: "The KIIT Electrical Society member portal is not publicly available.",
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function PortalLayout({ children }) {
  return children;
}
