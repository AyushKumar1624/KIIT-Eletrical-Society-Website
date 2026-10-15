// Portal builds only (NEXT_PUBLIC_PORTAL_DEMO=true); kept for future development. See next.config.mjs.
import PortalProvider from "@/components/portal/PortalProvider";
import PortalShell from "@/components/portal/PortalShell";
import "./portal.css";

const DEMO_METADATA = { title: { default: "KES Member Workspace — Frontend Demo", template: "%s — KES Demo" }, description: "A frontend preview of the KES member workspace with fictional member, project and activity records.", alternates: { canonical: null }, openGraph: { title: "KES Member Workspace — Frontend Demo", description: "Frontend preview with fictional records.", url: "/portal" }, robots: { index: false, follow: false } };
export const metadata = DEMO_METADATA;
export default function PortalLayout({ children }) {
  return <PortalProvider><PortalShell>{children}</PortalShell></PortalProvider>;
}
