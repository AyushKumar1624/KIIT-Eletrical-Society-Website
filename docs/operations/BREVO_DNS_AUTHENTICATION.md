# Brevo Email Domain Authentication Guide (SPF, DKIM, DMARC)

This guide documents the technical requirements, DNS records, and administrator workflows needed to fully authenticate outgoing emails sent on behalf of the KIIT Electrical Society (`@kiit.ac.in`) via Brevo SMTP relay.

---

## 1. Problem Statement: Why Gmail Displays "via brevosend.com"

When KES emails are dispatched using the institutional address `KIIT Electrical Society <24161010@kiit.ac.in>` through Brevo SMTP:
- If the sending domain (`kiit.ac.in`) is **unauthenticated in Brevo**, Brevo's default shared signing domain (`brevosend.com` or `sender-sib.com`) is injected into the email headers (`Sender` and `Return-Path`).
- Gmail and Outlook display this to recipients as:
  > **KIIT Electrical Society <24161010@kiit.ac.in> via brevosend.com**
- Furthermore, unauthenticated emails may trigger spam filters, fail SPF alignment, or be flagged with phishing warnings.

To achieve clean, professional institutional branding (`mailed-by: kiit.ac.in` and `signed-by: kiit.ac.in` with no "via" tag), the `kiit.ac.in` domain (or an authorized subdomain like `electrical.kiit.ac.in`) must be authenticated in Brevo and verified on the university DNS nameservers.

---

## 2. Authentication Requirements Breakdown

### A. DKIM (DomainKeys Identified Mail)
- **What it does:** Cryptographically signs outbound email headers using a private key held by Brevo. The receiving mail server retrieves the public key published in your DNS to verify that the email was not modified in transit.
- **Header outcome:** Changes `signed-by: brevosend.com` to `signed-by: kiit.ac.in` (or subdomain).

### B. SPF (Sender Policy Framework)
- **What it does:** Lists authorized IP addresses and hostnames allowed to send mail on behalf of the domain.
- **Header outcome:** Ensures `spf=pass` for the Brevo relay IPs (`include:spf.brevo.com`).

### C. DMARC (Domain-based Message Authentication, Reporting, and Conformance)
- **What it does:** Establishes alignment policy between the `From` header, SPF domain, and DKIM signature. Tells receiving mail servers how to treat messages that fail SPF or DKIM (e.g., `p=none`, `p=quarantine`, or `p=reject`).

### D. Custom Return-Path (Branded Envelope Sender)
- **What it does:** Replaces Brevo's default envelope sender (`bounce-...@mail.brevosend.com`) with a branded address on your domain (e.g., `mail.electrical.kiit.ac.in`).
- **Header outcome:** Changes `mailed-by: brevosend.com` to `mailed-by: electrical.kiit.ac.in`.

---

## 3. How to Obtain the Exact DNS Records from Brevo

> [!IMPORTANT]
> **Do NOT guess or invent DNS record values.** Brevo generates unique DKIM selectors and verification hashes for each account and domain.

To retrieve the exact records:
1. Log in to the [Brevo Admin Dashboard](https://app.brevo.com/).
2. Navigate to **Senders, Domains & Dedicated IPs** -> **Domains**.
3. Click **Add a domain**.
4. Enter either:
   - Root domain: `kiit.ac.in` (requires university-wide IT approval), or
   - Subdomain: `electrical.kiit.ac.in` (recommended if society owns subdomain DNS control).
5. Brevo will display a table containing 3 or 4 specific DNS records to add:
   - **Domain Verification Record (TXT):** Proves domain ownership to Brevo.
   - **DKIM Record (TXT):** Usually `mail._domainkey.<domain>` or `k1._domainkey.<domain>` with a public RSA key `k=rsa; p=MIGf...`.
   - **SPF Record (TXT):** Directs DNS to `include:spf.brevo.com`.
   - **DMARC Record (TXT):** Usually `_dmarc.<domain>` with `v=DMARC1; p=none; ...`.

---

## 4. University IT / DNS Administrator Request

Because `kiit.ac.in` is the official institutional domain of Kalinga Institute of Industrial Technology, modifying DNS records requires raising an official request with the **KIIT ICT / Systems Administration Cell**.

### Recommended Action Plan:
If KIIT ICT permits subdomain delegation:
- Request delegation or CNAME/TXT record additions for **`electrical.kiit.ac.in`**.
- Example Request Template:

```text
Subject: Request for DNS Record Configuration for KES Official Email Relay (Brevo)

Dear KIIT ICT Team,

The KIIT Electrical Society (KES) is configuring institutional email notifications (applicant acknowledgements, interview invites, and society announcements) through our SMTP service (Brevo).

To ensure high email deliverability and eliminate phishing warnings in recipient inboxes, we kindly request the addition of the following DNS records for electrical.kiit.ac.in (or kiit.ac.in):

[Insert the exact values generated from the Brevo Dashboard]:
1. TXT Record for Domain Ownership Verification
   - Host: @ (or electrical.kiit.ac.in)
   - Value: [Brevo verification code]

2. TXT Record for DKIM (Email Signature)
   - Host: mail._domainkey.electrical.kiit.ac.in
   - Value: [Brevo DKIM Public Key]

3. TXT Record for SPF (Sender Authorization)
   - Host: electrical.kiit.ac.in
   - Value: "v=spf1 include:spf.brevo.com ~all"

4. TXT Record for DMARC
   - Host: _dmarc.electrical.kiit.ac.in
   - Value: "v=DMARC1; p=none; rua=mailto:24161010@kiit.ac.in"

Thank you,
KIIT Electrical Society (KES)
```

---

## 5. Verification & Testing

Once KIIT DNS administrators confirm records have been propagated (typically 15 minutes to 24 hours):

### Step 1: Verify in Brevo Dashboard
1. Go back to **Senders & Domains** in Brevo.
2. Click **Check configuration** or **Verify domain**.
3. Confirm that all checkmarks turn green (**Authenticated**).

### Step 2: Send a Test Email via Operational Script
Run the local test utility to trigger a real test message to an authorized recipient:
```bash
node -e "
import { deliverNotificationJob } from './lib/notifications/runner.js';
// Test delivery logic
"
```
Or use `npm run jobs:process` after submitting a test application.

### Step 3: Inspect Raw Headers in Gmail
1. Open the test email received in Gmail.
2. Click the three dots (More options) -> **Show original**.
3. Verify the authentication badges:
   - **SPF:** `PASS` with IP authorized
   - **DKIM:** `PASS` with domain matching `kiit.ac.in` / `electrical.kiit.ac.in`
   - **DMARC:** `PASS`
4. Confirm that the Gmail "via brevosend.com" notice is gone.
