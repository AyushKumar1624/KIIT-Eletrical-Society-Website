"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { EVENTS as ALL_EVENTS, MEDIA } from "@/lib/content";

const EVENTS = ALL_EVENTS.filter(e => !e.temporary && ["k-raft", "kreative-kontrol-3", "project-expo-2025", "kallistic-flair"].includes(e.id));

// Row thumbnails render ~170px wide; detail photos up to a quarter of the page.
function Photo({ name, className, sizes = "(max-width: 560px) 100vw, 200px" }) {
  const m = MEDIA[name];
  if (!m) return null;
  return <Image className={className} src={m.src} alt={m.alt} width={m.w} height={m.h} sizes={sizes} />;
}

function Facts({ items }) {
  return (
    <dl className="ev-facts">
      {items.map(f => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}
    </dl>
  );
}

function Detail({ e }) {
  const d = e.details;
  const lists = [["Highlights", d.highlights], ["Rules", d.rules]].filter(([, l]) => l?.length);
  return (
    <div className="ev-detail">
      <div className="ev-detail-main">
        {d.overview.map((p, i) => <p key={i} className="ev-overview">{p}</p>)}

        {d.programme?.length > 0 && (
          <div className="ev-block">
            <h5>Programme</h5>
            <ol className="ev-programme">
              {d.programme.map(s => (
                <li key={s.t}>
                  {s.time && <span className="ev-time">{s.time}</span>}
                  <div>
                    <p className="ev-step">{s.t}</p>
                    {s.d && <p className="ev-step-d">{s.d}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {lists.map(([title, items]) => (
          <div key={title} className="ev-block">
            <h5>{title}</h5>
            <ul className="ev-list">{items.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}

        {d.note && <p className="ev-note">{d.note}</p>}
      </div>

      <aside className="ev-detail-side">
        <Facts items={d.facts} />
      </aside>

      {d.photos?.length > 0 && (
        <ul className={`ev-photos ev-photos--${Math.min(d.photos.length, 4)}`} aria-label={`Photographs from ${e.name}`}>
          {d.photos.map(p => (
            <li key={p}>
              <figure>
                <Photo name={p} sizes="(max-width: 560px) 50vw, (max-width: 1080px) 45vw, 25vw" />
                {MEDIA[p]?.credit && <figcaption>{MEDIA[p].credit}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Rows shown before "Show earlier events".
const INITIAL = 6;

// Year an event sits under; undated events inherit the previous event's year.
function yearOf(e, i) {
  for (let k = i; k >= 0; k--) {
    const y = EVENTS[k].dateTime?.slice(0, 4);
    if (y) return y;
  }
  return "";
}

export default function EventArchive() {
  const listRef = useRef(null);
  const [openCount, setOpenCount] = useState(0);
  const allOpen = EVENTS.length > 0 && openCount === EVENTS.length;
  const [showAll, setShowAll] = useState(false);
  const hiddenCount = Math.max(EVENTS.length - INITIAL, 0);

  // Open an event when the URL points at it (e.g. /#ev-project-expo-2025).
  useEffect(() => {
    const openFromHash = () => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const index = EVENTS.findIndex(e => `ev-${e.id}` === id);
      if (index >= INITIAL) setShowAll(true);
      const el = document.getElementById(id);
      if (el?.tagName === "DETAILS" && listRef.current?.contains(el)) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const sync = () => {
    const all = [...(listRef.current?.querySelectorAll("details") ?? [])];
    setOpenCount(all.filter(d => d.open).length);
  };

  const toggleAll = () => {
    const next = !allOpen;
    if (next) setShowAll(true);
    listRef.current?.querySelectorAll("details").forEach(d => { d.open = next; });
    setOpenCount(next ? EVENTS.length : 0);
  };

  return (
    <div className="ledger">
      <div className="ledger-head">
        <h3 className="ledger-title">Past event archive</h3>
        <button type="button" className="ledger-toggle" onClick={toggleAll} aria-controls="event-list">
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <p className="ledger-hint">Workshop programmes, exhibitions and creative challenges. <span className="ledger-open-count" aria-live="polite">{openCount ? `${openCount} of ${EVENTS.length} events expanded` : "All events collapsed"}</span></p>
      <ol id="event-list" ref={listRef} className="ev-list-root">
        {EVENTS.map((e, i) => (
          <li key={e.id} hidden={!showAll && i >= INITIAL} className="ev-item">
            {yearOf(e, i) !== (i > 0 ? yearOf(EVENTS[i - 1], i - 1) : null) && (
              <p className="ev-year" aria-hidden="true"><span>{yearOf(e, i)}</span></p>
            )}
            <details id={`ev-${e.id}`} className="ev" onToggle={sync}>
              <summary className="ev-summary" aria-labelledby={`ev-title-${e.id} ev-date-${e.id}`} aria-describedby={`ev-teaser-${e.id}`}>
                <span className="ledger-date" id={`ev-date-${e.id}`}>{e.dateTime ? <time dateTime={e.dateTime}>{e.date}</time> : e.date}</span>
                <span className="ledger-photo">
                  {e.image ? <Photo name={e.image} /> : <span aria-hidden="true" className="ledger-mark">KES</span>}
                </span>
                <span className="ledger-body">
                  <h4 className="ev-name" id={`ev-title-${e.id}`}>{e.name}</h4>
                  <span className="ledger-kind">{e.kind}</span>
                  <span className="ev-teaser" id={`ev-teaser-${e.id}`}>{e.summary}</span>
                  <span className="ev-meta">
                    <span>{e.place}</span>
                    {e.participants && <span>{e.participants} participants</span>}
                  </span>
                </span>
                <span className="ev-toggle" aria-hidden="true">
                  <span className="ev-action-open">Read event</span><span className="ev-action-close">Close details</span>
                  <span className="ev-toggle-icon" />
                </span>
              </summary>
              <Detail e={e} />
            </details>
          </li>
        ))}
      </ol>
      {hiddenCount > 0 && (
        <button type="button" className="ledger-more" aria-expanded={showAll} aria-controls="event-list" onClick={() => setShowAll(v => !v)}>
          <span>{showAll ? "Show fewer events" : `Show ${hiddenCount} earlier events`}</span>
          <span className="ev-toggle-icon" aria-hidden="true" data-open={showAll} />
        </button>
      )}
    </div>
  );
}
