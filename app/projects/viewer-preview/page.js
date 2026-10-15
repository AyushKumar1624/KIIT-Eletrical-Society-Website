import { notFound } from "next/navigation";
import "@/app/project-catalogue.css";

export const metadata = { title: "Project viewer development check", robots: { index: false, follow: false }, alternates: { canonical: null } };
export default async function ViewerPreviewPage() {
  if (process.env.NODE_ENV === "development") {
    const { default: ViewerPreview } = await import("@/components/projects/ViewerPreview");
    return <ViewerPreview />;
  }
  notFound();
}
