import test from "node:test";
import assert from "node:assert/strict";
import {
  applicationsService, createApplicationsService, summarize, filterApplications, paginate, reviewFromApplication,
  isReviewDirty, validateReview, safeExternalUrl, renderMessage, messageKindForStatus, APPLICATION_STATUSES,
} from "../lib/admin/applications.mjs";
import { PREVIEW_APPLICATIONS, createPreviewAdapter } from "../lib/admin/preview-applications.mjs";

const apps = PREVIEW_APPLICATIONS;

test("the default service has no adapter: nothing loads or saves", async () => {
  assert.deepEqual(await applicationsService.listApplications(), { status: "unavailable" });
  const review = reviewFromApplication(apps[0]);
  assert.deepEqual(await applicationsService.saveReview("x", review), { status: "unavailable" });
  assert.deepEqual(await applicationsService.updateStatus("x", "Selected"), { status: "unavailable" });
});

test("adapter failures and malformed responses become a generic error", async () => {
  const s = createApplicationsService({
    listApplications: async () => { throw new Error("database password in message"); },
    saveReview: async () => ({ status: "saved" }), // missing application
    updateStatus: async () => ({ status: "teapot" }),
  });
  assert.deepEqual(await s.listApplications(), { status: "error" });
  assert.deepEqual(await s.saveReview("DEMO-01", reviewFromApplication(apps[0])), { status: "error" });
  assert.deepEqual(await s.updateStatus("DEMO-01", "Selected"), { status: "error" });
  assert.equal((await s.updateStatus("DEMO-01", "Hired")).status, "invalid");
});

test("overview counts come from the loaded dataset", () => {
  const s = summarize(apps);
  assert.equal(s.total, apps.length);
  assert.equal(s.new, apps.filter(a => a.status === "New").length);
  assert.equal(s.shortlisted, apps.filter(a => a.status === "Shortlisted").length);
  assert.equal(s.selected, apps.filter(a => a.status === "Selected").length);
  assert.deepEqual(summarize([]), { total: 0, new: 0, shortlisted: 0, selected: 0 });
});

test("filters combine search, domain, year and status", () => {
  assert.equal(filterApplications(apps, { query: "tara" }).length, 1);
  assert.equal(filterApplications(apps, { query: "DEMO-2400003" }).length, 1);
  assert.equal(filterApplications(apps, { query: "FICTIONAL.APPLICANT05@" }).length, 1);
  assert.ok(filterApplications(apps, { domain: "robotics" }).every(a => a.domains.includes("robotics")));
  assert.ok(filterApplications(apps, { year: "1st year", status: "New" }).every(a => a.year === "1st year" && a.status === "New"));
  assert.equal(filterApplications(apps, { query: "zzz-nobody" }).length, 0);
  assert.equal(filterApplications(apps, {}).length, apps.length);
});

test("pagination clamps pages and reports ranges", () => {
  const p1 = paginate(apps, 1, 8);
  assert.deepEqual([p1.items.length, p1.page, p1.pages, p1.start, p1.end], [8, 1, 2, 1, 8]);
  const p9 = paginate(apps, 9, 8);
  assert.deepEqual([p9.page, p9.start, p9.end], [2, 9, apps.length]);
  const empty = paginate([], 3, 8);
  assert.deepEqual([empty.page, empty.pages, empty.start, empty.end], [1, 1, 0, 0]);
});

test("review drafts: dirty tracking and interview validation", () => {
  const base = reviewFromApplication(apps[0]);
  assert.equal(isReviewDirty(base, { ...base }), false);
  assert.equal(isReviewDirty(base, { ...base, notes: "x" }), true);
  assert.equal(isReviewDirty(base, { ...base, messages: { selection: "Edited" } }), true);
  const interview = { ...base, status: "Interview Scheduled" };
  assert.deepEqual(Object.keys(validateReview(interview)).sort(), ["interviewDate", "interviewMode", "interviewPlace", "interviewTime"]);
  assert.ok(validateReview({ ...interview, interview: { date: "2026-10-24", time: "16:30", mode: "Online", place: "not a link" } }).interviewPlace);
  assert.deepEqual(validateReview({ ...interview, interview: { date: "2026-10-24", time: "16:30", mode: "In person", place: "Room 1" } }), {});
  assert.ok(validateReview({ ...base, status: "Hired" }).status);
  assert.ok(validateReview({ ...base, notes: "x".repeat(4001) }).notes);
});

test("links render only for http(s)", () => {
  assert.equal(safeExternalUrl("https://github.com/x"), "https://github.com/x");
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("github.com/x"), null);
});

test("message templates use the applicant and interview details, with a fallback per status", () => {
  const app = apps[3];
  const text = renderMessage("interview", app, { date: "2026-10-24", time: "16:30", mode: "Online", place: "https://meet.example.com/x" });
  assert.match(text, /^Hi Rohan,/);
  assert.match(text, /Saturday, 24 October 2026/);
  assert.match(text, /Meeting link: https:\/\/meet\.example\.com\/x/);
  assert.match(renderMessage("interview", app), /\[date and time to be confirmed\]/);
  for (const kind of ["acknowledgement", "shortlisting", "selection", "non-selection"]) assert.match(renderMessage(kind, app), /KIIT Electrical Society/);
  assert.deepEqual(APPLICATION_STATUSES.map(messageKindForStatus), ["acknowledgement", "acknowledgement", "shortlisting", "interview", "selection", "non-selection"]);
});

test("preview adapter: saving appends history, bumps version and detects stale versions", async () => {
  const adapter = createPreviewAdapter();
  const s = createApplicationsService(adapter);
  const list = await s.listApplications();
  const app = list.applications.find(a => a.status === "New");
  const draft = { ...reviewFromApplication(app), status: "Under Review", notes: "Fictional note" };
  const saved = await s.saveReview(app.id, draft);
  assert.equal(saved.status, "saved");
  assert.equal(saved.application.version, app.version + 1);
  assert.deepEqual(saved.application.history.slice(-2).map(h => h.action), ["status", "notes"]);
  assert.equal((await s.saveReview(app.id, draft)).status, "conflict"); // stale version
  adapter.setMode("save-fails");
  assert.equal((await s.saveReview(app.id, reviewFromApplication(saved.application))).status, "unavailable");
});
