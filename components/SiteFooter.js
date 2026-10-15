import Image from "next/image";
import { Rule } from "@/components/Drawings";
import { NAV, JOIN, SOCIETY, MEDIA, CONTACT } from "@/lib/content";

export default function SiteFooter({ home = true }) {
  const href = id => (home ? `#${id}` : `/#${id}`);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-statement">
          <p className="footer-display">{SOCIETY.motto.split(", ")[0]}, <em>{SOCIETY.motto.split(", ")[1]}</em></p>
          {CONTACT.email && (
            <a className="footer-mail" href={`mailto:${CONTACT.email}`}>
              <span>Write to us</span>
              <span className="footer-mail-address">{CONTACT.email}</span>
            </a>
          )}
        </div>
        <Rule />
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src={MEDIA.logo.src} alt={MEDIA.logo.alt} width={112} height={112} />
            <div>
              <p className="footer-name">{SOCIETY.name}</p>
              <p>{SOCIETY.institution}<br />Bhubaneswar, Odisha</p>
            </div>
          </div>
          <nav aria-label="Footer">
            <ul>
              {NAV.map(n => <li key={n.id}><a href={href(n.id)}>{n.label}</a></li>)}
              <li><a href={JOIN.href}>{JOIN.label}</a></li>
            </ul>
          </nav>
          <p className="footer-note">A student society under {SOCIETY.parent}.</p>
        </div>
        <p className="footer-base">
          <span>© {new Date().getFullYear()} {SOCIETY.name}</span>
          <span className="footer-motto">{SOCIETY.motto}</span>
          <a href={home ? "#top" : "/"}>{home ? "Back to top ↑" : "Home"}</a>
        </p>
      </div>
    </footer>
  );
}
