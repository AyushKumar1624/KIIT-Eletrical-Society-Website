"use client";
import { useEffect, useRef, useState } from "react";
import ProjectMedia from "./ProjectMedia";
import { imageIndex, imageZoom } from "@/lib/projects/catalogue.mjs";
import { trapDialogTab } from "./dialog";

export function ImageViewer({ images, initialIndex = 0, opener, onClose }) {
  const dialogRef = useRef(null); const closeRef = useRef(null);
  const [index, setIndex] = useState(initialIndex); const [zoom, setZoom] = useState(1); const [notice, setNotice] = useState(""); const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);
  const image = images[index];
  function step(direction) { setIndex(i => imageIndex(i, direction, images.length)); setZoom(1); setNotice(""); stageRef.current?.scrollTo(0, 0); }
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal(); closeRef.current?.focus();
    const fullscreenChanged = () => setIsFullscreen(document.fullscreenElement === dialog);
    document.addEventListener("fullscreenchange", fullscreenChanged);
    return () => { document.removeEventListener("fullscreenchange", fullscreenChanged); dialog.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [opener]);
  async function fullscreen() {
    const dialog = dialogRef.current;
    try {
      if (document.fullscreenElement === dialog) await document.exitFullscreen();
      else if (dialog.requestFullscreen) await dialog.requestFullscreen();
      else setNotice("Full-screen viewing is not supported in this browser.");
    } catch { setNotice("Full-screen viewing is unavailable. The enlarged viewer remains usable."); }
  }
  function fit() { setZoom(1); stageRef.current?.scrollTo(0, 0); }
  return <dialog ref={dialogRef} className="kes-image-viewer" aria-labelledby="kes-viewer-title"
    onCancel={e => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}
    onKeyDown={e => {
      trapDialogTab(e);
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.shiftKey && zoom > 1 && e.key.startsWith("Arrow")) {
        e.preventDefault(); e.stopPropagation();
        stageRef.current?.scrollBy({ left: e.key === "ArrowRight" ? 80 : e.key === "ArrowLeft" ? -80 : 0, top: e.key === "ArrowDown" ? 80 : e.key === "ArrowUp" ? -80 : 0, behavior: "instant" });
      } else if (!e.shiftKey && images.length > 1 && ["ArrowRight", "ArrowLeft"].includes(e.key)) {
        e.preventDefault(); e.stopPropagation(); step(e.key === "ArrowRight" ? 1 : -1);
      }
    }}>
    <div className="kes-viewer-content">
      <header className="kes-viewer-toolbar"><h3 id="kes-viewer-title">Project photograph</h3><button ref={closeRef} type="button" onClick={onClose} aria-label="Close image viewer">Close ×</button></header>
      <div ref={stageRef} className="kes-image-stage" tabIndex={0} role="region" aria-label="Enlarged photograph; scroll to explore when zoomed" aria-describedby="kes-viewer-help">
        <div className="kes-image-canvas" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}><ProjectMedia key={image.src} image={image} title={image.alt} sizes="100vw" /></div>
      </div>
      <div className="kes-viewer-caption" aria-live="polite" aria-atomic="true"><p>{image.caption || image.alt}</p><span>{index + 1} / {images.length}</span>{image.credit && <small>{image.credit}</small>}</div>
      <div className="kes-viewer-controls">
        {images.length > 1 && <div className="kes-control-group"><button type="button" onClick={() => step(-1)} aria-label="Previous project photograph">← Previous</button><button type="button" onClick={() => step(1)} aria-label="Next project photograph">Next →</button></div>}
        <div className="kes-control-group"><button type="button" onClick={() => setZoom(z => imageZoom(z - .5))} disabled={zoom === 1} aria-label="Zoom out">−</button><output aria-label="Image zoom">{Math.round(zoom * 100)}%</output><button type="button" onClick={() => setZoom(z => imageZoom(z + .5))} disabled={zoom === 3} aria-label="Zoom in">+</button><button type="button" onClick={fit}>Reset to fit</button><button type="button" onClick={fullscreen} aria-pressed={isFullscreen}>{isFullscreen ? "Exit full screen" : "Full screen"}</button></div>
      </div>
      <p id="kes-viewer-help" className="kes-viewer-help">{images.length > 1 && "Arrow keys browse photographs. "}Shift + arrow keys pan when zoomed.</p>
      {notice && <p role="status" className="kes-viewer-notice">{notice}</p>}
    </div>
  </dialog>;
}

export default function ProjectGallery({ images, title }) {
  const [selected, setSelected] = useState(0); const [viewer, setViewer] = useState(null);
  const items = images.filter(image => image?.src);
  if (!items.length) return null;
  return <section className="kes-project-gallery" aria-labelledby="kes-project-gallery-title"><h3 id="kes-project-gallery-title">Project gallery</h3>
    <button className="kes-gallery-feature" type="button" aria-label={`Enlarge photograph of ${title}`} onClick={e => setViewer({ index: selected, opener: e.currentTarget })}><ProjectMedia key={items[selected].src} image={items[selected]} title={title} sizes="(max-width: 768px) 100vw, 1100px" /><span>Enlarge photograph ↗</span></button>
    <p className="kes-gallery-caption">{items[selected].caption || items[selected].alt}{items[selected].credit && ` · ${items[selected].credit}`}</p>
    {items.length > 1 && <ul className="kes-gallery-thumbnails" aria-label="Choose a project photograph">{items.map((image, i) => <li key={`${image.src}-${i}`}><button type="button" aria-label={`Photograph ${i + 1}: ${image.alt}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><ProjectMedia image={image} title={title} sizes="120px" /></button></li>)}</ul>}
    {viewer && <ImageViewer images={items} initialIndex={viewer.index} opener={viewer.opener} onClose={() => setViewer(null)} />}
  </section>;
}
