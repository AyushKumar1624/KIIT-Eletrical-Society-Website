"use client";

import { useEffect, useRef, useState } from "react";

// Scroll and pointer interaction for the homepage:
// - a brass "current" bar showing reading progress (--scroll on <html>)
// - gentle parallax on two photographs
// - a cursor spotlight on cards (--mx/--my) and a slight tilt on the hero photo
// - a back-to-top switch with a progress ring
// Motion parts stop when the visitor prefers reduced motion; the progress
// bar and back-to-top button remain because they carry information.

const PARALLAX = [
  [".hero-photo-main > img", 0.1],
  [".about-print", -0.07],
];
const SPOT = ".work-card, .reason, .domain-row, .archive-card, .leader, .contact-links a";

export default function ScrollFx() {
  const [showTop, setShowTop] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = () => root.classList.contains("reduce-motion");
    const layers = PARALLAX.flatMap(([sel, speed]) => [...document.querySelectorAll(sel)].map(el => ({ el, speed })));
    let queued = false;

    function frame() {
      queued = false;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll", (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4));
      const show = window.scrollY > window.innerHeight * 0.8;
      if (show !== shown.current) { shown.current = show; setShowTop(show); }
      const still = reduced();
      root.classList.toggle("fx-parallax", !still);
      for (const { el, speed } of layers) {
        if (still) { el.style.translate = ""; continue; }
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > window.innerHeight + 100) continue;
        const offset = (box.top + box.height / 2 - window.innerHeight / 2) * speed;
        el.style.translate = `0 ${Math.max(-60, Math.min(60, offset)).toFixed(1)}px`;
      }
    }
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

    // Pointer: spotlight position on cards, tilt on the hero photo (mouse/pen only).
    const hero = document.querySelector(".hero-photo-main");
    function onPointer(e) {
      if (e.pointerType === "touch") return;
      const card = e.target.closest?.(SPOT);
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      if (hero && !reduced()) {
        const r = hero.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        const x = inside ? (e.clientX - r.left) / r.width - 0.5 : 0;
        const y = inside ? (e.clientY - r.top) / r.height - 0.5 : 0;
        hero.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
        hero.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      }
    }
    const resetHero = () => { hero?.style.setProperty("--rx", "0deg"); hero?.style.setProperty("--ry", "0deg"); };

    request();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    document.addEventListener("pointermove", onPointer, { passive: true });
    hero?.addEventListener("pointerleave", resetHero);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      document.removeEventListener("pointermove", onPointer);
      hero?.removeEventListener("pointerleave", resetHero);
      root.classList.remove("fx-parallax");
      layers.forEach(({ el }) => { el.style.translate = ""; });
    };
  }, []);

  function toTop() {
    const smooth = !document.documentElement.classList.contains("reduce-motion");
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    const heading = document.getElementById("hero-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className="scroll-current" aria-hidden="true"><span /></div>
      <button type="button" className={`to-top${showTop ? " is-visible" : ""}`} onClick={toTop} aria-label="Back to top" tabIndex={showTop ? 0 : -1} aria-hidden={!showTop}>
        <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
          <circle className="to-top-track" cx="24" cy="24" r="21" />
          <circle className="to-top-ring" cx="24" cy="24" r="21" pathLength="100" />
          <path className="to-top-arrow" d="M24 31V17M18 23l6-6 6 6" />
        </svg>
      </button>
    </>
  );
}
