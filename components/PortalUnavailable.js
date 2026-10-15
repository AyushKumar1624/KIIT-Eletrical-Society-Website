import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { JOIN } from "@/lib/content";

// Served on every /portal address. The portal code is kept for future
// development but is not publicly available (see next.config.mjs).
export default function PortalUnavailable() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader home={false} />
      <main id="main" className="portal panel-green">
        <div className="wrap portal-inner">
          <p className="kicker"><span className="kicker-num">Members</span> Portal</p>
          <h1 className="section-title">This page <em>isn’t available.</em></h1>
          <p className="portal-text">
            There is no member sign-in on this website. To become part of KES, start a membership application with your
            KIIT institutional email.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-brass" href={JOIN.href}>{JOIN.label} <span aria-hidden="true" className="btn-arrow">→</span></Link>
            <Link className="btn btn-line" href="/">Back to the homepage</Link>
          </div>
        </div>
      </main>
      <SiteFooter home={false} />
    </>
  );
}
