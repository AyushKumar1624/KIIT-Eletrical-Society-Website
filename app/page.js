import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DomainGlyph } from "@/components/Drawings";
import EventArchive from "@/components/EventArchive";
import FeaturedProjects, { workForDomain } from "@/components/FeaturedProjects";
import Reveal from "@/components/Reveal";
import BootSequence from "@/components/BootSequence";
import ScrollFx from "@/components/ScrollFx";
import GalleryGrid from "@/components/GalleryGrid";
import {
  SOCIETY, MEDIA, ABOUT, DOMAINS, METHOD, TEAM, TEAM_TERM, MENTORS, FOUNDING_FACULTY, ALUMNI, TEAM_PHOTO, GALLERY, CONTACT,
} from "@/lib/content";

// Responsive photo. `sizes` describes the rendered slot so the browser picks
// a small file on phones; `lead` marks the largest above-the-fold image.
function Photo({ name, className, sizes = "(max-width: 860px) 100vw, 50vw", eager = false, lead = false }) {
  const m = MEDIA[name];
  if (!m) return null;
  return (
    <Image
      className={className}
      src={m.src}
      alt={m.alt}
      width={m.w}
      height={m.h}
      sizes={sizes}
      loading={eager || lead ? "eager" : "lazy"}
      fetchPriority={lead ? "high" : undefined}
    />
  );
}

function AccentTitle({ text }) {
  const parts = typeof text === "string" ? text.match(/^(.+?[.!?])\s+(.+)$/) : null;
  if (!parts) return text;
  return <>{parts[1]} <em>{parts[2]}</em></>;
}

function SectionHead({ num, kicker, id, title, note }) {
  return (
    <header className={`section-head${note ? " section-head--split" : ""}`}>
      <div>
        <p className="kicker"><span className="kicker-num">§ {num}</span> {kicker}</p>
        <h2 id={id} className="section-title"><AccentTitle text={title} /></h2>
      </div>
      {note && <p className="section-note">{note}</p>}
    </header>
  );
}

// A person without an approved photo keeps the same alcove, with initials.
function Portrait({ name, person = "" }) {
  const m = MEDIA[name];
  if (!m) {
    const initials = person.replace(/^(Dr|Prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("");
    return <figure className="portrait portrait--empty" aria-hidden="true"><span>{initials}</span></figure>;
  }
  return (
    <figure className="portrait">
      <Image src={m.src} alt={m.alt} width={m.w} height={m.h} sizes="(max-width: 560px) 50vw, 240px" />
    </figure>
  );
}


export default function Home() {
  return (
    <>
      <BootSequence />
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />

      <main id="main">
        {/* ── Hero ─────────────────────────────── */}
        <section className="hero panel-green" id="top" aria-labelledby="hero-title">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1 id="hero-title" className="hero-title">
                <span className="hero-line">{SOCIETY.motto.split(", ")[0]},</span>{" "}
                <em className="hero-line">{SOCIETY.motto.split(", ")[1]}</em>
              </h1>
              <p className="hero-lede">{SOCIETY.intro}</p>
              <div className="hero-actions">
                <a className="btn btn-brass" href="#projects">
                  Explore projects <span aria-hidden="true" className="btn-arrow">→</span>
                </a>
                <a className="btn btn-line" href="#about">About KES <span aria-hidden="true">↗</span></a>
              </div>
            </div>

            <figure className="hero-visual">
              <div className="hero-photo-main">
                <Photo name="drLabPanel" lead sizes="(max-width: 1000px) 100vw, (max-width: 1280px) 45vw, 550px" />
              </div>
            </figure>
          </div>
        </section>

        {/* ── About ────────────────────────────── */}
        <section className="section panel-parchment" id="about" aria-labelledby="about-title">
          <div className="wrap">
            <SectionHead num="01" kicker="The Society" id="about-title" title={ABOUT.lead} />
            <p className="about-intro">{ABOUT.intro}</p>
            <h3 className="reasons-title">{ABOUT.reasonsTitle}</h3>
            <ul className="reasons">
              {ABOUT.reasons.map(r => (
                <li key={r.t} className="reason">
                  <h4>{r.t}</h4>
                  <p>{r.d}</p>
                </li>
              ))}
            </ul>
            <figure className="about-visual">
              <div className="about-photo-main"><Photo name={ABOUT.image} sizes="(max-width: 1360px) 100vw, 1280px" /></div>
              <div className="about-print"><Photo name={ABOUT.print} sizes="180px" /><span>{ABOUT.printCaption}</span></div>
              <figcaption>{ABOUT.imageCaption}</figcaption>
            </figure>
          </div>
        </section>

        {/* ── Domains ──────────────────────────── */}
        <section className="section panel-stone" id="domains" aria-labelledby="domains-title">
          <div className="wrap">
            <SectionHead
              num="02" kicker="Our expertise" id="domains-title" title="Technical minds. Creative voices."
              note="From building robots to telling their stories, every domain brings a different skill to the same team."
            />
            <div className="domain-groups">
              {[...new Set(DOMAINS.map(d => d.group))].map(group => (
                <section key={group} className="domain-group" aria-labelledby={`domains-${group.replace(/\W+/g, "-").toLowerCase()}`}>
                  <h3 className="domain-group-title" id={`domains-${group.replace(/\W+/g, "-").toLowerCase()}`}>{group}</h3>
                  <ul className="domain-list">
                    {DOMAINS.filter(d => d.group === group).map(d => {
                      const work = workForDomain(d.title);
                      const body = (
                        <>
                          <span className="domain-glyph" aria-hidden="true"><DomainGlyph name={d.key} /></span>
                          <span className="domain-copy">
                            <span className="domain-title">{d.title}</span>
                            <span className="domain-text">{d.text}</span>
                          </span>
                          {work && <span className="domain-go" aria-hidden="true">→</span>}
                        </>
                      );
                      return (
                        <li key={d.key}>
                          {work
                            ? <a className="domain-row domain-row--link" href={`#${work.id}`} aria-label={`${d.title}: ${d.text} See documented work: ${work.title}`}>{body}</a>
                            : <div className="domain-row">{body}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>

        {/* ── Projects ─────────────────────────── */}
        <section className="section panel-parchment" id="projects" aria-labelledby="projects-title">
          <div className="wrap">
            <SectionHead
              num="03" kicker="Engineering in practice" id="projects-title" title="Projects"
              note="Explore KES work across robotics, aerospace, embedded systems and intelligent technologies — from the purpose of a build to the engineering ideas behind it."
            />
            <FeaturedProjects />
          </div>
        </section>

        {/* ── Events ───────────────────────────── */}
        <section className="section panel-charcoal" id="events" aria-labelledby="events-title">
          <div className="wrap">
            <SectionHead num="04" kicker="Past highlights" id="events-title" title="Experiences worth revisiting." note="A selection of completed workshops, exhibitions and creative challenges." />


            <EventArchive />

            <div className="method-block">
              <h3 className="ledger-title">How an event runs <span>— the Kreative Kontrol format</span></h3>
              <ol className="method">
                {METHOD.map(m => (
                  <li key={m.step}>
                    <span className="method-step">{m.step}</span>
                    <h4>{m.t}</h4>
                    <p>{m.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Team ─────────────────────────────── */}
        <section className="section panel-stone" id="team" aria-labelledby="team-title">
          <div className="wrap">
            <SectionHead
              num="05" kicker="Our people" id="team-title" title="The minds behind the movement."
              note="Run by students and guided by faculty of the School of Electrical Engineering."
            />
            <figure className="team-photo">
              <Photo name={TEAM_PHOTO} sizes="(max-width: 1360px) 100vw, 1360px" />
              <figcaption>
                <span>Organisers and participants at the close of Kreative Kontrol 3.0</span>
                {MEDIA[TEAM_PHOTO]?.credit && <small>{MEDIA[TEAM_PHOTO].credit}</small>}
              </figcaption>
            </figure>
            {TEAM.length > 0 && <>
            <h3 className="team-subhead">Office bearers · {TEAM_TERM}</h3>
            <ul className="leaders">
              {TEAM.map(m => (
                <li key={m.name} className="leader">
                  <Portrait name={m.photo} person={m.name} />
                  <p className="team-role">{m.role}</p>
                  <p className="leader-name">{m.name}</p>
                  {m.linkedin && (
                    <a className="leader-link" href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn (opens in a new tab)`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11Z"/></svg>
                      <span>LinkedIn</span>
                      <span aria-hidden="true" className="leader-link-arrow">↗</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            </>}

            <div className="faculty-grid">
              {[["Faculty In Charge", MENTORS], ["Founding Faculty", FOUNDING_FACULTY]].filter(([, people]) => people.length).map(([label, people]) => (
                <section key={label} aria-label={label}>
                  <h3 className="team-subhead">{label}</h3>
                  {people.map(m => (
                    <article key={m.name} className="faculty">
                      <Portrait name={m.photo} person={m.name} />
                      <div className="faculty-text">
                        <p className="team-role">{m.role}</p>
                        <p className="leader-name">{m.name}</p>
                        {m.title && <p className="faculty-title">{m.title}</p>}
                        <a className="team-link" href={m.url} target="_blank" rel="noopener noreferrer">
                          School of EE profile<span className="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>

            {ALUMNI.length > 0 && <>
            <h3 className="team-subhead">Where our alumni work</h3>
            <ul className="alumni">
              {ALUMNI.map(a => (
                <li key={a.name}>
                  <span className="alumni-year">{a.year}</span>
                  <span className="alumni-name">{a.name}</span>
                  <span className="alumni-org">{a.org}</span>
                </li>
              ))}
            </ul>
            </>}
          </div>
        </section>

        {/* ── Gallery ──────────────────────────── */}
        <section className="section panel-charcoal" id="gallery" aria-labelledby="gallery-title">
          <div className="wrap">
            <SectionHead num="06" kicker="Life at KES" id="gallery-title" title="Moments that make us." />
            <GalleryGrid
              items={GALLERY.filter(g => MEDIA[g.media]).map(g => {
                const m = MEDIA[g.media];
                return { src: m.src, alt: m.alt, w: m.w, h: m.h, span: g.span, caption: g.caption, meta: m.credit ? `${g.meta} · ${m.credit}` : g.meta };
              })}
            />
          </div>
        </section>

        {/* ── Contact ──────────────────────────── */}
        <section className="section panel-green contact" id="contact" aria-labelledby="contact-title">
          <div className="wrap contact-grid">
            <div>
              <p className="kicker"><span className="kicker-num">§ 07</span> Contact</p>
              <h2 id="contact-title" className="section-title">Bring curiosity. <em>We supply the components.</em></h2>
              <p className="contact-text">
                Workshops, events and society updates are announced on our official channels.
              </p>
              <address className="contact-office">{CONTACT.office}</address>
            </div>
            <ul className="contact-links">
              {CONTACT.social.map(s => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <span className="contact-link-label">{s.label}</span>
                    <span className="contact-link-handle">{s.handle}<span className="sr-only"> (opens in a new tab)</span></span>
                    <span className="contact-link-arrow" aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
              {CONTACT.email && (
                <li>
                  <a href={`mailto:${CONTACT.email}`}>
                    <span className="contact-link-label">Email</span>
                    <span className="contact-link-handle">{CONTACT.email}</span>
                    <span className="contact-link-arrow" aria-hidden="true">→</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
      <Reveal />
      <ScrollFx />
    </>
  );
}
