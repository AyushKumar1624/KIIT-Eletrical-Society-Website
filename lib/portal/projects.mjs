import { DOMAIN_CONFIG, PROJECT_STAGES } from "./config.mjs";

export function linkedInUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !(url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")) || url.username || url.password || url.pathname === "/") throw new Error();
    return url.href;
  } catch { throw new Error("Use a full HTTPS LinkedIn URL, such as https://www.linkedin.com/in/your-name/."); }
}
export function projectTeam(state, project) {
  const members = [state.profile, ...state.members];
  return project.team.map(person => {
    const member = members.find(m => m.id === person.memberId);
    return { ...person, name: member?.name || person.name, linkedin: person.linkedin || member?.linkedin || "" };
  });
}
function validDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Choose a valid project date or leave it blank.");
  return value;
}
export function saveProject(state, payload, opportunity = null) {
  const existing = payload.id && state.projects.find(p => p.id === payload.id);
  if (payload.id && (!existing || existing.ownerId !== state.profile.id)) throw new Error("Only the project owner can edit this demo record.");
  const title = String(opportunity?.title || payload.title || "").trim();
  const description = String(payload.description || opportunity?.description || "").trim();
  const domain = opportunity?.domain || payload.domain;
  const stage = opportunity ? "Planned" : payload.stage;
  if (!title || !description) throw new Error("Add a project name and a short description of what you are building.");
  if (!DOMAIN_CONFIG.some(d => d.id === domain) || !PROJECT_STAGES.includes(stage)) throw new Error("Choose a configured domain and project stage.");
  if (opportunity && state.projects.some(p => p.opportunityId === opportunity.id && (p.ownerId === state.profile.id || p.team.some(m => m.memberId === state.profile.id)))) throw new Error("This project brief is already in My Projects.");
  const members = [state.profile, ...state.members];
  const team = [{ memberId: state.profile.id, name: state.profile.name, linkedin: linkedInUrl(payload.ownerLinkedin || state.profile.linkedin || "") }];
  for (const person of payload.collaborators || []) {
    const member = person.memberId ? members.find(m => m.id === person.memberId) : null;
    if (person.memberId && !member) throw new Error("Choose a valid member or enter a collaborator’s name.");
    const name = String(member?.name || person.name || "").trim();
    if (!name) throw new Error("Enter a name for every collaborator, or remove the empty row.");
    if (team.some(m => m.name.toLowerCase() === name.toLowerCase() || (member && m.memberId === member.id))) throw new Error("Each team member should appear only once.");
    team.push({ memberId: member?.id || null, name, linkedin: linkedInUrl(person.linkedin || member?.linkedin || "") });
  }
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return {
    id: existing?.id || `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ownerId: state.profile.id, title, description, domain, stage, team,
    targetDate: validDate(payload.targetDate), linkedin: linkedInUrl(payload.linkedin),
    opportunityId: existing?.opportunityId || opportunity?.id || null,
    created: existing?.created || stamp, updated: stamp,
  };
}
