// DEVELOPER PREVIEW ONLY — loaded by `npm run dev` at /join?preview=1.
// Simulates the verification and application services so every screen can be
// reviewed. Nothing is emailed, stored or submitted.

import { checkInstitutionalEmail } from "./eligibility.mjs";

export const PREVIEW_CODES = Object.freeze({ valid: "246810", expired: "000000" });

const settings = { mode: "available" }; // available | unavailable | failing
const wait = ms => new Promise(r => setTimeout(r, ms));

async function respond(build) {
  await wait(650);
  if (settings.mode === "unavailable") return { status: "unavailable" };
  if (settings.mode === "failing") return { status: "error" };
  return build();
}

export const previewService = {
  available: true,
  applicationsAvailable: true,
  preview: true,
  codes: PREVIEW_CODES,
  setMode: mode => { settings.mode = mode; },
  // Fictional answers for reviewing later steps quickly.
  sample: () => ({
    fullName: "Riya Sen", whatsapp: "+91 90000 00000",
    roll: "2400000", school: "School of Electrical Engineering", programme: "B.Tech Electrical Engineering",
    year: "2nd year", graduation: String(new Date().getFullYear() + 2),
    domains: ["embedded", "design"],
    motivation: "I like taking old electronics apart and want to learn to design my own circuits with a team.",
    skills: "", explore: "A small ESP32 weather station.", link: "",
  }),
  requestCode: email => respond(() =>
    checkInstitutionalEmail(email).ok ? { status: "sent", resendAfter: 30, expiresIn: 600 } : { status: "ineligible" }),
  verifyCode: (email, code) => respond(() =>
    code === PREVIEW_CODES.valid ? { status: "verified", token: "preview-token" }
      : code === PREVIEW_CODES.expired ? { status: "expired" }
        : { status: "invalid", attemptsLeft: 4 }),
  submitApplication: (token, application) => respond(() =>
    token !== "preview-token" ? { status: "unauthorized" }
      : { status: "submitted", reference: `PREVIEW-${application.roll || "0000"}` }),
};
