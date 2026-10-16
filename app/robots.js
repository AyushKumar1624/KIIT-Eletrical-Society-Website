export const dynamic = "force-static";

export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    ...(site ? { sitemap: `${site.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
