"use client";

import { useEffect } from "react";

// Scroll reveals. Nothing is hidden in advance: an element is only animated
// at the moment it first enters the viewport, so content stays visible with
// JavaScript off, and nothing animates when the visitor prefers reduced motion.
// Elements entering together are staggered; app/experience.css chooses the
// effect (rise, title mask, photographic "develop").
const SELECTOR = [
  ".section-head", ".impact-item", ".about-intro", ".reason", ".about-visual",
  ".plate", ".domain-row", ".work-card", ".register-row", ".archive-card", ".feature", ".ev", ".method li",
  ".leader", ".faculty", ".alumni li", ".gallery-item", ".contact-grid > *", ".team-photo", ".domain-group-title",
].join(",");
const STEP = 80;     // ms between items entering together
const MAX_STEPS = 5;

export default function Reveal() {
  useEffect(() => {
    if (document.documentElement.classList.contains("reduce-motion") || !window.IntersectionObserver) return;

    const io = new IntersectionObserver(entries => {
      entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, i) => {
          entry.target.style.setProperty("--reveal-delay", `${Math.min(i, MAX_STEPS) * STEP}ms`);
          entry.target.classList.add("reveal-enter");
          io.unobserve(entry.target);
        });
    }, { threshold: 0 });

    document.querySelectorAll(SELECTOR).forEach(el => {
      // Anything already on screen is left as it is.
      if (el.getBoundingClientRect().top >= window.innerHeight) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return null;
}
