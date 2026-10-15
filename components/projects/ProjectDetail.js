"use client";
import { useEffect, useRef } from "react";
import ProjectMedia from "./ProjectMedia";
import ProjectGallery from "./ProjectGallery";
import { trapDialogTab } from "./dialog";
import { projectImages } from "@/lib/projects/catalogue.mjs";

export default function ProjectDetail({ project, opener, scrollPosition, onClose }) {
  const dialogRef = useRef(null); const closeRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const pagePosition = scrollPosition || { left: window.scrollX, top: window.scrollY };
    dialog.showModal(); closeRef.current?.focus();
    return () => {
      dialog.close();
      if (opener?.isConnected) requestAnimationFrame(() => { opener.focus({ preventScroll: true }); window.scrollTo({ ...pagePosition, behavior: "instant" }); });
    };
  }, [opener, scrollPosition]);
  return <dialog ref={dialogRef} className="kes-project-dialog" aria-labelledby="kes-project-detail-title"
    onKeyDown={trapDialogTab}
    onCancel={e => { if (e.target !== e.currentTarget) return; e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <article className="kes-project-detail">
      <header className="kes-project-detail-bar"><span>Project notebook</span><button ref={closeRef} type="button" aria-label="Close project details" onClick={onClose}>Close ×</button></header>
      <div className="kes-project-detail-hero"><ProjectMedia image={project.coverImage} title={project.title} category={project.category} sizes="(max-width: 768px) 100vw, 550px" /><div><p className="kes-project-category">{project.categoryTitle}</p><h2 id="kes-project-detail-title">{project.title}</h2><p>{project.introduction}</p></div></div>
      <div className="kes-project-detail-body">
        <section><h3>Project overview</h3><p>{project.overview}</p></section>
        <section className="kes-principle"><h3>How it works</h3><p className="kes-concept-label">General engineering principle</p><p>{project.workingPrinciple}</p></section>
        <section><h3>Technical exploration</h3><p>{project.technicalExploration}</p>{project.verifiedTechnologies.length > 0 && <ul className="kes-verified-technologies">{project.verifiedTechnologies.map(item => <li key={item}>{item}</li>)}</ul>}</section>
        <section><h3>Potential applications</h3><p>{project.potentialApplications}</p></section>
        <section className="kes-takeaway"><h3>Engineering takeaway</h3><p>{project.takeaway}</p></section>
        {(project.team?.length > 0 || project.year || project.status) && <section><h3>Project information</h3><dl className="kes-project-facts">{project.team?.length > 0 && <div><dt>Team</dt><dd>{project.team.join(", ")}</dd></div>}{project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}{project.status && <div><dt>Status</dt><dd>{project.status}</dd></div>}</dl></section>}
        <ProjectGallery images={projectImages(project)} title={project.title} />
        {project.references?.length > 0 && <section><h3>Supporting references</h3><ul>{project.references.map(ref => <li key={ref.href}><a href={ref.href} target="_blank" rel="noopener noreferrer">{ref.label} (opens in a new tab)</a></li>)}</ul></section>}
      </div>
    </article>
  </dialog>;
}
