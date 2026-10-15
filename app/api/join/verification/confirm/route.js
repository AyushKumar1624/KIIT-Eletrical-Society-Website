import { verificationHandler } from "@/lib/join/server/handlers.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = verificationHandler("confirm");
