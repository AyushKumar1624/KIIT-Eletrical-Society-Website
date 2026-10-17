"use client";
import { useEffect, useState } from "react";
import { PROJECT_CATALOGUE, PROJECT_CATEGORIES, categoryCounts, filterProjects } from "@/lib/projects/catalogue.mjs";
import ProjectMedia from "./ProjectMedia";
import ProjectDetail from "./ProjectDetail";

export function ProjectCard({ project, onOpen }) {
  const tags = project.verifiedTechnologies?.length ? project.verifiedTechnologies : (project.legacyRecord?.stack || []);
  return <li id={`project-${project.id}`} className="kes-project-card"><button type="button" className="kes-project-card-button" aria-haspopup="dialog" aria-label={`Explore Project: ${project.title}`} aria-describedby={`purpose-${project.id}`} onClick={e => onOpen(project, e.currentTarget)}>
    <ProjectMedia image={project.coverImage} title={project.title} category={project.category} />
    <span className="kes-project-card-body">
      <span className="kes-project-category">{project.categoryTitle}</span>
      <span className="kes-project-card-title" role="heading" aria-level={3}>{project.title}</span>
      <span className="kes-project-description" id={`purpose-${project.id}`}>{project.description}</span>
      {tags.length > 0 && (
        <span className="kes-project-tech-tags" aria-label="Technical stack">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="kes-project-tech-tag">{tag}</span>
          ))}
          {tags.length > 3 && (
            <span className="kes-project-tech-tag kes-project-tech-tag--more">+{tags.length - 3}</span>
          )}
        </span>
      )}
      <span className="kes-project-card-action">Explore Project <span aria-hidden="true">↗</span></span>
    </span>
  </button></li>;
}

export function CategoryFilters({ selected, onSelect }) {
  const counts = categoryCounts();
  return <div className="kes-project-filters" role="group" aria-label="Filter projects by technical category">{[{ id: "all", title: "All Projects" }, ...PROJECT_CATEGORIES].map(category => <button key={category.id} type="button" aria-pressed={selected === category.id} onClick={() => onSelect(category.id)}>{category.title}<span>{counts[category.id]}</span></button>)}</div>;
}

export default function ProjectCatalogue() {
  const [category, setCategory] = useState("all"); const [query, setQuery] = useState(""); const [selected, setSelected] = useState(null);
  const projects = filterProjects(category, query);
  useEffect(() => {
    // Keep existing domain-to-documentation links usable inside the ancillary
    // disclosure without changing any domain, event or leadership content.
    function revealContext() {
      if (!location.hash.startsWith("#work-")) return;
      const target = document.getElementById(location.hash.slice(1));
      const disclosure = target?.closest(".kes-project-context");
      if (disclosure) { disclosure.open = true; target.scrollIntoView({ block: "start" }); }
    }
    revealContext(); window.addEventListener("hashchange", revealContext);
    return () => window.removeEventListener("hashchange", revealContext);
  }, []);
  return <div className="kes-project-catalogue">
    <div className="kes-project-browse"><CategoryFilters selected={category} onSelect={setCategory} /><label className="kes-project-search">Search projects<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Project title or engineering focus" /></label></div>
    <div className="kes-project-register-note"><p role="status" aria-live="polite" aria-atomic="true">{projects.length} {projects.length === 1 ? "project" : "projects"}{category !== "all" ? ` in ${PROJECT_CATEGORIES.find(c => c.id === category).title}` : " to explore"}</p><p>Neutral covers stand in for project photographs that have not yet been supplied.</p></div>
    <div className="kes-project-results">{projects.length > 0 ? <ul className="kes-project-grid">{projects.map(project => <ProjectCard key={project.id} project={project} onOpen={(project, opener) => setSelected({ project, opener, scrollPosition: { left: window.scrollX, top: window.scrollY } })} />)}</ul>
      : <div className="kes-project-empty"><h3>No matching projects</h3><p>Try another title or engineering focus, or choose All Projects.</p><button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Clear filters</button></div>}</div>
    {selected && <ProjectDetail project={selected.project} opener={selected.opener} scrollPosition={selected.scrollPosition} onClose={() => setSelected(null)} />}
  </div>;
}
