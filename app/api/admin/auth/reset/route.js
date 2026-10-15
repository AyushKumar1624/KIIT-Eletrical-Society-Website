import { createAuthHandler } from "@/lib/admin/server/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createAuthHandler("reset");
