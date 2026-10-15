// Who may apply to KES: holders of a KIIT institutional email address.
//
// Shared by the Join KES form and any future verification service. A server
// MUST run checkInstitutionalEmail() itself before sending a code, confirming
// a code or accepting an application — the browser check is only a courtesy.
// An eligible domain is not proof of ownership; only a confirmed one-time
// code is (see docs/join-kes-integration.md).

export const KIIT_DOMAINS = Object.freeze([
  "kiit.ac.in",
  "biotech.kiit.ac.in",
  "fashion.kiit.ac.in",
  "film.kiit.ac.in",
  "ksap.kiit.ac.in",
  "ksfh.kiit.ac.in",
  "ksmc.kiit.ac.in",
  "ksod.kiit.ac.in",
  "ksol.kiit.ac.in",
  "library.kiit.ac.in",
  "kins.ac.in",
  "kims.ac.in",
  "kids.ac.in",
  "kls.ac.in",
  "ksom.ac.in",
  "ksrm.ac.in",
  "kp.kiit.ac.in",
  "kspt.kiit.ac.in",
  "ksls.kiit.ac.in",
  "ksec.kiit.ac.in",
  "ksp.kiit.ac.in",
  "ksams.kiit.ac.in",
]);

const ALLOWED = new Set(KIIT_DOMAINS);

// One "@", a local part without spaces, and a dotted domain of letters,
// digits and hyphens.
const EMAIL_FORMAT = /^[^\s@]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

export const EMAIL_MESSAGES = Object.freeze({
  required: "Enter your KIIT institutional email address.",
  format: "Enter a complete email address, such as name@kiit.ac.in.",
  domain: "Please use an eligible KIIT institutional email address.",
});

/**
 * Trims, checks the format and compares the domain exactly (case-insensitive)
 * against KIIT_DOMAINS. No suffix matching: "x.kiit.ac.in" is not eligible
 * unless it is listed.
 * @returns {{ ok: true, email: string, domain: string } | { ok: false, reason: "required"|"format"|"domain", message: string }}
 */
export function checkInstitutionalEmail(input) {
  const email = String(input ?? "").trim();
  if (!email) return { ok: false, reason: "required", message: EMAIL_MESSAGES.required };
  if (!EMAIL_FORMAT.test(email)) return { ok: false, reason: "format", message: EMAIL_MESSAGES.format };
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (!ALLOWED.has(domain)) return { ok: false, reason: "domain", message: EMAIL_MESSAGES.domain };
  return { ok: true, email: email.toLowerCase(), domain };
}
