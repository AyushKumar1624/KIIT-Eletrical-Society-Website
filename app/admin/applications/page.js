import { AdminApplications } from "@/components/admin/AdminAccess";
import { adminPageAccess } from "@/lib/admin/server/page-access.mjs";
import { redirect } from "next/navigation";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";
export default async function AdminApplicationsPage() {
  const access = await adminPageAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  return <AdminApplications />;
}
