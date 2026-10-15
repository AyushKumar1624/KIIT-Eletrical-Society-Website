"use client";

import { useEffect } from "react";
import { SOCIETY } from "@/lib/content";

// "Filament ignition": current flows in, the bulb draws, the filament lights,
// and light floods out to reveal the page. The head script in app/layout.js
// decides whether it plays (homepage, once per session, motion allowed) by
// adding html.kes-boot before first paint. The timeline is pure CSS
// (app/experience.css), so it always ends on its own; this component only
// lets visitors skip it and cleans up afterwards.
export default function BootSequence() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("kes-boot")) return;
    const overlay = document.querySelector(".boot");
    const finish = () => {
      root.classList.remove("kes-boot", "kes-boot-skip");
      cleanup();
    };
    const skip = () => {
      root.classList.add("kes-boot-skip");
      setTimeout(finish, 260);
    };
    // Keep the class briefly after the light-out so the hero's cued entrance completes.
    const onEnd = e => { if (e.target === overlay && e.animationName === "boot-out") setTimeout(finish, 1200); };
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") e.preventDefault(); // dismiss only; don't also scroll or activate
      skip();
    };
    function cleanup() {
      overlay?.removeEventListener("animationend", onEnd);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", skip);
    }
    overlay?.addEventListener("animationend", onEnd);
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", skip, { once: true, passive: true });
    return cleanup;
  }, []);

  return (
    <div className="boot" aria-hidden="true">
      <span className="boot-wire boot-wire--l" />
      <span className="boot-wire boot-wire--r" />
      <svg className="boot-bulb" viewBox="0 0 120 180" width="112" height="168">
        <defs>
          <radialGradient id="boot-glow-fill">
            <stop offset="0" stopColor="#fff3d6" stopOpacity=".95" />
            <stop offset=".35" stopColor="#e1c595" stopOpacity=".55" />
            <stop offset="1" stopColor="#b59a69" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="boot-glow" cx="60" cy="72" r="58" fill="url(#boot-glow-fill)" />
        <path className="boot-glass" pathLength="1" d="M60 8C30 8 10 31 10 60c0 22 13 35 23 49 6 8 9 15 9 23h36c0-8 3-15 9-23 10-14 23-27 23-49 0-29-20-52-50-52Z" />
        <path className="boot-wires" pathLength="1" d="M50 132V94M70 132V94" />
        <path className="boot-filament" pathLength="1" d="M50 94l3.3-14 3.4 14 3.3-14 3.3 14 3.4-14L70 94" />
        <path className="boot-base" pathLength="1" d="M42 140h36M44 148h32M47 156h26M53 164h14" />
      </svg>
      <p className="boot-name">{SOCIETY.name}</p>
      <p className="boot-motto">{SOCIETY.motto}</p>
    </div>
  );
}
