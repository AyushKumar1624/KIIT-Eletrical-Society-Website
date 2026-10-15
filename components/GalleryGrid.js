"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// Gallery grid with a lightbox. Each tile is a real button; the viewer is a
// native <dialog> (focus trapping, Escape, top layer) with arrow-key and
// swipe navigation. Controls and visibility do not depend on animations.
export default function GalleryGrid({ items }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const touchStart = useRef(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const open = (i, opener) => {
    openerRef.current = opener;
    setIndex(i);
    dialogRef.current?.showModal();
    setVisible(true);
  };

  const close = useCallback(() => {
    setVisible(false);
    dialogRef.current?.close();
    openerRef.current?.focus();
  }, []);

  const step = useCallback(d => setIndex(i => (i + d + items.length) % items.length), [items.length]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onKey = e => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onCancel = e => { e.preventDefault(); close(); };
    dlg.addEventListener("keydown", onKey);
    dlg.addEventListener("cancel", onCancel);
    return () => { dlg.removeEventListener("keydown", onKey); dlg.removeEventListener("cancel", onCancel); };
  }, [step, close]);

  const item = items[index];

  return (
    <>
      <ul className="gallery">
        {items.map((g, i) => (
          <li key={g.src} className={`gallery-item gallery-item--${g.span}`}>
            <figure>
              <button type="button" className="gallery-open" onClick={e => open(i, e.currentTarget)} aria-label={`View photo: ${g.caption}`}>
                <Image src={g.src} alt={g.alt} width={g.w} height={g.h} sizes={g.span === "wide" ? "(max-width: 560px) 100vw, 66vw" : "(max-width: 560px) 100vw, (max-width: 1080px) 50vw, 33vw"} />
              </button>
              <figcaption>
                <span>{g.caption}</span>
                <small>{g.meta}</small>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className={`lightbox${visible ? " is-visible" : ""}`}
        aria-label="Photo viewer"
        onClick={e => { if (e.target === e.currentTarget) close(); }}
        onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={e => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        {item && (
          <figure className="lightbox-figure">
            <Image key={item.src} className="lightbox-img" src={item.src} alt={item.alt} width={item.w} height={item.h} sizes="(max-width: 1100px) 94vw, 1100px" />
            <figcaption aria-live="polite" aria-atomic="true">
              <span>{item.caption}</span>
              <small>{item.meta} · {index + 1} / {items.length}</small>
            </figcaption>
          </figure>
        )}
        <button type="button" className="lightbox-btn lightbox-close" onClick={close} aria-label="Close photo viewer">×</button>
        <button type="button" className="lightbox-btn lightbox-prev" onClick={() => step(-1)} aria-label="Previous photo">←</button>
        <button type="button" className="lightbox-btn lightbox-next" onClick={() => step(1)} aria-label="Next photo">→</button>
      </dialog>
    </>
  );
}
