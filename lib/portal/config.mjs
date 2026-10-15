import { DOMAINS } from "../content.js";

export const DOMAIN_CONFIG = DOMAINS.map(d => ({
  id: d.key, name: d.title, description: d.text,
  category: d.group === "Technical" ? "Technical" : "Creative & community",
  leadId: d.key === "robotics" ? "m2" : "m4",
  coLeadId: "m3",
}));
export const ROLES = ["Member", "Co-Lead", "Lead", "Vice President", "President", "Faculty In-Charge", "Alumni", "System Administrator"];
export const PROJECT_STAGES = ["Planned", "Building", "Built"];
export const CATEGORIES = ["General", "Important", "Events", "Domain Updates", "Meetings", "Deadlines"];
export const NAVIGATION = [
  ["", "Overview", "home"], ["domains", "Domains", "grid"],
  ["announcements", "Announcements", "announce"], ["events", "Events", "calendar"],
  ["calendar", "Calendar", "calendar"],
  ["membership", "Membership ID card", "card"], ["notifications", "Notifications", "bell"],
  ["profile", "My profile", "person"], ["settings", "Settings", "settings"],
];
// UX permissions only. These do not provide authentication or server authorization.
const ROLE_RULES = {
  Member: { scope: "own" },
  "Co-Lead": { scope: "domain", projectRegister: true },
  Lead: { scope: "domain", projectRegister: true, manageAnnouncements: true },
  "Vice President": { scope: "society", projectRegister: true, manageAnnouncements: true, oversight: true },
  President: { scope: "society", projectRegister: true, manageAnnouncements: true, oversight: true },
  "Faculty In-Charge": { scope: "society", future: true },
  Alumni: { scope: "own", future: true },
  "System Administrator": { scope: "society", future: true },
};
export function permissions(state) { return ROLE_RULES[state.role] || ROLE_RULES.Member; }
export function can(state, action, domain) {
  const rule = permissions(state);
  return !!rule[action] && (rule.scope === "society" || domain === state.managedDomain);
}
export function myProjects(state) {
  return state.projects.filter(p => p.ownerId === state.profile.id || p.team.some(m => m.memberId === state.profile.id));
}
export function visibleProjects(state) {
  const scope = permissions(state).scope;
  const own = new Set(myProjects(state).map(p => p.id));
  return state.projects.filter(p => own.has(p.id) || (permissions(state).projectRegister && (scope === "society" || p.domain === state.managedDomain)));
}
export function visibleAnnouncements(state) {
  const scope = permissions(state).scope;
  return state.announcements.filter(a => a.audience === "society" ||
    (a.audience === "leadership" ? scope !== "own" : state.profile.domains.includes(a.audience) || (scope === "society") || (scope === "domain" && a.audience === state.managedDomain)));
}
export function visibleNotifications(state) {
  const visible = new Set(visibleAnnouncements(state).map(a => a.id));
  const projects = new Set(visibleProjects(state).map(p => p.id));
  return state.notifications.filter(n => (!n.announcementId || visible.has(n.announcementId)) && (!n.projectId || projects.has(n.projectId)));
}
export const domainName = id => DOMAIN_CONFIG.find(d => d.id === id)?.name || "Society-wide";
export function dateLabel(value, options = {}) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", ...options }).format(new Date(`${value}T12:00:00`));
}
