"use client";

import { useState } from "react";

// Verified chronological milestones derived strictly from official KES records in lib/content.js.
const TIMELINE_DATA = [
  {
    year: "2026",
    date: "Sep 2026",
    title: "K-RAFT PCB Design",
    kind: "Workshop & Competition",
    venue: "Campus 20, KIIT",
    summary: "Hands-on KiCad session from blank schematic to routed BJT multivibrator board, closing with champion trophies.",
    tag: "Circuit Design",
  },
  {
    year: "2026",
    date: "Mar 2026",
    title: "Kreative Kontrol 3.0",
    kind: "Flagship Symposium",
    venue: "E-Block & OAT-1, Campus 3",
    summary: "Drone aerodynamics with Silver Wings Media Creation, Tinkercad fault-finding, and ₹15,000 timed circuit design final.",
    tag: "Flagship",
  },
  {
    year: "2026",
    date: "Jan 2026",
    title: "KSHITIJ 2026 Robotics",
    kind: "National Fest Participation",
    venue: "IIT Kharagpur",
    summary: "KES robotics teams fielded tracked and wheeled rovers across obstacle courses and arena challenges over three days.",
    tag: "Robotics",
  },
  {
    year: "2025",
    date: "Nov 2025",
    title: "Project Expo 2025",
    kind: "Hardware & IoT Exhibition",
    venue: "OAT-3, Block A, Campus 3",
    summary: "412 participants across KIIT demonstrated hardware prototypes before a faculty jury for gold, silver and bronze medals.",
    tag: "Exhibition",
  },
  {
    year: "2025",
    date: "Aug 2025",
    title: "KAOS OF CIRCUITS",
    kind: "Simulation & Prototyping",
    venue: "Campus 3, KIIT",
    summary: "347 participants paired Tinkercad circuit simulation with physical breadboard electronic assembly.",
    tag: "Circuits",
  },
  {
    year: "2025",
    date: "Mar 2025",
    title: "Kreative Kontrol 2.0",
    kind: "Flagship Seminar",
    venue: "Campus 3, KIIT",
    summary: "Control system seminar, creative hardware challenges, and alumni insights with 289 participants.",
    tag: "Control Systems",
  },
  {
    year: "2025",
    date: "Jan 2025",
    title: "TechTriad Hackathon — 1st Place",
    kind: "Competition Win",
    venue: "IIT Kharagpur (KSHITIJ)",
    summary: "KES team members Soumyadip Maity and Vaishnavi Jaiswal took 1st place in the TechTriad Hackathon.",
    tag: "Achievement",
  },
];

export default function KesTimeline() {
  const [filterYear, setFilterYear] = useState("all");

  const filtered = filterYear === "all"
    ? TIMELINE_DATA
    : TIMELINE_DATA.filter(item => item.year === filterYear);

  return (
    <section className="kes-timeline-block" aria-labelledby="timeline-heading">
      <div className="kes-timeline-header">
        <div>
          <h3 id="timeline-heading" className="ledger-title">
            Chronology of Technical Milestones
          </h3>
          <p className="kes-timeline-lede">
            Verified timeline of society symposia, competitions and national achievements.
          </p>
        </div>
        <div className="kes-timeline-filters" role="group" aria-label="Filter timeline by year">
          {["all", "2026", "2025"].map(year => (
            <button
              key={year}
              type="button"
              className={`kes-timeline-filter-btn${filterYear === year ? " is-active" : ""}`}
              aria-pressed={filterYear === year}
              onClick={() => setFilterYear(year)}
            >
              {year === "all" ? "Full Timeline" : year}
            </button>
          ))}
        </div>
      </div>

      <ol className="kes-timeline-track" role="list">
        {filtered.map((item, idx) => (
          <li key={`${item.title}-${item.date}`} className="kes-timeline-node">
            <div className="kes-timeline-connector" aria-hidden="true">
              <span className="kes-timeline-dot" />
              {idx < filtered.length - 1 && <span className="kes-timeline-line" />}
            </div>
            <div className="kes-timeline-content">
              <div className="kes-timeline-meta">
                <span className="kes-timeline-date">{item.date}</span>
                <span className="kes-timeline-tag">{item.tag}</span>
              </div>
              <h4 className="kes-timeline-title">{item.title}</h4>
              <p className="kes-timeline-kind">{item.kind} · <em>{item.venue}</em></p>
              <p className="kes-timeline-summary">{item.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
