# Local Development Guide

This document describes how to set up, develop, and test the KIIT Electrical Society website locally.

---

## 1. Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **npm:** v10+
- **Git**

---

## 2. Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushKumar1624/KIIT-Eletrical-Society-Website.git
   cd KIIT-Eletrical-Society-Website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   For local offline development, you can use:
   - `JOIN_DELIVERY=console` (prints 6-digit OTP codes in the server console instead of sending real emails)
   - `JOIN_STORE=mongodb` (connects to local or Atlas MongoDB)

4. **Verify Environment Configuration:**
   ```bash
   npm run env:check
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Available NPM Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000`. |
| `npm run build` | Compiles optimized Next.js production build. |
| `npm start` | Runs the compiled production build locally. |
| `npm run lint` | Executes ESLint across the codebase. |
| `npm test` | Runs the 82-spec unit and integration test suite. |
| `npm run test:mongo` | Executes the real MongoDB replica set concurrency & transaction tests. |
| `npm run verify:all` | Runs the 10 operational smoke test scenarios. |
| `npm run env:check` | Safely validates environment variables without printing secret values. |
| `npm run production:check` | Automated 8-step pre-flight check for production readiness. |
| `npm run production:init` | Idempotently applies collection schemas, indexes, and seeds default CMS content. |
| `npm run admin:provision` | Interactive CLI to provision the initial administrator account. |
| `npm run jobs:process` | Processes due notification jobs from the MongoDB queue. |
| `npm run content:migrate` | Migrates static factual content into MongoDB CMS collections. |
| `npm run recruitment:cycle` | Opens, closes, or inspects status of recruitment cycles. |

---

## 4. Testing & Verification

Always run all three checks before committing changes:
```bash
npm run lint
npm test
npm run verify:all
```
For a complete pre-flight check:
```bash
npm run production:check
```
