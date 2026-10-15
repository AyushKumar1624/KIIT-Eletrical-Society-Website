import { AdminLogin } from "@/components/admin/AdminAccess";

export const metadata = { title: "Admin Login" };
export default function AdminLoginPage() {
  return <AdminLogin previewAvailable={process.env.NODE_ENV === "development"} />;
}
