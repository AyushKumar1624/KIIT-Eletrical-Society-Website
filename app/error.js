"use client";

import { useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Redacted error logging — never log sensitive internals, tokens, or PII
    console.error("[error_boundary] Client render error occurred:", error?.digest || "unspecified");
  }, [error]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader home={false} />
      <main id="main" className="portal panel-green">
        <div className="wrap portal-inner">
          <p className="kicker"><span className="kicker-num">500</span> Circuit interrupted</p>
          <h1 className="section-title">An unexpected fault <em>occurred.</em></h1>
          <p className="portal-text">
            The system encountered an unhandled exception while rendering. You can attempt to reset the connection or return to the society homepage.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-brass"
              onClick={() => reset()}
            >
              Reset connection <span aria-hidden="true" className="btn-arrow">↻</span>
            </button>
            <Link className="btn btn-line" href="/">
              Return to homepage <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter home={false} />
    </>
  );
}
