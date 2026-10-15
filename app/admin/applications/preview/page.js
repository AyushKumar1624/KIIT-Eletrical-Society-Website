import { notFound } from "next/navigation";

export const metadata = { title: "Development preview" };
export default async function AdminPreviewPage() {
  // This is a design preview, never an alternate authentication mechanism.
  // NODE_ENV cannot enable it in next build / next start.
  if (process.env.NODE_ENV === "development") {
    const { default: Preview } = await import("@/components/admin/ApplicationsPreview");
    return <Preview />;
  }
  notFound();
}
