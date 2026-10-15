import test from "node:test";
import assert from "node:assert/strict";
import { PROJECT_CATALOGUE, PROJECT_CATEGORIES, categoryCounts, filterProjects, imageIndex, imageZoom, projectImages } from "../lib/projects/catalogue.mjs";

const expected = [
  ["Self-Balancing Robot", "All-Terrain Sand Robot", "Advanced Line Follower Robot", "Bionic Prosthetic Arm", "Autonomous Fire Detection and Suppression Rover"],
  ["Autonomous Surveillance Drone", "RC Fixed-Wing Aircraft", "Agriculture Monitoring Drone", "Arduino-Based Custom Drone Flight Controller", "UAV-Based Medical Organ Transportation System", "Autonomous UAV-Based Crop Anomaly Detection System"],
  ["Alcohol Detection System", "Smart Helmet System", "Wireless Power Transfer System", "Hydroponic Plant Monitoring System"],
  ["Anti-Sleep Monitoring System", "Interactive AI Desk Companion Chatbot"],
];
test("the supplied catalogue has exactly 17 unique titles and stable IDs, in the required categories", () => {
  assert.equal(PROJECT_CATALOGUE.length, 17);
  assert.equal(new Set(PROJECT_CATALOGUE.map(p => p.id)).size, 17);
  assert.equal(new Set(PROJECT_CATALOGUE.map(p => p.title)).size, 17);
  PROJECT_CATEGORIES.forEach((c, i) => assert.deepEqual(filterProjects(c.id).map(p => p.title), expected[i]));
  assert.deepEqual(categoryCounts(), { all: 17, robotics: 5, aerospace: 6, embedded: 4, intelligent: 2 });
});
test("every project has concise card copy and meaningful, bounded explanatory content", () => {
  for (const project of PROJECT_CATALOGUE) {
    const cardWords = project.description.split(/\s+/).length;
    const words = ["introduction", "overview", "workingPrinciple", "technicalExploration", "potentialApplications", "takeaway"].map(key => { assert.ok(project[key]?.length > 25, `${project.id}: ${key}`); return project[key]; }).join(" ").split(/\s+/).length;
    assert.ok(cardWords >= 20 && cardWords <= 30, project.id);
    assert.ok(words >= 150 && words <= 250, `${project.id}: ${words} words`);
  }
});
test("search combines with categories, is trimmed and case-insensitive, and handles empty results", () => {
  assert.equal(filterProjects("all", "  SELF-BALANCING ")[0].id, "self-balancing-robot");
  assert.equal(filterProjects("aerospace", "robot").length, 0);
  assert.equal(filterProjects("embedded", "hydroponic").length, 1);
  assert.equal(filterProjects("all", "no matching example").length, 0);
});
test("unknown optional information is explicit, legacy records are matched rather than duplicated", () => {
  assert.equal(PROJECT_CATALOGUE.filter(p => p.legacyRecord).length, 12);
  for (const project of PROJECT_CATALOGUE) {
    assert.equal(project.coverImage, null); assert.deepEqual(project.gallery, []);
    assert.equal(project.team, null); assert.equal(project.year, null); assert.equal(project.status, null);
    if (project.legacyRecord) assert.equal(project.legacyRecord.title, project.legacyTitle);
  }
  assert.equal(PROJECT_CATALOGUE.filter(p => p.verifiedTechnologies.length).length, 1);
});
test("gallery navigation wraps and zoom stays inside fit-to-three-times limits", () => {
  assert.equal(imageIndex(0, -1, 3), 2); assert.equal(imageIndex(2, 1, 3), 0);
  assert.equal(imageIndex(0, 1, 1), 0); assert.equal(imageIndex(0, 1, 0), 0);
  assert.equal(imageZoom(.5), 1); assert.equal(imageZoom(1.5), 1.5); assert.equal(imageZoom(4), 3);
});
test("a cover can be enlarged without duplicate photographs or losing gallery captions", () => {
  const cover = { src: "/fixture-a", alt: "Test cover" };
  const gallery = [{ src: "/fixture-a", alt: "Test cover", caption: "Preserved caption" }, { src: "/fixture-b", alt: "Second fixture" }];
  assert.equal(projectImages({ coverImage: cover, gallery }).length, 2);
  assert.equal(projectImages({ coverImage: cover, gallery })[0].caption, "Preserved caption");
  assert.deepEqual(projectImages({ coverImage: cover, gallery: [] }), [cover]);
  assert.deepEqual(projectImages({ coverImage: null, gallery: [] }), []);
});
