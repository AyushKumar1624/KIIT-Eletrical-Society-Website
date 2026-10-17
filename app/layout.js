import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SOCIETY } from "@/lib/content";
import "./tokens.css";
import "./globals.css";
import "./premium.css";
import "./design.css";
import "./homepage-sections.css";
import "./motion.css";
import "./system.css";
import "./navigation-hero.css";
import "./projects-events.css";
import "./responsive-motion.css";
import "./experience.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-editorial", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });

// Set NEXT_PUBLIC_SITE_URL to the live address when deploying so social cards
// and canonical links resolve to absolute URLs (falls back to Vercel production URL or localhost).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const SITE_TITLE = `${SOCIETY.name} — ${SOCIETY.motto}`;
const DESCRIPTION = "KIIT Electrical Society (KES), a student community at KIIT, Bhubaneswar, connecting hands-on engineering, software, design and storytelling through learning and collaboration.";

// Icons and the social image come from app/icon.png, app/apple-icon.png and
// app/opengraph-image.jpg (scripts/prepare-site-icons.mjs).
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s — KIIT Electrical Society" },
  description: DESCRIPTION,
  applicationName: "KIIT Electrical Society",
  keywords: ["KIIT Electrical Society", "KES", "KIIT", "Bhubaneswar", "electrical engineering", "student society", "KAOS OF CIRCUIT", "Kreative Kontrol", "robotics", "embedded systems"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "KIIT Electrical Society",
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: DESCRIPTION },
};

export const viewport = { themeColor: "#102F29" };

// Runs before first paint. Motion follows the OS setting; ?motion=on / ?motion=off
// overrides it for this tab (for previewing). The homepage loading animation
// plays once per session (?intro=1 replays it) and never blocks content: it is
// CSS-timed and this script removes it after 3.5s regardless.
const MOTION_PREFERENCE = `(function(){
  var d=document.documentElement,m=window.matchMedia('(prefers-reduced-motion: reduce)'),pref=null,q;
  try{q=new URLSearchParams(location.search);var v=q.get('motion');if(v==='on'||v==='off')sessionStorage.setItem('kes-motion',v);pref=sessionStorage.getItem('kes-motion');}catch(e){}
  function sync(){d.classList.toggle('reduce-motion',pref==='off'||(m.matches&&pref!=='on'));d.classList.toggle('force-motion',pref==='on');}
  sync();m.addEventListener('change',sync);
  try{
    if(location.pathname==='/'&&!location.hash&&!d.classList.contains('reduce-motion')&&(!sessionStorage.getItem('kes-intro-seen')||(q&&q.get('intro')==='1'))){
      sessionStorage.setItem('kes-intro-seen','1');d.classList.add('kes-boot');
      setTimeout(function(){d.classList.remove('kes-boot','kes-boot-skip');},3500);
    }
  }catch(e){}
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_PREFERENCE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
