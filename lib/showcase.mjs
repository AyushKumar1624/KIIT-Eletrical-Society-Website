import { MEDIA, PROJECTS } from "./content.js";

// Ancillary activity documentation. The authoritative named-project catalogue
// is lib/projects/catalogue.mjs; these records are not counted as projects.
export const WORK_RECORDS = [
  { ...PROJECTS[0], detailImage: "psuTitle", group: "workshops", type: "Workshop build", domain: "Embedded Systems", stage: null, action: "View workshop build", purpose: "Learn how a power supply works by assembling and testing a breadboard circuit.", context: "Hands-on circuit work from the KES power-supply workshop. This is a workshop record, not a named member project." },
  { ...PROJECTS[2], detailImage: "kk3CircuitBuild", group: "workshops", type: "Engineering challenge", domain: "Embedded Systems", stage: null, action: "View challenge", purpose: "Apply circuit design and problem-solving skills using a fixed component kit.", context: "The timed build round of Kreative Kontrol 3.0. Individual team projects are not identified in this record.", text: "Participants used a fixed kit of eight components to build a working circuit within the allotted time." },
  { ...PROJECTS[3], detailImage: "kshitijArena", group: "highlights", type: "Event participation", domain: "Robotics", stage: null, action: "View event highlight", purpose: "Put mobile robot builds through practical arena and obstacle-course challenges.", context: "Documented KES participation at KSHITIJ 2026, IIT Kharagpur. This records event participation; individual robot titles and results are unpublished." },
  { no: "C-01", group: "creative", type: "Graphic design", title: "K-RAFT event poster", domain: "Graphic Design", image: "kraftPoster", stage: null, action: "View creative work", origin: "K-RAFT", purpose: "Communicate the circuit-design workshop through a single visual announcement.", context: "The official event poster preserved in the society’s media collection.", text: "A visual record of K-RAFT’s workshop announcement, combining event information and graphic layout.", stack: ["Event communication", "Layout", "Typography"] },
  { no: "C-02", group: "creative", type: "Event photography", title: "Kreative Kontrol photo coverage", domain: "Photography / Videography / Editing", image: "kk3RcJet", detailImage: "kk3Photographer", stage: null, action: "View creative work", origin: "Kreative Kontrol 3.0", purpose: "Document hands-on learning and preserve the story of the drone workshop.", context: "Event photography from Kreative Kontrol 3.0. Photography credit is shown with the image.", text: "The event’s photo collection captures practical demonstrations, participants and the workshop atmosphere.", stack: ["Photography", "Event documentation", "Visual storytelling"] },
];
export const WORK_GROUPS = [
  { id: "workshops", title: "Workshops & engineering challenges", note: "Practical learning and competition builds, separate from individual member projects." },
  { id: "highlights", title: "Event highlights", note: "Participation and demonstrations from society events." },
  { id: "creative", title: "Creative work", note: "Design and photography that communicate and document the society’s work." },
];
export const workId = p => `work-${p.no.toLowerCase()}`;
export function recordImage(p) { return p.image ? MEDIA[p.image] || null : null; }
// The photograph inside a record's details: always a different one from the card, or none.
export function recordDetailImage(p) { return p.detailImage && p.detailImage !== p.image ? MEDIA[p.detailImage] || null : null; }
