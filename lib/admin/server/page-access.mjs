import "server-only";
import { cookies } from "next/headers";
import { getAdminBackend } from "./index.mjs";
import { cookieName } from "./http.mjs";
export async function adminPageAccess() {
  try {
    const service = await getAdminBackend();
    if (!service) return { status: "unavailable" };
    return await service.getSession((await cookies()).get(cookieName())?.value);
  } catch { return { status: "unavailable" }; }
}
