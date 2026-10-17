// Applications review: service contract and pure helpers.
// Frontend only. Like lib/admin/auth.mjs, the default service has no adapter,
// so every call resolves to { status: "unavailable" } — no fetch, storage or
// fixture fallback. A future server adapter must enforce administrator
// authorization on every request; this UI is not access control.

import { DOMAIN_GROUPS, YEAR_OPTIONS, domainLabel } from "../join/application.mjs";

export { YEAR_OPTIONS, domainLabel };
export const DOMAIN_OPTIONS = DOMAIN_GROUPS.flatMap(g => g.options.map(o => ({ key: o.key, label: o.label, group: g.label })));

export const APPLICATION_STATUSES = Object.freeze(["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Not Selected"]);
export const INTERVIEW_MODES = Object.freeze(["In person", "Online"]);
export const PAGE_SIZE = 8;
export const NOTE_LIMIT = 4000;
export const MESSAGE_LIMIT = 4000;

export const UNAVAILABLE_APPLICATIONS = "The application service is not connected yet. Applicant records and review actions will be available once it is.";

// ── Service contract ──────────────────────────────────────────────
// listApplications()                  → ok {applications} | unauthenticated | unavailable | error
// saveReview(id, review)              → saved {application} | conflict | invalid {errors} | not-found | unauthenticated | unavailable | error
// updateStatus(id, status, {version}) → same as saveReview
// "unavailable" = no service connected (the default); "error" = a connected service failed.
const allowed = {
  listApplications: ["ok", "unauthenticated", "unavailable", "error"],
  saveReview: ["saved", "conflict", "invalid", "not-found", "unauthenticated", "unavailable", "error"],
  updateStatus: ["saved", "conflict", "invalid", "not-found", "unauthenticated", "unavailable", "error"],
};

export function createApplicationsService(adapter = null) {
  async function invoke(method, ...args) {
    if (typeof adapter?.[method] !== "function") return { status: "unavailable" };
    try {
      const result = await adapter[method](...args);
      if (!allowed[method].includes(result?.status)) return { status: "error" };
      if (result.status === "ok" && !Array.isArray(result.applications)) return { status: "error" };
      if (result.status === "saved" && !result.application?.id) return { status: "error" };
      return result;
    } catch {
      return { status: "error" }; // never surface raw backend errors
    }
  }
  return Object.freeze({
    listApplications: () => invoke("listApplications"),
    async saveReview(id, review) {
      const errors = validateReview(review);
      if (Object.keys(errors).length) return { status: "invalid", errors };
      return invoke("saveReview", id, toReviewPayload(review));
    },
    async updateStatus(id, status, { version } = {}) {
      if (!APPLICATION_STATUSES.includes(status)) return { status: "invalid", errors: { status: "Choose a valid status." } };
      return invoke("updateStatus", id, status, { version });
    },
  });
}

export const applicationsService = createApplicationsService();

export function createApplicationsHttpAdapter(fetcher = (typeof window !== "undefined" ? window.fetch.bind(window) : fetch)) {
  async function call(method, queryParams = {}, body) {
    const isGet = method === "GET";
    const qs = new URLSearchParams(Object.entries(queryParams).filter(([_, v]) => v != null && v !== "")).toString();
    const url = `/api/admin/applications${qs ? `?${qs}` : ""}`;
    const response = await fetcher(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: isGet ? {} : { "Content-Type": "application/json" },
      ...(isGet ? {} : { body: JSON.stringify(body) }),
    });
    return response.json();
  }
  return {
    listApplications: (filters = {}) => call("GET", filters),
    saveReview: (id, review) => call("PUT", {}, { id, review }),
    updateStatus: (id, status, { version } = {}) => call("PATCH", {}, { id, review: { status, version } }),
  };
}

export const connectedApplicationsService = createApplicationsService(createApplicationsHttpAdapter());

// ── Overview, filters, pagination ─────────────────────────────────
export function summarize(applications) {
  const count = s => applications.filter(a => a.status === s).length;
  return { total: applications.length, new: count("New"), shortlisted: count("Shortlisted"), selected: count("Selected") };
}

export const EMPTY_FILTERS = Object.freeze({ query: "", domain: "", year: "", status: "" });

export function filterApplications(applications, filters = EMPTY_FILTERS) {
  const q = filters.query?.trim().toLowerCase() ?? "";
  return applications.filter(a =>
    (!q || [a.fullName, a.roll, a.email].some(v => String(v ?? "").toLowerCase().includes(q))) &&
    (!filters.domain || a.domains?.includes(filters.domain)) &&
    (!filters.year || a.year === filters.year) &&
    (!filters.status || a.status === filters.status));
}

export function paginate(items, page = 1, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return { items: items.slice(start, start + size), page: current, pages, start: items.length ? start + 1 : 0, end: Math.min(start + size, items.length), total: items.length };
}

// ── Review drafts ─────────────────────────────────────────────────
const EMPTY_INTERVIEW = Object.freeze({ date: "", time: "", mode: "", place: "" });

/** The editable part of an application, as the drawer starts it. */
export function reviewFromApplication(app) {
  return {
    version: app.version ?? 0,
    status: app.status,
    notes: app.notes ?? "",
    interview: { ...EMPTY_INTERVIEW, ...(app.interview ?? {}) },
    messages: { ...(app.messages ?? {}) }, // only edited drafts; others follow the template
  };
}

const comparable = r => JSON.stringify({
  status: r.status, notes: r.notes,
  interview: hasInterview(r.interview) ? r.interview : null,
  messages: Object.fromEntries(Object.entries(r.messages).sort()),
});
export const isReviewDirty = (baseline, draft) => comparable(baseline) !== comparable(draft);
export const hasInterview = i => Boolean(i && (i.date || i.time || i.mode || i.place));

export function validateReview(review) {
  const errors = {};
  if (!APPLICATION_STATUSES.includes(review?.status)) errors.status = "Choose a status.";
  if ((review?.notes ?? "").length > NOTE_LIMIT) errors.notes = `Keep notes under ${NOTE_LIMIT} characters.`;
  if (review?.status === "Interview Scheduled") {
    const i = review.interview ?? EMPTY_INTERVIEW;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date)) errors.interviewDate = "Choose the interview date.";
    if (!/^\d{2}:\d{2}$/.test(i.time)) errors.interviewTime = "Choose the interview time.";
    if (!INTERVIEW_MODES.includes(i.mode)) errors.interviewMode = "Choose in person or online.";
    if (!i.place?.trim()) errors.interviewPlace = i.mode === "Online" ? "Add the meeting link." : "Add the venue.";
    else if (i.mode === "Online" && !safeExternalUrl(i.place.trim())) errors.interviewPlace = "Enter a full meeting link starting with https://.";
  }
  for (const [kind, text] of Object.entries(review?.messages ?? {})) {
    if (String(text).length > MESSAGE_LIMIT) errors[`message-${kind}`] = `Keep this message under ${MESSAGE_LIMIT} characters.`;
  }
  return errors;
}

export function toReviewPayload(review) {
  return {
    version: review.version,
    status: review.status,
    notes: review.notes.trim(),
    interview: hasInterview(review.interview) ? { ...review.interview, place: review.interview.place.trim() } : null,
    messages: { ...review.messages },
  };
}

// ── Display helpers ───────────────────────────────────────────────
/** An http(s) URL safe to render as a link, or null (e.g. javascript: URLs). */
export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const TZ = "Asia/Kolkata";
export const formatDate = iso => iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: TZ }).format(new Date(iso)) : "—";
export const formatDateTime = iso => iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(iso)) : "—";
export function formatInterviewDate(date, time) {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}:00+05:30`);
  if (Number.isNaN(d.getTime())) return date;
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(d);
  const at = time ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(d) + " IST" : "";
  return at ? `${day}, ${at}` : day;
}

export function describeHistory(entry) {
  switch (entry.action) {
    case "submitted": return "Application submitted";
    case "status": return `Status changed from ${entry.from} to ${entry.to}`;
    case "notes": return "Internal notes updated";
    case "interview": return entry.text ? `Interview details updated: ${entry.text}` : "Interview details cleared";
    case "message": return `${messageLabel(entry.kind)} draft edited`;
    default: return entry.text || "Updated";
  }
}

// ── Applicant message previews (never sent from this panel) ────────
export const MESSAGE_KINDS = Object.freeze([
  { id: "acknowledgement", label: "Acknowledgement" },
  { id: "shortlisting", label: "Shortlisting" },
  { id: "interview", label: "Interview invitation" },
  { id: "selection", label: "Selection" },
  { id: "non-selection", label: "Non-selection" },
]);
export const messageLabel = id => MESSAGE_KINDS.find(k => k.id === id)?.label ?? id;

export function messageKindForStatus(status) {
  return { "Shortlisted": "shortlisting", "Interview Scheduled": "interview", "Selected": "selection", "Not Selected": "non-selection" }[status] ?? "acknowledgement";
}

const listDomains = keys => {
  const names = (keys ?? []).map(domainLabel);
  return names.length <= 1 ? names[0] ?? "your chosen domain" : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

export function renderMessage(kind, app, interview = EMPTY_INTERVIEW) {
  const first = String(app.fullName ?? "").trim().split(/\s+/)[0] || "there";
  const domains = listDomains(app.domains);
  const sign = "\n\nBuild small, think big.\nKIIT Electrical Society";
  const when = formatInterviewDate(interview.date, interview.time) || "[date and time to be confirmed]";
  const placeLabel = interview.mode === "Online" ? "Meeting link" : "Venue";
  switch (kind) {
    case "shortlisting":
      return `Hi ${first},\n\nThank you for applying to KIIT Electrical Society. We're pleased to let you know that you have been shortlisted for the next stage of recruitment for ${domains}.\n\nWe'll write to you separately with the details of the next step.${sign}`;
    case "interview":
      return `Hi ${first},\n\nWe'd like to invite you to an interview for ${domains}.\n\nWhen: ${when}\nFormat: ${interview.mode || "[in person or online]"}\n${placeLabel}: ${interview.place || "[to be confirmed]"}\n\nPlease reply to this email to confirm that you can attend, or let us know if you need another time.${sign}`;
    case "selection":
      return `Hi ${first},\n\nCongratulations — you have been selected to join KIIT Electrical Society in ${domains}.\n\nWe'll be in touch shortly with the next steps for new members.${sign}`;
    case "non-selection":
      return `Hi ${first},\n\nThank you for your interest in KIIT Electrical Society and for the time you put into your application.\n\nAfter careful review, we are unable to offer you a place in this recruitment cycle. This isn't a judgement of your potential, and we'd be glad to see you at our public events and to receive your application in a future drive.${sign}`;
    default:
      return `Hi ${first},\n\nThank you for applying to join KIIT Electrical Society. We have received your application for ${domains}.\n\nOur team reviews every application, and we'll contact you at this email address about the next steps. Applying does not guarantee selection.${sign}`;
  }
}
