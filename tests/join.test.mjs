import test from "node:test";
import assert from "node:assert/strict";
import { KIIT_DOMAINS, checkInstitutionalEmail, EMAIL_MESSAGES } from "../lib/join/eligibility.mjs";
import { STEPS, EMPTY_APPLICATION, validateStep, validateApplication, toSubmission, graduationYears } from "../lib/join/application.mjs";

test("every listed KIIT domain is accepted, case-insensitively and trimmed", () => {
  assert.equal(KIIT_DOMAINS.length, 22);
  for (const d of KIIT_DOMAINS) {
    const r = checkInstitutionalEmail(`  Student.Name@${d.toUpperCase()}  `);
    assert.equal(r.ok, true, d);
    assert.equal(r.domain, d);
    assert.equal(r.email, `student.name@${d}`);
  }
});

test("unlisted domains are refused with the exact message — no suffix matching", () => {
  for (const email of [
    "a@gmail.com", "a@kiit.ac.in.evil.com", "a@evilkiit.ac.in", "a@cse.kiit.ac.in",
    "a@mail.kiit.ac.in", "a@kiit.ac", "a@ksom.kiit.ac.in",
  ]) {
    const r = checkInstitutionalEmail(email);
    assert.equal(r.ok, false, email);
    assert.equal(r.message, "Please use an eligible KIIT institutional email address.", email);
  }
});

test("malformed or empty input is a format/required error, not a domain error", () => {
  assert.equal(checkInstitutionalEmail("").reason, "required");
  assert.equal(checkInstitutionalEmail("   ").reason, "required");
  for (const email of ["kiit.ac.in", "@kiit.ac.in", "a b@kiit.ac.in", "a@@kiit.ac.in", "a@kiit", "a@kiit..ac.in", "a@kiit.ac.in."]) {
    assert.equal(checkInstitutionalEmail(email).reason, "format", email);
  }
  assert.equal(EMAIL_MESSAGES.domain, "Please use an eligible KIIT institutional email address.");
});

const now = new Date("2026-10-15T12:00:00Z");
const complete = {
  ...EMPTY_APPLICATION,
  fullName: "Test Applicant", whatsapp: "+91 98765 43210",
  roll: "2405123", school: "School of Electrical Engineering", programme: "B.Tech EE", year: "2nd year", graduation: "2029",
  domains: ["design"], motivation: "I want to learn to build things with a team.",
  confirmAccurate: true, consentContact: true,
};

test("each step reports its own required fields", () => {
  assert.deepEqual(Object.keys(validateStep("personal", EMPTY_APPLICATION, now)), ["fullName", "whatsapp"]);
  assert.deepEqual(Object.keys(validateStep("academic", EMPTY_APPLICATION, now)), ["roll", "school", "programme", "year", "graduation"]);
  assert.deepEqual(Object.keys(validateStep("domains", EMPTY_APPLICATION, now)), ["domains"]);
  assert.deepEqual(Object.keys(validateStep("interests", EMPTY_APPLICATION, now)), ["motivation"]); // the rest are optional
  assert.deepEqual(Object.keys(validateStep("review", EMPTY_APPLICATION, now)), ["confirmAccurate", "consentContact"]);
  for (const s of STEPS) assert.deepEqual(validateStep(s.id, complete, now), {}, s.id);
});

test("domains: technical only, non-technical only, or both; unknown keys don't count", () => {
  assert.deepEqual(validateStep("domains", { ...complete, domains: ["robotics"] }, now), {});
  assert.deepEqual(validateStep("domains", { ...complete, domains: ["writing"] }, now), {});
  assert.deepEqual(validateStep("domains", { ...complete, domains: ["ai", "media"] }, now), {});
  assert.ok(validateStep("domains", { ...complete, domains: ["not-a-domain"] }, now).domains);
});

test("format rules: phone, optional link, motivation length, graduation range", () => {
  assert.ok(validateStep("personal", { ...complete, whatsapp: "12345" }, now).whatsapp);
  assert.deepEqual(validateStep("personal", { ...complete, whatsapp: "98765-43210" }, now), {});
  assert.ok(validateStep("interests", { ...complete, link: "github.com/me" }, now).link);
  assert.ok(validateStep("interests", { ...complete, link: "javascript:alert(1)" }, now).link);
  assert.deepEqual(validateStep("interests", { ...complete, link: "https://github.com/me" }, now), {});
  assert.ok(validateStep("interests", { ...complete, motivation: "Because." }, now).motivation);
  assert.ok(validateStep("academic", { ...complete, graduation: "2040" }, now).graduation);
  assert.deepEqual(graduationYears(now), ["2026", "2027", "2028", "2029", "2030", "2031", "2032"]);
});

test("whole application: first failing step and a trimmed submission payload", () => {
  assert.equal(validateApplication(EMPTY_APPLICATION, now).firstStep, 0);
  assert.equal(validateApplication({ ...complete, domains: [] }, now).firstStep, 2);
  assert.equal(validateApplication(complete, now).firstStep, -1);
  const payload = toSubmission({ ...complete, fullName: "  Test Applicant ", domains: ["design", "bogus"] }, "test@kiit.ac.in");
  assert.equal(payload.email, "test@kiit.ac.in");
  assert.equal(payload.fullName, "Test Applicant");
  assert.equal(payload.whatsapp, "+919876543210");
  assert.deepEqual(payload.domains, ["design"]);
});
