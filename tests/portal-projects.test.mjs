import test from "node:test";
import assert from "node:assert/strict";
import { createDemoState } from "../lib/portal/data.mjs";
import { demoAction, getCalendarItems, restoreDemo, searchDemo } from "../lib/portal/service.mjs";
import { NAVIGATION, myProjects, visibleProjects, visibleNotifications, visibleAnnouncements } from "../lib/portal/config.mjs";
import { linkedInUrl, projectTeam } from "../lib/portal/projects.mjs";

const project = {
  title: "My fictional build", description: "A demo project for testing member ownership and collaboration.", domain: "embedded", stage: "Building", targetDate: "2026-10-24",
  ownerLinkedin: "https://www.linkedin.com/in/demo-member/", linkedin: "https://www.linkedin.com/posts/demo-build/",
  collaborators: [{ memberId: "m3", name: "ignored stale name", linkedin: "https://www.linkedin.com/in/demo-collaborator/" }, { name: "Fictional External Teammate", linkedin: "" }],
};
test("navigation contains exactly the requested nine sections", () => {
  assert.deepEqual(NAVIGATION.map(n => n[0]), ["", "domains", "announcements", "events", "calendar", "membership", "notifications", "profile", "settings"]);
});
test("members can add a project and are automatically assigned as owner", () => {
  const before = createDemoState();
  const saved = demoAction(before, { type: "projectSave", payload: { ...project, ownerId: "m4" } });
  const record = saved.projects[0];
  assert.equal(record.ownerId, before.profile.id); assert.equal(record.team[0].memberId, before.profile.id);
  assert.equal(record.team[1].name, "Kabir Das"); assert.equal(record.team[2].name, "Fictional External Teammate");
  assert.equal(before.projects.length + 1, saved.projects.length); assert.equal(before.projects.some(p => p.title === project.title), false);
  assert.ok(myProjects(saved).some(p => p.id === record.id));
  assert.ok(getCalendarItems(saved).some(i => i.id === record.id && i.type === "Project" && i.date === project.targetDate));
  assert.ok(searchDemo(saved, "My fictional").some(r => r.type === "Projects"));
  assert.equal(saved.notifications[0].type, "Project update");
});
test("applying creates one personal planned project and prevents repeat applications", () => {
  const state = createDemoState();
  const saved = demoAction(state, { type: "projectApply", payload: { opportunityId: "demo-brief-rover", collaborators: [] } });
  const record = saved.projects[0];
  assert.equal(record.title, state.projectOpportunities[0].title); assert.equal(record.stage, "Planned"); assert.equal(record.ownerId, state.profile.id);
  assert.equal(record.targetDate, "");
  assert.throws(() => demoAction(saved, { type: "projectApply", payload: { opportunityId: "demo-brief-rover" } }), /already/);
  assert.throws(() => demoAction(state, { type: "projectApply", payload: { opportunityId: "unknown" } }));
});
test("previously built projects can be recorded and only the owner can edit", () => {
  const state = createDemoState();
  const saved = demoAction(state, { type: "projectSave", payload: { ...project, stage: "Built", targetDate: "2025-08-12" } });
  const record = saved.projects[0]; assert.equal(record.stage, "Built");
  const edited = demoAction(saved, { type: "projectSave", payload: { ...project, id: record.id, stage: "Built", title: "Updated demo build" } });
  assert.equal(edited.projects.length, saved.projects.length); assert.equal(edited.projects[0].title, "Updated demo build");
  assert.throws(() => demoAction(state, { type: "projectSave", payload: { ...project, id: "demo-project-visuals" } }), /owner/);
});
test("collaborators see shared builds, councils see the register, profile names remain consistent", () => {
  let state = createDemoState();
  state.projects[2].team.push({ memberId: "m1", name: "old", linkedin: "" });
  assert.ok(myProjects(state).some(p => p.id === "demo-project-visuals"));
  state = demoAction(state, { type: "profile", payload: { ...state.profile, name: "Renamed Demo Member", linkedin: "https://www.linkedin.com/in/renamed-demo/" } });
  const member = projectTeam(state, state.projects[0])[0];
  assert.equal(member.name, "Renamed Demo Member"); assert.equal(member.linkedin, state.profile.linkedin);
  assert.equal(visibleProjects({ ...state, role: "President" }).length, state.projects.length);
  const unrelated = createDemoState(); assert.equal(visibleProjects(unrelated).some(p => p.id === "demo-project-visuals"), false);
});
test("validation rejects empty names, duplicate teammates, invalid dates and unsafe LinkedIn URLs", () => {
  const state = createDemoState();
  for (const payload of [{ ...project, title: "" }, { ...project, description: "" }, { ...project, targetDate: "2026-02-30" }, { ...project, collaborators: [{ name: "Aarav Sen" }] }, { ...project, collaborators: [{ name: "" }] }, { ...project, linkedin: "https://linkedin.com.evil.example/in/demo" }]) {
    assert.throws(() => demoAction(state, { type: "projectSave", payload }));
  }
  assert.equal(linkedInUrl(""), ""); assert.ok(linkedInUrl("https://in.linkedin.com/in/demo/"));
  for (const value of ["javascript:alert(1)", "http://linkedin.com/in/demo", "https://linkedin.com@evil.example/in/demo", "https://example.com/in/demo"]) assert.throws(() => linkedInUrl(value));
});
test("old demo sessions retain profile/preferences while removing task records and notifications", () => {
  const old = createDemoState(); old.version = 1; old.session = true; old.profile.name = "Existing Demo Member"; delete old.profile.linkedin; delete old.projects; delete old.projectOpportunities;
  old.tasks = [{ title: "Legacy task" }]; old.settings.taskNotifications = false; delete old.settings.projectNotifications;
  old.notifications.push({ id: "legacy", title: "Old task", type: "Task assignment", href: "/portal/tasks", read: false });
  const saved = restoreDemo(JSON.stringify(old));
  assert.equal(saved.version, 2); assert.equal(saved.profile.name, old.profile.name); assert.equal(saved.session, true); assert.equal(saved.profile.linkedin, "");
  assert.equal(saved.tasks, undefined); assert.equal(saved.settings.projectNotifications, false); assert.equal(saved.notifications.some(n => n.id === "legacy"), false);
  assert.equal(restoreDemo("{broken").session, false);
});
test("projects respect notification preferences and preserve announcement/event behavior", () => {
  const base = demoAction(createDemoState(), { type: "settings", payload: { projectNotifications: false } });
  assert.equal(demoAction(base, { type: "projectSave", payload: project }).notifications.length, base.notifications.length);
  const president = { ...base, role: "President" };
  const saved = demoAction(president, { type: "announcementSave", payload: { title: "Private sample", description: "Demo council update", category: "General", audience: "leadership" } });
  assert.equal(visibleAnnouncements({ ...saved, role: "Member" }).some(a => a.title === "Private sample"), false);
  assert.equal(visibleNotifications({ ...saved, role: "Member" }).some(n => n.announcementId === saved.announcements[0].id), false);
  assert.equal(getCalendarItems(base).some(i => i.id === "khaos-of-circuit-2"), false);
  assert.equal(demoAction(base, { type: "register", payload: { id: "khaos-of-circuit-2" } }).events[0].registered, true);
});
