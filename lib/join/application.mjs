// The Join KES membership application: steps, options and validation.
// Plain data and pure functions, so a future application service can run the
// same validateApplication() on what it receives.

import { DOMAINS } from "../content.js";

export const STEPS = Object.freeze([
  { id: "personal", title: "Personal details", fields: ["fullName", "whatsapp"] },
  { id: "academic", title: "Academic details", fields: ["roll", "school", "programme", "year", "graduation"] },
  { id: "domains", title: "Domain preferences", fields: ["domains"] },
  { id: "interests", title: "Interests & experience", fields: ["motivation", "skills", "explore", "link"] },
  { id: "review", title: "Review & submit", fields: ["confirmAccurate", "consentContact"] },
]);

// Labels as used in recruitment; descriptions come from the homepage domains.
const describe = key => DOMAINS.find(d => d.key === key)?.text ?? "";
const option = (key, label) => ({ key, label, text: describe(key) });
export const DOMAIN_GROUPS = Object.freeze([
  {
    id: "technical", label: "Technical",
    options: [
      option("robotics", "Robotics"),
      option("embedded", "Embedded Systems"),
      option("ai", "Artificial Intelligence & Machine Learning"),
      option("web", "Web Development"),
    ],
  },
  {
    id: "non-technical", label: "Non-technical",
    options: [
      option("design", "Graphic Designing"),
      option("media", "Photography, Videography & Editing"),
      option("outreach", "Social Media & Outreach"),
      option("events", "Marketing & Event Management"),
      option("writing", "Content Writing"),
    ],
  },
]);
export const DOMAIN_KEYS = new Set(DOMAIN_GROUPS.flatMap(g => g.options.map(o => o.key)));
export const domainLabel = key => DOMAIN_GROUPS.flatMap(g => g.options).find(o => o.key === key)?.label ?? key;

// No verified KIIT school/programme directory exists in this project, so
// school and programme are free text; year of study is a generic list.
export const YEAR_OPTIONS = Object.freeze(["1st year", "2nd year", "3rd year", "4th year", "5th year"]);
export function graduationYears(now = new Date()) {
  const y = now.getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(y + i));
}

export const LIMITS = Object.freeze({ name: 80, text: 120, motivationMin: 20, motivation: 600, long: 800, link: 300 });

export const EMPTY_APPLICATION = Object.freeze({
  fullName: "", whatsapp: "",
  roll: "", school: "", programme: "", year: "", graduation: "",
  domains: [],
  motivation: "", skills: "", explore: "", link: "",
  confirmAccurate: false, consentContact: false,
});

const digits = v => String(v).replace(/[\s()-]/g, "");
const isUrl = v => { try { const u = new URL(v); return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".") && !u.username && !u.password; } catch { return false; } };

const RULES = {
  fullName: v => !v.trim() ? "Enter your full name." : v.trim().length < 2 ? "Enter your full name." : v.length > LIMITS.name ? `Keep your name under ${LIMITS.name} characters.` : null,
  whatsapp: v => !v.trim() ? "Enter your WhatsApp number." : !/^\+?\d{10,15}$/.test(digits(v.trim())) ? "Enter a 10-digit number, or include your country code, e.g. +91 98765 43210." : null,
  roll: v => !v.trim() ? "Enter your KIIT roll number." : !/^[A-Za-z0-9/-]{4,20}$/.test(v.trim()) ? "Enter your roll number as it appears on your KIIT ID card." : null,
  school: v => !v.trim() ? "Enter your school or institute." : v.length > LIMITS.text ? `Keep this under ${LIMITS.text} characters.` : null,
  programme: v => !v.trim() ? "Enter your branch or programme." : v.length > LIMITS.text ? `Keep this under ${LIMITS.text} characters.` : null,
  year: v => YEAR_OPTIONS.includes(v) ? null : "Select your current year of study.",
  graduation: (v, now) => {
    const y = Number(v), current = now.getFullYear();
    return /^\d{4}$/.test(v) && y >= current - 1 && y <= current + 8 ? null : "Select your expected graduation year.";
  },
  // Every selection must be a known domain, each chosen once.
  domains: v => !Array.isArray(v) || !v.length ? "Choose at least one domain — technical, non-technical or both."
    : v.some(k => !DOMAIN_KEYS.has(k)) ? "Choose domains from the list shown."
      : new Set(v).size !== v.length ? "Choose each domain only once." : null,
  motivation: v => {
    const t = v.trim();
    if (!t) return "Tell us briefly why you want to join KES.";
    if (t.length < LIMITS.motivationMin) return `Write a little more — at least ${LIMITS.motivationMin} characters.`;
    return t.length > LIMITS.motivation ? `Keep this under ${LIMITS.motivation} characters.` : null;
  },
  skills: v => v.length > LIMITS.long ? `Keep this under ${LIMITS.long} characters.` : null,
  explore: v => v.length > LIMITS.long ? `Keep this under ${LIMITS.long} characters.` : null,
  link: v => !v.trim() ? null : v.length > LIMITS.link || !isUrl(v.trim()) ? "Enter a full link starting with https://, or leave this empty." : null,
  confirmAccurate: v => v === true ? null : "Confirm that your information is accurate.",
  consentContact: v => v === true ? null : "Agree to be contacted about your application to continue.",
};

/** Errors for one step, keyed by field name. Empty object when the step is complete. */
export function validateStep(stepId, values, now = new Date()) {
  const step = STEPS.find(s => s.id === stepId);
  const errors = {};
  for (const field of step?.fields ?? []) {
    const message = RULES[field](values[field] ?? EMPTY_APPLICATION[field], now);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Errors for the whole application, plus the first step that needs attention. */
export function validateApplication(values, now = new Date()) {
  const errors = {};
  let firstStep = -1;
  STEPS.forEach((s, i) => {
    const e = validateStep(s.id, values, now);
    if (Object.keys(e).length && firstStep < 0) firstStep = i;
    Object.assign(errors, e);
  });
  return { errors, firstStep };
}

/** The payload POSTed to /api/join/applications. The server ignores nothing: it re-validates every field and takes the email from the verified session. */
export function toSubmission(values, verifiedEmail) {
  const t = v => String(v ?? "").trim();
  return {
    email: verifiedEmail,
    fullName: t(values.fullName),
    whatsapp: digits(t(values.whatsapp)),
    roll: t(values.roll),
    school: t(values.school),
    programme: t(values.programme),
    year: values.year,
    graduation: values.graduation,
    domains: [...new Set(values.domains.filter(k => DOMAIN_KEYS.has(k)))],
    motivation: t(values.motivation),
    skills: t(values.skills),
    explore: t(values.explore),
    link: t(values.link),
    confirmAccurate: values.confirmAccurate === true,
    consentContact: values.consentContact === true,
  };
}
