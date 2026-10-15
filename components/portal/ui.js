"use client";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { usePortal } from "./PortalProvider";

const paths = {
  home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
  task: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 10 2 2 5-5M8 16h8" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  announce: <><path d="M3 9h5l11-5v16L8 15H3ZM8 15l2 6H6l-2-6M22 9v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 6" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5 16c0-3 6-3 6 0M14 10h5M14 14h4" /></>,
  bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5ZM10 21h4" /></>,
  settings: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 4v16M4 12h16" />,
  close: <path d="m5 5 14 14M5 19 19 5" />,
  logout: <><path d="M9 3H3v18h6M8 12h13m-5-5 5 5-5 5" /></>,
  check: <path d="m4 12 5 5L20 6" />,
};
export function Icon({ name, size = 18 }) { return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.grid}</svg>; }
export function Button({ children, variant = "primary", className = "", ...props }) { return <button className={`kp-button kp-button--${variant} ${className}`} type="button" {...props}>{children}</button>; }
export function ActionLink({ children, href, variant = "primary" }) { return <Link className={`kp-button kp-button--${variant}`} href={href}>{children}</Link>; }
export function Badge({ children, tone = "neutral" }) { return <span className={`kp-badge kp-badge--${tone}`}>{children}</span>; }
export function Avatar({ member, size = "normal" }) { return <span className={`kp-avatar kp-avatar--${size}`} aria-label={member.name}>{member.photo ? <img src={member.photo} alt={member.name} /> : member.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>; } // eslint-disable-line @next/next/no-img-element -- member uploads are data URLs
export function PageHead({ eyebrow = "Your workspace", title, description, children }) { return <header className="kp-page-head"><div><p className="kp-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="kp-description">{description}</p>}</div>{children && <div className="kp-head-actions">{children}</div>}</header>; }
export function Panel({ title, action, children, className = "" }) { return <section className={`kp-panel ${className}`}>{title && <div className="kp-panel-head"><h2>{title}</h2>{action}</div>}{children}</section>; }
export function Empty({ title = "Nothing here yet", text = "When demo items are added, they will appear here.", children }) { return <div className="kp-empty"><Icon name="grid" size={26} /><h3>{title}</h3><p>{text}</p>{children}</div>; }
export function Field({ label, hint, ...props }) { const id = useId(); return <div className="kp-field"><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />{hint && <small id={`${id}-hint`}>{hint}</small>}</div>; }
export function TextArea({ label, ...props }) { const id = useId(); return <div className="kp-field"><label htmlFor={id}>{label}</label><textarea id={id} rows={4} {...props} /></div>; }
export function Select({ label, options, ...props }) { const id = useId(); return <div className="kp-field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}</select></div>; }
export function Tabs({ options, value, onChange, label = "View" }) { return <div className="kp-tabs" role="group" aria-label={label}>{options.map(o => <button key={o} type="button" aria-pressed={value === o} className={value === o ? "is-active" : ""} onClick={() => onChange(o)}>{o}</button>)}</div>; }
export function Modal({ title, onClose, children }) {
  const ref = useRef(null); const feedbackRef = useRef(null); const label = useId();
  const { feedback, dismissFeedback } = usePortal();
  useEffect(() => {
    dismissFeedback();
    const opener = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); if (opener?.isConnected) opener.focus(); };
  }, [dismissFeedback]);
  useEffect(() => { if (feedback?.error) feedbackRef.current?.focus(); }, [feedback]);
  return <dialog className="kp-modal" ref={ref} aria-labelledby={label} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}><div className="kp-modal-head"><h2 id={label}>{title}</h2><Button variant="ghost" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></Button></div><div className="kp-modal-content">{feedback?.error && <p ref={feedbackRef} tabIndex={-1} className="kp-modal-feedback" role="alert">{feedback.message}</p>}{children}</div></dialog>;
}
export function Skeleton() { return <div className="kp-loading" role="status"><div className="kp-skeleton kp-skeleton-title" /><div className="kp-skeleton" /><div className="kp-skeleton" /><span>Opening the demo workspace…</span></div>; }
export async function readPhoto(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose an image smaller than 2 MB.");
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error("The image could not be read.")); r.readAsDataURL(file); });
}
