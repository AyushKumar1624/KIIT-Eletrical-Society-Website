// Sends the one-time code. SMTP works with Gmail/Google Workspace (app
// password), Outlook, Resend, Brevo, Amazon SES and most other providers.
import nodemailer from "nodemailer";

const minutes = s => Math.round(s / 60);

export function codeEmail({ code, expiresIn }) {
  const subject = `${code} is your KES verification code`;
  const text = [
    "Your KIIT Electrical Society verification code is:",
    "",
    `    ${code}`,
    "",
    `Enter it on the Join KES page within ${minutes(expiresIn)} minutes.`,
    "",
    "If you didn't ask to join KES, you can ignore this email.",
    "KES will never ask for your email password.",
    "",
    "KIIT Electrical Society — Build small, think big.",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#E9E3D6;font-family:Arial,Helvetica,sans-serif;color:#292A26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#FBF9F4;border-radius:10px;border-top:4px solid #B59A69" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 28px 24px">
<p style="margin:0 0 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#183B32;font-weight:bold">KIIT Electrical Society</p>
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#112B24">Your verification code</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Enter this code on the Join KES page within ${minutes(expiresIn)} minutes.</p>
<p style="margin:0 0 20px;padding:14px 0;text-align:center;font-size:32px;letter-spacing:.3em;font-weight:bold;color:#112B24;background:#fff;border:1px solid #DDD5C4;border-radius:6px">${code}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#55534B">If you didn't ask to join KES, you can ignore this email. KES will never ask for your email password.</p>
</td></tr></table>
<p style="margin:16px 0 0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#55534B">Build small, think big.</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

export function createSmtpSender(config) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  return async ({ to, code, expiresIn }) => {
    const message = codeEmail({ code, expiresIn });
    await transport.sendMail({ from: config.from, replyTo: config.replyTo, to, ...message });
  };
}

// Development without SMTP: print the code where only the developer can see it.
export function createConsoleSender() {
  return async ({ to, code }) => {
    console.info(`\n[join] DEVELOPMENT — no email sent. Verification code for ${to}: ${code}\n`);
  };
}
