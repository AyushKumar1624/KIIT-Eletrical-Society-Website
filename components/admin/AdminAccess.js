"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SOCIETY } from "@/lib/content";
import { adminAuth, UNAVAILABLE_MESSAGE, validateCredentials } from "@/lib/admin/auth.mjs";
import { applicationsService, connectedApplicationsService } from "@/lib/admin/applications.mjs";
import ApplicationsReview from "./ApplicationsReview";

function Brand() {
  return <Link href="/" className="ka-brand"><Image src="/kes-logo.jpeg" alt="" width={48} height={48} /><span>KIIT Electrical Society<small>{SOCIETY.motto}</small></span></Link>;
}

function useAdminSession() {
  const [access, setAccess] = useState({ status: "loading" });
  useEffect(() => {
    let current = true;
    adminAuth.getSession().then(result => { if (current) setAccess(result); });
    return () => { current = false; };
  }, []);
  return [access, setAccess];
}

export function AdminLogin({ previewAvailable = false }) {
  const router = useRouter();
  const [access] = useAdminSession();
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const emailRef = useRef(null); const passwordRef = useRef(null); const messageRef = useRef(null); const headingRef = useRef(null);
  useEffect(() => { if (access.status === "authenticated") router.replace("/admin/applications"); }, [access.status, router]);

  function changeMode(value) {
    setRecovery(value); setPassword(""); setShow(false); setErrors({}); setMessage("");
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateCredentials({ email, password }, recovery);
    setErrors(invalid); setMessage("");
    if (Object.keys(invalid).length) { (invalid.email ? emailRef : passwordRef).current?.focus(); return; }
    setBusy(true);
    const result = recovery ? await adminAuth.recoverPassword(email) : await adminAuth.signIn({ email, password });
    setBusy(false); setPassword(""); setShow(false);
    if (result.status === "authenticated") { router.replace("/admin/applications"); return; }
    if (result.status === "invalid") { setErrors(result.errors); emailRef.current?.focus(); return; }
    setMessage(result.status === "unavailable"
      ? recovery ? "Password recovery is currently unavailable. No reset email has been sent." : UNAVAILABLE_MESSAGE
      : result.status === "recovery-requested" ? "If this address is eligible, follow the recovery instructions provided by the authentication service."
      : recovery ? "Unable to request password recovery. Please try again." : "Unable to sign in. Check your details and try again.");
    requestAnimationFrame(() => messageRef.current?.focus());
  }

  return <main id="admin-main" className="ka-login">
    <section className="ka-intro" aria-label="KES administrator access"><Brand /><div><p className="ka-eyebrow">Administrator workspace</p><h2>A focused space.<br /><em>A shared purpose.</em></h2><p>Administrator access is separate from membership applications and the Member Portal.</p></div><p className="ka-intro-note">{SOCIETY.motto}</p></section>
    <div className="ka-form-area"><section className="ka-login-card" aria-labelledby="admin-login-title">
      <p className="ka-eyebrow">KIIT Electrical Society</p><h1 id="admin-login-title" ref={headingRef} tabIndex={-1}>{recovery ? "Forgot password?" : "Admin Login"}</h1>
      <p className="ka-description">{recovery ? "Enter your administrator email to request account recovery." : "Sign in with your administrator account."}</p>
      {access.status === "unavailable" && <p className="ka-service-note">Authentication is currently unavailable. {recovery ? "Password recovery is unavailable." : "Sign-in is currently unavailable."}</p>}
      {access.status === "loading" && <p role="status">Checking session…</p>}
      {access.status === "authenticated" && <p role="status">Opening administrator workspace…</p>}
      <form onSubmit={submit} method="post" noValidate aria-busy={busy}>
        <div className="ka-field"><label htmlFor="admin-email">Email address</label><input ref={emailRef} id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: undefined })); setMessage(""); }} aria-invalid={!!errors.email} aria-describedby={errors.email ? "admin-email-error" : undefined} disabled={busy} />{errors.email && <p className="ka-error" id="admin-email-error">{errors.email}</p>}</div>
        {!recovery && <div className="ka-field"><label htmlFor="admin-password">Password</label><div className="ka-password"><input ref={passwordRef} id="admin-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: undefined })); setMessage(""); }} aria-invalid={!!errors.password} aria-describedby={errors.password ? "admin-password-error" : undefined} disabled={busy} /><button type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} aria-controls="admin-password" disabled={busy} onClick={() => setShow(v => !v)}>{show ? "Hide" : "Show"}</button></div>{errors.password && <p className="ka-error" id="admin-password-error">{errors.password}</p>}</div>}
        {message && <p ref={messageRef} tabIndex={-1} className="ka-message" role="alert">{message}</p>}
        <button className="ka-button ka-primary" type="submit" disabled={busy || access.status === "loading" || access.status === "authenticated"}>{busy ? recovery ? "Requesting recovery…" : "Signing in…" : recovery ? "Request password reset" : "Sign In"}</button>
        <button className="ka-text-button" type="button" disabled={busy} onClick={() => changeMode(!recovery)}>{recovery ? "Back to Admin Login" : "Forgot password?"}</button>
      </form>
      <Link className="ka-back" href="/">← Back to the public website</Link>
      {process.env.NODE_ENV === "development" && previewAvailable && <p className="ka-dev-link"><Link href="/admin/applications/preview" prefetch={false}>Open development preview</Link><span>Fictional records · no authentication</span></p>}
    </section></div>
  </main>;
}

export function AdminApplications() {
  const [access, setAccess] = useAdminSession();
  if (access.status === "authenticated") return <AdminPanel session={access.session} service={connectedApplicationsService} onLoggedOut={() => setAccess({ status: "unauthenticated" })} />;
  return <main id="admin-main" className="ka-access"><Brand /><section className="ka-access-card" aria-busy={access.status === "loading"}>
    <p className="ka-eyebrow">Administrator access</p><h1>{access.status === "loading" ? "Checking your session…" : access.status === "unauthenticated" ? "Sign in to continue." : "Service unavailable."}</h1>
    <p role="status">{access.status === "loading" ? "Please wait while administrator access is checked." : access.status === "unauthenticated" ? "An administrator session is required to open Applications." : UNAVAILABLE_MESSAGE}</p>
    {access.status !== "loading" && <Link className="ka-button ka-primary" href="/admin/login">Go to Admin Login</Link>}
    <Link className="ka-back" href="/">← Back to the public website</Link>
  </section></main>;
}

export function AdminPanel({ session, preview = false, service = applicationsService, previewTools = null, reviewKey = 0, onLoggedOut }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function logout() {
    if (preview) { router.replace("/admin/login"); return; }
    setBusy(true); setError("");
    const result = await adminAuth.logout(); setBusy(false);
    if (result.status === "unauthenticated") { onLoggedOut?.(); router.replace("/admin/login"); }
    else setError("Logout service unavailable. Your session could not be confirmed as ended. Please try again.");
  }
  return <div className="ka-shell">
    <aside className="ka-sidebar"><Brand /><nav aria-label="Administrator"><Link href={preview ? "/admin/applications/preview" : "/admin/applications"} aria-current="page">Applications</Link></nav><p>Administrator workspace</p><Link className="ka-back" href="/">Public website ↗</Link></aside>
    <div className="ka-workspace"><header className="ka-topbar"><div className="ka-identity"><span>{preview ? "Fictional administrator" : session?.user?.name || "Administrator"}</span><small>{preview ? "Development preview" : session?.user?.email}</small></div><button className="ka-button" disabled={busy} onClick={logout}>{busy ? "Logging out…" : preview ? "Exit preview" : "Logout"}</button></header>
      <main id="admin-main" className="ka-panel-main">
        {preview && <div className="ka-preview-note"><p>Development preview · fictional data only · no administrator authentication. This preview is unavailable in production.</p>{previewTools}</div>}
        {error && <p className="ka-message" role="alert">{error}</p>}
        <p className="ka-eyebrow">Membership administration</p><h1>Applications</h1><p className="ka-description">Review membership applications, record decisions and prepare applicant messages. Nothing on this page sends email.</p>
        <ApplicationsReview key={reviewKey} service={service} />
      </main>
    </div>
  </div>;
}
