"use client";

// Applications review: overview, filterable register and the review drawer.
// Data comes only from the `service` prop (lib/admin/applications.mjs). With
// no connected service it shows an honest unavailable state.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  APPLICATION_STATUSES, DOMAIN_OPTIONS, YEAR_OPTIONS, INTERVIEW_MODES, MESSAGE_KINDS, NOTE_LIMIT, MESSAGE_LIMIT,
  UNAVAILABLE_APPLICATIONS, EMPTY_FILTERS, summarize, filterApplications, paginate, reviewFromApplication, isReviewDirty,
  hasInterview, validateReview, safeExternalUrl, formatDate, formatDateTime, describeHistory, messageKindForStatus,
  renderMessage, domainLabel,
} from "@/lib/admin/applications.mjs";

const statusClass = s => `kr-status kr-status--${s.toLowerCase().replace(/\s+/g, "-")}`;
const StatusBadge = ({ status }) => <span className={statusClass(status)}>{status}</span>;

const LOAD_MESSAGES = {
  unavailable: UNAVAILABLE_APPLICATIONS,
  error: "Applications couldn’t be loaded. Check your connection and try again.",
  unauthenticated: "Your administrator session has ended. Sign in again to view applications.",
};

export default function ApplicationsReview({ service }) {
  const [load, setLoad] = useState({ status: "loading", applications: [] });
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [announce, setAnnounce] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    let live = true;
    service.listApplications().then(r => {
      if (!live) return;
      setLoad(r.status === "ok" ? { status: "ok", applications: r.applications } : { status: r.status, applications: [] });
    });
    return () => { live = false; };
  }, [service, attempt]);

  const applications = load.applications;
  const summary = useMemo(() => summarize(applications), [applications]);
  const filtered = useMemo(() => filterApplications(applications, filters), [applications, filters]);
  const view = paginate(filtered, page);
  const filtering = Object.values(filters).some(Boolean);
  const open = applications.find(a => a.id === openId) ?? null;

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); };
  const retry = () => { setLoad({ status: "loading", applications: [] }); setAttempt(a => a + 1); };
  const goPage = p => { setPage(p); requestAnimationFrame(() => tableRef.current?.focus({ preventScroll: false })); };

  function onSaved(app) {
    setLoad(l => ({ ...l, applications: l.applications.map(a => a.id === app.id ? app : a) }));
    setAnnounce(`Review saved for ${app.fullName}.`);
  }
  function closeDrawer() {
    const id = openId;
    setOpenId(null);
    requestAnimationFrame(() => document.getElementById(`kr-review-${id}`)?.focus());
  }

  const loading = load.status === "loading";
  const cards = [
    { key: "total", label: "Total Applications", value: summary.total, filter: "" },
    { key: "new", label: "New", value: summary.new, filter: "New" },
    { key: "shortlisted", label: "Shortlisted", value: summary.shortlisted, filter: "Shortlisted" },
    { key: "selected", label: "Selected", value: summary.selected, filter: "Selected" },
  ];

  return (
    <div className="kr">
      <section aria-labelledby="kr-overview-title" className="kr-overview">
        <h2 id="kr-overview-title" className="kr-visually-hidden">Overview</h2>
        <ul className="kr-cards">
          {cards.map(c => {
            const active = load.status === "ok" && filters.status === c.filter && (Boolean(c.filter) || !filtering);
            return (
              <li key={c.key}>
                <button
                  type="button" className={`kr-card${active ? " is-active" : ""}`} aria-pressed={active}
                  disabled={load.status !== "ok"} onClick={() => { setFilters({ ...EMPTY_FILTERS, status: c.filter }); setPage(1); }}
                >
                  <span className="kr-card-label">{c.label}</span>
                  <span className="kr-card-value">{load.status === "ok" ? c.value : "—"}</span>
                  <span className="kr-visually-hidden">{c.filter ? `Show ${c.label.toLowerCase()} applications` : "Show all applications"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ka-applications kr-register" aria-labelledby="application-register-title">
        <div className="ka-panel-heading">
          <h2 id="application-register-title">Application register</h2>
          {load.status === "ok" && <span aria-live="polite">{view.total ? `Showing ${view.start}–${view.end} of ${view.total}` : "No matching applications"}{filtering && ` · filtered from ${applications.length}`}</span>}
        </div>

        {(load.status === "ok" || loading) && (
          <div className="kr-toolbar" role="search" aria-label="Filter applications">
            <div className="kr-filter kr-filter--search">
              <label htmlFor="kr-search">Search</label>
              <input id="kr-search" type="search" placeholder="Name, roll number or email" value={filters.query} disabled={loading} onChange={e => setFilter("query", e.target.value)} />
            </div>
            <div className="kr-filter">
              <label htmlFor="kr-domain">Domain</label>
              <select id="kr-domain" value={filters.domain} disabled={loading} onChange={e => setFilter("domain", e.target.value)}>
                <option value="">All domains</option>
                {["Technical", "Non-technical"].map(g => (
                  <optgroup key={g} label={g}>{DOMAIN_OPTIONS.filter(o => o.group === g).map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</optgroup>
                ))}
              </select>
            </div>
            <div className="kr-filter">
              <label htmlFor="kr-year">Year</label>
              <select id="kr-year" value={filters.year} disabled={loading} onChange={e => setFilter("year", e.target.value)}>
                <option value="">All years</option>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="kr-filter">
              <label htmlFor="kr-status">Status</label>
              <select id="kr-status" value={filters.status} disabled={loading} onChange={e => setFilter("status", e.target.value)}>
                <option value="">All statuses</option>
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {filtering && <button type="button" className="ka-button kr-clear" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {loading && (
          <div className="kr-state" aria-busy="true">
            <p role="status" className="kr-visually-hidden">Loading applications…</p>
            <div className="kr-skeleton" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
          </div>
        )}

        {!loading && load.status !== "ok" && (
          <div className="ka-empty kr-state" role={load.status === "error" ? "alert" : "status"}>
            <h3>{load.status === "unavailable" ? "Application review is not connected yet." : load.status === "unauthenticated" ? "Signed out." : "Couldn’t load applications."}</h3>
            <p>{LOAD_MESSAGES[load.status] ?? LOAD_MESSAGES.error}</p>
            {load.status === "error" && <button type="button" className="ka-button" onClick={retry}>Try again</button>}
            {load.status === "unauthenticated" && <a className="ka-button" href="/admin/login">Go to Admin Login</a>}
          </div>
        )}

        {load.status === "ok" && applications.length === 0 && (
          <div className="ka-empty kr-state"><h3>No applications yet.</h3><p>Applications will appear here once applicants submit them.</p></div>
        )}

        {load.status === "ok" && applications.length > 0 && view.total === 0 && (
          <div className="ka-empty kr-state"><h3>No applications match these filters.</h3><p>Try a different search, or clear the filters to see every application.</p><button type="button" className="ka-button" onClick={clearFilters}>Clear filters</button></div>
        )}

        {load.status === "ok" && view.total > 0 && (
          <>
            <div className="kr-table-wrap" ref={tableRef} tabIndex={-1} aria-label="Applications table">
              <table className="kr-table">
                <caption className="kr-visually-hidden">Applications, page {view.page} of {view.pages}</caption>
                <thead>
                  <tr>
                    <th scope="col">Applicant</th>
                    <th scope="col">School / branch</th>
                    <th scope="col">Domains</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="kr-visually-hidden">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {view.items.map(a => (
                    <tr key={a.id}>
                      <th scope="row" className="kr-applicant"><strong>{a.fullName}</strong><span>{a.roll}</span></th>
                      <td data-label="School / branch"><span className="kr-school">{a.school}</span><span className="kr-sub">{a.programme} · {a.year}</span></td>
                      <td data-label="Domains"><DomainChips domains={a.domains} max={2} /></td>
                      <td data-label="Submitted"><time dateTime={a.submittedAt}>{formatDate(a.submittedAt)}</time></td>
                      <td data-label="Status"><StatusBadge status={a.status} /></td>
                      <td className="kr-action">
                        <button type="button" id={`kr-review-${a.id}`} className="ka-button" onClick={() => setOpenId(a.id)}>
                          Review Application<span className="kr-visually-hidden">: {a.fullName}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {view.pages > 1 && (
              <nav className="kr-pagination" aria-label="Application pages">
                <button type="button" className="ka-button" disabled={view.page === 1} onClick={() => goPage(view.page - 1)}>
                  <span aria-hidden="true">←</span> Previous
                </button>
                <ol>
                  {Array.from({ length: view.pages }, (_, i) => i + 1).map(p => (
                    <li key={p}>
                      <button type="button" className="kr-page" aria-current={p === view.page ? "page" : undefined} onClick={() => goPage(p)}>
                        <span className="kr-visually-hidden">Page </span>{p}
                      </button>
                    </li>
                  ))}
                </ol>
                <button type="button" className="ka-button" disabled={view.page === view.pages} onClick={() => goPage(view.page + 1)}>
                  Next <span aria-hidden="true">→</span>
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      <p className="kr-visually-hidden" aria-live="polite">{announce}</p>
      {open && <ReviewDrawer key={open.id} application={open} service={service} onSaved={onSaved} onClose={closeDrawer} />}
    </div>
  );
}

function DomainChips({ domains = [], max = Infinity }) {
  const shown = domains.slice(0, max);
  const rest = domains.length - shown.length;
  return (
    <ul className="kr-chips">
      {shown.map(d => <li key={d}>{domainLabel(d)}</li>)}
      {rest > 0 && <li className="kr-chip-more" title={domains.slice(max).map(domainLabel).join(", ")}>+{rest} more</li>}
    </ul>
  );
}

// ── Review drawer ─────────────────────────────────────────────────

const SAVE_FAILURES = {
  conflict: "Not saved: this application changed since you opened it. Your edits are kept here — copy anything you need, then close and reopen it to see the latest version.",
  unauthenticated: "Not saved: your administrator session has ended. Your edits are kept here; sign in again in another tab, then save.",
  "not-found": "Not saved: this application could not be found. It may have been removed.",
  unavailable: "Not saved: the application service is not connected. Your edits are kept in this panel.",
  error: "Not saved: something went wrong. Your edits are kept — please try again.",
};
const ERROR_FIELDS = ["status", "interviewDate", "interviewTime", "interviewMode", "interviewPlace", "notes"];
const fieldIdFor = key => ({ status: "kr-d-status", interviewDate: "kr-d-date", interviewTime: "kr-d-time", interviewMode: "kr-d-mode-0", interviewPlace: "kr-d-place", notes: "kr-d-notes" })[key] ?? (key.startsWith("message-") ? "kr-d-message" : null);

function ReviewDrawer({ application, service, onSaved, onClose }) {
  const dialogRef = useRef(null);
  const keepRef = useRef(null);
  const resultRef = useRef(null);
  const [baseline, setBaseline] = useState(() => reviewFromApplication(application));
  const [draft, setDraft] = useState(() => reviewFromApplication(application));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { tone: "ok" | "error", text }
  const [confirmClose, setConfirmClose] = useState(false);
  const [kind, setKind] = useState(() => messageKindForStatus(application.status));
  const [copied, setCopied] = useState("");
  const dirty = isReviewDirty(baseline, draft);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    return () => { if (d?.open) d.close(); };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => { if (confirmClose) keepRef.current?.focus(); }, [confirmClose]);

  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
  const update = patch => { setDraft(d => ({ ...d, ...patch })); setResult(null); };
  const updateInterview = patch => update({ interview: { ...draft.interview, ...patch } });
  const clearError = key => errors[key] && setErrors(e => { const n = { ...e }; delete n[key]; return n; });

  async function save() {
    if (saving) return;
    const found = validateReview(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      setResult({ tone: "error", text: "Not saved: fix the highlighted fields first. Your edits are kept." });
      const first = ERROR_FIELDS.find(k => found[k]) ?? Object.keys(found)[0];
      requestAnimationFrame(() => document.getElementById(fieldIdFor(first))?.focus());
      return;
    }
    setSaving(true); setResult(null);
    const r = await service.saveReview(application.id, draft);
    setSaving(false);
    if (r.status === "saved") {
      const next = reviewFromApplication(r.application);
      setBaseline(next); setDraft(next); setErrors({});
      onSaved(r.application);
      setResult({ tone: "ok", text: "Review saved." });
      return;
    }
    if (r.status === "invalid") setErrors(r.errors ?? {});
    setResult({ tone: "error", text: r.status === "invalid" ? "Not saved: some fields need attention. Your edits are kept." : SAVE_FAILURES[r.status] ?? SAVE_FAILURES.error });
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  // Messages: an edited draft, or the template for the current interview details.
  const messageText = draft.messages[kind] ?? renderMessage(kind, application, draft.interview);
  const setMessage = text => update({ messages: { ...draft.messages, [kind]: text } });
  const resetMessage = () => { const m = { ...draft.messages }; delete m[kind]; update({ messages: m }); };
  async function copyMessage() {
    try { await navigator.clipboard.writeText(messageText); setCopied(kind); } catch { setCopied("failed"); }
  }
  function onTabKey(e, i) {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? MESSAGE_KINDS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const k = MESSAGE_KINDS[(next + MESSAGE_KINDS.length) % MESSAGE_KINDS.length].id;
    setKind(k); setCopied("");
    requestAnimationFrame(() => document.getElementById(`kr-tab-${k}`)?.focus());
  }

  const showInterview = draft.status === "Interview Scheduled" || hasInterview(draft.interview);
  const link = application.link ? safeExternalUrl(application.link) : null;
  const history = [...(application.history ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const err = key => errors[key] ? <p className="ka-error" id={`${fieldIdFor(key)}-error`}>{errors[key]}</p> : null;
  const described = key => errors[key] ? `${fieldIdFor(key)}-error` : undefined;

  return (
    <dialog ref={dialogRef} className="kr-drawer" aria-labelledby="kr-drawer-title" onCancel={e => { e.preventDefault(); if (confirmClose) setConfirmClose(false); else requestClose(); }}>
      <div className="kr-drawer-inner">
        <header className="kr-drawer-head">
          <div>
            <p className="ka-eyebrow">{application.id} · Submitted {formatDateTime(application.submittedAt)}</p>
            <h2 id="kr-drawer-title">{application.fullName}</h2>
            <p className="kr-head-meta"><StatusBadge status={baseline.status} />{dirty && <span className="kr-unsaved-dot">Unsaved changes</span>}</p>
          </div>
          <button type="button" className="kr-close" onClick={requestClose} aria-label="Close review">
            <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </header>

        <div className="kr-drawer-body">
          <section className="kr-block" aria-labelledby="kr-s-applicant">
            <h3 id="kr-s-applicant">Applicant</h3>
            <dl className="kr-details">
              <div><dt>Institutional email</dt><dd>{application.email}</dd></div>
              <div><dt>WhatsApp</dt><dd>{application.whatsapp}</dd></div>
              <div><dt>KIIT roll number</dt><dd>{application.roll}</dd></div>
              <div><dt>School / institute</dt><dd>{application.school}</dd></div>
              <div><dt>Branch / programme</dt><dd>{application.programme}</dd></div>
              <div><dt>Year of study</dt><dd>{application.year}</dd></div>
              <div><dt>Expected graduation</dt><dd>{application.graduation}</dd></div>
            </dl>
            <h4 className="kr-subhead">Domains</h4>
            <DomainChips domains={application.domains} />
          </section>

          <section className="kr-block" aria-labelledby="kr-s-words">
            <h3 id="kr-s-words">In their words</h3>
            <dl className="kr-answers">
              <div><dt>Why do you want to join KES?</dt><dd>{application.motivation || <span className="kr-muted">Not provided</span>}</dd></div>
              <div><dt>Relevant skills or experience</dt><dd>{application.skills || <span className="kr-muted">Not provided</span>}</dd></div>
              <div><dt>Projects or interests to explore</dt><dd>{application.explore || <span className="kr-muted">Not provided</span>}</dd></div>
              <div><dt>Portfolio, GitHub or LinkedIn</dt><dd>
                {!application.link ? <span className="kr-muted">Not provided</span>
                  : link ? <a href={link} target="_blank" rel="noopener noreferrer nofollow">{application.link}<span className="kr-visually-hidden"> (opens in a new tab)</span> <span aria-hidden="true">↗</span></a>
                    : <><span className="kr-raw">{application.link}</span> <span className="kr-muted">(not a valid web link, so it isn’t clickable)</span></>}
              </dd></div>
            </dl>
          </section>

          <section className="kr-block" aria-labelledby="kr-s-review">
            <h3 id="kr-s-review">Review</h3>
            <div className="kr-field">
              <label htmlFor="kr-d-status">Application status</label>
              <select id="kr-d-status" value={draft.status} aria-invalid={!!errors.status} aria-describedby={described("status")}
                onChange={e => { update({ status: e.target.value }); clearError("status"); setKind(messageKindForStatus(e.target.value)); setCopied(""); }}>
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {err("status")}
            </div>

            {showInterview && (
              <fieldset className="kr-interview">
                <legend>Interview details{draft.status === "Interview Scheduled" ? "" : <span className="kr-muted"> (kept from earlier)</span>}</legend>
                <div className="kr-pair">
                  <div className="kr-field">
                    <label htmlFor="kr-d-date">Date</label>
                    <input id="kr-d-date" type="date" value={draft.interview.date} aria-invalid={!!errors.interviewDate} aria-describedby={described("interviewDate")}
                      onChange={e => { updateInterview({ date: e.target.value }); clearError("interviewDate"); }} />
                    {err("interviewDate")}
                  </div>
                  <div className="kr-field">
                    <label htmlFor="kr-d-time">Time (IST)</label>
                    <input id="kr-d-time" type="time" value={draft.interview.time} aria-invalid={!!errors.interviewTime} aria-describedby={described("interviewTime")}
                      onChange={e => { updateInterview({ time: e.target.value }); clearError("interviewTime"); }} />
                    {err("interviewTime")}
                  </div>
                </div>
                <div className="kr-field" role="radiogroup" aria-labelledby="kr-d-mode-label" aria-describedby={described("interviewMode")}>
                  <span id="kr-d-mode-label" className="kr-label">Format</span>
                  <div className="kr-radios">
                    {INTERVIEW_MODES.map((m, i) => (
                      <label key={m} className="kr-radio">
                        <input id={`kr-d-mode-${i}`} type="radio" name="kr-mode" value={m} checked={draft.interview.mode === m}
                          onChange={() => { updateInterview({ mode: m }); clearError("interviewMode"); clearError("interviewPlace"); }} /> {m}
                      </label>
                    ))}
                  </div>
                  {err("interviewMode")}
                </div>
                <div className="kr-field">
                  <label htmlFor="kr-d-place">{draft.interview.mode === "Online" ? "Meeting link" : "Venue"}</label>
                  <input id="kr-d-place" type={draft.interview.mode === "Online" ? "url" : "text"} value={draft.interview.place} aria-invalid={!!errors.interviewPlace} aria-describedby={described("interviewPlace")}
                    onChange={e => { updateInterview({ place: e.target.value }); clearError("interviewPlace"); }} />
                  {err("interviewPlace")}
                </div>
                {draft.status !== "Interview Scheduled" && (
                  <button type="button" className="ka-text-button" onClick={() => update({ interview: { date: "", time: "", mode: "", place: "" } })}>Clear interview details</button>
                )}
              </fieldset>
            )}

            <div className="kr-field">
              <label htmlFor="kr-d-notes">Internal reviewer notes</label>
              <p className="kr-hint" id="kr-d-notes-hint">Visible to administrators only. Never shared with the applicant.</p>
              <textarea id="kr-d-notes" rows={5} maxLength={NOTE_LIMIT} value={draft.notes} aria-invalid={!!errors.notes}
                aria-describedby={["kr-d-notes-hint", described("notes")].filter(Boolean).join(" ")}
                onChange={e => { update({ notes: e.target.value }); clearError("notes"); }} />
              <p className="kr-counter" aria-hidden="true">{draft.notes.length}/{NOTE_LIMIT}</p>
              {err("notes")}
            </div>
          </section>

          <section className="kr-block" aria-labelledby="kr-s-messages">
            <h3 id="kr-s-messages">Applicant messages</h3>
            <p className="kr-notice">Previews only. This panel does not send email — nothing here is delivered to the applicant. Edited drafts are kept with the review when you save.</p>
            <div className="kr-tabs" role="tablist" aria-label="Message type">
              {MESSAGE_KINDS.map((k, i) => (
                <button key={k.id} id={`kr-tab-${k.id}`} type="button" role="tab" aria-selected={kind === k.id} aria-controls="kr-message-panel"
                  tabIndex={kind === k.id ? 0 : -1} onClick={() => { setKind(k.id); setCopied(""); }} onKeyDown={e => onTabKey(e, i)}>
                  {k.label}{draft.messages[k.id] !== undefined && <span className="kr-edited"> · edited</span>}
                </button>
              ))}
            </div>
            <div id="kr-message-panel" role="tabpanel" aria-labelledby={`kr-tab-${kind}`} className="kr-message">
              <p className="kr-hint">For {application.fullName} · {application.email}</p>
              <label htmlFor="kr-d-message" className="kr-visually-hidden">{MESSAGE_KINDS.find(k => k.id === kind).label} message</label>
              <textarea id="kr-d-message" rows={11} maxLength={MESSAGE_LIMIT} value={messageText} onChange={e => setMessage(e.target.value)}
                aria-invalid={!!errors[`message-${kind}`]} />
              {errors[`message-${kind}`] && <p className="ka-error">{errors[`message-${kind}`]}</p>}
              <div className="kr-message-actions">
                <button type="button" className="ka-button" onClick={copyMessage}>Copy text</button>
                {draft.messages[kind] !== undefined && <button type="button" className="ka-text-button" onClick={resetMessage}>Reset to template</button>}
                <span role="status" className="kr-hint">{copied === kind ? "Copied to clipboard." : copied === "failed" ? "Couldn’t copy — select the text and copy it manually." : ""}</span>
              </div>
            </div>
          </section>

          <section className="kr-block" aria-labelledby="kr-s-history">
            <h3 id="kr-s-history">Review history</h3>
            {history.length ? (
              <ol className="kr-history">
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <time dateTime={h.at}>{formatDateTime(h.at)}</time>
                    <span>{describeHistory(h)}</span>
                    <small>{h.by}</small>
                  </li>
                ))}
              </ol>
            ) : <p className="kr-muted">No history recorded.</p>}
          </section>
        </div>

        <footer className="kr-drawer-foot">
          <p className={`kr-save-state${dirty ? " is-dirty" : ""}`} aria-live="polite">{dirty ? "Unsaved changes" : "No unsaved changes"}</p>
          {result && <p ref={resultRef} tabIndex={-1} className={result.tone === "ok" ? "kr-result-ok" : "ka-message kr-result-error"} role={result.tone === "ok" ? "status" : "alert"}>{result.text}</p>}
          <div className="kr-foot-actions">
            <button type="button" className="ka-button" onClick={requestClose}>Close</button>
            <button type="button" className="ka-button ka-primary" onClick={save} disabled={saving || !dirty} aria-busy={saving || undefined}>{saving ? "Saving…" : "Save review"}</button>
          </div>
        </footer>

        {confirmClose && (
          <div className="kr-confirm-backdrop">
            <div className="kr-confirm" role="alertdialog" aria-modal="true" aria-labelledby="kr-confirm-title" aria-describedby="kr-confirm-text">
              <h3 id="kr-confirm-title">Discard unsaved changes?</h3>
              <p id="kr-confirm-text">Your edits to this review haven’t been saved. Closing now will lose them.</p>
              <div className="kr-foot-actions">
                <button ref={keepRef} type="button" className="ka-button ka-primary" onClick={() => setConfirmClose(false)}>Keep editing</button>
                <button type="button" className="ka-button" onClick={onClose}>Discard changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
