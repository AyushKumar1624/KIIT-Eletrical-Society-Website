# KIIT Electrical Society (KES) — Applicant Privacy Notice & Data Handling Statement

*Last Updated: October 2026*  
*Recruitment Cycle: 2026–27*

> [!NOTE]  
> This notice describes how applicant information is collected, stored, evaluated, and communicated by the KIIT Electrical Society (KES) for the recruitment cycle. This document reflects the technical architecture implemented on the official website. Any formal university-wide legal statements or college policies must be reviewed and formally approved by KIIT Student Activity Centre (KSAC) / faculty advisors prior to public dissemination.

---

## 1. What Information We Collect

When you apply to join KES via `/join`, the following details are requested and recorded:
* **Identification & Contact**: Full Name, WhatsApp Number (for recruitment communications), and institutional email address (`@kiit.ac.in`).
* **Academic Information**: KIIT Roll Number, School / Institute, Branch / Programme, Current Year of Study, and Expected Graduation Year.
* **Domain Preferences**: One or more selected domains (Technical: *Robotics, Embedded Systems, AI/ML, Web Development*; Non-Technical: *Graphic Design, Media/Video, Social Media/Outreach, Event Management, Content Writing*).
* **Motivation & Experience**: Brief statement of interest, technical/creative skills, topics you wish to explore, and an optional portfolio/code repository link.
* **Declarations**: Explicit confirmation of statement accuracy (`confirmAccurate`) and consent to be contacted regarding your application (`consentContact`).

---

## 2. Purpose of Collection

Your application data is used strictly for legitimate society operations:
1. **Eligibility Verification**: Ensuring applicant enrollment in KIIT via institutional email verification and roll-number normalization.
2. **Domain-Specific Review**: Enabling authorized domain leads and faculty coordinators to assess applicant interests and schedule interviews.
3. **Communication**: Delivering automated notifications (OTP verification, application acknowledgement, interview invitations, and recruitment outcomes) via email and WhatsApp.

---

## 3. Data Storage & Technical Safeguards

* **Server-Side Security**: All application data is stored in MongoDB Atlas with strict BSON schema validators. Sensitive fields are never exposed to browser bundles or public APIs.
* **Role-Based Access Control (RBAC)**: Restricted domain reviewers can only access applications matching their assigned technical or non-technical domains.
* **Audit Trail**: Every administrative review note, status transition, and data export is immutably logged with actor identity and timestamps in `audit_logs`.
* **OTP Protection**: One-Time Passwords are never stored in plain text; only cryptographically salted HMAC-SHA256 digests are stored, with automated TTL expiration after 10 minutes.
* **Duplicate Protection**: Candidate records are constrained by unique database indexes on `[cycleId, email]` and `[cycleId, rollNormalized]`, preventing duplicate or conflicting submissions.

---

## 4. Public Content vs. Private Data Isolation

* **Strict Isolation**: Personal applicant data, internal review ratings, interview notes, and audit logs are strictly private. Public APIs (`/api/content/*`) return published society achievements, projects, events, and gallery records only.
* **No Client Leaks**: Unauthenticated visitors cannot enumerate or query candidate records.

---

## 5. Retention & Disposal

* Candidate applications remain associated with the recruitment cycle (`2026-27`) in which they were submitted to allow multi-cycle recruitment tracking.
* Ephemeral session tokens and challenge digests are automatically removed by MongoDB TTL background indexes.

---

## 6. Contact & Inquiries

For recruitment questions or data rectification requests, applicants may reach out to:
* **Faculty Coordinator**: `admin@kes.kiit.ac.in`
* **Admissions & Recruitment Inquiries**: `24161010@kiit.ac.in` / `contact@kiitelectricalsociety.org`
* **Society Headquarters**: School of Electrical Engineering, Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar, Odisha, India.
