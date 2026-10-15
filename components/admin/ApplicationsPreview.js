"use client";

import { useState } from "react";
import { AdminPanel } from "./AdminAccess";
import { createApplicationsService } from "@/lib/admin/applications.mjs";
import { createPreviewAdapter } from "@/lib/admin/preview-applications.mjs";

// Loaded only by the development-only route. Fictional records, simulated
// service responses; nothing is read from or sent to a real service.
const MODES = [
  ["normal", "Normal"],
  ["slow", "Slow responses"],
  ["empty", "No applications (reload)"],
  ["load-error", "Loading fails (reload)"],
  ["signed-out", "Session ended"],
  ["save-fails", "Saving fails"],
  ["conflict", "Save conflict"],
];

export default function ApplicationsPreview() {
  const [adapter] = useState(createPreviewAdapter);
  const [service] = useState(() => createApplicationsService(adapter));
  const [mode, setMode] = useState("normal");
  const [reviewKey, setReviewKey] = useState(0);

  const tools = (
    <div className="kr-preview-tools">
      <label>Simulate
        <select value={mode} onChange={e => { adapter.setMode(e.target.value); setMode(e.target.value); }}>
          {MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="button" className="ka-button" onClick={() => setReviewKey(k => k + 1)}>Reload applications</button>
      <button type="button" className="ka-button" onClick={() => { adapter.reset(); setReviewKey(k => k + 1); }}>Reset fixtures</button>
    </div>
  );

  return <AdminPanel preview service={service} previewTools={tools} reviewKey={reviewKey} />;
}
