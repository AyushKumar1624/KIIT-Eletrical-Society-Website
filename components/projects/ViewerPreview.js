"use client";
import { useState } from "react";
import ProjectDetail from "./ProjectDetail";
import { PROJECT_CATALOGUE } from "@/lib/projects/catalogue.mjs";

// Development-only viewer exercise. Logos are UI fixtures, not build evidence.
const fixture = {
  ...PROJECT_CATALOGUE[0], title: "Viewer test fixture — not a project record",
  gallery: [
    { src: "/kes-logo.jpeg", alt: "KES logo used only as a viewer test fixture", caption: "Test fixture 1 — logo, not a project photograph" },
    { src: "/icon.png", alt: "KES app icon used only as a second viewer test fixture", caption: "Test fixture 2 — app icon, not a project photograph" },
    { src: "/missing-project-viewer-fixture.webp", alt: "Deliberately missing image for fallback verification", caption: "Test fixture 3 — intentionally unavailable image" },
  ],
};
export default function ViewerPreview() {
  const [open, setOpen] = useState(null);
  return <main className="section panel-parchment"><div className="wrap"><h1>Development-only image viewer check</h1><p>These logo fixtures are not project photographs and never appear in the public catalogue.</p><button type="button" className="btn" onClick={e => setOpen(e.currentTarget)}>Open viewer test details</button>{open && <ProjectDetail project={fixture} opener={open} onClose={() => setOpen(null)} />}</div></main>;
}
