import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JoinFlow from "@/components/join/JoinFlow";
import { verificationStatus, applicationReadiness } from "@/lib/join/server/index.mjs";
import "./join.css";

export const metadata = {
  title: "Join KES", // the root layout adds "— KIIT Electrical Society"
  description: "Apply to join KIIT Electrical Society: verify your KIIT institutional email, then complete a short membership application.",
  alternates: { canonical: "/join" },
};

// Rendered per request so the page reflects the current email settings and recruitment cycle.
export const dynamic = "force-dynamic";

// /join?preview=1 opens the developer preview, on the development server only.
export default async function JoinPage({ searchParams }) {
  const preview = process.env.NODE_ENV === "development" && (await searchParams)?.preview === "1";
  const verification = verificationStatus().ready;
  const status = { verification, applications: verification && await applicationReadiness() };
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader home={false} />
      <main id="main" className="join">
        <div className="wrap">
          <JoinFlow preview={preview} status={status} />
        </div>
      </main>
      <SiteFooter home={false} />
    </>
  );
}
