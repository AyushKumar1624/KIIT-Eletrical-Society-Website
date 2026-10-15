import { createDemoState, DEMO_VERSION } from "./data.mjs";
import { DOMAIN_CONFIG, ROLES, CATEGORIES, can, visibleAnnouncements, visibleNotifications, visibleProjects } from "./config.mjs";

import { linkedInUrl, saveProject } from "./projects.mjs";

const required = (value, label) => { if (!String(value || "").trim()) throw new Error(`${label} is required.`); };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const assert = (condition, message = "This action is unavailable for the selected demo role.") => { if (!condition) throw new Error(message); };
export function getMembers(state) { return [{ ...state.profile, role: state.role }, ...state.members]; }
export function getCalendarItems(state) {
  return [
    ...state.events.filter(e => e.date).map(e => ({ ...e, title: e.name, type: "Event", href: `/portal/events/${e.id}` })),
    ...visibleProjects(state).filter(p => p.targetDate).map(p => ({ ...p, date: p.targetDate, type: "Project", href: `/portal#project-${p.id}` })),
    ...state.activities.map(a => ({ ...a, href: `/portal/domains/${a.domain}` })),
  ];
}
export function searchDemo(state, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [
    ...visibleProjects(state).map(p => ({ id: p.id, label: p.title, type: "Projects", href: `/portal#project-${p.id}` })),
    ...DOMAIN_CONFIG.map(d => ({ id: d.id, label: d.name, type: "Domains", href: `/portal/domains/${d.id}` })),
    ...state.events.map(e => ({ id: e.id, label: e.name, type: "Events", href: `/portal/events/${e.id}` })),
    ...visibleAnnouncements(state).map(a => ({ id: a.id, label: a.title, type: "Announcements", href: "/portal/announcements" })),
  ].filter(r => r.label.toLowerCase().includes(q));
}
export function restoreDemo(raw) {
  const base = createDemoState();
  if (!raw) return base;
  try {
    const saved = JSON.parse(raw);
    if (![1, DEMO_VERSION].includes(saved.version) || !saved.profile || !ROLES.includes(saved.role) || ![saved.members, saved.events, saved.announcements, saved.notifications, saved.profile.domains].every(Array.isArray)) return base;
    if (saved.version === DEMO_VERSION && !Array.isArray(saved.projects)) return base;
    const restored = { ...base, ...saved, version: DEMO_VERSION,
      profile: { ...base.profile, ...saved.profile },
      projects: saved.projects || base.projects,
      projectOpportunities: saved.projectOpportunities || base.projectOpportunities,
      settings: { ...base.settings, ...saved.settings, projectNotifications: saved.settings?.projectNotifications ?? saved.settings?.taskNotifications ?? true },
      notifications: saved.notifications.filter(n => !n.type.startsWith("Task") && !n.href.includes("/portal/tasks")),
    };
    delete restored.tasks; delete restored.settings.taskNotifications;
    restored.announcements = restored.announcements.map(a => a.id === "a1" && a.description.includes("Explore the sample tasks") ? { ...a, description: base.announcements[0].description } : a);
    restored.announcements = restored.announcements.map(a => a.id === "a2" ? { ...a, description: a.description.replace("Share feedback in the task discussion.", "Keep these observations with your project record.") } : a);
    restored.activities = restored.activities.map(a => ({ ...a, description: a.description.replace("review task progress", "share what members are building") }));
    return restored;
  } catch { return base; }
}
export function demoAction(state, action) {
  const next = structuredClone(state);
  const p = action.payload || {};
  switch (action.type) {
    case "login": assert(ROLES.includes(p.role)); next.session = true; next.role = p.role; break;
    case "signout": next.session = false; break;
    case "reset": return createDemoState();
    case "role": assert(ROLES.includes(p.role)); next.role = p.role; break;
    case "profile":
    case "onboard": {
      required(p.name, "Name"); required(p.branch, "Department");
      assert(/^[^\s@]+@kiit\.ac\.in$/i.test(p.email), "Use a KIIT email address format, such as member.demo@kiit.ac.in. No email will be sent.");
      assert(p.domains?.length > 0 && p.domains.every(d => DOMAIN_CONFIG.some(c => c.id === d)), "Select at least one configured domain.");
      const { name, email, branch, year, photo, domains, bio } = p;
      const linkedin = linkedInUrl(p.linkedin);
      next.profile = { ...next.profile, name: name.trim(), email, branch, year, photo, domains, linkedin, bio: bio || "" };
      if (action.type === "onboard") { required(p.roll, "Roll number"); assert(p.terms, "Accept the demo declaration to continue."); next.profile.roll = p.roll; next.onboarded = true; }
      break;
    }
    case "settings": next.settings = { ...next.settings, ...p }; break;
    case "projectSave":
    case "projectApply": {
      const opportunity = action.type === "projectApply" ? state.projectOpportunities.find(o => o.id === p.opportunityId) : null;
      if (action.type === "projectApply") assert(opportunity, "This project brief is unavailable.");
      const project = saveProject(state, p, opportunity);
      const position = next.projects.findIndex(existing => existing.id === project.id);
      if (position >= 0) next.projects[position] = project;
      else next.projects.unshift(project);
      if (state.settings.projectNotifications) next.notifications.unshift({ id: id("notification"), projectId: project.id, title: position >= 0 ? "Project record updated: " + project.title : "Added to My Projects: " + project.title, type: "Project update", href: "/portal#project-" + project.id, read: false, date: today() });
      break;
    }
    case "announcementSave": {
      const scope = p.audience === "society" || p.audience === "leadership" ? undefined : p.audience;
      assert(can(state, "manageAnnouncements", scope)); required(p.title, "Title"); required(p.description, "Description"); assert(CATEGORIES.includes(p.category));
      if (p.id) { const old = next.announcements.find(a => a.id === p.id); assert(old && can(state, "manageAnnouncements", old.audience)); Object.assign(old, p); }
      else {
        const announcementId = id("announcement");
        next.announcements.unshift({ ...p, id: announcementId, author: state.profile.name, date: today(), read: false, pinned: false, attachments: [] });
        if (state.settings.announcementNotifications) next.notifications.unshift({ id: id("notification"), announcementId, title: `Demo announcement: ${p.title}`, type: "Announcement", href: "/portal/announcements", read: false, date: today() });
      }
      break;
    }
    case "announcementRead": { const a = next.announcements.find(a => a.id === p.id); assert(a && visibleAnnouncements(state).some(x => x.id === a.id)); a.read = true; break; }
    case "announcementPin": { const a = next.announcements.find(a => a.id === p.id); assert(a && can(state, "manageAnnouncements", a.audience)); a.pinned = !a.pinned; break; }
    case "register": {
      const e = next.events.find(e => e.id === p.id); assert(e && e.status !== "Past demo", "This sample event is closed."); e.registered = !e.registered;
      if (state.settings.eventNotifications) next.notifications.unshift({ id: id("notification"), title: `${e.registered ? "Demo registration recorded" : "Demo registration cancelled"}: ${e.name}`, type: "Event update", href: `/portal/events/${e.id}`, read: false, date: today() });
      break;
    }
    case "notificationRead": {
      const allowed = new Set(visibleNotifications(state).map(n => n.id));
      next.notifications = next.notifications.map(n => allowed.has(n.id) && (p.id === n.id || p.all) ? { ...n, read: true } : n);
      break;
    }
    default: throw new Error("Unknown demo action.");
  }
  return next;
}
