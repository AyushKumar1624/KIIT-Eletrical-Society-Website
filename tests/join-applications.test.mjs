import test from "node:test";
import assert from "node:assert/strict";
import { KIIT_DOMAINS, checkInstitutionalEmail } from "../lib/join/eligibility.mjs";
import { parseSubmission } from "../lib/join/server/submission.mjs";
import { createApplicationService, DuplicateKeyError, isCycleOpen } from "../lib/join/server/applications.mjs";
import { applicationsHandler, verificationHandler } from "../lib/join/server/handlers.mjs";
import { createVerifier } from "../lib/join/server/verifier.mjs";
import { createMemoryStore } from "../lib/join/server/store.mjs";

const EMAIL = "applicant@kiit.ac.in";
const now = new Date("2026-10-15T10:00:00Z");
const valid = () => ({
  email: EMAIL, fullName: "Test Applicant", whatsapp: "+91 98765 43210", roll: "2405001",
  school: "School of Electrical Engineering", programme: "B.Tech EE", year: "2nd year", graduation: "2028",
  domains: ["robotics", "design"], motivation: "I want to learn to build circuits with a team.",
  skills: "", explore: "", link: "https://github.com/test-applicant", confirmAccurate: true, consentContact: true,
});
const OPEN = { _id: "2026-27", name: "Test cycle", open: true, current: true };

// In-memory repository enforcing the same unique keys as the MongoDB indexes,
// with an atomic application+jobs insert and failure injection.
function fakeRepository({ cycle = OPEN, failJobs = false, failDb = false } = {}) {
  const apps = [], jobs = [];
  return {
    apps, jobs, cycle,
    async currentCycle() { if (failDb) throw new Error("db down"); return this.cycle; },
    async findInCycle(cycleId, { email, rollNormalized }) {
      const found = apps.filter(a => a.cycleId === cycleId && (a.email === email || a.rollNormalized === rollNormalized));
      return found.find(a => a.email === email) ?? found[0] ?? null;
    },
    async insertWithJobs(doc, jobDocs) {
      await new Promise(r => setImmediate(r)); // let concurrent callers interleave
      if (apps.some(a => a.cycleId === doc.cycleId && a.email === doc.email)) throw new DuplicateKeyError("email");
      if (apps.some(a => a.cycleId === doc.cycleId && a.rollNormalized === doc.rollNormalized)) throw new DuplicateKeyError("roll");
      if (apps.some(a => a.reference === doc.reference)) throw new DuplicateKeyError("reference");
      if (failJobs) throw new Error("job insert failed"); // transaction aborts: nothing persists
      apps.push(structuredClone(doc)); jobs.push(...structuredClone(jobDocs));
    },
  };
}
const service = (opts = {}) => { const repository = fakeRepository(opts); return { repository, svc: createApplicationService({ repository, now: () => now }) }; };

test("the 22 KIIT domains are unchanged; lookalikes are refused", () => {
  assert.equal(KIIT_DOMAINS.length, 22);
  for (const d of KIIT_DOMAINS) assert.ok(checkInstitutionalEmail(`a@${d}`).ok, d);
  for (const bad of ["a@kiit.ac.in.evil.com", "a@cse.kiit.ac.in", "a@kiit.ac", "a@kiit-ac.in", "a@kiitac.in", "a@xkiit.ac.in", "a@kiit.ac.in@x.com"]) assert.equal(checkInstitutionalEmail(bad).ok, false, bad);
});

test("strict parsing: unknown, client-controlled and wrongly typed fields are rejected", () => {
  for (const extra of ["status", "notes", "history", "role", "reference", "submittedAt", "__proto__x"]) {
    assert.equal(parseSubmission({ application: { ...valid(), [extra]: "x" } }, EMAIL, now).status, "invalid", extra);
  }
  assert.equal(parseSubmission({ application: valid(), token: "x" }, EMAIL, now).status, "invalid");
  assert.equal(parseSubmission({ application: [] }, EMAIL, now).status, "invalid");
  assert.ok(parseSubmission({ application: { ...valid(), fullName: 42 } }, EMAIL, now).errors.fullName);
  assert.ok(parseSubmission({ application: { ...valid(), confirmAccurate: "true" } }, EMAIL, now).errors.confirmAccurate);
  assert.ok(parseSubmission({ application: { ...valid(), domains: "robotics" } }, EMAIL, now).errors.domains);
  assert.ok(parseSubmission({ application: { ...valid(), domains: [{}] } }, EMAIL, now).errors.domains);
  assert.ok(parseSubmission({ application: { ...valid(), motivation: "x".repeat(5000) } }, EMAIL, now).errors.motivation);
  const { roll, ...missingRoll } = valid(); void roll;
  assert.ok(parseSubmission({ application: missingRoll }, EMAIL, now).errors.roll);
});

test("domains, confirmations and links are validated on the server", () => {
  const errs = a => parseSubmission({ application: { ...valid(), ...a } }, EMAIL, now).errors ?? {};
  assert.ok(errs({ domains: [] }).domains);
  assert.ok(errs({ domains: ["robotics", "hacking"] }).domains, "mixed valid/unknown rejected");
  assert.ok(errs({ domains: ["robotics", "robotics"] }).domains, "duplicates rejected");
  assert.ok(errs({ confirmAccurate: false }).confirmAccurate);
  assert.ok(errs({ consentContact: false }).consentContact);
  for (const link of ["javascript:alert(1)", "ftp://x.com/a", "data:text/html,x", "https://user:pw@x.com"]) assert.ok(errs({ link }).link, link);
  const ok = parseSubmission({ application: valid() }, EMAIL, now);
  assert.equal(ok.ok, true);
  assert.equal(ok.application.email, EMAIL);
  assert.deepEqual(Object.keys(ok.application).sort(), ["confirmAccurate", "consentContact", "domains", "email", "explore", "fullName", "graduation", "link", "motivation", "programme", "roll", "school", "skills", "whatsapp", "year"]);
});

test("email substitution: the address comes from verification, never the payload", () => {
  assert.equal(parseSubmission({ application: { ...valid(), email: "someone.else@kiit.ac.in" } }, EMAIL, now).status, "unauthorized");
  const { email, ...noEmail } = valid(); void email;
  assert.equal(parseSubmission({ application: noEmail }, EMAIL, now).application.email, EMAIL);
});

test("closed, not-yet-open and ended cycles refuse applications", async () => {
  assert.equal(isCycleOpen(null, now), false);
  for (const cycle of [null, { ...OPEN, open: false }, { ...OPEN, opensAt: new Date("2026-11-01") }, { ...OPEN, closesAt: new Date("2026-10-01") }]) {
    const { svc, repository } = service({ cycle });
    assert.deepEqual(await svc.submit(EMAIL, { application: valid() }), { status: "unavailable", reason: "closed" });
    assert.equal(repository.apps.length, 0);
  }
  assert.equal(isCycleOpen({ ...OPEN, opensAt: new Date("2026-10-01"), closesAt: new Date("2026-11-01") }, now), true);
});

test("a saved application gets a server reference, status New and both notification jobs", async () => {
  const { svc, repository } = service();
  const r = await svc.submit(EMAIL, { application: valid() });
  assert.equal(r.status, "submitted");
  assert.match(r.reference, /^KES-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.equal(r.submittedAt, now.toISOString());
  const saved = repository.apps[0];
  assert.equal(saved.status, "New"); assert.equal(saved.email, EMAIL); assert.equal(saved.reference, r.reference);
  assert.deepEqual(saved.history.map(h => h.action), ["submitted"]);
  assert.deepEqual(repository.jobs.map(j => j.kind).sort(), ["admin-new-application", "applicant-acknowledgement"]);
  assert.ok(repository.jobs.every(j => j.applicationId === saved._id && j.status === "pending"));
});

test("idempotent retry returns the same reference; changed content or another roll owner is a duplicate", async () => {
  const { svc, repository } = service();
  const first = await svc.submit(EMAIL, { application: valid() });
  assert.deepEqual(await svc.submit(EMAIL, { application: { ...valid(), fullName: "  Test Applicant " } }), first, "whitespace-only retry");
  assert.deepEqual(await svc.submit(EMAIL, { application: { ...valid(), motivation: "Something different entirely, at length." } }), { status: "duplicate" });
  assert.deepEqual(await svc.submit("other@kiit.ac.in", { application: { ...valid(), email: "other@kiit.ac.in", roll: " 2405001 " } }), { status: "duplicate" }, "same roll, different email");
  assert.equal(repository.apps.length, 1); assert.equal(repository.jobs.length, 2);
  // A new cycle keeps earlier history and accepts the same applicant again.
  repository.cycle = { ...OPEN, _id: "2027-28" };
  const next = await svc.submit(EMAIL, { application: valid() });
  assert.equal(next.status, "submitted"); assert.notEqual(next.reference, first.reference); assert.equal(repository.apps.length, 2);
});

test("concurrent submissions: identical ones share one record and reference; different ones yield one success", async () => {
  const { svc, repository } = service();
  const same = await Promise.all(Array.from({ length: 10 }, () => svc.submit(EMAIL, { application: valid() })));
  assert.ok(same.every(r => r.status === "submitted" && r.reference === same[0].reference));
  assert.equal(repository.apps.length, 1); assert.equal(repository.jobs.length, 2);
  const { svc: svc2, repository: repo2 } = service();
  const mixed = await Promise.all(Array.from({ length: 6 }, (_, i) => svc2.submit(EMAIL, { application: { ...valid(), motivation: `Distinct motivation number ${i} for the race.` } })));
  assert.equal(mixed.filter(r => r.status === "submitted").length, 1);
  assert.equal(mixed.filter(r => r.status === "duplicate").length, 5);
  assert.equal(repo2.apps.length, 1);
});

test("database and notification-job failures persist nothing and surface as errors", async () => {
  const jobsFail = service({ failJobs: true });
  await assert.rejects(jobsFail.svc.submit(EMAIL, { application: valid() }));
  assert.equal(jobsFail.repository.apps.length, 0); assert.equal(jobsFail.repository.jobs.length, 0);
  await assert.rejects(service({ failDb: true }).svc.submit(EMAIL, { application: valid() }));
});

// ── HTTP: cookie-bound verification and the submission route ─────────────────
const SECRET = "test-only-join-secret-with-32-plus-characters";
function makeVerifier(t = { now: Date.now() }) {
  const sent = [];
  const verifier = createVerifier({ store: createMemoryStore(() => t.now), secret: SECRET, now: () => t.now, send: async m => { sent.push(m); } });
  return { verifier, sent, t };
}
const req = (path, body, cookie) => new Request(`https://kes.example${path}`, {
  method: "POST", headers: { "content-type": "application/json", origin: "https://kes.example", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body),
});
const cookieOf = res => res.headers.get("set-cookie");

test("confirm sets an HttpOnly join cookie and never returns the token", async () => {
  const { verifier, sent } = makeVerifier();
  const confirm = verificationHandler("confirm", { verifier: async () => verifier, status: () => ({ mode: "smtp" }), origin: () => true });
  await verifier.requestCode(EMAIL);
  const res = await confirm(req("/api/join/verification/confirm", { email: EMAIL, code: sent[0].code }));
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ["email", "expiresIn", "status"]);
  assert.equal(body.email, EMAIL);
  const cookie = cookieOf(res);
  assert.match(cookie, /^kes-join=[A-Za-z0-9_.-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=1800$/);
  assert.ok(!cookie.includes("kes-admin"));
});

test("submission route: missing, forged or expired verification is unauthorized; success clears the cookie", async () => {
  const { verifier, sent, t } = makeVerifier();
  const repo = fakeRepository();
  const svc = createApplicationService({ repository: repo, now: () => now });
  const submit = applicationsHandler({ verifier: async () => verifier, applications: async () => svc, origin: () => true });
  const confirm = verificationHandler("confirm", { verifier: async () => verifier, status: () => ({ mode: "smtp" }), origin: () => true });

  assert.equal((await submit(req("/api/join/applications", { application: valid() }))).status, 401);
  assert.equal((await submit(req("/api/join/applications", { application: valid() }, "kes-join=forged.token"))).status, 401);

  await verifier.requestCode(EMAIL);
  const cookie = cookieOf(await confirm(req("/c", { email: EMAIL, code: sent[0].code }))).split(";")[0];

  const substituted = await submit(req("/a", { application: { ...valid(), email: "victim@kiit.ac.in" } }, cookie));
  assert.equal(substituted.status, 401);
  assert.equal(repo.apps.length, 0);

  const bad = await submit(req("/a", { application: { ...valid(), domains: ["robotics", "nope"] } }, cookie));
  assert.equal(bad.status, 400); assert.ok((await bad.json()).errors.domains);

  const ok = await submit(req("/a", { application: valid() }, cookie));
  assert.equal(ok.status, 201);
  const body = await ok.json();
  assert.equal(body.status, "submitted"); assert.equal(body.reference, repo.apps[0].reference);
  assert.match(cookieOf(ok), /^kes-join=; .*Max-Age=0/);

  const retry = await submit(req("/a", { application: valid() }, cookie)); // response was lost; cookie still held
  assert.deepEqual(await retry.json(), body);

  t.now += 1801 * 1000;
  assert.equal((await submit(req("/a", { application: valid() }, cookie))).status, 401, "expired verification");
});

test("submission route: closed cycle, duplicates and database failure use the existing envelope", async () => {
  const { verifier, sent } = makeVerifier();
  const confirm = verificationHandler("confirm", { verifier: async () => verifier, status: () => ({ mode: "smtp" }), origin: () => true });
  await verifier.requestCode(EMAIL);
  const cookie = cookieOf(await confirm(req("/c", { email: EMAIL, code: sent[0].code }))).split(";")[0];
  const route = repository => applicationsHandler({ verifier: async () => verifier, applications: async () => createApplicationService({ repository, now: () => now }), origin: () => true });

  const closed = await route(fakeRepository({ cycle: { ...OPEN, open: false } }))(req("/a", { application: valid() }, cookie));
  assert.equal(closed.status, 503); assert.deepEqual(await closed.json(), { status: "unavailable", reason: "closed" });

  const repo = fakeRepository(); const h = route(repo);
  await h(req("/a", { application: valid() }, cookie));
  const dup = await h(req("/a", { application: { ...valid(), motivation: "A different motivation, long enough." } }, cookie));
  assert.equal(dup.status, 409); assert.deepEqual(await dup.json(), { status: "duplicate" });

  const down = await route(fakeRepository({ failDb: true }))(req("/a", { application: valid() }, cookie));
  assert.equal(down.status, 503); assert.deepEqual(await down.json(), { status: "unavailable" });
  const jobs = await route(fakeRepository({ failJobs: true }))(req("/a", { application: valid() }, cookie));
  assert.equal(jobs.status, 503);

  const noService = applicationsHandler({ verifier: async () => verifier, applications: async () => null, origin: () => true });
  assert.equal((await noService(req("/a", { application: valid() }, cookie))).status, 503);
  const crossSite = applicationsHandler({ verifier: async () => verifier, applications: async () => null, origin: () => false });
  assert.equal((await crossSite(req("/a", { application: valid() }, cookie))).status, 403);
});
