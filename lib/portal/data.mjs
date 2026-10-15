export const DEMO_VERSION = 2;
// All names, identities, assignments and dated activities below are fictional.
// KHAOS uses the supplied two-day concept, with no finalized date, rules or venue.
export function createDemoState() {
  return {
    version: DEMO_VERSION, session: false, onboarded: false, role: "Member", managedDomain: "robotics",
    profile: { id: "m1", name: "Aarav Sen", email: "aarav.demo@kiit.ac.in", roll: "DEMO-240001", branch: "Electrical Engineering", year: "2nd year", photo: "", membershipId: "KES-DEMO-001", status: "Demo active", joined: "2026-08-01", domains: ["robotics", "embedded", "design"], linkedin: "", bio: "Curious about the place where circuits, code and design meet." },
    members: [
      { id: "m2", name: "Nisha Rao", year: "3rd year", branch: "Electrical Engineering", role: "Lead", domains: ["robotics", "embedded"], bio: "Exploring motion and embedded control." },
      { id: "m3", name: "Kabir Das", year: "2nd year", branch: "Computer Science", role: "Co-Lead", domains: ["robotics", "web"], bio: "Building useful tools and connected systems." },
      { id: "m4", name: "Meera Shah", year: "3rd year", branch: "Computer Science", role: "Lead", domains: ["design", "media", "web", "writing", "ai", "outreach", "events"], bio: "Bringing visual storytelling into engineering." },
      { id: "m5", name: "Ishaan Roy", year: "1st year", branch: "Electronics & Telecommunication", role: "Member", domains: ["embedded", "media"], bio: "Learning electronics and event photography." },
      { id: "m6", name: "Tara Bose", year: "4th year", branch: "Electrical Engineering", role: "President", domains: ["events", "outreach"], bio: "Helping technical and creative teams work together." },
    ],
    projects: [
      { id: "demo-project-rover", ownerId: "m1", title: "Sensor test rover", description: "A fictional mobile robot build exploring sensor readings and control. This sample shows how a member’s current project is recorded.", domain: "robotics", stage: "Building", team: [{memberId:"m1",name:"Aarav Sen",linkedin:""},{memberId:"m3",name:"Kabir Das",linkedin:""}], targetDate:"", linkedin:"", opportunityId:null, created:"2026-10-12", updated:"2026-10-12" },
      { id: "demo-project-guide", ownerId: "m1", title: "Circuit learning guide", description: "A fictional past documentation project that explains a breadboard setup through concise writing and diagrams.", domain: "writing", stage: "Built", team: [{memberId:"m1",name:"Aarav Sen",linkedin:""}], targetDate:"", linkedin:"", opportunityId:null, created:"2026-10-10", updated:"2026-10-10" },
      { id: "demo-project-visuals", ownerId: "m4", title: "Community visual concepts", description: "A fictional creative project exploring a consistent visual language for society communication.", domain: "design", stage: "Building", team: [{memberId:"m4",name:"Meera Shah",linkedin:""}], targetDate:"", linkedin:"", opportunityId:null, created:"2026-10-11", updated:"2026-10-11" },
    ],
    projectOpportunities: [
      { id: "demo-brief-rover", title: "Sensor-guided rover", domain: "robotics", description: "Fictional demo brief: explore a rover prototype that responds to sensor input. Apply to create your own project record.", demo: true },
      { id: "demo-brief-design", title: "Workshop visual identity kit", domain: "design", description: "Fictional demo brief: develop a coherent set of visual concepts for a workshop. Apply to begin your own creative build.", demo: true },
    ],
    announcements: [
      { id: "a1", title: "Welcome to your KES workspace", description: "This is a frontend demonstration. Explore your projects, switch roles and try the membership card. All people and activities in this workspace are fictional.", author: "Demo Council", date: "2026-10-14", category: "General", audience: "society", read: false, pinned: true, attachments: [] },
      { id: "a2", title: "Robotics bench notes", description: "Keep setup notes with your sensor test so another teammate can reproduce it. Keep these observations with your project record.", author: "Nisha Rao", date: "2026-10-13", category: "Domain Updates", audience: "robotics", read: false, pinned: false, attachments: ["bench-note-template-demo.md"] },
      { id: "a3", title: "Creative review prompts", description: "Consider clarity, typography and accessibility when reviewing a visual concept. This is a sample design-team announcement.", author: "Meera Shah", date: "2026-10-12", category: "Important", audience: "design", read: true, pinned: false, attachments: [] },
      { id: "a4", title: "Council review checklist", description: "Demo leadership-only note: review workload across technical and creative domains.", author: "Demo Council", date: "2026-10-11", category: "Meetings", audience: "leadership", read: false, pinned: false, attachments: [] },
    ],
    events: [
      { id: "khaos-of-circuit-2", name: "KHAOS OF CIRCUIT 2.0", status: "Concept preview", date: null, time: null, venue: null, description: "A two-day engineering concept: an engineering challenge on Day 1 and a project expo on Day 2. This is an unscheduled portal example, not a live event announcement.", schedule: [{ title: "Day 1 · Engineering challenge", text: "An engineering challenge focused on practical problem solving. Detailed format and rules have not been confirmed." }, { title: "Day 2 · Project expo", text: "A project showcase for participants to explain and demonstrate their work. Detailed arrangements have not been confirmed." }], eligibility: null, organizer: "KIIT Electrical Society", updates: ["Dates, venue, eligibility and registration arrangements are unpublished."], responsibility: "No responsibility assigned", registered: false, image: null },
      { id: "demo-robotics-bench", name: "Robotics bench session", status: "Upcoming demo", date: "2026-10-20", time: "16:00", venue: "Demo workspace", description: "Fictional practice session for reviewing a sensor test and sharing bench notes.", domain: "robotics", schedule: [{ title: "Sensor review", text: "Discuss the fictional demo test setup and results." }], eligibility: "Demo members", organizer: "Fictional robotics team", updates: ["Sample activity for calendar and registration testing."], responsibility: "Bring your demo bench notes", registered: false, image: null },
      { id: "demo-design-review", name: "Visual storytelling review", status: "Past demo", date: "2026-10-08", time: "17:00", venue: "Demo creative studio", description: "Fictional review of visual concepts and event documentation.", domain: "design", schedule: [{ title: "Peer review", text: "Discuss clarity and visual hierarchy in the sample concepts." }], eligibility: "Demo members", organizer: "Fictional creative team", updates: ["Completed sample activity."], responsibility: "No responsibility assigned", registered: true, image: null },
    ],
    activities: [{ id: "meeting1", title: "Demo robotics team check-in", date: "2026-10-16", type: "Meeting", domain: "robotics", description: "Fictional domain meeting to share what members are building." }],
    notifications: [
      { id: "n1", title: "Your demo projects are ready to explore", type: "Project update", href: "/portal#my-projects", read: false, date: "2026-10-14" },
      { id: "n2", title: "Welcome announcement published", type: "Announcement", href: "/portal/announcements", read: false, date: "2026-10-14" },
      { id: "n3", title: "Your past demo build is in My Projects", type: "Project update", href: "/portal#my-projects", read: true, date: "2026-10-10" },
      { id: "n4", title: "Robotics check-in added", type: "Domain activity", href: "/portal/calendar", read: false, date: "2026-10-13" },
    ],
    settings: { theme: "Light", reduceMotion: false, compact: false, projectNotifications: true, announcementNotifications: true, eventNotifications: true, emailUpdates: false },
  };
}
