import { NextResponse } from "next/server"

// Simple in-memory rate limiting cache
// Key: IP address, Value: Array of timestamps of recent requests
const ipCache = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5 // Maximum 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = ipCache.get(ip) || []
  
  // Filter out timestamps older than the window
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }
  
  activeTimestamps.push(now)
  ipCache.set(ip, activeTimestamps)
  return false
}

// Script and HTML tag sanitization helper to prevent XSS or spreadsheet injection
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
    // 1. Content-Length Limit (Max 10 KB to prevent large payload Denial of Service)
    const contentLength = Number(request.headers.get("content-length") || "0")
    if (contentLength > 10 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    // 2. CSRF / Origin Verification
    const host = request.headers.get("host")
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    
    // Verify the origin or referer matches our host in production
    if (process.env.NODE_ENV === "production") {
      const allowedHost = host || ""
      const requestOrigin = origin || referer || ""
      
      if (requestOrigin && !requestOrigin.includes(allowedHost)) {
        return NextResponse.json({ error: "Unauthorized request origin" }, { status: 403 })
      }
    }

    // 3. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    if (ip !== "unknown" && isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, name, role, plan, linkedin, github, expertise, interests } = body

    // 4. Server-side Input Validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValid) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (name && (typeof name !== "string" || name.length > 100)) {
      return NextResponse.json({ error: "Invalid name format or length" }, { status: 400 })
    }

    if (role !== "founder" && role !== "investor") {
      return NextResponse.json({ error: "Invalid role selection" }, { status: 400 })
    }

    // 5. Sanitization of input fields
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedName = name ? sanitize(name) : "Anonymous"
    const sanitizedRole = role
    const sanitizedPlan = plan ? sanitize(plan) : (role === "founder" ? "something" : "nothing")
    const sanitizedLinkedin = linkedin ? sanitize(linkedin) : undefined
    const sanitizedGithub = github ? sanitize(github) : undefined
    
    const sanitizedExpertise = Array.isArray(expertise)
      ? expertise.map(x => sanitize(x)).filter(Boolean)
      : undefined
      
    const sanitizedInterests = Array.isArray(interests)
      ? interests.map(x => sanitize(x)).filter(Boolean)
      : undefined

    // 6. Build secure payload (ignoring any extra attributes injected by client)
    const securePayload = {
      email: sanitizedEmail,
      name: sanitizedName,
      role: sanitizedRole,
      plan: sanitizedPlan,
      linkedin: sanitizedLinkedin,
      github: sanitizedGithub,
      expertise: sanitizedExpertise,
      interests: sanitizedInterests,
      submittedAt: new Date().toISOString()
    }

    // Retrieve the form endpoint URL (Google Sheets Web App)
    const formEndpoint = process.env.FORM_ENDPOINT

    if (!formEndpoint) {
      // In development or if not configured, return a mock success
      return NextResponse.json({
        success: true,
        message: "FORM_ENDPOINT environment variable not configured. Mocking signup success.",
        token: "mock-token-" + Math.random().toString(36).slice(2)
      })
    }

    // Forward to Google Sheets Web App
    const response = await fetch(formEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(securePayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Form submission failed: ${errorText}` },
        { status: response.status }
      )
    }

    // Parse response if JSON, otherwise return generic success
    const contentType = response.headers.get("content-type")
    const responseData = contentType && contentType.includes("application/json")
      ? await response.json()
      : { message: "Submission accepted" }

    return NextResponse.json({
      success: true,
      token: "waitlist-token-" + Math.random().toString(36).slice(2),
      data: responseData
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
