"use client";

// Join KES: institutional email → one-time code → stepped application.
// Services come from lib/join/service.js; without one, the page says so plainly
// and never claims a code was sent or an application received. Verification is
// an HttpOnly cookie the page cannot read; answers live only in memory.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MEDIA, SOCIETY, CONTACT } from "@/lib/content";
import { checkInstitutionalEmail, EMAIL_MESSAGES } from "@/lib/join/eligibility.mjs";
import {
  STEPS, DOMAIN_GROUPS, YEAR_OPTIONS, LIMITS, EMPTY_APPLICATION,
  graduationYears, validateStep, validateApplication, toSubmission, domainLabel,
} from "@/lib/join/application.mjs";
import { getJoinService } from "@/lib/join/service";

// Build-time constant: production bundles drop every developer-preview branch.
const DEV_PREVIEW = process.env.NODE_ENV === "development";
const LAST = STEPS.length - 1;
const GRAD_YEARS = graduationYears();
const INSTAGRAM = CONTACT.social.find(s => s.label === "Instagram")?.url;

const MSG = {
  noService: "Online applications aren’t open yet. Email verification isn’t connected to this website, so codes can’t be sent right now.",
  noSubmission: "Applications aren’t open for submission right now. You can verify your email and prepare your answers, but the form can’t be submitted until recruitment opens.",
  sendUnavailable: "No code was sent: email verification isn’t connected to this website yet.",
  sendError: "We couldn’t send a code just now. Check your connection and try again.",
  verifyUnavailable: "Your code couldn’t be checked: email verification isn’t connected to this website yet.",
  verifyError: "We couldn’t check your code just now. Please try again.",
  submitUnavailable: "Your application wasn’t sent: the application service is unavailable right now. Your answers are kept on this page — please try again shortly.",
  submitClosed: "Your application wasn’t sent: applications for this recruitment cycle are closed. Your answers are kept on this page.",
  submitError: "We couldn’t submit your application. Check your connection and try again — your answers are kept.",
  submitDuplicate: "An application from this email address has already been received. KES will contact you about the next steps.",
  submitReverify: "Your email verification has expired. Verify your email again — your answers are kept.",
};

// Answers are kept in memory only, never in browser storage: a reload starts
// a fresh form. They survive errors and re-verification on this page.
const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const focusById = id => requestAnimationFrame(() => document.getElementById(id)?.focus());
const fieldId = field => field === "domains" ? `join-domain-${DOMAIN_GROUPS[0].options[0].key}` : `join-${field}`;

export default function JoinFlow({ preview = false, status = {} }) {
  const verificationReady = Boolean(status.verification);
  const applicationsReady = Boolean(status.applications);
  const [service, setService] = useState(null);
  const [phase, setPhase] = useState("email"); // email | code | form | done

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null); // { tone: "error" | "ok", text }
  const [devNote, setDevNote] = useState(""); // development server only: where the code went

  const [pendingEmail, setPendingEmail] = useState("");
  const [expiresIn, setExpiresIn] = useState(600);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // { email } — the credential is an HttpOnly cookie

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [values, setValues] = useState(EMPTY_APPLICATION);
  const [errors, setErrors] = useState({});
  const [announce, setAnnounce] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // { text, reverify? }
  const [result, setResult] = useState(null);
  const [previewMode, setPreviewMode] = useState("available");

  const headingRef = useRef(null);
  const focusHeading = useRef(false);

  useEffect(() => {
    let live = true;
    getJoinService({ preview, status: { verification: verificationReady, applications: applicationsReady } })
      .then(s => { if (live) setService(s); });
    return () => { live = false; };
  }, [preview, verificationReady, applicationsReady]);

  // Clear any draft an earlier version of this page left in sessionStorage.
  useEffect(() => { try { window.sessionStorage.removeItem("kes-join-draft"); } catch { /* ignore */ } }, []);

  // Move focus to the new screen's heading after a step or phase change.
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    const h = headingRef.current;
    if (!h) return;
    h.focus({ preventScroll: true });
    const top = h.getBoundingClientRect().top;
    if (top < 96 || top > window.innerHeight * 0.6) document.getElementById("join-card")?.scrollIntoView({ block: "start" });
  }, [phase, step]);

  const cooling = phase === "code" && resendAt > now;
  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooling]);
  const resendIn = cooling ? Math.ceil((resendAt - now) / 1000) : 0;

  const goPhase = p => { setPhase(p); setNotice(null); focusHeading.current = true; };
  const goStep = i => {
    setStep(i); setFurthest(f => Math.max(f, i)); setErrors({}); setAnnounce(""); setSubmitError(null);
    focusHeading.current = true;
  };

  // ── Email ─────────────────────────────────────────────
  async function sendCode(target, { resend = false } = {}) {
    if (!service || sending) return;
    const check = checkInstitutionalEmail(target);
    if (!check.ok) { setEmailError(check.message); focusById("join-email"); return; }
    setEmailError(""); setNotice(null); setSending(true);
    const res = await service.requestCode(check.email);
    setSending(false);
    if (res.status === "sent") {
      const t = Date.now();
      setNow(t); setResendAt(t + (res.resendAfter ?? 60) * 1000); setExpiresIn(res.expiresIn ?? 600);
      setPendingEmail(check.email); setEmail(check.email); setCode(""); setCodeError(""); setDevNote(res.devNote || "");
      if (resend) setNotice({ tone: "ok", text: `A new code is on its way to ${check.email}. Earlier codes no longer work.` });
      else goPhase("code");
    } else if (res.status === "ineligible") {
      setEmailError(EMAIL_MESSAGES.domain); if (resend) goPhase("email");
    } else if (res.status === "rate_limited") {
      const wait = res.retryAfter ?? 60, t = Date.now();
      setNow(t); setResendAt(t + wait * 1000);
      setNotice({ tone: "error", text: `Too many codes requested. Try again in ${clock(wait)}.` });
    } else {
      setNotice({ tone: "error", text: res.status === "unavailable" ? MSG.sendUnavailable : MSG.sendError });
    }
  }

  // ── Code ──────────────────────────────────────────────
  async function confirmCode(e) {
    e.preventDefault();
    if (!service || verifying) return;
    if (!/^\d{6}$/.test(code)) { setCodeError("Enter the 6-digit code from the email."); focusById("join-code"); return; }
    setCodeError(""); setNotice(null); setVerifying(true);
    const res = await service.verifyCode(pendingEmail, code);
    setVerifying(false);
    if (res.status === "verified" && typeof res.email === "string") {
      setVerified({ email: res.email }); setCode(""); setSubmitError(null);
      goPhase("form");
      return;
    }
    if (res.status === "invalid") {
      const left = typeof res.attemptsLeft === "number" ? ` ${res.attemptsLeft} ${res.attemptsLeft === 1 ? "attempt" : "attempts"} left.` : "";
      setCodeError(`That code doesn’t match. Check the latest email from KES and try again.${left}`);
    } else if (res.status === "expired") {
      setCodeError("This code has expired. Request a new code to continue."); setResendAt(0);
    } else if (res.status === "locked") {
      setCodeError("Too many incorrect attempts. Request a new code to try again."); setResendAt(0);
    } else {
      setNotice({ tone: "error", text: res.status === "unavailable" ? MSG.verifyUnavailable : MSG.verifyError });
      return;
    }
    focusById("join-code");
  }

  function changeEmail() {
    setCode(""); setCodeError(""); setPendingEmail(""); setResendAt(0);
    goPhase("email");
    focusHeading.current = false;
    focusById("join-email");
  }

  // ── Application ───────────────────────────────────────
  const stepId = STEPS[step].id;
  const setFieldError = (field, message) => setErrors(prev => {
    const next = { ...prev };
    if (message) next[field] = message; else delete next[field];
    return next;
  });
  function update(field, value) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (errors[field]) setFieldError(field, validateStep(stepId, nextValues)[field]);
  }
  // On leaving a field, flag format problems; "required" waits for Continue.
  function blur(field) {
    const v = values[field];
    if (!errors[field] && (typeof v !== "string" || !v.trim())) return;
    setFieldError(field, validateStep(stepId, values)[field]);
  }
  const bind = field => ({ name: field, value: values[field], onChange: e => update(field, e.target.value), onBlur: () => blur(field) });

  function showErrors(e) {
    setErrors(e);
    const fields = Object.keys(e);
    setAnnounce(`${fields.length} ${fields.length === 1 ? "answer needs" : "answers need"} attention.`);
    const first = STEPS.find(s => s.id === stepId).fields.find(f => e[f]) ?? fields[0];
    focusById(fieldId(first));
  }

  function next() {
    const e = validateStep(stepId, values);
    if (Object.keys(e).length) { showErrors(e); return; }
    const target = returnToReview ? LAST : step + 1;
    setReturnToReview(false);
    goStep(target);
  }

  function jump(i) {
    if (i === step) return;
    if (i > step) {
      const e = validateStep(stepId, values);
      if (Object.keys(e).length) { showErrors(e); return; }
    }
    setReturnToReview(false);
    goStep(i);
  }

  async function submit() {
    if (!service || submitting) return;
    const { firstStep } = validateApplication(values);
    if (firstStep >= 0) {
      const e = validateStep(STEPS[firstStep].id, values);
      if (firstStep !== step) { goStep(firstStep); setErrors(e); setAnnounce("Some answers need attention before you submit."); }
      else showErrors(e);
      return;
    }
    setSubmitting(true); setSubmitError(null);
    const res = await service.submitApplication(toSubmission(values, verified.email));
    setSubmitting(false);
    if (res.status === "submitted") {
      setResult({ reference: typeof res.reference === "string" ? res.reference : null, submittedAt: typeof res.submittedAt === "string" ? res.submittedAt : null });
      goPhase("done");
    } else if (res.status === "invalid" && res.errors && typeof res.errors === "object") {
      const i = STEPS.findIndex(s => s.fields.some(f => res.errors[f]));
      if (i >= 0) { goStep(i); setErrors(res.errors); setAnnounce("Some answers need attention before you submit."); }
      else setSubmitError({ text: MSG.submitError });
    } else if (res.status === "unauthorized") {
      setSubmitError({ text: MSG.submitReverify, reverify: true });
    } else if (res.status === "duplicate") {
      setSubmitError({ text: MSG.submitDuplicate });
    } else {
      setSubmitError({ text: res.status === "unavailable" ? (res.reason === "closed" ? MSG.submitClosed : MSG.submitUnavailable) : MSG.submitError });
    }
  }

  function reverify() {
    setEmail(verified?.email ?? email);
    setVerified(null);
    setSubmitError(null);
    goPhase("email");
  }

  // ── Developer preview (development server only) ───────
  const previewAction = !DEV_PREVIEW ? null : action => {
    const demo = "preview.applicant@kiit.ac.in";
    const ensureVerified = () => { if (!verified) setVerified({ email: demo }); };
    if (action === "fill") {
      setValues(v => ({ ...v, ...service.sample() })); setErrors({});
    } else if (action === "email") {
      goPhase("email");
    } else if (action === "code") {
      const t = Date.now();
      setPendingEmail(p => p || demo); setNow(t); setResendAt(t + 30000); setCode(""); setCodeError("");
      goPhase("code");
    } else if (action.startsWith("step-")) {
      ensureVerified();
      const i = Number(action.slice(5));
      setStep(i); setFurthest(f => Math.max(f, i)); setErrors({}); setSubmitError(null);
      goPhase("form");
    } else if (action === "done") {
      ensureVerified(); setResult({ reference: "KES-PREV-IEW0", submittedAt: new Date().toISOString() }); goPhase("done");
    }
  };

  const isPreview = DEV_PREVIEW && Boolean(service?.preview);
  const heading = { ref: headingRef, tabIndex: -1, id: "join-step-heading" };

  return (
    <div className={`join-layout join-layout--${phase}`}>
      {DEV_PREVIEW && isPreview && (
        <PreviewBar
          codes={service.codes} mode={previewMode}
          onMode={m => { service.setMode(m); setPreviewMode(m); }}
          onAction={previewAction}
        />
      )}

      <aside className="join-aside">
        <div className="join-brand">
          <Image src={MEDIA.logo.src} alt="" width={56} height={56} />
          <div>
            <p className="join-brand-name">{SOCIETY.name}</p>
            <p className="join-motto">{SOCIETY.motto}</p>
          </div>
        </div>
        <h1 className="join-title">Your journey with KES <em>starts here.</em></h1>
        {(phase === "email" || phase === "code") && (
          <>
            <p className="join-intro">
              KES is a student community at KIIT where you learn by doing — in workshops, on small project teams and alongside
              people from engineering, design and media. Beginners are welcome; curiosity is enough.
            </p>
            <ul className="join-pillars">
              <li><strong>Learn</strong><span>Hands-on workshops where you try things yourself.</span></li>
              <li><strong>Build</strong><span>Small projects with a team, from idea to working prototype.</span></li>
              <li><strong>Collaborate</strong><span>Work with engineers, designers, writers and photographers.</span></li>
            </ul>
          </>
        )}
        {phase === "form" && <Progress step={step} furthest={furthest} onJump={jump} />}
      </aside>

      <section className="join-card" id="join-card" aria-labelledby="join-step-heading">
        {phase === "email" && (
          <form className="join-step" noValidate onSubmit={e => { e.preventDefault(); sendCode(email); }}>
            <p className="join-eyebrow">Verify your email</p>
            <h2 className="join-heading" {...heading}>Start with your KIIT email</h2>
            <p className="join-lede">We’ll send a one-time code to confirm the address belongs to you.</p>
            {service && !service.available && (
              <div className="join-notice join-notice--info" role="note">
                <p>{MSG.noService}</p>
                {INSTAGRAM && <p>Recruitment drives are announced on <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">KES Instagram<span className="sr-only"> (opens in a new tab)</span></a>.</p>}
              </div>
            )}
            {service?.available && !service.applicationsAvailable && (
              <div className="join-notice join-notice--info" role="note"><p>{MSG.noSubmission}</p></div>
            )}
            <Field id="join-email" label="KIIT institutional email" hint="For example, rollnumber@kiit.ac.in." error={emailError}>
              {a => (
                <input
                  {...a} type="email" name="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                  required aria-required="true" value={email}
                  onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                />
              )}
            </Field>
            {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
            <div className="join-actions">
              <button type="submit" className="btn btn-brass join-primary" disabled={!service || sending} aria-busy={sending || undefined}>
                {sending ? "Sending code…" : "Continue with KIIT Email"} <Arrow />
              </button>
            </div>
            <p className="join-fine"><Lock /> KES will never ask for your email password — only the one-time code we send you.</p>
          </form>
        )}

        {phase === "code" && (
          <form className="join-step" noValidate onSubmit={confirmCode}>
            <p className="join-eyebrow">Confirm it’s you</p>
            <h2 className="join-heading" {...heading}>Check your inbox</h2>
            <p className="join-lede">
              Enter the 6-digit code sent to <strong className="join-email-chip">{pendingEmail}</strong>. It expires in {Math.round(expiresIn / 60)} minutes.
              If it hasn’t arrived, check your spam folder.
            </p>
            {devNote && <p className="join-preview-note">{devNote}</p>}
            {DEV_PREVIEW && isPreview && <p className="join-preview-note">Developer preview: no email was sent. Use code {service.codes.valid}; {service.codes.expired} shows an expired code.</p>}
            <Field id="join-code" label="One-time code" error={codeError}>
              {a => (
                <input
                  {...a} className="join-code-input" type="text" name="code" inputMode="numeric" autoComplete="one-time-code"
                  pattern="[0-9]*" maxLength={6} required aria-required="true" value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (codeError) setCodeError(""); }}
                />
              )}
            </Field>
            {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
            <div className="join-actions">
              <button type="submit" className="btn btn-brass join-primary" disabled={verifying} aria-busy={verifying || undefined}>
                {verifying ? "Checking code…" : "Verify email"} <Arrow />
              </button>
            </div>
            <div className="join-links">
              <button type="button" className="join-text-btn" disabled={resendIn > 0 || sending} onClick={() => sendCode(pendingEmail, { resend: true })}>
                {sending ? "Sending…" : resendIn > 0 ? `Resend code in ${clock(resendIn)}` : "Resend code"}
              </button>
              <button type="button" className="join-text-btn" onClick={changeEmail}>Use a different email</button>
            </div>
          </form>
        )}

        {phase === "form" && verified && (
          <form className="join-step" noValidate onSubmit={e => { e.preventDefault(); if (step === LAST) submit(); else next(); }}>
            <p className="join-verified"><span className="join-verified-label"><Check /> Verified</span> <span className="join-verified-email">{verified.email}</span></p>
            <p className="join-eyebrow">Step {step + 1} of {STEPS.length}</p>
            <h2 className="join-heading" {...heading}>{STEPS[step].title}</h2>

            {stepId === "personal" && (
              <>
                <p className="join-lede">All fields are required unless marked optional.</p>
                <Field id="join-fullName" label="Full name" error={errors.fullName}>
                  {a => <input {...a} {...bind("fullName")} type="text" autoComplete="name" maxLength={LIMITS.name} required aria-required="true" />}
                </Field>
                <Field id="join-verifiedEmail" label="Institutional email" hint="Verified with a one-time code. To use another address, verify it again.">
                  {a => <input {...a} type="email" value={verified.email} readOnly aria-readonly="true" className="join-readonly" />}
                </Field>
                <Field id="join-whatsapp" label="WhatsApp number" hint="KES may contact you here about recruitment. Include your country code if it isn’t +91." error={errors.whatsapp}>
                  {a => <input {...a} {...bind("whatsapp")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} required aria-required="true" />}
                </Field>
              </>
            )}

            {stepId === "academic" && (
              <>
                <p className="join-lede">Write these as they appear on your KIIT ID card.</p>
                <Field id="join-roll" label="KIIT roll number" error={errors.roll}>
                  {a => <input {...a} {...bind("roll")} type="text" autoComplete="off" maxLength={20} required aria-required="true" />}
                </Field>
                <Field id="join-school" label="School / institute" hint="For example, School of Electrical Engineering." error={errors.school}>
                  {a => <input {...a} {...bind("school")} type="text" autoComplete="organization" maxLength={LIMITS.text} required aria-required="true" />}
                </Field>
                <Field id="join-programme" label="Branch / programme" hint="For example, B.Tech Electrical Engineering." error={errors.programme}>
                  {a => <input {...a} {...bind("programme")} type="text" maxLength={LIMITS.text} required aria-required="true" />}
                </Field>
                <div className="join-pair">
                  <Field id="join-year" label="Current year of study" error={errors.year}>
                    {a => (
                      <select {...a} {...bind("year")} required aria-required="true">
                        <option value="">Select year</option>
                        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field id="join-graduation" label="Expected graduation year" error={errors.graduation}>
                    {a => (
                      <select {...a} {...bind("graduation")} required aria-required="true">
                        <option value="">Select year</option>
                        {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    )}
                  </Field>
                </div>
              </>
            )}

            {stepId === "domains" && (
              <DomainPicker
                selected={values.domains} error={errors.domains}
                onChange={domains => update("domains", domains)}
              />
            )}

            {stepId === "interests" && (
              <>
                <p className="join-lede">There are no wrong answers, and no experience is needed. Tell us what you’re curious about.</p>
                <Field id="join-motivation" label="Why do you want to join KES?" hint="A few sentences is plenty." error={errors.motivation}
                  counter={<Counter value={values.motivation} max={LIMITS.motivation} />}>
                  {a => <textarea {...a} {...bind("motivation")} rows={4} maxLength={LIMITS.motivation} required aria-required="true" />}
                </Field>
                <Field id="join-skills" label="Relevant skills or experience" optional hint="Anything counts — school projects, hobbies, courses, or nothing yet." error={errors.skills}
                  counter={<Counter value={values.skills} max={LIMITS.long} />}>
                  {a => <textarea {...a} {...bind("skills")} rows={3} maxLength={LIMITS.long} />}
                </Field>
                <Field id="join-explore" label="Projects or interests you’d like to explore" optional error={errors.explore}
                  counter={<Counter value={values.explore} max={LIMITS.long} />}>
                  {a => <textarea {...a} {...bind("explore")} rows={3} maxLength={LIMITS.long} />}
                </Field>
                <Field id="join-link" label="Portfolio, GitHub or LinkedIn link" optional hint="Starts with https://" error={errors.link}>
                  {a => <input {...a} {...bind("link")} type="url" inputMode="url" autoComplete="url" maxLength={LIMITS.link} spellCheck={false} />}
                </Field>
              </>
            )}

            {stepId === "review" && (
              <>
                <p className="join-lede">Check your answers before you submit. You can edit any section.</p>
                <Review values={values} email={verified.email} onEdit={i => { setReturnToReview(true); goStep(i); }} />
                <div className="join-data-note">
                  <h3>How your details are used</h3>
                  <p>
                    KES uses this application to review your interest, plan recruitment by domain and contact you about your application.
                    Your answers are not published on this website. Applying does not guarantee selection.
                  </p>
                </div>
                <Checkbox id="join-confirmAccurate" checked={values.confirmAccurate} error={errors.confirmAccurate}
                  onChange={v => update("confirmAccurate", v)} label="I confirm that the information provided is accurate." />
                <Checkbox id="join-consentContact" checked={values.consentContact} error={errors.consentContact}
                  onChange={v => update("consentContact", v)} label="I agree to be contacted by KES regarding my application and recruitment." />
              </>
            )}

            <p className="sr-only" aria-live="polite">{announce}</p>
            {submitError && (
              <Notice tone="error">
                {submitError.text}
                {submitError.reverify && <> <button type="button" className="join-text-btn join-text-btn--inline" onClick={reverify}>Verify email again</button></>}
              </Notice>
            )}
            <div className="join-actions">
              {step > 0 && (
                <button type="button" className="btn join-btn-quiet" onClick={() => { setReturnToReview(false); goStep(step - 1); }}>
                  <span aria-hidden="true">←</span> Back
                </button>
              )}
              <button type="submit" className="btn btn-brass join-primary" disabled={submitting} aria-busy={submitting || undefined}>
                {step === LAST
                  ? (submitting ? "Submitting…" : "Submit Application")
                  : returnToReview ? "Save and return to review" : `Continue to ${STEPS[step + 1].title.toLowerCase()}`}
                {step !== LAST && <Arrow />}
              </button>
            </div>
            {step === LAST && <p className="join-fine">Applying does not guarantee selection.</p>}
          </form>
        )}

        {phase === "done" && (
          <div className="join-step join-done">
            <p className="join-eyebrow">Application received</p>
            <h2 className="join-heading" {...heading}>Thank you{values.fullName.trim() ? `, ${values.fullName.trim().split(/\s+/)[0]}` : ""}.</h2>
            {DEV_PREVIEW && isPreview && <p className="join-preview-note">Developer preview: nothing was submitted or saved.</p>}
            <p className="join-lede">
              Your application to {SOCIETY.name} has been received. KES will contact you at{" "}
              <strong className="join-email-chip">{verified?.email}</strong> about the next stage of recruitment.
            </p>
            {result?.reference && (
              <p className="join-reference">
                Reference <strong>{result.reference}</strong>
                {result.submittedAt && <> · submitted <time dateTime={result.submittedAt}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(result.submittedAt))} IST</time></>}
              </p>
            )}
            <p className="join-fine">Keep this reference if you need to contact KES about your application. Applying is not membership: KES will contact you if you are selected.</p>
            <p className="join-fine">Applying does not guarantee selection. Thank you for your interest in building with us.</p>
            <div className="join-actions">
              <Link className="btn btn-brass join-primary" href="/">Back to the KES website</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────

function Field({ id, label, hint, error, optional = false, counter = null, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`join-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}{optional && <span className="join-optional"> (optional)</span>}</label>
      {hint && <p className="join-hint" id={`${id}-hint`}>{hint}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {counter}
      {error && <p className="join-error" id={`${id}-error`}><Alert /> {error}</p>}
    </div>
  );
}

function Counter({ value, max }) {
  const n = value.length;
  return <p className={`join-counter${n > max * 0.9 ? " is-near" : ""}`} aria-hidden="true">{n}/{max}</p>;
}

function Checkbox({ id, checked, onChange, label, error }) {
  return (
    <div className={`join-check${error ? " has-error" : ""}`}>
      <input
        id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        required aria-required="true" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {error && <p className="join-error" id={`${id}-error`}><Alert /> {error}</p>}
    </div>
  );
}

function DomainPicker({ selected, onChange, error }) {
  const toggle = key => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  return (
    <div className="join-domains" role="group" aria-labelledby="join-step-heading" aria-describedby={`join-domains-hint${error ? " join-domains-error" : ""}`}>
      <p className="join-lede" id="join-domains-hint">
        Choose as many as you like — technical, non-technical or both. No prior experience is needed in any of them.
      </p>
      {DOMAIN_GROUPS.map(g => (
        <fieldset key={g.id} className="join-domain-group">
          <legend>{g.label}</legend>
          <ul>
            {g.options.map(o => {
              const on = selected.includes(o.key);
              return (
                <li key={o.key}>
                  <label className={`join-domain${on ? " is-on" : ""}`} htmlFor={`join-domain-${o.key}`}>
                    <input id={`join-domain-${o.key}`} type="checkbox" checked={on} onChange={() => toggle(o.key)} aria-describedby={`join-domain-${o.key}-text`} />
                    <span className="join-domain-copy">
                      <span className="join-domain-name">{o.label}</span>
                      <span className="join-domain-text" id={`join-domain-${o.key}-text`}>{o.text}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
      <p className="join-count" aria-live="polite">{selected.length ? `${selected.length} selected` : "None selected yet"}</p>
      {error && <p className="join-error" id="join-domains-error"><Alert /> {error}</p>}
    </div>
  );
}

function Review({ values, email, onEdit }) {
  const or = (v, fallback = "Not provided") => (v && String(v).trim()) || <span className="join-muted">{fallback}</span>;
  const pick = group => {
    const keys = DOMAIN_GROUPS.find(g => g.id === group).options.map(o => o.key).filter(k => values.domains.includes(k));
    return keys.length ? keys.map(domainLabel).join(", ") : <span className="join-muted">None</span>;
  };
  const sections = [
    [["Full name", or(values.fullName)], ["Institutional email", email], ["WhatsApp number", or(values.whatsapp)]],
    [["KIIT roll number", or(values.roll)], ["School / institute", or(values.school)], ["Branch / programme", or(values.programme)],
      ["Year of study", or(values.year)], ["Expected graduation", or(values.graduation)]],
    [["Technical", pick("technical")], ["Non-technical", pick("non-technical")]],
    [["Why KES", or(values.motivation)], ["Skills or experience", or(values.skills)], ["Would like to explore", or(values.explore)], ["Link", or(values.link)]],
  ];
  return (
    <div className="join-review">
      {sections.map((rows, i) => (
        <section key={STEPS[i].id} className="join-review-block" aria-labelledby={`join-review-${STEPS[i].id}`}>
          <div className="join-review-head">
            <h3 id={`join-review-${STEPS[i].id}`}>{STEPS[i].title}</h3>
            <button type="button" className="join-text-btn" onClick={() => onEdit(i)}>
              Edit<span className="sr-only"> {STEPS[i].title.toLowerCase()}</span>
            </button>
          </div>
          <dl>
            {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Progress({ step, furthest, onJump }) {
  return (
    <nav className="join-progress" aria-label="Application progress">
      <p className="join-progress-count" aria-hidden="true">Step {step + 1} of {STEPS.length} <span>· {STEPS[step].title}</span></p>
      <ol>
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          const marker = <span className="join-progress-mark" aria-hidden="true">{i < step ? <Check /> : i + 1}</span>;
          const text = <span className="join-progress-label">{s.title}{i < step && <span className="sr-only"> (completed)</span>}</span>;
          return (
            <li key={s.id} className={`is-${state}`} aria-current={i === step ? "step" : undefined}>
              {i !== step && i <= furthest
                ? <button type="button" onClick={() => onJump(i)}>{marker}{text}</button>
                : <span className="join-progress-item">{marker}{text}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Notice({ tone = "error", children }) {
  return <div className={`join-notice join-notice--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

function PreviewBar({ codes, mode, onMode, onAction }) {
  return (
    <div className="join-preview" role="region" aria-label="Developer preview controls">
      <p><strong>Developer preview</strong> — development server only. No email is sent and nothing is saved. Code {codes.valid} verifies; {codes.expired} is expired; anything else is invalid.</p>
      <div className="join-preview-row">
        <label>Service
          <select value={mode} onChange={e => onMode(e.target.value)}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="failing">Failing (error)</option>
          </select>
        </label>
        <label>Jump to
          <select value="" onChange={e => { if (e.target.value) onAction(e.target.value); }}>
            <option value="">Choose a screen…</option>
            <option value="email">Email entry</option>
            <option value="code">Code entry</option>
            {STEPS.map((s, i) => <option key={s.id} value={`step-${i}`}>{i + 1}. {s.title}</option>)}
            <option value="done">Submitted</option>
          </select>
        </label>
        <button type="button" onClick={() => onAction("fill")}>Fill sample answers</button>
      </div>
    </div>
  );
}

const Arrow = () => <span aria-hidden="true" className="btn-arrow">→</span>;
const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Lock = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
);
const Alert = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 4.5v4.2M8 10.8v.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
