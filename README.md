<p align="center">
  <img src="./public/thing-logo-white.png" alt="Something Logo" width="180"/>
</p>

<h1 align="center" style="font-family: 'Outfit', sans-serif; font-weight: 800; border-bottom: none; letter-spacing: -0.05em;">something.</h1>

<p align="center" style="font-size: 1.2rem; color: #a1a1aa; font-family: 'Outfit', sans-serif;">
  <b>protect the idea. find the conviction.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-v2.0-34D399?style=flat-square&labelColor=0d0d11" alt="Version"/>
  <img src="https://img.shields.io/badge/Security-Cryptographic%20NDA-E3C27A?style=flat-square&labelColor=0d0d11" alt="Security"/>
  <img src="https://img.shields.io/badge/Status-Waitlist%20Active-white?style=flat-square&labelColor=0d0d11" alt="Status"/>
</p>

---

## The Vision

In the startup ecosystem, ideas are cheap—yet founders are terrified to share them, and investors are overloaded with noise. Diligence is slow, agreements are opaque, and trust is hard to scale.

**something.** changes the game. 

It is a next-generation platform that brings founders and early-conviction investors together under cryptographic trust defaults. We stress-test ideas, align milestones, and release capital transparently.

---

## Core Pillars

### 1. Cryptographic Trust Defaults
No more handshake deals or tedious lawyer negotiations. Every interaction, project disclosure, and match is protected by **mutual NDAs by default**. Your identity and IP stay hashed until you explicitly grant consent.

### 2. Escrow-Gated Milestone Releases
Aligning incentives in real-time. Capital is released dynamically as milestones are reached and verified, providing zero lock-in contracts and securing both sides.

### 3. AI-Assisted Conviction Testing
Two AI minds stress-test the reality of your product. We don't just validate hypotheses—we find why users will stay, helping founders build conviction and investors spot hidden potential.

---

## High-Fidelity Interface

Designed to feel premium, responsive, and alive. 

* **The Action Picker:** A simple, high-friction selector separating the paths for builders and backers.
* **Streamlined Waitlist Flow:** A 2-step signup wizard optimizing for speed. We collect your email and optional details (full name, social links, core expertise, or investment interests) and automatically generate secure access keys in the background.
* **URL Role Detection:** Seamlessly directs users coming from marketing campaigns, highlighting and defaulting their chosen signup path.

---

## Security Architecture

To protect the launch waitlist, the application utilizes a serverless gateway proxy (`/api/signup`) with active defense parameters:

* **CSRF Protection:** Strictly rejects any submissions originating from external domains.
* **Sliding-Window IP Rate Limiter:** Restricts registrations to a maximum of **5 requests per minute per IP** to prevent bot spams.
* **HTML Sanitization:** Cleanses text entries to prevent database cell and script injections.
* **Data Privacy:** Signups are streamed directly to your own private Google Spreadsheet via a secure Apps Script endpoint.

---

## Deploying the Landing Page

For engineers deploying this startup landing page:

### 1. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Add your Apps Script Web App URL to the `.env` file:
```env
FORM_ENDPOINT=https://script.google.com/macros/s/AKfycb.../exec
```

### 2. Local Startup
```bash
npm install
npm run dev
```

### 3. Production Deployment
Host the app on Vercel or any Next.js compatible hosting provider, configuring `FORM_ENDPOINT` as an environment variable in your dashboard.

---
<p align="center">
  <sub>Developed by <b>something.to</b></sub>
</p>
