// DEVELOPMENT PREVIEW ONLY — imported solely by components/admin/ApplicationsPreview.js,
// which the /admin/applications/preview route loads only on the dev server.
// Every record is fictional. Nothing is sent, stored or read from a real service.

const ADMIN = "Fictional reviewer";
const base = Date.parse("2026-09-08T10:00:00+05:30");
const at = (day, hour = 0) => new Date(base + day * 86_400_000 + hour * 3_600_000).toISOString();

const PEOPLE = [
  ["Ira Fictional", "1st year", "School of Electrical Engineering", "B.Tech Electrical Engineering", ["robotics", "embedded"], "New"],
  ["Kabir Samplewala", "2nd year", "School of Computer Engineering", "B.Tech Computer Science", ["ai", "web"], "Under Review"],
  ["Meher Placeholder", "1st year", "School of Mass Communication", "BA Journalism", ["media", "writing"], "Shortlisted"],
  ["Rohan Testkar", "3rd year", "School of Electronics Engineering", "B.Tech ECE", ["embedded"], "Interview Scheduled"],
  ["Tara Demo", "2nd year", "School of Electrical Engineering", "B.Tech Electrical Engineering", ["robotics"], "Selected"],
  ["Anaya Exampleton", "4th year", "School of Computer Engineering", "B.Tech IT", ["web", "design"], "Not Selected"],
  ["Vihaan Mockford", "1st year", "School of Mechanical Engineering", "B.Tech Mechanical", ["robotics", "events"], "New"],
  ["Saanvi Dummyrao", "2nd year", "School of Fashion", "B.Des Fashion", ["design", "outreach"], "New"],
  ["Arjun Fixtureson", "3rd year", "School of Computer Engineering", "B.Tech CSE", ["ai"], "Under Review"],
  ["Nila Samplesson", "1st year", "School of Biotechnology", "B.Tech Biotechnology", ["writing"], "Shortlisted"],
  ["Dev Placeholderjee", "5th year", "School of Law", "BA LLB", ["events", "outreach"], "New"],
  ["Zoya Trialwala", "2nd year", "School of Film and Media Sciences", "BSc Film & Television", ["media"], "Selected"],
  ["Fictional Applicant With An Unusually Long Name For Layout Testing", "1st year", "School of Electrical Engineering and an Unusually Long Institute Name", "B.Tech Electrical and Electronics Engineering (Honours)", ["robotics", "embedded", "ai", "web", "design", "media", "outreach", "events", "writing"], "New"],
  ["Ayaan Mockingbird", "3rd year", "School of Electronics Engineering", "B.Tech ETC", ["embedded", "web"], "Under Review"],
];

function fixture([fullName, year, school, programme, domains, status], i) {
  const n = String(i + 1).padStart(2, "0");
  const submitted = at(i * 1.7, 9 + (i % 8));
  const history = [{ at: submitted, by: "Applicant", action: "submitted" }];
  let interview = null;
  const steps = { "Under Review": ["Under Review"], Shortlisted: ["Under Review", "Shortlisted"], "Interview Scheduled": ["Under Review", "Shortlisted", "Interview Scheduled"], Selected: ["Under Review", "Shortlisted", "Interview Scheduled", "Selected"], "Not Selected": ["Under Review", "Not Selected"] }[status] ?? [];
  let from = "New";
  steps.forEach((to, k) => { history.push({ at: at(i * 1.7 + 2 + k * 2, 11), by: ADMIN, action: "status", from, to }); from = to; });
  if (["Interview Scheduled", "Selected"].includes(status)) {
    interview = { date: "2026-10-24", time: "16:30", mode: i % 2 ? "Online" : "In person", place: i % 2 ? "https://meet.example.com/kes-preview" : "Fictional seminar room, Campus 3" };
    history.splice(history.length - (status === "Selected" ? 1 : 0), 0, { at: at(i * 1.7 + 5, 12), by: ADMIN, action: "interview", text: "24 Oct 2026, 4:30 pm" });
  }
  return {
    id: `DEMO-${n}`,
    version: 1,
    submittedAt: submitted,
    status,
    fullName,
    email: `fictional.applicant${n}@kiit.ac.in`,
    whatsapp: `+91 90000 000${n}`,
    roll: `DEMO-${2400000 + i}`,
    school, programme, year,
    graduation: String(2026 + 5 - Number(year[0] || 1)),
    domains,
    motivation: i === 12
      ? "This fictional answer is deliberately long to test wrapping. ".repeat(9).trim()
      : "Fictional answer: I want to learn by building small things with a team and to understand how real circuits behave.",
    skills: i % 3 === 0 ? "" : "Fictional: basic Arduino projects in school, some Python, and a lot of curiosity.",
    explore: i % 4 === 0 ? "" : "Fictional: a line-following robot and a small weather station.",
    link: i % 3 === 1 ? `https://github.com/fictional-applicant-${n}` : i === 5 ? "javascript:alert('not a link')" : "",
    notes: status === "New" ? "" : "Fictional note: clear motivation; follow up on prior project experience.",
    interview,
    messages: {},
    history,
  };
}

export const PREVIEW_APPLICATIONS = Object.freeze(PEOPLE.map(fixture));

const wait = ms => new Promise(r => setTimeout(r, ms));

/** A simulated adapter for createApplicationsService(). `mode` is changed from the preview toolbar. */
export function createPreviewAdapter() {
  let records = structuredClone(PREVIEW_APPLICATIONS);
  const settings = { mode: "normal" }; // normal | slow | load-error | empty | save-fails | conflict | signed-out

  function applyReview(record, review) {
    const t = new Date().toISOString();
    const history = [...record.history];
    if (review.status !== record.status) history.push({ at: t, by: ADMIN, action: "status", from: record.status, to: review.status });
    if (review.notes !== (record.notes ?? "")) history.push({ at: t, by: ADMIN, action: "notes" });
    const before = JSON.stringify(record.interview ?? null), after = JSON.stringify(review.interview ?? null);
    if (before !== after) history.push({ at: t, by: ADMIN, action: "interview", text: review.interview ? `${review.interview.date} ${review.interview.time}, ${review.interview.mode}` : "" });
    for (const kind of new Set([...Object.keys(record.messages ?? {}), ...Object.keys(review.messages)])) {
      if ((record.messages ?? {})[kind] !== review.messages[kind]) history.push({ at: t, by: ADMIN, action: "message", kind });
    }
    return { ...record, status: review.status, notes: review.notes, interview: review.interview, messages: review.messages, version: record.version + 1, history };
  }

  async function save(id, change) {
    await wait(settings.mode === "slow" ? 1800 : 600);
    if (settings.mode === "signed-out") return { status: "unauthenticated" };
    if (settings.mode === "save-fails") return { status: "unavailable" };
    if (settings.mode === "conflict") return { status: "conflict" };
    const i = records.findIndex(r => r.id === id);
    if (i < 0) return { status: "not-found" };
    if (change.version !== undefined && change.version !== records[i].version) return { status: "conflict" };
    records[i] = applyReview(records[i], change);
    return { status: "saved", application: structuredClone(records[i]) };
  }

  return {
    get mode() { return settings.mode; },
    setMode(mode) { settings.mode = mode; },
    reset() { records = structuredClone(PREVIEW_APPLICATIONS); },
    async listApplications() {
      await wait(settings.mode === "slow" ? 2500 : 500);
      if (settings.mode === "load-error") throw new Error("simulated failure");
      if (settings.mode === "signed-out") return { status: "unauthenticated" };
      return { status: "ok", applications: settings.mode === "empty" ? [] : structuredClone(records) };
    },
    saveReview: (id, review) => save(id, review),
    updateStatus: (id, status, { version } = {}) => {
      const r = records.find(x => x.id === id);
      return save(id, { ...(r ? { notes: r.notes, interview: r.interview, messages: r.messages } : {}), status, version });
    },
  };
}
