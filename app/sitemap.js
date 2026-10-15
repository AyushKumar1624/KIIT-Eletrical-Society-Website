// Lists the public site only. URLs need the live address, so the sitemap is
// empty until NEXT_PUBLIC_SITE_URL is set at deploy time.
export default function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return [];
  const base = site.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/join`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
