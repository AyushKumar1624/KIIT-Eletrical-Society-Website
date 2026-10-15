import "./admin.css";
import "./applications-review.css";

export const metadata = {
  title: { default: "KES Administrator", template: "%s — KES Administrator" },
  description: "Administrator access for KIIT Electrical Society.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: { title: "KES Administrator", description: "Administrator access for KIIT Electrical Society.", url: "/admin/login" },
};

export default function AdminLayout({ children }) {
  return <div className="ka-root"><a className="ka-skip" href="#admin-main">Skip to content</a>{children}</div>;
}
