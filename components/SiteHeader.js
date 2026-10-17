"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, JOIN, SOCIETY, MEDIA } from "@/lib/content";

const DESKTOP_QUERY = "(min-width: 1001px)";

export default function SiteHeader({ home = true }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);
  const firstLinkRef = useRef(null);
  const pathname = usePathname();

  // On the homepage, link to in-page anchors; elsewhere, back to the homepage sections.
  const hrefFor = id => (home ? `#${id}` : `/#${id}`);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  const followSection = id => {
    close();
    if (!home) return;
    // Move keyboard focus out of the closing drawer; preserve native anchor scrolling.
    requestAnimationFrame(() => {
      const heading = document.getElementById(id)?.querySelector("h2");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollPercent(Math.min(100, Math.max(0, (y / total) * 100)));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view.
  useEffect(() => {
    if (!home || !window.IntersectionObserver) return;
    const sections = NAV.map(n => document.getElementById(n.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach(s => observer.observe(s));
    const onTop = () => window.scrollY < 200 && setActive(null);
    window.addEventListener("scroll", onTop, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onTop); };
  }, [home]);

  // Mobile menu behaviour: focus, Escape, focus trap, scroll lock, auto-close on desktop.
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    document.body.classList.add("nav-locked");
    const background = [...document.querySelectorAll("main, .site-footer")].map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });

    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); close(true); return; }
      if (e.key !== "Tab" || !headerRef.current) return;
      const focusables = [...headerRef.current.querySelectorAll("a[href], button:not([disabled]):not([tabindex='-1'])")]
        .filter(el => el.offsetParent !== null);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onMq = e => e.matches && close();

    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.classList.remove("nav-locked");
      background.forEach(([el, previous]) => { el.inert = previous; });
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <>
      <header ref={headerRef} className={`site-header${scrolled || !home ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
        <div className="wrap site-header-inner">
          <a className="brand" href={home ? "#top" : "/"} aria-label={`${SOCIETY.name} — home`}>
            <Image className="brand-seal" src={MEDIA.logo.src} alt="" width={96} height={96} sizes="48px" loading="eager" />
            <span className="brand-text">
              <span className="brand-name">KIIT Electrical Society</span>
              <span className="brand-sub">{SOCIETY.motto}</span>
            </span>
          </a>

          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen(v => !v)}
          >
            <span className="nav-toggle-label">{open ? "Close" : "Menu"}</span>
            <span aria-hidden="true" className="nav-toggle-bars" />
          </button>

          <nav id="site-nav" className="site-nav" aria-label="Primary">
            <div className="nav-drawer-header">
              <span className="nav-drawer-title">Section Index</span>
              <span className="nav-drawer-hint">KIIT Electrical Society</span>
            </div>
            <ul className="nav-list">
              {NAV.map((item, i) => (
                <li key={item.id}>
                  <a
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={hrefFor(item.id)}
                    aria-current={active === item.id ? "location" : undefined}
                    className={active === item.id ? "is-active-link" : undefined}
                    onClick={() => followSection(item.id)}
                  >
                    <span className="nav-item-left">
                      <span className="nav-num" aria-hidden="true">§ 0{i + 1}</span>
                      <span className="nav-text">{item.label}</span>
                    </span>
                    {active === item.id && <span className="nav-active-node" aria-hidden="true" />}
                  </a>
                </li>
              ))}
            </ul>
            {/* .portal-link carries the shared header-action layout; .join-link the filled style. */}
            <div className="nav-drawer-cta">
              <Link className="portal-link join-link" href={JOIN.href} aria-current={pathname === JOIN.href ? "page" : undefined} onClick={() => close()}>
                <span>{home ? "Apply to join KES" : JOIN.label}</span>
                <span aria-hidden="true" className="join-link-arrow">→</span>
              </Link>
              <p className="nav-drawer-meta">Recruitment 2026–27 · KIIT Student Activity Centre</p>
            </div>
          </nav>
        </div>
        <div className="header-progress-track" aria-hidden="true">
          <div className="header-progress-fill" style={{ transform: `scaleX(${scrollPercent / 100})` }} />
        </div>
        <button type="button" className="nav-scrim" tabIndex={-1} aria-hidden="true" onClick={() => close()} />
      </header>
    </>
  );
}
