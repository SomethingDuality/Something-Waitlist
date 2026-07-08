import { NextResponse, after } from "next/server"
import { sendWaitlistEmail } from "@/lib/mailer"

// Simple in-memory rate limiting cache
const ipCache = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = ipCache.get(ip) || []
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return true
  activeTimestamps.push(now)
  ipCache.set(ip, activeTimestamps)
  return false
}

function sanitize(input: string): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

export async function POST(request: Request) {
  try {
    // 1. Content-Length limit
    const contentLength = Number(request.headers.get("content-length") || "0")
    if (contentLength > 10 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    // 2. CSRF / Origin check
    const host = request.headers.get("host")
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    if (process.env.NODE_ENV === "production") {
      const allowedHost = host || ""
      const requestOrigin = origin || referer || ""
      if (requestOrigin && !requestOrigin.includes(allowedHost)) {
        return NextResponse.json({ error: "Unauthorized request origin" }, { status: 403 })
      }
    }

    // 3. Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    if (ip !== "unknown" && isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, name, role, plan, linkedin, github, expertise, interests } = body

    // 4. Validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }
    if (name && (typeof name !== "string" || name.length > 100)) {
      return NextResponse.json({ error: "Invalid name format or length" }, { status: 400 })
    }
    if (role !== "founder" && role !== "investor") {
      return NextResponse.json({ error: "Invalid role selection" }, { status: 400 })
    }

    // 5. Sanitize
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedName = name ? sanitize(name) : "Anonymous"
    const sanitizedRole = role
    const sanitizedPlan = plan ? sanitize(plan) : (role === "founder" ? "something" : "nothing")
    const sanitizedLinkedin = linkedin ? sanitize(linkedin) : undefined
    const sanitizedGithub = github ? sanitize(github) : undefined
    const sanitizedExpertise = Array.isArray(expertise)
      ? expertise.map((x: string) => sanitize(x)).filter(Boolean)
      : undefined
    const sanitizedInterests = Array.isArray(interests)
      ? interests.map((x: string) => sanitize(x)).filter(Boolean)
      : undefined

    // 6. Secure payload
    const securePayload = {
      email: sanitizedEmail,
      name: sanitizedName,
      role: sanitizedRole,
      plan: sanitizedPlan,
      linkedin: sanitizedLinkedin,
      github: sanitizedGithub,
      expertise: sanitizedExpertise,
      interests: sanitizedInterests,
      submittedAt: new Date().toISOString(),
    }

    const formEndpoint = process.env.FORM_ENDPOINT

    // ── Run confirmation email and Sheets submission after response ──────
    after(async () => {
      const emailPromise = sendWaitlistEmail(sanitizedEmail, sanitizedName, sanitizedRole).catch((err) => {
        console.error("[mailer] Failed to send waitlist email:", err)
      })

      let sheetsPromise = Promise.resolve()
      if (!formEndpoint) {
        console.warn("FORM_ENDPOINT not configured. Skipping Google Sheets submission.")
      } else {
        sheetsPromise = fetch(formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(securePayload),
        }).then(() => {}).catch((err) => {
          console.error("[sheets] Failed to submit to form endpoint:", err)
        })
      }

      await Promise.all([emailPromise, sheetsPromise])
    })

    return NextResponse.json({
      success: true,
      token: "waitlist-token-" + Math.random().toString(36).slice(2),
      message: !formEndpoint ? "FORM_ENDPOINT not configured. Mocking signup success." : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}