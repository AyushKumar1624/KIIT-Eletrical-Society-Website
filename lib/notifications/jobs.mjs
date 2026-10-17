import "server-only";
import { randomUUID } from "node:crypto";
import { COLLECTIONS } from "../backend/mongo.mjs";
import { mailConfig } from "../join/server/config.mjs";
import { createMailSender } from "../join/server/mailer.mjs";
import { renderMessage } from "../admin/applications.mjs";

export const NOTIFICATION_KINDS = Object.freeze([
  "applicant-acknowledgement",
  "admin-new-application",
  "shortlisting",
  "interview-invitation",
  "selection",
  "non-selection",
]);

export const DEFAULT_COMMUNITY_LINKS = Object.freeze({
  general: "https://chat.whatsapp.com/invite/kes-members-orientation",
  robotics: "https://chat.whatsapp.com/invite/kes-robotics-domain",
  embedded: "https://chat.whatsapp.com/invite/kes-embedded-domain",
  ai: "https://chat.whatsapp.com/invite/kes-ai-domain",
  web: "https://chat.whatsapp.com/invite/kes-web-domain",
  design: "https://chat.whatsapp.com/invite/kes-design-domain",
  media: "https://chat.whatsapp.com/invite/kes-media-domain",
  outreach: "https://chat.whatsapp.com/invite/kes-outreach-domain",
  events: "https://chat.whatsapp.com/invite/kes-events-domain",
  writing: "https://chat.whatsapp.com/invite/kes-writing-domain",
});

/**
 * Retrieves sensitive community links from system_settings or default.
 * Server-only: never expose to client or public APIs.
 */
export async function getCommunityLinks(db) {
  try {
    const doc = await db.collection(COLLECTIONS.settings).findOne({ _id: "selection_links" });
    return doc?.links || DEFAULT_COMMUNITY_LINKS;
  } catch {
    return DEFAULT_COMMUNITY_LINKS;
  }
}

/** Formats HTML email for applicant communications */
export function formatEmailHtml({ title, body, sign = "Build small, think big." }) {
  const formattedBody = body
    .split("\n\n")
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#292A26">${p.replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#E9E3D6;font-family:Arial,Helvetica,sans-serif;color:#292A26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:540px;background:#FBF9F4;border-radius:10px;border-top:4px solid #B59A69" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 28px 24px">
<p style="margin:0 0 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#183B32;font-weight:bold">KIIT Electrical Society</p>
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:22px;color:#112B24">${title}</h1>
${formattedBody}
</td></tr></table>
<p style="margin:16px 0 0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#55534B">${sign}</p>
</td></tr></table></body></html>`;
}

/**
 * Builds email subject, text, and html based on job kind and application data.
 */
export async function buildNotificationEmail(db, job, app) {
  const first = String(app.fullName || "").trim().split(/\s+/)[0] || "there";
  const ref = app.reference || "KES-APP";

  switch (job.kind) {
    case "applicant-acknowledgement": {
      const subject = `Application Received: ${ref} — KIIT Electrical Society`;
      const body = renderMessage("acknowledgement", app);
      return {
        to: app.email,
        subject,
        text: `${body}\n\nYour application reference is: ${ref}`,
        html: formatEmailHtml({
          title: "Application Received",
          body: `${body}\n\nYour application reference is: <strong>${ref}</strong>`,
        }),
      };
    }

    case "admin-new-application": {
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.JOIN_EMAIL_FROM || "admin@kiitelectricalsociety.org";
      const subject = `[New Application] ${app.fullName} (${(app.domains || []).join(", ")}) — ${ref}`;
      const text = `A new application has been submitted to KIIT Electrical Society.\n\nApplicant: ${app.fullName}\nEmail: ${app.email}\nRoll: ${app.roll}\nDomains: ${(app.domains || []).join(", ")}\nReference: ${ref}\n\nReview this application in the administrator workspace.`;
      const html = formatEmailHtml({
        title: "New Application Submitted",
        body: `A new application has been submitted to KIIT Electrical Society.<br /><br /><strong>Applicant:</strong> ${app.fullName}<br /><strong>Email:</strong> ${app.email}<br /><strong>Roll:</strong> ${app.roll}<br /><strong>Domains:</strong> ${(app.domains || []).join(", ")}<br /><strong>Reference:</strong> ${ref}`,
      });
      return { to: adminEmail, subject, text, html };
    }

    case "shortlist":
    case "shortlisting": {
      const subject = `Recruitment Update: Shortlisted for KES (${ref})`;
      const customBody = job.customMessage || renderMessage("shortlisting", app);
      return {
        to: app.email,
        subject,
        text: customBody,
        html: formatEmailHtml({ title: "Recruitment Shortlist", body: customBody }),
      };
    }

    case "interview":
    case "interview-invitation": {
      const subject = `Interview Invitation — KIIT Electrical Society (${ref})`;
      const interview = app.interview || {};
      const customBody = job.customMessage || renderMessage("interview", app, interview);
      return {
        to: app.email,
        subject,
        text: customBody,
        html: formatEmailHtml({ title: "Interview Invitation", body: customBody }),
      };
    }

    case "selection": {
      const subject = `Welcome to KIIT Electrical Society! Selection Notice (${ref})`;
      const links = await getCommunityLinks(db);
      const domainLinks = (app.domains || [])
        .map(d => links[d] ? `• ${d}: ${links[d]}` : null)
        .filter(Boolean)
        .join("\n");

      let body = job.customMessage || renderMessage("selection", app);
      body += `\n\nOfficial Group Links for Selected Members:\n• General Orientation: ${links.general || DEFAULT_COMMUNITY_LINKS.general}\n${domainLinks}`;

      return {
        to: app.email,
        subject,
        text: body,
        html: formatEmailHtml({ title: "Congratulations — Welcome to KES", body }),
      };
    }

    case "rejection":
    case "non-selection": {
      const subject = `KIIT Electrical Society Recruitment Update (${ref})`;
      const customBody = job.customMessage || renderMessage("non-selection", app);
      return {
        to: app.email,
        subject,
        text: customBody,
        html: formatEmailHtml({ title: "Recruitment Decision", body: customBody }),
      };
    }

    default:
      throw new Error(`Unknown notification kind: ${job.kind}`);
  }
}
