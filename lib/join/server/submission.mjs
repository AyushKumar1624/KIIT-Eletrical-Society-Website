// Strict server-side parsing of a Join KES application.
//
// Runs before the shared validateApplication() rules: it rejects anything that
// is not exactly the form's shape (unknown or client-controlled fields such as
// status, notes, history, role or reference; wrong types; oversized values),
// then normalizes and validates the content. The email is never taken from the
// request: it comes from the verified-applicant session.
import "server-only";
import { createHash } from "node:crypto";
import { validateApplication, toSubmission, DOMAIN_KEYS } from "../application.mjs";

const STRING_FIELDS = Object.freeze({
  fullName: 200, whatsapp: 40, roll: 40, school: 300, programme: 300, year: 20, graduation: 8,
  motivation: 1500, skills: 2000, explore: 2000, link: 600,
});
const BOOLEAN_FIELDS = Object.freeze(["confirmAccurate", "consentContact"]);
// `email` may be present (the existing client sends it) but is only compared
// with the session, never trusted.
const ALLOWED = new Set([...Object.keys(STRING_FIELDS), ...BOOLEAN_FIELDS, "domains", "email"]);
const FORM_ERROR = "This application couldn’t be read. Refresh the page and try again.";

/**
 * @returns {{ ok: true, application: object } | { ok: false, status: "invalid" | "unauthorized", errors?: object }}
 */
export function parseSubmission(body, verifiedEmail, now = new Date()) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => k !== "application")) {
    return { ok: false, status: "invalid", errors: { form: FORM_ERROR } };
  }
  const input = body.application;
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    return { ok: false, status: "invalid", errors: { form: FORM_ERROR } };
  }
  if (Object.keys(input).some(k => !ALLOWED.has(k))) return { ok: false, status: "invalid", errors: { form: FORM_ERROR } };

  const errors = {};
  for (const [field, max] of Object.entries(STRING_FIELDS)) {
    const v = input[field];
    if (typeof v !== "string") errors[field] = "This answer is missing or in the wrong format.";
    else if (v.length > max) errors[field] = "This answer is too long.";
  }
  for (const field of BOOLEAN_FIELDS) if (typeof input[field] !== "boolean") errors[field] = "Confirm this to continue.";
  const domains = input.domains;
  if (!Array.isArray(domains) || domains.length > DOMAIN_KEYS.size * 2 || domains.some(d => typeof d !== "string" || d.length > 20)) {
    errors.domains = "Choose domains from the list shown.";
  }
  if (Object.keys(errors).length) return { ok: false, status: "invalid", errors };

  // Email substitution: a different address in the payload is not a typo the
  // server can fix; the applicant must verify that address instead.
  if (input.email !== undefined && (typeof input.email !== "string" || input.email.trim().toLowerCase() !== verifiedEmail)) {
    return { ok: false, status: "unauthorized" };
  }

  const values = { ...Object.fromEntries(Object.keys(STRING_FIELDS).map(k => [k, input[k]])), domains: [...domains], confirmAccurate: input.confirmAccurate, consentContact: input.consentContact };
  const checked = validateApplication(values, now).errors;
  if (Object.keys(checked).length) return { ok: false, status: "invalid", errors: checked };

  const application = toSubmission(values, verifiedEmail);
  return { ok: true, application };
}

export const normalizeRoll = roll => roll.trim().toUpperCase();

/** Stable digest of what the applicant submitted, used to recognise retries of the same submission. */
export function submissionDigest(application) {
  const ordered = Object.fromEntries(Object.keys(application).sort().map(k => [k, k === "domains" ? [...application[k]].sort() : application[k]]));
  return createHash("sha256").update(JSON.stringify(ordered)).digest("base64url");
}
