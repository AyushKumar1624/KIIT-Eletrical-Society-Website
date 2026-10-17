import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase, COLLECTIONS } from "@/lib/backend/mongo.mjs";
import { recordAuditLog } from "@/lib/admin/server/audit.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { escapeCsvField } from "@/lib/admin/server/csv.mjs";

export async function GET(request) {
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { searchParams } = new URL(request.url);
    const { db } = await getDatabase();
    const applicationsCol = db.collection(COLLECTIONS.applications);
    const cyclesCol = db.collection(COLLECTIONS.cycles);

    const currentCycle = await cyclesCol.findOne({ current: true });
    const cycleId = searchParams.get("cycleId") || currentCycle?._id;

    const filter = {};
    if (cycleId) filter.cycleId = cycleId;

    // Role-based domain isolation
    if (access.session.user.role === "reviewer" && access.session.user.domain) {
      filter.domains = access.session.user.domain;
    } else if (searchParams.get("domain")) {
      filter.domains = searchParams.get("domain");
    }

    if (searchParams.get("status")) {
      filter.status = searchParams.get("status");
    }
    if (searchParams.get("year")) {
      filter.year = searchParams.get("year");
    }

    const applications = await applicationsCol.find(filter).sort({ submittedAt: -1 }).limit(5000).toArray();

    const headers = [
      "Reference",
      "Full Name",
      "Email",
      "WhatsApp",
      "Roll Number",
      "School",
      "Programme",
      "Year",
      "Graduation",
      "Domains",
      "Status",
      "Submitted At",
      "Interview Date",
      "Interview Time",
      "Interview Mode",
      "Interview Place",
    ];

    const rows = [headers.map(escapeCsvField).join(",")];

    for (const app of applications) {
      const interview = app.interview || {};
      const row = [
        app.reference || "",
        app.fullName || "",
        app.email || "",
        app.whatsapp || "",
        app.roll || "",
        app.school || "",
        app.programme || "",
        app.year || "",
        app.graduation || "",
        (app.domains || []).join("; "),
        app.status || "",
        app.submittedAt ? new Date(app.submittedAt).toISOString() : "",
        interview.date || "",
        interview.time || "",
        interview.mode || "",
        interview.place || "",
      ];
      rows.push(row.map(escapeCsvField).join(","));
    }

    const csvContent = rows.join("\r\n");
    const filename = `kes-applications-${cycleId || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

    // Record audit log
    await recordAuditLog(db, {
      actorId: access.session.user.id,
      actorEmail: access.session.user.email,
      action: "export_applications_csv",
      entity: "applications",
      entityId: cycleId || "all",
      newValue: { count: applications.length, filter },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}
