// The member portal is not publicly available: keep it out of search results.
export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/portal", "/admin"] }],
    ...(site ? { sitemap: `${site.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
