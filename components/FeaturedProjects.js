import Image from "next/image";
import { WORK_GROUPS, WORK_RECORDS, recordImage, recordDetailImage, workId } from "@/lib/showcase.mjs";
import ProjectCatalogue from "@/components/projects/ProjectCatalogue";
import "@/app/project-catalogue.css";

// Preserve domain-to-work anchors for the existing documented records.
export function workForDomain(domainTitle) {
  const p = WORK_RECORDS.find(w => w.domain === domainTitle);
  return p ? { id: workId(p), title: p.title } : null;
}

function WorkCard({ record: p }) {
  const image = recordImage(p);
  const detail = recordDetailImage(p);
  return <li id={workId(p)} className={`work-card${image ? "" : " work-card--unpictured"}`}>
    <figure className={`work-image${p.type === "Graphic design" ? " work-image--artwork" : ""}`}>
      {image
        ? <Image src={image.src} alt={image.alt} width={image.w} height={image.h} sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 580px" />
        : <div className="work-image-placeholder"><svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor"><rect x="4" y="5" width="28" height="26" rx="3" /><circle cx="12" cy="13" r="3" /><path d="m5 27 8-8 5 5 6-8 8 11" /></svg><span>Project photograph not supplied</span></div>}
    </figure>
    <div className="work-copy">
      <div className="work-record-heading"><span className="work-kind">{p.type}</span><span className="work-origin">{p.origin}</span></div>
      <h4>{p.title}</h4>
      <dl className="work-metadata"><div><dt>Domain</dt><dd>{p.domain}</dd></div><div><dt>Stage</dt><dd>{p.stage || "Not recorded"}</dd></div></dl>
      <p className="work-purpose">{p.purpose}</p>
      <details className="work-detail">
        <summary><span className="work-action-open">{p.action}</span><span className="work-action-close">Close details</span><span className="sr-only">: {p.title}</span><span className="ev-toggle-icon" aria-hidden="true" /></summary>
        <div className="work-detail-body">
          <p className="work-context">{p.context}</p>
          {p.text !== p.purpose && <p>{p.text}</p>}
          <dl>{p.archiveArea && <div><dt>Original archive category</dt><dd>{p.archiveArea}</dd></div>}<div><dt>Tools & focus</dt><dd>{p.stack.join(" · ")}</dd></div></dl>
          {detail && <figure><Image src={detail.src} alt={detail.alt} width={detail.w} height={detail.h} sizes="(max-width: 560px) 100vw, 580px" /><figcaption>{detail.alt}{detail.credit && ` · ${detail.credit}`}</figcaption></figure>}
        </div>
      </details>
    </div>
  </li>;
}

export default function FeaturedProjects() {
  return <div className="work-showcase">
    <ProjectCatalogue />
    <details className="kes-project-context"><summary>Workshop, event & creative documentation <span aria-hidden="true">+</span></summary><p className="kes-context-intro">These existing records document society activities. They are separate from the project catalogue above.</p>
    {WORK_GROUPS.map(group => <section key={group.id} className={`work-group work-group--${group.id}`} aria-labelledby={`work-group-${group.id}`}>
      <header className="work-group-heading"><h3 id={`work-group-${group.id}`}>{group.title}</h3><p>{group.note}</p></header>
      <ul className="featured-work">{WORK_RECORDS.filter(p => p.group === group.id).map(p => <WorkCard key={p.no} record={p} />)}</ul>
    </section>)}
    </details>
  </div>;
}
