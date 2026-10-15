"use client";

import { useEffect, useState } from "react";
import { usePortal } from "./PortalProvider";
import { DOMAIN_CONFIG, PROJECT_STAGES, dateLabel, domainName, myProjects, permissions, visibleProjects } from "@/lib/portal/config.mjs";
import { projectTeam } from "@/lib/portal/projects.mjs";
import { Avatar, Badge, Button, Empty, Field, Icon, Modal, Select, Tabs, TextArea } from "./ui";

function ProjectEditor({ initial, opportunity, defaultDomain, onClose }) {
  const { state, act } = usePortal();
  const own = initial?.team.find(m => m.memberId === state.profile.id);
  const [form, setForm] = useState({
    id: initial?.id, title: initial?.title || opportunity?.title || "", description: initial?.description || opportunity?.description || "",
    domain: initial?.domain || opportunity?.domain || defaultDomain || state.profile.domains[0] || DOMAIN_CONFIG[0].id,
    stage: initial?.stage || "Building", targetDate: initial?.targetDate || "", linkedin: initial?.linkedin || "",
    ownerLinkedin: own?.linkedin || state.profile.linkedin || "",
    collaborators: initial ? projectTeam(state, initial).filter(m => m.memberId !== state.profile.id) : [],
  });
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const updateMember = (i, key, value) => setForm(f => ({ ...f, collaborators: f.collaborators.map((member, index) => index === i ? { ...member, [key]: value } : member) }));
  return <Modal title={opportunity ? "Apply for a project" : initial ? "Edit project record" : "Add your project"} onClose={onClose}>
    <form onSubmit={e => {
      e.preventDefault();
      const success = act(opportunity ? "projectApply" : "projectSave", { ...form, opportunityId: opportunity?.id }, opportunity ? "Project assigned to you and added to My Projects." : "Project record saved.");
      if (success) onClose();
    }}>
      {opportunity && <p className="kp-notice">Fictional demo brief. Applying automatically adds this project to your personal record; no real application is sent.</p>}
      <Field label="Project name" required value={form.title} readOnly={!!opportunity} maxLength={140} onChange={e => update("title", e.target.value)} />
      <TextArea label="What are you building?" required value={form.description} onChange={e => update("description", e.target.value)} />
      <div className="kp-form-grid">
        <Select label="Project domain" options={DOMAIN_CONFIG.map(d => ({ value: d.id, label: d.name }))} value={form.domain} disabled={!!opportunity} onChange={e => update("domain", e.target.value)} />
        {!opportunity && <Select label="Project stage" options={PROJECT_STAGES} value={form.stage} onChange={e => update("stage", e.target.value)} />}
        <Field label={form.stage === "Built" && !opportunity ? "Build date (optional)" : "Target date (optional)"} type="date" value={form.targetDate} onInput={e => update("targetDate", e.currentTarget.value)} onChange={e => update("targetDate", e.target.value)} />
        <Field label="Project LinkedIn link (optional)" type="url" placeholder="https://www.linkedin.com/posts/…" value={form.linkedin} onChange={e => update("linkedin", e.target.value)} />
      </div>
      <h3 className="kp-subhead">The people behind the build</h3>
      <div className="kp-project-owner"><Avatar member={state.profile} /><div><strong>{state.profile.name}</strong><small>Project owner · automatically assigned to you</small></div></div>
      <Field label="Your LinkedIn profile (optional)" type="url" placeholder="https://www.linkedin.com/in/your-name/" value={form.ownerLinkedin} onChange={e => update("ownerLinkedin", e.target.value)} />
      {form.collaborators.map((person, i) => <fieldset className="kp-collaborator" key={i}>
        <legend>Collaborator {i + 1}</legend>
        <div className="kp-form-grid">
          <Select label={`Society member ${i + 1}`} options={[{ value: "", label: "Enter a collaborator’s name" }, ...state.members.map(m => ({ value: m.id, label: m.name }))]} value={person.memberId || ""} onChange={e => {
            const member = state.members.find(m => m.id === e.target.value);
            setForm(f => ({ ...f, collaborators: f.collaborators.map((p, index) => index === i ? { ...p, memberId: member?.id || null, name: member?.name || "", linkedin: member?.linkedin || "" } : p) }));
          }} />
          <Field label={`Collaborator ${i + 1} name`} required readOnly={!!person.memberId} value={person.name} onChange={e => updateMember(i, "name", e.target.value)} />
        </div>
        <Field label={`Collaborator ${i + 1} LinkedIn (optional)`} type="url" value={person.linkedin} placeholder="https://www.linkedin.com/in/…" onChange={e => updateMember(i, "linkedin", e.target.value)} />
        <Button variant="ghost" onClick={() => update("collaborators", form.collaborators.filter((_, index) => index !== i))}>Remove collaborator {i + 1}</Button>
      </fieldset>)}
      <Button variant="secondary" onClick={() => update("collaborators", [...form.collaborators, { memberId: null, name: "", linkedin: "" }])}><Icon name="plus" /> Add collaborator</Button>
      <p className="kp-fineprint">Add a planned build, your current work, or choose Built for a previous project. Names and links stay in this browser’s frontend demo.</p>
      <div className="kp-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{opportunity ? "Apply & add to My Projects" : initial ? "Save project changes" : "Add to My Projects"}</Button></div>
    </form>
  </Modal>;
}

function ProjectDetail({ project, onClose, onEdit }) {
  const { state } = usePortal();
  const team = projectTeam(state, project);
  return <Modal title={project.title} onClose={onClose}>
    <div className="kp-actions"><Badge tone={project.stage === "Built" ? "green" : project.stage === "Planned" ? "gold" : "blue"}>{project.stage}</Badge><Badge>{domainName(project.domain)}</Badge></div>
    <p className="kp-long-text">{project.description}</p>
    <h3>The project team</h3>
    {team.map((person, i) => <div className="kp-project-person" key={person.memberId || `${person.name}-${i}`}><span><strong>{person.name}</strong><small>{person.memberId === project.ownerId ? "Project owner" : "Collaborator"}</small></span>{person.linkedin && <a href={person.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span></a>}</div>)}
    <dl className="kp-definition"><div><dt>Added to project register</dt><dd>{dateLabel(project.created)}</dd></div>{project.targetDate && <div><dt>{project.stage === "Built" ? "Build date" : "Target date"}</dt><dd>{dateLabel(project.targetDate)}</dd></div>}</dl>
    {project.linkedin && <a className="kp-button kp-button--secondary" href={project.linkedin} target="_blank" rel="noopener noreferrer">Project on LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span></a>}
    {project.ownerId === state.profile.id && <div className="kp-actions"><Button onClick={() => onEdit(project)}>Edit my project</Button></div>}
    <p className="kp-fineprint">Demo project record · saved in this browser.</p>
  </Modal>;
}

export default function ProjectWorkspace({ domain }) {
  const { state, projectRequest, requestProject } = usePortal();
  const [tab, setTab] = useState("My Projects"); const [query, setQuery] = useState(""); const [stage, setStage] = useState("All projects");
  const [editor, setEditor] = useState(null); const [selected, setSelected] = useState(null); const [apply, setApply] = useState(false);
  const own = myProjects(state); const all = visibleProjects(state); const register = permissions(state).projectRegister;
  const items = (tab === "My Projects" ? own : all).filter(p => (!domain || p.domain === domain) && (stage === "All projects" || p.stage === stage) && `${p.title} ${p.description} ${projectTeam(state, p).map(m => m.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const opportunities = state.projectOpportunities.filter(o => !domain || o.domain === domain);
  const [lastRole, setLastRole] = useState(state.role);
  if (state.role !== lastRole) { setLastRole(state.role); setTab("My Projects"); }
  useEffect(() => {
    const fromHash = () => {
      let value;
      try { value = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const project = visibleProjects(state).find(p => `project-${p.id}` === value);
      if (project) setSelected(project.id);
    };
    fromHash(); window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [state]);
  const current = state.projects.find(p => p.id === selected);
  const [lastRequest, setLastRequest] = useState(null);
  if (projectRequest !== lastRequest) {
    setLastRequest(projectRequest);
    if (projectRequest && visibleProjects(state).some(p => p.id === projectRequest)) setSelected(projectRequest);
  }
  return <section className="kp-project-workspace" id={domain ? `projects-${domain}` : "my-projects"} aria-labelledby={domain ? `projects-heading-${domain}` : "my-projects-heading"}>
    <header className="kp-project-heading"><div><p className="kp-eyebrow">Ideas into real work</p><h2 id={domain ? `projects-heading-${domain}` : "my-projects-heading"}>My Projects</h2><p>What you’re building, who’s building with you, and what you’ve already made.</p></div><div className="kp-actions"><Button variant="secondary" onClick={() => setApply(true)}>Apply for a project</Button><Button onClick={() => setEditor({})}><Icon name="plus" /> Add your project</Button></div></header>
    <div className="kp-toolbar"><Field label="Search my projects" type="search" placeholder="Project or team member" value={query} onChange={e => setQuery(e.target.value)} /><Select label="Project stage filter" options={["All projects", ...PROJECT_STAGES]} value={stage} onChange={e => setStage(e.target.value)} />{register && <Tabs options={["My Projects", permissions(state).scope === "society" ? "Society register" : "Domain register"]} value={tab} onChange={setTab} label="Project register view" />}</div>
    <div className="kp-project-grid">{items.map(p => <article className="kp-project-card" key={p.id} id={`project-${p.id}`}><div className="kp-actions"><Badge tone={p.stage === "Built" ? "green" : p.stage === "Planned" ? "gold" : "blue"}>{p.stage}</Badge><span>{domainName(p.domain)}</span></div><button className="kp-project-title" onClick={() => setSelected(p.id)}>{p.title}</button><p>{p.description}</p><div className="kp-project-team-preview"><Icon name="people" size={16} /><span>{projectTeam(state, p).map(m => m.name).join(" · ")}</span></div>{p.targetDate && <small>{p.stage === "Built" ? "Built" : "Target"}: {dateLabel(p.targetDate)}</small>}<footer><Button variant="ghost" onClick={() => setSelected(p.id)}>View project →</Button>{p.ownerId === state.profile.id && <Button variant="ghost" onClick={() => setEditor(p)}>Edit project</Button>}</footer></article>)}</div>
    {!items.length && (query || stage !== "All projects"
      ? <Empty title="No matching projects" text="No projects match this search or stage."><Button variant="secondary" onClick={() => { setQuery(""); setStage("All projects"); }}>Clear filters</Button></Empty>
      : <Empty title="Your next build starts here" text="Apply for a project brief or add a new or previously built project to your record."><Button variant="secondary" onClick={() => setEditor({})}>Add your first project</Button></Empty>)}
    {apply && <Modal title="Choose a project to build" onClose={() => setApply(false)}><p className="kp-notice">These are fictional demo briefs, not live society opportunities. Applying assigns the selected project to your member profile automatically.</p><div className="kp-opportunities">{opportunities.map(o => {
      const applied = own.some(p => p.opportunityId === o.id);
      return <article key={o.id}><Badge>{domainName(o.domain)}</Badge><h3>{o.title}</h3><p>{o.description}</p><Button variant={applied ? "secondary" : "primary"} disabled={applied} onClick={() => { setApply(false); setEditor({ opportunity: o }); }}>{applied ? "Already in My Projects" : "Apply for this project"}</Button></article>;
    })}</div>{!opportunities.length && <Empty title="No project briefs here yet" text="You can still propose your own build using Add your project." />}</Modal>}
    {current && <ProjectDetail project={current} onClose={() => { setSelected(null); requestProject(null); if (window.location.hash.startsWith("#project-")) history.replaceState(null, "", window.location.pathname); }} onEdit={project => { setSelected(null); requestProject(null); setEditor(project); }} />}
    {editor && <ProjectEditor initial={editor.id ? editor : null} opportunity={editor.opportunity} defaultDomain={domain} onClose={() => setEditor(null)} />}
  </section>;
}
