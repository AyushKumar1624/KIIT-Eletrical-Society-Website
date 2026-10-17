// The member portal is not publicly available: keep it out of search results.
export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/portal", "/admin"] }],
    ...(site ? { sitemap: `${site.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
