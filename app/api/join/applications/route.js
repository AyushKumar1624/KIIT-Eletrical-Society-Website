// POST { application } → persists a Join KES application for the applicant
// verified by the HttpOnly join cookie. See docs/join-kes-integration.md.
import { applicationsHandler } from "@/lib/join/server/handlers.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = applicationsHandler();
