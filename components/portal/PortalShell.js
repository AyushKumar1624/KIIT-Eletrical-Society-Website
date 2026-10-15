"use client";
import Image from "next/image";
import { SOCIETY } from "@/lib/content";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePortal } from "./PortalProvider";
import { NAVIGATION, ROLES, permissions, visibleNotifications } from "@/lib/portal/config.mjs";
import { searchDemo } from "@/lib/portal/service.mjs";
import { Avatar, Badge, Button, Empty, Icon, Modal, Skeleton } from "./ui";

export default function PortalShell({ children }) {
  const { state, ready, act, requestProject } = usePortal(); const router = useRouter(); const path = usePathname();
  const [collapsed, setCollapsed] = useState(false); const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false); const [query, setQuery] = useState(""); const [bell, setBell] = useState(false); const [account, setAccount] = useState(false);
  const menuButton = useRef(null); const drawerRef = useRef(null);
  const accountButton = useRef(null); const bellButton = useRef(null);
  const isAccess = path === "/portal/login" || path === "/portal/onboarding";
  useEffect(() => { if (ready && !state.session && path !== "/portal/login") router.replace("/portal/login"); }, [ready, state.session, path, router]);
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setDrawer(false); setBell(false); setAccount(false); setSearch(false); }
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  useEffect(() => {
    if (!drawer) return;
    const focusable = () => [...drawerRef.current.querySelectorAll("a,button,select")].filter(e => e.offsetParent !== null);
    focusable()[0]?.focus();
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const key = e => {
      if (e.key === "Escape") { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); }
      if (e.key === "Tab") { const all = focusable(); const first = all[0]; const last = all[all.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", key);
    const mq = window.matchMedia("(min-width: 1001px)");
    const resize = e => { if (e.matches) setDrawer(false); };
    mq.addEventListener("change", resize);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", key); mq.removeEventListener("change", resize); };
  }, [drawer]);
  useEffect(() => {
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key === "k" && !drawer && !isAccess) { e.preventDefault(); setSearch(true); } if (e.key === "Escape") { if (bell) bellButton.current?.focus(); if (account) accountButton.current?.focus(); setBell(false); setAccount(false); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [bell, account, drawer, isAccess]);
  useEffect(() => {
    if (!bell && !account) return;
    const outside = e => { if (!e.target.closest(".kp-dropdown-wrap")) { setBell(false); setAccount(false); } };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [bell, account, drawer, isAccess]);
  const notifications = visibleNotifications(state);
  const unread = notifications.filter(n => !n.read).length;
  const section = NAVIGATION.find(([slug]) => slug && path.startsWith(`/portal/${slug}`))?.[1] || "Overview";
  const results = searchDemo(state, query);
  function signout() { act("signout"); router.push("/portal/login"); }
  return <div className={`kp-root${state.settings.reduceMotion ? " kp-no-motion" : ""}${state.settings.compact ? " kp-compact" : ""}${state.settings.theme === "Dark" ? " kp-dark" : ""}`}>
    {!ready || (!state.session && path !== "/portal/login") ? <Skeleton /> : isAccess ? children : <div className={`kp-shell${collapsed ? " kp-collapsed" : ""}`}>
      <a className="kp-skip" href="#portal-main">Skip to workspace</a>
      {drawer && <button className="kp-scrim" aria-label="Close navigation" tabIndex={-1} onClick={() => { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); }} />}
      <aside id="workspace-navigation" className={`kp-sidebar${drawer ? " is-open" : ""}`} ref={drawerRef} role={drawer ? "dialog" : undefined} aria-modal={drawer ? true : undefined} aria-label="Workspace navigation">
        <Link href="/portal" className="kp-brand"><Image src="/kes-logo.jpeg" alt="KES" width={40} height={40} /><span><b>KIIT Electrical Society</b><small>MEMBER WORKSPACE</small></span></Link>
        <div className="kp-sidebar-label"><span>Workspace</span><button className="kp-collapse" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(v => !v)}><Icon name="menu" size={15} /></button><button className="kp-mobile-close" aria-label="Close navigation" onClick={() => { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); }}><Icon name="close" /></button></div>
        <nav><ul>{NAVIGATION.map(([slug, label, icon]) => <li key={slug}><Link href={`/portal${slug ? `/${slug}` : ""}`} className={path === `/portal${slug ? `/${slug}` : ""}` || (slug && path.startsWith(`/portal/${slug}/`)) ? "is-active" : ""} onClick={() => { setDrawer(false); if (path === `/portal${slug ? `/${slug}` : ""}`) requestAnimationFrame(() => document.getElementById("portal-main")?.focus({ preventScroll: true })); }} title={collapsed ? label : undefined} aria-label={label} aria-current={path === `/portal${slug ? `/${slug}` : ""}` ? "page" : undefined}><Icon name={icon} /><span>{label}</span>{slug === "notifications" && unread > 0 && <small>{unread}</small>}</Link></li>)}</ul></nav>
        <div className="kp-sidebar-foot"><p>{SOCIETY.motto.split(", ")[0]},<br />{" "}<em>{SOCIETY.motto.split(", ")[1]}</em></p><Link href="/">Back to KES <Icon name="arrow" size={15} /></Link></div>
      </aside>
      <div className="kp-workspace" inert={drawer}>
        <header className="kp-topbar">
          <button ref={menuButton} className="kp-icon-button kp-mobile-menu" aria-controls="workspace-navigation" aria-expanded={drawer} aria-label="Open navigation" onClick={() => setDrawer(v => !v)}><Icon name="menu" /></button>
          <nav className="kp-breadcrumb" aria-label="Breadcrumb"><Link href="/portal">Workspace</Link><span>/</span><span>{section}</span></nav>
          <div className="kp-top-actions">
            <button className="kp-search-trigger" onClick={() => setSearch(true)} aria-label="Search workspace"><Icon name="search" /><span>Search workspace</span><kbd>⌘ K</kbd></button>
            <div className="kp-dropdown-wrap"><button ref={bellButton} className="kp-icon-button" aria-label={`Notifications, ${unread} unread`} aria-expanded={bell} onClick={() => { setBell(v => !v); setAccount(false); }}><Icon name="bell" />{unread > 0 && <span className="kp-unread-dot" />}</button>{bell && <div className="kp-dropdown"><h2>Notifications <Badge>{unread} unread</Badge></h2>{notifications.slice(0, 3).map(n => <Link key={n.id} href={n.href} onClick={() => { act("notificationRead", { id: n.id }); if (n.projectId) requestProject(n.projectId); }}><span>{n.title}</span><small>{n.read ? "Read" : "Unread"} · {n.type}</small></Link>)}{!notifications.length && <Empty title="All quiet" />}<Link href="/portal/notifications">View notification center →</Link></div>}</div>
            <div className="kp-dropdown-wrap"><button ref={accountButton} className="kp-account-trigger" aria-label="Account menu" aria-expanded={account} onClick={() => { setAccount(v => !v); setBell(false); }}><Avatar member={state.profile} size="small" /></button>{account && <div className="kp-dropdown kp-account-menu"><h2>{state.profile.name}</h2><Link href="/portal/profile">My profile</Link><Link href="/portal/membership">Membership card</Link><Link href="/portal/settings">Preferences</Link><button onClick={signout}><Icon name="logout" /> Demo sign out</button></div>}</div>
          </div>
        </header>
        <div className="kp-demo-strip"><span><b>FRONTEND DEMO</b> <span>Fictional records · browser-only state · no real authentication</span></span><label>Preview role <select aria-label="Preview role" value={state.role} onChange={e => act("role", { role: e.target.value }, `Previewing ${e.target.value} permissions.`)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></label></div>
        <main tabIndex={-1} id="portal-main" className="kp-main" key={path}>{permissions(state).future && <p className="kp-notice">{state.role} is a limited preview. Dedicated controls are planned for a later phase.</p>}{children}</main>
        <footer className="kp-workspace-footer"><span>{SOCIETY.name} · {SOCIETY.motto}</span><span>Phase 1 / frontend demonstration</span></footer>
      </div>
    </div>}
    {search && <Modal title="Search the workspace" onClose={() => setSearch(false)}><label className="kp-search-input"><Icon name="search" /><input autoFocus aria-label="Search projects, domains, events and announcements" placeholder="Search projects, domains…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector(".kp-search-results a")?.focus(); } }} /></label><div className="kp-search-results">{query.trim() ? results.length ? [...new Set(results.map(r => r.type))].map(type => <section key={type}><h3>{type}</h3>{results.filter(r => r.type === type).map(r => <Link key={`${r.type}-${r.id}`} href={r.href} onClick={() => { if (r.type === "Projects") requestProject(r.id); setSearch(false); }}>{r.label}<Icon name="arrow" size={16} /></Link>)}</section>) : <Empty title="No results" text="Try a project title, announcement or domain." /> : <Empty title="What are you looking for?" text="Search across the demo workspace. Use Tab to move through results and Enter to open one." />}</div></Modal>}
  </div>;
}
