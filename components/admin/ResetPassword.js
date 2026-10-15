"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminAuth } from "@/lib/admin/auth.mjs";

export default function ResetPassword() {
  const tokenRef = useRef(""); const feedbackRef = useRef(null);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (incoming) tokenRef.current = incoming;
    // Remove the bearer token from the address bar/history immediately. It is
    // held only in this component, never in browser storage or a GET request.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    if (password.length < 15 || password.length > 128 || password !== confirm) { setMessage("Use 15–128 characters and make sure both passwords match."); requestAnimationFrame(() => feedbackRef.current?.focus()); return; }
    setBusy(true); setMessage(""); const result = await adminAuth.resetPassword(tokenRef.current, password); setBusy(false); setPassword(""); setConfirm("");
    if (result.status === "unauthenticated" && result.passwordReset) { setDone(true); tokenRef.current = ""; setMessage("Password changed. Previous sessions are no longer valid. Sign in with your new password."); }
    else setMessage(result.status === "unavailable" ? "Password reset is currently unavailable. Please try again later." : "This reset link is invalid or expired, or the request could not be completed. Request a new link from Admin Login.");
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  return <main id="admin-main" className="ka-access"><section className="ka-access-card"><p className="ka-eyebrow">KIIT Electrical Society</p><h1>Reset admin password</h1><p className="ka-description">Choose a new password for your administrator account.</p>{message && <p ref={feedbackRef} tabIndex={-1} role={done ? "status" : "alert"} className="ka-message">{message}</p>}{!done && <form method="post" noValidate onSubmit={submit} aria-busy={busy} style={{ marginTop: 24 }}><div className="ka-field"><label htmlFor="reset-password">New password</label><input id="reset-password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} /></div><div className="ka-field"><label htmlFor="reset-confirm">Confirm new password</label><input id="reset-confirm" type="password" autoComplete="new-password" required disabled={busy} value={confirm} onChange={e => setConfirm(e.target.value)} /></div><button type="submit" className="ka-button ka-primary" disabled={busy}>{busy ? "Resetting password…" : "Reset password"}</button></form>}<Link className="ka-back" href="/admin/login">Back to Admin Login</Link></section></main>;
}
