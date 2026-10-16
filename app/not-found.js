import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader home={false} />
      <main id="main" className="not-found panel-green">
        <div className="wrap not-found-inner">
          <p className="kicker"><span className="kicker-num">404</span> Open circuit</p>
          <h1 className="section-title">This page isn’t <em>connected.</em></h1>
          <p className="not-found-text">The link may be out of date, or the page has moved. Everything about the society starts from the homepage.</p>
          <div className="hero-actions">
            <Link className="btn btn-brass" href="/">Back to the homepage <span aria-hidden="true" className="btn-arrow">→</span></Link>
            <Link className="btn btn-line" href="/#events">See events</Link>
          </div>
        </div>
      </main>
      <SiteFooter home={false} />
    </>
  );
}
