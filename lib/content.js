// Public site content for KIIT Electrical Society.
// Facts here come from society documents, posters and event photographs.
// Leave unconfirmed details as null rather than inventing them.
//
// TEMPORARY CONTENT: anything marked `temporary: true` is a stand-in that must
// be replaced or confirmed before launch. Search this file for "temporary: true".

export const SOCIETY = {
  name: "KIIT Electrical Society",
  short: "KES",
  motto: "Build small, think big.", // Exact approved website wording.
  institution: "Kalinga Institute of Industrial Technology",
  institutionShort: "KIIT Deemed to be University, Bhubaneswar",
  parent: "KIIT Student Activity Centre (KSAC)",
  intro: "A student community at KIIT, learning and creating together through engineering, design and storytelling.",
};

// Header navigation. Every id must match a section id on the homepage.
export const NAV = [
  { id: "about", label: "About" },
  { id: "domains", label: "Domains" },
  { id: "projects", label: "Projects" },
  { id: "events", label: "Events" },
  { id: "team", label: "Team" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
];

// ── Media registry ────────────────────────────────────────────────
// `source` records where each original came from.
// Publication: all event photographs confirmed cleared for public use by KES (14 Oct 2026).
//   Local files  → scripts/prepare-media.mjs
//   Google Drive → downloaded at 2400px, then scripts/prepare-drive-media.mjs
const DRIVE = {
  kk3: "Drive › Kreative Kontrol 3.0 › iG/@alpha.vs_ › Photos",
  darkroute: "Drive › KES_DarkRoute",
  expo: "Drive › Project Expo",
  psu: "Drive › KES Workshop",
  kshitij: "Drive › KSHITIJ_2026 › Vishal › Kshitij'26 Gdrive",
};
const KK3_CREDIT = "Photo: @alpha.vs_";
const m = (file, w, h, alt, source, extra = {}) => ({ src: `/media/${file}.webp`, w, h, alt, source, temporary: false, ...extra });

export const MEDIA = {
  logo: { src: "/kes-logo.jpeg", w: 322, h: 322, alt: "KIIT Electrical Society logo", source: "Desktop/KES Logo.jpeg (original, unaltered)", temporary: false },

  // Kreative Kontrol 3.0 — 22 March 2026
  kk3Auditorium: m("kk3-auditorium", 1600, 1067, "A packed E-Block auditorium beneath the Kreative Kontrol 3.0 title screen", `${DRIVE.kk3}/DSC01832.JPG`, { credit: KK3_CREDIT }),
  kk3RcJet: m("kk3-rc-jet-handson", 1067, 1600, "Trainers and students work on a red radio-controlled jet during the drone workshop", `${DRIVE.kk3}/DSC01874.JPG`, { credit: KK3_CREDIT }),
  kk3Flight: m("kk3-flight-over-crowd", 1600, 1067, "A model aircraft banks overhead as participants watch from the open-air theatre", `${DRIVE.kk3}/DSC01885.JPG`, { credit: KK3_CREDIT }),
  kk3DeltaJet: m("kk3-delta-jet", 1600, 1067, "A delta-wing model jet resting on the grass before its flight", `${DRIVE.kk3}/DSC01902.JPG`, { credit: KK3_CREDIT }),
  kk3Quadcopter: m("kk3-quadcopter", 1600, 1067, "A quadcopter hovers above the campus arches during the live demonstration", `${DRIVE.kk3}/DSC01922.JPG`, { credit: KK3_CREDIT }),
  kk3Tinkercad: m("kk3-tinkercad", 1600, 1067, "A participant debugs a circuit in Tinkercad during the simulation round", `${DRIVE.kk3}/DSC02051.JPG`, { credit: KK3_CREDIT }),
  kk3CircuitBuild: m("kk3-circuit-build", 1067, 1600, "Teams assemble circuits along a row of benches in the final round", `${DRIVE.kk3}/DSC02126.JPG`, { credit: KK3_CREDIT }),
  kk3Bench: m("kk3-bench-closeup", 1600, 1067, "Close-up of a team wiring components during the timed circuit design final", `${DRIVE.kk3}/DSC02142.JPG`, { credit: KK3_CREDIT }),
  kk3Group: m("kk3-group", 1600, 1067, "Participants and organisers gather for the closing photograph of Kreative Kontrol 3.0", `${DRIVE.kk3}/DSC02200.JPG`, { credit: KK3_CREDIT }),
  kk3Standee: m("kk3-standee", 1600, 1067, "A participant holds a model jet beside the Kreative Kontrol 3.0 standee", `${DRIVE.kk3}/DSC02007.JPG`, { credit: KK3_CREDIT }),
  kk3AircraftLineup: m("kk3-aircraft-lineup", 1600, 1067, "Model aircraft and a quadcopter lined up for the drone workshop", `${DRIVE.kk3}/DSC01788.JPG`, { credit: KK3_CREDIT }),
  kk3OatGroup: m("kk3-oat-group", 1600, 1067, "Participants gather at the open-air theatre with the model aircraft", `${DRIVE.kk3}/DSC01910.JPG`, { credit: KK3_CREDIT }),
  kk3HeavyDrone: m("kk3-heavy-drone", 1600, 1067, "A heavy-lift drone rests on the field before take-off", `${DRIVE.kk3}/DSC01942.JPG`, { credit: KK3_CREDIT }),
  kk3Photographer: m("kk3-photographer", 1067, 1600, "A student photographer frames a shot during Kreative Kontrol 3.0", `${DRIVE.kk3}/DSC02155.JPG`, { credit: KK3_CREDIT }),
  kk3Prize: m("kk3-prize", 1600, 1067, "A trophy is presented on stage beneath the Kreative Kontrol 3.0 screen", `${DRIVE.kk3}/DSC02199.JPG`, { credit: KK3_CREDIT }),
  droneWorkshop: m("kk3-drone-workshop", 1600, 900, "A trainer from Silver Wings Media Creation explains a fixed-wing model during the drone workshop", "Downloads/IMG_20260322_120157.jpg"),
  rcAircraft: m("kk3-rc-aircraft", 1600, 900, "Students gather around radio-controlled aircraft laid out at OAT-1", "Downloads/IMG_20260322_121405.jpg"),
  audience: m("kk3-audience", 1600, 900, "Participants seated in the E-Block auditorium", "Downloads/IMG_20260322_112231.jpg"),
  inauguration: m("kk3-inauguration", 900, 1600, "A guest lights the ceremonial brass lamp at the inauguration", "Downloads/IMG_20260322_111652.jpg"),

  // DarkRoute
  drLabPanel: m("darkroute-lab-panel", 1600, 1067, "A participant traces connections on a machines-lab training panel", `${DRIVE.darkroute}/IMG_0051.JPG`),
  drDcDistribution: m("darkroute-dc-distribution", 1067, 1600, "A participant beside the DC distribution unit in the electrical lab", `${DRIVE.darkroute}/IMG_0181.JPG`),
  drMotorPanel: m("darkroute-motor-panel", 1600, 1067, "Participants at the three-phase synchronous motor test panel", `${DRIVE.darkroute}/IMG_0217.JPG`),
  drDcPanel: m("darkroute-dc-panel", 1067, 1600, "A participant studies a DC machine panel schematic", `${DRIVE.darkroute}/IMG_0280.JPG`),

  // Project Expo 2025
  expoPitch: m("expo-pitch", 1600, 1067, "A presenter pitches a project to the audience at Project Expo", `${DRIVE.expo}/DSC01489.JPG`),
  expoJury: m("expo-jury", 1067, 1600, "The jury panel listens to a team presentation at Project Expo", `${DRIVE.expo}/DSC01761.JPG`),
  expoStall: m("expo-stall-review", 1067, 1600, "Students demonstrate their project on a laptop at their stall", `${DRIVE.expo}/DSC02171.JPG`),
  expoNightDemo: m("expo-night-demo", 1067, 1600, "A hardware prototype on a stall table during the evening session", `${DRIVE.expo}/DSC02514.JPG`),
  expoNightJudging: m("expo-night-judging", 1600, 1067, "Judges gather around a team's prototype during evening evaluation", `${DRIVE.expo}/DSC02507.JPG`),
  expoGroup: m("expo-group", 1600, 1067, "Organisers and participants pose in front of the Project Expo banner", `${DRIVE.expo}/DSC02640.JPG`),
  expoStandee: m("expo-standee", 1600, 1067, "The Project Expo 2025 standee listing the event rules", `${DRIVE.expo}/DSC02622.JPG`),
  expoTeamPrototype: m("expo-team-prototype", 1600, 1067, "A team stands behind their prototype at Project Expo", `${DRIVE.expo}/DSC01456.JPG`),
  expoStalls: m("expo-stalls", 1600, 1067, "Teams and visitors gathered among the Project Expo stalls", `${DRIVE.expo}/DSC01975.JPG`),
  expoEveningDrone: m("expo-evening-drone", 1600, 1067, "A team with their drone build at the evening session", `${DRIVE.expo}/DSC02546.JPG`),

  // Power supply workshop
  psuTitle: m("psu-workshop-title", 1600, 1067, "Title slide: Workshop on Building Power Supply System from Scratch", `${DRIVE.psu}/DSC02843.JPG`),
  psuBreadboard: m("psu-workshop-breadboard", 1067, 1600, "Two participants build a circuit on breadboards during the workshop", `${DRIVE.psu}/DSC02964.JPG`),
  psuCircuit: m("psu-workshop-circuit", 1067, 1600, "Close-up of breadboard power-supply circuits being assembled", `${DRIVE.psu}/DSC02970.JPG`),
  psuRoom: m("psu-workshop-room", 1600, 1067, "Participants at their benches with circuits and meters", `${DRIVE.psu}/DSC03004.JPG`),
  psuAudience: m("psu-workshop-audience", 1600, 1067, "A full room of participants at the power supply workshop", `${DRIVE.psu}/DSC02989.JPG`),

  // KSHITIJ 2026, IIT Kharagpur
  kshitijTeam: m("kshitij-team", 1600, 1067, "The KES robotics team in matching black shirts with their robot at KSHITIJ 2026", `${DRIVE.kshitij}/Day1_1701/IMG_0929.JPG`),
  kshitijIitKgp: m("kshitij-iit-kgp", 1200, 1600, "KES members in front of the illuminated Indian Institute of Technology Kharagpur main building", `${DRIVE.kshitij}/Day2_1801/IMG_5413.JPG`),
  kshitijObstacle: m("kshitij-obstacle-course", 1067, 1600, "A tracked robot climbs a ramp on the obstacle course", `${DRIVE.kshitij}/Day1_1701/IMG_1197.JPG`),
  kshitijArena: m("kshitij-arena", 1067, 1600, "A wheeled combat robot in the competition arena", `${DRIVE.kshitij}/Day1_1701/IMG_2267.JPG`),
  kshitijDrivers: m("kshitij-drivers", 1600, 1067, "KES members drive their robot with handheld controllers", `${DRIVE.kshitij}/Day1_1701/IMG_2166.JPG`),
  kshitijPit: m("kshitij-pit-repair", 1600, 1067, "Team members repair their robot between rounds", `${DRIVE.kshitij}/Day1_1701/IMG_1272.JPG`),

  // 2026–27 office bearers. Transparent cutouts (background removed) from the
  // official announcement posters, framed head to waist on a 480×600 canvas.
  teamMimansha: m("team-mimansha", 480, 600, "Mimansha Tiwari, President", "Instagram › instagram.com/p/DcxsgdYFDNU (slide 2)"),
  teamSujal: m("team-sujal", 480, 600, "Sujal Krishna, President", "Instagram › instagram.com/p/DcxsgdYFDNU (slide 3)"),
  teamAyush: m("team-ayush", 480, 600, "Ayush Kumar, Vice President", "Instagram › instagram.com/p/DcxsQE5lFg5 (slide 2)"),
  teamJaya: m("team-jaya", 480, 600, "Jaya Kumari, Vice President", "Instagram › instagram.com/p/DcxsQE5lFg5 (slide 3)"),
  teamDattaraya: m("team-dattaraya", 480, 600, "Dattaraya Sahoo, Vice President", "Instagram › instagram.com/p/DcxsQE5lFg5 (slide 4)"),

  // Faculty — official School of EE profile photos, background removed.
  mentorMaharana: m("mentor-maharana", 480, 600, "Dr. Manoj Kumar Maharana", "electrical.kiit.ac.in/profiles/manoj-kumar-maharana"),
  mentorKundu: m("mentor-kundu", 480, 600, "Dr. Shubhasri Kundu", "electrical.kiit.ac.in/profiles/shubhasri-kundu"),

  // K-RAFT — 27 September 2026
  kraftSession: m("kraft-session", 1600, 900, "The resource person walks a full room through KiCad on the display screen", "WhatsApp › K-RAFT photo 3"),
  kraftRoom: m("kraft-room", 1600, 900, "Participants follow along on laptops during the K-RAFT workshop", "WhatsApp › K-RAFT photo 5"),
  kraftStage: m("kraft-stage", 1600, 900, "The resource person explains PCB layout from the stage", "WhatsApp › K-RAFT photo 1"),
  kraftKicad: m("kraft-kicad", 1600, 900, "KiCad PCB editor board setup shown on screen during the session", "WhatsApp › K-RAFT photo 6"),
  kraftGroup: m("kraft-group", 1600, 900, "Participants and organisers with the K-RAFT trophies", "WhatsApp › K-RAFT photo 8"),
  kraftChampions: m("kraft-champions", 900, 1600, "The K-RAFT champion receives the trophy alongside organisers", "WhatsApp › K-RAFT photo 10"),
  kraftRunnersUp: m("kraft-runners-up", 900, 1600, "The K-RAFT runner-up receives the trophy", "WhatsApp › K-RAFT photo 9"),

  kraftPoster: m("k-raft-poster", 1131, 1600, "K-RAFT circuit design workshop poster", "Desktop/konstruct/poster.PNG"),
};


export const ABOUT = {
  lead: "Learn together. Create with purpose.",
  intro: "KIIT Electrical Society is a student society in the School of Electrical Engineering at KIIT, Bhubaneswar, under the KIIT Student Activity Centre. We learn by building — circuits, code, visuals and the stories behind them.",
  reasonsTitle: "What we build together",
  // Each reason is backed by documented activity elsewhere on the site.
  reasons: [
    { t: "Build real things", d: "Workshops and timed build rounds turn classroom theory into circuits that work." },
    { t: "Learn from practitioners", d: "Faculty, alumni and industry trainers teach the tools they use — from KiCad and Tinkercad to drones." },
    { t: "Find your place", d: "Nine technical and creative domains, from robotics to content writing, so every skill has a team." },
  ],
  // Not the hero photograph: the K-RAFT workshop room, plus a KSHITIJ print.
  image: "psuAudience",
  imageCaption: "Building power supplies from scratch at a KES workshop",
  print: "kshitijPit",
  printCaption: "Between rounds",
};

export const DOMAINS = [
  { plate: "01", group: "Technical", key: "robotics", title: "Robotics", text: "Mechanisms, motors and control systems that turn ideas into movement." },
  { plate: "02", group: "Technical", key: "embedded", title: "Embedded Systems", text: "Microcontrollers, sensors and firmware that connect code to the physical world." },
  { plate: "03", group: "Technical", key: "ai", title: "AI & ML", text: "Explore data, learning algorithms and intelligent applications." },
  { plate: "04", group: "Technical", key: "web", title: "Web Development", text: "Build clear, useful web experiences through design and code." },
  { plate: "05", group: "Creative & community", key: "design", title: "Graphic Design", text: "Give ideas a visual identity through layout, typography and illustration." },
  { plate: "06", group: "Creative & community", key: "media", title: "Photography / Videography / Editing", text: "Capture the work, document the moments and shape stories through editing." },
  { plate: "07", group: "Creative & community", key: "outreach", title: "Social Media & Outreach", text: "Share society stories and connect our work with the wider community." },
  { plate: "08", group: "Creative & community", key: "events", title: "Marketing & Event Management", text: "Plan experiences, coordinate teams and communicate with participants." },
  { plate: "09", group: "Creative & community", key: "writing", title: "Content Writing", text: "Make technical ideas and society stories clear, engaging and accessible." },
];

// Project showcase. Each stream is real and photographed; individual project
// titles and team names have not been supplied yet (temporary).
export const PROJECTS = [
  {
    no: "P-01",
    title: "Power supplies from scratch",
    origin: "KES Workshop",
    text: "Members built power-supply circuits stage by stage on the breadboard, testing each one with a meter before moving on.",
    stack: ["Breadboard", "Power electronics", "Multimeter"],
    status: "Circuit write-up being prepared",
    image: "psuCircuit",
    temporary: true,
  },
  {
    no: "P-02",
    title: "Hardware & IoT prototypes",
    origin: "Project Expo 2025",
    text: "Teams of up to four from every branch of KIIT built hardware and IoT prototypes and defended them before a jury, competing for gold, silver and bronze.",
    stack: ["Hardware", "IoT", "Teams of 4"],
    status: "Winning entries to be listed",
    image: "expoNightDemo",
    temporary: true,
  },
  {
    no: "P-03",
    title: "Timed circuit builds",
    origin: "Kreative Kontrol 3.0 · Final round",
    text: "A fixed kit of eight components, a clock, and a working circuit that had to use every part.",
    stack: ["ESP32", "PIR & sound sensors", "OLED", "SG90 servo"],
    status: "Winning builds to be documented",
    image: "kk3Bench",
    temporary: true,
  },
  {
    no: "P-04",
    title: "Robotics at KSHITIJ 2026",
    origin: "IIT Kharagpur · January 2026",
    text: "KES teams took their robots to IIT Kharagpur’s techno-management fest — tracked and wheeled builds driven through the obstacle course and the arena.",
    stack: ["Mobile robots", "RC control", "Tracked drive"],
    status: "Competition result to be confirmed",
    image: "kshitijObstacle",
    temporary: true,
  },
  {
    no: "P-05",
    title: "Fault-finding in simulation",
    origin: "Kreative Kontrol 3.0 · Round 2",
    text: "Deliberately faulty circuits handed out in Tinkercad — participants traced the error, corrected it and ran it.",
    stack: ["Tinkercad Circuits", "Arduino"],
    status: "Circuit files being archived",
    image: "kk3Tinkercad",
    temporary: true,
  },
];

// Member projects listed on the previous KES website.
export const ARCHIVE_PROJECTS = [
  { area: "Robotics", title: "Self-Balancing Robot", text: "Two-wheeled inverted pendulum with PID control and gyroscopic stabilisation.", stack: ["Arduino", "MPU6050", "Motor drivers"] },
  { area: "Electronics", title: "Wireless Power Transfer", text: "Resonant inductive coupling for efficient short-range power transmission.", stack: ["Induction coils", "Oscillator", "Resonance"] },
  { area: "IoT", title: "Smart Helmet", text: "Safety helmet with accident detection, GPS tracking and an emergency SOS.", stack: ["ESP8266", "GPS", "Accelerometer"] },
  { area: "IoT", title: "Alcohol Detection Ignition Lock", text: "Vehicle ignition interlock that blocks starting when alcohol is detected.", stack: ["Arduino", "MQ-3 sensor", "GSM"] },
  { area: "IoT", title: "Hydroponic Plant Monitor", text: "Automated hydroponics with nutrient control, pH monitoring and a mobile app.", stack: ["ESP32", "pH sensor", "TDS meter"] },
  { area: "Robotics", title: "All-Terrain Sand Robot", text: "Rugged autonomous rover for sand, with solar power.", stack: ["Arduino", "DC motors", "Solar panels"] },
  { area: "Robotics", title: "Bionic Prosthetic Arm", text: "EMG-controlled arm with multiple degrees of freedom and force feedback.", stack: ["EMG sensors", "Servo motors", "Arduino"] },
  { area: "Robotics", title: "Line Follower", text: "High-speed line follower with IR sensing, PID control and maze solving.", stack: ["Arduino", "IR sensors", "Motor driver"] },
  { area: "Drones", title: "RC Fixed-Wing Aircraft", text: "Custom radio-controlled aircraft with FPV camera and long-range telemetry.", stack: ["Flight controller", "ESC", "Brushless motors"] },
  { area: "Drones", title: "Surveillance Drone", text: "Quadcopter with autonomous navigation, object detection and live video.", stack: ["Raspberry Pi", "Flight controller", "OpenCV"] },
  { area: "Drones", title: "Agriculture Monitoring Drone", text: "Multispectral imaging for crop health analysis and precision spraying.", stack: ["Flight controller", "Multispectral camera", "GPS"] },
  { area: "AI / ML", title: "Anti-Sleep Monitor", text: "Driver drowsiness detection using eye tracking and facial recognition.", stack: ["Python", "OpenCV", "TensorFlow"] },
];

// No upcoming events are currently published.

// Past events, newest first. Each row opens to show its full details.
// `summary` is the one-line teaser; `details` is shown when expanded.
// Sources: event notesheets, posters and standees visible in event photos,
// and the previous KES website (kes-v2.vercel.app) for the 2025 events.
export const EVENTS = [
  {
    id: "k-raft",
    date: "27 Sep 2026", dateTime: "2026-09-27",
    name: "K-RAFT",
    kind: "Circuit design workshop",
    summary: "A hands-on KiCad workshop on schematic capture and PCB layout, followed by technical activities.",
    place: "6th Floor, K3 Ladies Club, Campus 20",
    image: "kraftSession",
    details: {
      overview: [
        "K-RAFT took a full room from a blank KiCad project to a routed printed circuit board. Working live on the display, the resource person built up a BJT astable multivibrator — schematic, footprints, board setup and layer stack — while participants followed along on their own laptops.",
        "Participants then put what they had learned to the test in technical activities, and the day closed with trophies for the champion and runner-up.",
      ],
      facts: [
        { k: "Date", v: "27 September 2026" },
        { k: "Time", v: "9 AM onwards" },
        { k: "Venue", v: "6th Floor, K3 Ladies Club, Campus 20" },
        { k: "Tool", v: "KiCad" },
        { k: "Worked example", v: "BJT astable multivibrator" },
        { k: "Awards", v: "Champion & runner-up trophies" },
      ],
      programme: [
        { t: "Schematic capture", d: "Placing symbols, wiring nets and checking the circuit." },
        { t: "PCB layout", d: "Assigning footprints, placing parts and routing copper." },
        { t: "Technical activities", d: "Hands-on challenges to put knowledge and creativity to the test." },
        { t: "Prize distribution", d: "Trophies presented to the champion and runner-up." },
      ],
      photos: ["kraftRoom", "kraftKicad", "kraftChampions", "kraftRunnersUp", "kraftGroup", "kraftStage"],
    },
  },
  {
    id: "kreative-kontrol-3",
    date: "22 Mar 2026", dateTime: "2026-03-22",
    name: "Kreative Kontrol 3.0",
    kind: "Flagship · Workshop & competition",
    summary: "A drone workshop with Silver Wings Media Creation, then a concept quiz, a Tinkercad fault-finding round and a timed circuit design final.",
    place: "Auditorium, E-Block & OAT-1, Campus 3",
    image: "kk3Auditorium",
    details: {
      overview: [
        "The third edition of the society’s flagship competition, which tests participants across electrical engineering — from theory to simulation to real-time problem solving — in a competitive, time-bound format.",
        "For 3.0, KES partnered with Silver Wings Media Creation, an Odisha-based media and drone organisation, whose trainers introduced industry-standard multirotor and fixed-wing drones, including tuning and practical operation, with live flying at OAT-1.",
      ],
      facts: [
        { k: "Date", v: "22 March 2026, 9:30 AM – 6 PM" },
        { k: "Venue", v: "Auditorium, E-Block & OAT-1, Campus 3" },
        { k: "Partner", v: "Silver Wings Media Creation" },
        { k: "Prize pool", v: "₹15,000 for the top three teams" },
      ],
      programme: [
        { time: "9:30 – 1:30", t: "Drone workshop", d: "Drone principles, a walk-through of components and flight systems, a live demonstration, and Q&A with the trainers." },
        { time: "1:30 – 3:00", t: "Lunch break" },
        { time: "3:00 – 4:00", t: "Quiz & simulation", d: "Round 1: a conceptual quiz on the workshop. Round 2: faulty circuits in Tinkercad — find the errors, correct them and simulate." },
        { time: "4:00 – 6:00", t: "Circuit design final", d: "Shortlisted teams receive eight electronic components and must build a working circuit that uses all of them. The three fastest complete builds win." },
      ],
      photos: ["droneWorkshop", "kk3Quadcopter", "kk3Tinkercad", "kk3Prize", "kk3Standee"],
    },
  },
  {
    id: "kshitij-2026",
    date: "Jan 2026", dateTime: "2026-01",
    name: "KSHITIJ 2026",
    kind: "Off-campus · Team participation",
    summary: "KES robotics teams competed over three days at IIT Kharagpur’s techno-management fest.",
    place: "IIT Kharagpur",
    image: "kshitijTeam",
    temporary: true, // Confirm the competition entered and any result.
    details: {
      overview: [
        "KES teams represented the society at KSHITIJ 2026, the techno-management festival of IIT Kharagpur. Over three days they drove their robots through the obstacle course and into the arena, repairing and re-tuning between rounds.",
      ],
      facts: [
        { k: "Dates", v: "16 – 18 January 2026" },
        { k: "Host", v: "IIT Kharagpur" },
        { k: "Entries", v: "Tracked and wheeled RC robots" },
      ],
      photos: ["kshitijObstacle", "kshitijArena", "kshitijDrivers", "kshitijPit", "kshitijIitKgp"],
      note: "Competition name and result to be confirmed.",
    },
  },
  {
    id: "darkroute",
    date: "Jan 2026", dateTime: "2026-01",
    name: "DarkRoute",
    kind: "Lab event",
    summary: "Teams worked their way through the electrical machines and power labs — panels, motor test benches and the DC distribution unit.",
    place: "Electrical laboratories, KIIT",
    image: "drMotorPanel",
    temporary: true, // Date taken from Drive upload (10 Jan); confirm date and format.
    details: {
      overview: [
        "DarkRoute sent teams through the School of Electrical Engineering’s laboratories, working at machine training panels, the synchronous motor test bench and the DC distribution unit.",
      ],
      facts: [
        { k: "Date", v: "January 2026" },
        { k: "Venue", v: "Electrical machines & power laboratories" },
      ],
      photos: ["drLabPanel", "drMotorPanel", "drDcDistribution", "drDcPanel"],
      note: "Exact date and event format to be confirmed.",
    },
  },
  {
    id: "power-supply-workshop",
    date: "Date to be confirmed", dateTime: null,
    name: "Building Power Supply Systems from Scratch",
    kind: "Workshop",
    summary: "A guest-led workshop that took participants from first principles to working power-supply circuits on the bench.",
    place: "KIIT",
    image: "psuTitle",
    temporary: true, // Confirm date, venue and speaker.
    details: {
      overview: [
        "A practical workshop on designing and building a power-supply system from scratch. After a guest session on the theory, participants assembled and tested circuits stage by stage on breadboards, with meters at every bench.",
      ],
      facts: [
        { k: "Format", v: "Guest session followed by a hands-on build" },
        { k: "Certificates", v: "For all participants" },
      ],
      highlights: [
        "Exclusive industrial visit opportunity",
        "Practical, application-focused technical skills",
        "Real-world competency through structured learning",
        "Certificates for all participants",
      ],
      photos: ["psuBreadboard", "psuCircuit", "psuRoom"],
      note: "Date, venue and speaker to be confirmed.",
    },
  },
  {
    id: "project-expo-2025",
    date: "Nov 2025", dateTime: "2025-11",
    name: "Project Expo 2025",
    kind: "Exhibition & competition",
    summary: "Students from every branch of KIIT showcased hardware and IoT projects before a jury.",
    place: "OAT-3, Block A, Campus 3",
    participants: 412,
    image: "expoJury",
    details: {
      overview: [
        "A project showcase where students presented their ideas, models and technical creations — encouraging creativity, practical learning and peer inspiration. Teams pitched to a faculty jury by day and demonstrated working prototypes at their stalls into the evening.",
      ],
      facts: [
        { k: "Date", v: "November 2025, 10 AM onwards" },
        { k: "Venue", v: "OAT-3, Block A, Campus 3" },
        { k: "Participants", v: "412" },
        { k: "Awards", v: "Gold, silver & bronze medals; certificates for all" },
      ],
      rules: [
        "Open to students from all branches of KIIT",
        "Teams of up to four members",
        "Registration mandatory",
        "Projects must be hardware-based or IoT-related",
        "Each project must have a unique idea and title",
      ],
      photos: ["expoPitch", "expoStall", "expoNightJudging", "expoGroup"],
    },
  },
  {
    id: "kaos-of-circuits",
    date: "Aug 2025", dateTime: "2025-08",
    name: "KAOS OF CIRCUITS",
    kind: "Circuit building & simulation",
    summary: "Hands-on circuit building that blended Tinkercad practice with real electronics.",
    place: "Campus 3",
    participants: 347,
    image: null,
    details: {
      overview: [
        "The first KAOS OF CIRCUITS paired simulation with the real thing: participants practised in Tinkercad, then moved to physical electronics, working through challenges that tested teamwork and technical skill — with prizes for the best.",
      ],
      facts: [
        { k: "Date", v: "August 2025" },
        { k: "Venue", v: "Campus 3" },
        { k: "Participants", v: "347" },
      ],
    },
  },
  {
    id: "kreative-kontrol-2",
    date: "Mar 2025", dateTime: "2025-03",
    name: "Kreative Kontrol 2.0",
    kind: "Flagship · Seminar & challenges",
    summary: "A circuit design seminar combined with hands-on control-system activities and alumni insights.",
    place: "Campus 3",
    participants: 289,
    image: null,
    details: {
      overview: [
        "The second edition of the flagship paired a circuit-design seminar with hands-on control-system sessions. Alumni shared their experience, and challenges pushed participants’ creative and technical limits.",
      ],
      facts: [
        { k: "Date", v: "March 2025" },
        { k: "Venue", v: "Campus 3" },
        { k: "Participants", v: "289" },
      ],
    },
  },
  {
    id: "kreative-kontrol-workshop",
    date: "Mar 2025", dateTime: "2025-03",
    name: "Kreative Kontrol — Motors & Motion",
    kind: "Workshop",
    summary: "A hands-on workshop on motors, motion and control, with creative project demonstrations.",
    place: "Campus 3",
    participants: 324,
    image: null,
    details: {
      overview: [
        "A practical workshop focused on motors and motion. Participants explored control systems hands-on and saw creative project demonstrations in interactive sessions.",
      ],
      facts: [
        { k: "Date", v: "March 2025" },
        { k: "Venue", v: "Campus 3" },
        { k: "Participants", v: "324" },
      ],
    },
  },
  {
    id: "kinetidroid",
    date: "Feb 2025", dateTime: "2025-02",
    name: "Kinetidroid — Sand Rover",
    kind: "Robotics competition",
    summary: "Teams designed, built and raced rugged rovers across sand terrain.",
    place: "Campus 3",
    participants: 451,
    image: null,
    details: {
      overview: ["A high-energy rover competition: participants designed and built rugged sand rovers, then raced them over challenging terrain. Creativity, engineering skill and performance under tough conditions decided the winners."],
      facts: [{ k: "Date", v: "February 2025" }, { k: "Venue", v: "Campus 3" }, { k: "Participants", v: "451" }],
    },
  },
  {
    id: "konnex",
    date: "Feb 2025", dateTime: "2025-02",
    name: "KONNEX — Treasure Hunt",
    kind: "Adventure",
    summary: "Puzzles, clues and strategy in a map-themed treasure hunt.",
    place: "A Block, Campus 3",
    participants: 368,
    image: null,
    details: {
      overview: ["An adventurous treasure hunt of puzzles, clues and strategic challenges set in a map-themed environment. Teams explored, decoded hints and raced to uncover hidden rewards."],
      facts: [{ k: "Date", v: "February 2025" }, { k: "Venue", v: "A Block, Campus 3" }, { k: "Participants", v: "368" }],
    },
  },
  {
    id: "current-flow",
    date: "Feb 2025", dateTime: "2025-02",
    name: "Current Flow — Circuit Design",
    kind: "Design competition",
    summary: "Build efficient, inventive circuits within set constraints.",
    place: "A Block, Campus 3",
    participants: 354,
    image: null,
    details: {
      overview: ["A competitive circuit-design event where participants applied creativity and technical skill to build efficient electronic circuits within given constraints — rewarding problem solving, logical thinking and hands-on engineering."],
      facts: [{ k: "Date", v: "February 2025" }, { k: "Venue", v: "A Block, Campus 3" }, { k: "Participants", v: "354" }],
    },
  },
  {
    id: "kurious-quest",
    date: "Feb 2025", dateTime: "2025-02",
    name: "Kurious Quest",
    kind: "Challenge",
    summary: "A fast-paced quest of creative tasks and clues.",
    place: "Block A, Campus 3",
    participants: 327,
    image: null,
    details: {
      overview: ["A fast-paced challenge in which teams solved creative tasks, decoded clues and competed in an interactive quest built on teamwork."],
      facts: [{ k: "Date", v: "February 2025" }, { k: "Venue", v: "Block A, Campus 3" }, { k: "Participants", v: "327" }],
    },
  },
  {
    id: "kallistic-flair",
    date: "Feb 2025", dateTime: "2025-02",
    name: "Kallistic Flair",
    kind: "Art & illustration",
    summary: "Sketches, digital artwork and expressive design.",
    place: "Campus 3",
    participants: 276,
    image: null,
    details: {
      overview: ["A creative art and digital-illustration competition. Participants showcased sketches, digital artwork and expressive designs, judged on originality, visual storytelling and aesthetic innovation."],
      facts: [{ k: "Date", v: "February 2025" }, { k: "Venue", v: "Campus 3" }, { k: "Participants", v: "276" }],
    },
  },
  {
    id: "kshitij-2025",
    date: "Jan 2025", dateTime: "2025-01",
    name: "KSHITIJ 2025 — TechTriad winners",
    kind: "Achievement · 1st place",
    summary: "A KES team won the TechTriad Hackathon at IIT Kharagpur.",
    place: "IIT Kharagpur",
    image: null,
    details: {
      overview: ["KES members took first place in the TechTriad Hackathon at KSHITIJ 2025, IIT Kharagpur, with a complete reimagining of a website experience built on creative problem solving and UI/UX restructuring."],
      facts: [
        { k: "Result", v: "1st place, TechTriad Hackathon" },
        { k: "Event", v: "KSHITIJ 2025, IIT Kharagpur" },
        { k: "Team", v: "Soumyadip Maity, Vaishnavi Jaiswal" },
      ],
    },
  },
];

// Drawn from how Kreative Kontrol 3.0 was run.
export const METHOD = [
  { step: "01", t: "Learn", d: "Practitioners open with a workshop — principles, components and a live demonstration." },
  { step: "02", t: "Test", d: "A conceptual quiz checks what was understood before anyone touches a part." },
  { step: "03", t: "Simulate", d: "Faulty circuits are handed out in Tinkercad: find the error, correct it, run it." },
  { step: "04", t: "Build", d: "A fixed kit of components, a clock, and a working circuit at the end of it." },
];

// Office bearers. Only confirmed names are published; the rest are open slots.
// 2026–27 office bearers, as announced on the society's Instagram (2 Sep 2026).
// Portraits are cropped from the official announcement posters.
export const TEAM_TERM = "2026–27";
export const TEAM = [
  { role: "President", name: "Mimansha Tiwari", photo: "teamMimansha", linkedin: "https://www.linkedin.com/in/mimanshatiwari0404/" },
  { role: "President", name: "Sujal Krishna", photo: "teamSujal", linkedin: "https://www.linkedin.com/in/sujalkrishna/" },
  { role: "Vice President", name: "Ayush Kumar", photo: "teamAyush", linkedin: "https://www.linkedin.com/in/ayush-kumar-063195362/" },
  { role: "Vice President", name: "Jaya Kumari", photo: "teamJaya", linkedin: "https://www.linkedin.com/in/jaya-kumari-8861a0417/" },
  { role: "Vice President", name: "Dattaraya Sahoo", photo: "teamDattaraya" },
];
// Current faculty in charge, with School of EE profile.
export const MENTORS = [
  { name: "Dr. Shubhasri Kundu", role: "Faculty In Charge", title: "School of Electrical Engineering", photo: "mentorKundu", url: "https://electrical.kiit.ac.in/profiles/shubhasri-kundu/" },
];
export const FOUNDING_FACULTY = [
  { name: "Dr. Manoj Kumar Maharana", role: "Founding Faculty", title: "School of Electrical Engineering", photo: "mentorMaharana", url: "https://electrical.kiit.ac.in/profiles/manoj-kumar-maharana/" },
];

// Alumni placements, from the previous KES website. `year` is graduating batch.
export const ALUMNI = [
  { name: "Akash Roy Choudhury", year: 2019, org: "Neocell Energy Pvt. Ltd." },
  { name: "Dipanjan Panda", year: 2022, org: "First Solar Inc." },
  { name: "Anirban Sadhukhan", year: 2023, org: "Stellantis, JSW Steel, Accenture" },
  { name: "Bishwayan Ghosh", year: 2023, org: "Providence" },
  { name: "Soumik Das", year: 2024, org: "KPIT" },
  { name: "Ansuman Mukharjee", year: 2024, org: "BSES Rajdhani Power Ltd." },
  { name: "Shilpi Sinha", year: 2024, org: "BSES Rajdhani Power Ltd." },
  { name: "Rewant Raj", year: 2024, org: "Healthunity Solutions Pvt. Ltd." },
];
export const TEAM_PHOTO = "kk3Group";

// Gallery, in display order. `span`: wide (2 columns), tall (2 rows) or normal.
export const GALLERY = [
  { media: "expoStalls", caption: "Teams and visitors across the stalls", meta: "Project Expo 2025", span: "wide" },
  { media: "kshitijTeam", caption: "The KES robotics team with their robot", meta: "KSHITIJ 2026 · IIT Kharagpur", span: "tall" },
  { media: "kk3OatGroup", caption: "Everyone out at the open-air theatre", meta: "22 Mar 2026 · Kreative Kontrol 3.0", span: "wide" },
  { media: "expoNightDemo", caption: "A prototype on show after dark", meta: "Project Expo 2025", span: "tall" },
  { media: "kk3AircraftLineup", caption: "The fleet, lined up for the drone workshop", meta: "Kreative Kontrol 3.0", span: "normal" },
  { media: "drMotorPanel", caption: "At the synchronous motor panel", meta: "DarkRoute", span: "normal" },
  { media: "psuBreadboard", caption: "Breadboards out, meters on", meta: "Power supply workshop", span: "tall" },
  { media: "kk3Flight", caption: "A model banks over the open-air theatre", meta: "Kreative Kontrol 3.0 · OAT-1", span: "wide" },
  { media: "expoEveningDrone", caption: "A drone build at the evening session", meta: "Project Expo 2025", span: "normal" },
  { media: "kshitijDrivers", caption: "Driving from the sidelines", meta: "KSHITIJ 2026", span: "tall" },
  { media: "drDcPanel", caption: "Reading a DC machine panel", meta: "DarkRoute", span: "normal" },
  { media: "kshitijIitKgp", caption: "A night at IIT Kharagpur", meta: "KSHITIJ 2026", span: "tall" },
  { media: "kk3DeltaJet", caption: "Delta wing, ready to fly", meta: "Kreative Kontrol 3.0", span: "normal" },
  { media: "expoTeamPrototype", caption: "A team and their prototype", meta: "Project Expo 2025", span: "normal" },
  { media: "drDcDistribution", caption: "Beside the DC distribution unit", meta: "DarkRoute", span: "normal" },
  { media: "kk3HeavyDrone", caption: "Heavy-lift drone, ready on the field", meta: "Kreative Kontrol 3.0", span: "wide" },
  { media: "psuRoom", caption: "Every bench, a working circuit", meta: "Power supply workshop", span: "normal" },
  { media: "rcAircraft", caption: "Aircraft laid out at OAT-1", meta: "Kreative Kontrol 3.0 · Drone workshop", span: "wide" },
  { media: "inauguration", caption: "Lighting the lamp at the inauguration", meta: "22 Mar 2026 · Kreative Kontrol 3.0", span: "normal" },
  { media: "expoStandee", caption: "The rules, on the standee", meta: "Project Expo 2025", span: "normal" },
  { media: "audience", caption: "Seated in the E-Block auditorium", meta: "Kreative Kontrol 3.0", span: "wide" },
];

export const CONTACT = {
  email: "kiitelectricalsociety@gmail.com",
  office: "Campus 3, KIIT University, Bhubaneswar, Odisha",
  social: [
    { label: "Instagram", handle: "@kiit_electrical_society", url: "https://www.instagram.com/kiit_electrical_society/" },
    { label: "LinkedIn", handle: "KIIT Electrical Society", url: "https://www.linkedin.com/company/kiit-electrical-society/" },
  ],
};
