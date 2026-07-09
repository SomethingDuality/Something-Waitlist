"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SomethingLogo } from "@/components/something-logo"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  User,
  Award,
  Compass,
  Link2,
  Loader2,
  UserCheck,
  Check,
} from "lucide-react"

// ── Constants ──────────────────────────────────────────────────────────────────

const FOUNDER_EXPERTISE_OPTS = [
  "Product", "Engineering", "Design", "Growth/Marketing",
  "Finance", "Legal", "Operations", "Hardware", "AI/ML",
]

const INVESTOR_INTEREST_OPTS = [
  "Pre-seed", "Seed", "Series A", "Web3",
  "AI/ML", "Climate", "Health", "Fintech", "Consumer", "Deep Tech",
]

const STEP_COPY = [
  {
    headline: "protect the idea.\nfind the conviction.",
    sub: "Two AI agents argue over your idea first. One tries to kill it. If it survives, the right people find you.",
    accentWord: "conviction",
    accentColor: "#34D399",
  },
  {
    headline: "secure early access\nto the platform.",
    sub: "NDAs are the standard here. Your details stay private until you choose to share them.",
    accentWord: "access",
    accentColor: "#34D399",
  },
]

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SignupPage() {
  // Step state: 1=Role, 2=Details
  const [step, setStep] = useState(1)

  // Role
  const [role, setRole] = useState<"founder" | "investor">("founder")

  // Read role parameter from URL on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const r = params.get("role")
      if (r === "investor" || r === "founder") {
        setRole(r)
      }
    }
  }, [])

  // Details
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password] = useState(() => Math.random().toString(36).slice(-10) + "A1!")
  
  // Dynamic links list
  const [links, setLinks] = useState<string[]>([""])

  // Profile – Founder
  const [expertise, setExpertise] = useState<string[]>([])
  const [newExpertise, setNewExpertise] = useState("")

  // Profile – Investor
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")

  // Shared
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // ── Validation ──────────────────────────────────────────────────────────────

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const founderColor = "#34D399"
  const investorColor = "#E3C27A"
  const accentColor = role === "founder" ? founderColor : investorColor

  const goNext = () => setStep((s) => Math.min(s + 1, 2))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const toggleExpertise = (v: string) =>
    setExpertise((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))

  const toggleInterest = (v: string) =>
    setInterests((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))

  const addCustomExpertise = () => {
    const v = newExpertise.trim()
    if (!v) {
      setNewExpertise("")
      return
    }

    const alreadySelected = expertise.some(x => x.toLowerCase() === v.toLowerCase())
    if (alreadySelected) {
      setNewExpertise("")
      return
    }

    const predefined = FOUNDER_EXPERTISE_OPTS.find(x => x.toLowerCase() === v.toLowerCase())
    const valueToAdd = predefined || v

    setExpertise((p) => [...p, valueToAdd])
    setNewExpertise("")
  }

  const addCustomInterest = () => {
    const v = newInterest.trim()
    if (!v) {
      setNewInterest("")
      return
    }

    const alreadySelected = interests.some(x => x.toLowerCase() === v.toLowerCase())
    if (alreadySelected) {
      setNewInterest("")
      return
    }

    const predefined = INVESTOR_INTEREST_OPTS.find(x => x.toLowerCase() === v.toLowerCase())
    const valueToAdd = predefined || v

    setInterests((p) => [...p, valueToAdd])
    setNewInterest("")
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailValid || loading) return
    setLoading(true)
    setError(null)

    const activeLinks = links.map(l => l.trim()).filter(Boolean)

    const payload = {
      name: name.trim() || "Anonymous",
      email: email.trim(),
      password,
      role,
      plan: role === "founder" ? "something" : "nothing",
      linkedin: activeLinks[0] || undefined,
      github: activeLinks.slice(1).join(", ") || undefined,
      expertise: role === "founder" && expertise.length ? expertise : undefined,
      interests: role === "investor" && interests.length ? interests : undefined,
    }

    // ── Optimistic UI ────────────────────────────────────────────────────────
    // Show the success screen immediately — no waiting on the network.
    // The actual POST to Google Sheets fires in the background.
    const optimisticToken = "waitlist-" + Math.random().toString(36).slice(2)
    localStorage.setItem("token", optimisticToken)
    localStorage.setItem("demo_name", name.trim() || "Anonymous")
    localStorage.setItem("demo_email", email.trim())
    localStorage.setItem("demo_role", role)
    localStorage.setItem("selected_plan", role === "founder" ? "something" : "nothing")
    localStorage.removeItem("onboarding_complete")
    window.dispatchEvent(new Event("auth:login"))

    // Flip to success immediately — user sees instant confirmation
    setLoading(false)
    setIsSubmitted(true)

    // Fire-and-forget: send to Google Sheets in the background
    fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently swallow — user already sees success.
      // In a future iteration, queue to localStorage for retry.
    })

  }

  const copyIndex = isSubmitted ? STEP_COPY.length - 1 : Math.min(step - 1, STEP_COPY.length - 1)
  const copy = STEP_COPY[copyIndex]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0c] text-white">

      {/* ── Left brand column ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5 bg-[#070709] w-[440px] shrink-0">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute top-1/3 -left-1/3 w-[500px] h-[500px] rounded-full transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 65%)`,
          }}
        />
        <div
          className="pointer-events-none absolute bottom-1/4 right-0 w-64 h-64 rounded-full transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${accentColor}04 0%, transparent 70%)`,
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <SomethingLogo />
        </Link>

        {/* Editorial copy — changes per step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 space-y-5 my-auto"
          >
            <h2
              className="text-4xl font-bold tracking-tight leading-[1.15] whitespace-pre-line"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              {copy.headline.split(copy.accentWord).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ color: accentColor }}>{copy.accentWord}</span>
                  )}
                </span>
              ))}
            </h2>

            <p className="text-sm text-white/30 leading-relaxed max-w-[280px]">
              {copy.sub}
            </p>

            {/* Trust badges */}
            <div className="flex flex-col gap-2.5 pt-4">
              {[
                "Mutual NDAs by default",
                "Escrow-gated milestone releases",
                "Zero lock-in contracts",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[11px] text-white/25 font-mono">
                  <span
                    className="h-1 w-1 rounded-full shrink-0"
                    style={{ background: accentColor, opacity: 0.6 }}
                  />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex justify-between text-[11px] text-white/20 font-mono">
          <span>something.to</span>
          <span>v2.0</span>
        </div>
      </div>

      {/* ── Right form column ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Mobile header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/"><SomethingLogo /></Link>
        </div>

        <div className="w-full max-w-xl">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Top glow line */}
            <div
              aria-hidden
              className="absolute top-0 inset-x-0 h-px transition-all duration-500"
              style={{
                background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
              }}
            />

            {/* Progress bar */}
            {!isSubmitted && (
              <div className="px-8 pt-7 pb-0">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
                    Step {step} of 2
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2].map((s) => (
                      <div
                        key={s}
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                          width: s === step ? 28 : 10,
                          background: s <= step ? accentColor : "rgba(255,255,255,0.06)",
                          opacity: s < step ? 0.4 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step content */}
            <div className="px-8 pb-12 pt-2">
              <AnimatePresence mode="wait">

                {isSubmitted ? (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="space-y-6 text-center py-6"
                  >
                    <div className="mx-auto h-16 w-16 rounded-full bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center text-[#34D399] text-3xl font-semibold">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                        You&apos;re on the list!
                      </h1>
                      <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto">
                        Thank you for signing up to the waitlist. We have recorded your interest as a{" "}
                        <span style={{ color: accentColor }} className="font-semibold">{role}</span>. We will reach out as soon as access becomes available.
                      </p>
                    </div>
                    <div className="pt-4">
                      <Link href="/">
                        <Button className="h-11 px-8 font-semibold rounded-lg text-black cursor-pointer" style={{ background: accentColor }}>
                          Return to home
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* ── Step 1: Role ── */}
                    {step === 1 && (
                      <motion.div
                        key="step-role"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-7"
                      >
                        <div>
                          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                            Choose your role
                          </h1>
                          <p className="mt-1.5 text-sm text-white/40">
                            Are you building something, or backing it?
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Founder */}
                          <button
                            type="button"
                            id="role-founder-btn"
                            onClick={() => { setRole("founder"); goNext() }}
                            className={cn(
                              "group relative rounded-xl border p-5 text-left cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px] w-full",
                              role === "founder"
                                ? "border-[#34D399]/60 bg-[#34D399]/[0.04] shadow-[0_0_24px_rgba(52,211,153,0.08)]"
                                : "border-white/8 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]"
                            )}
                          >
                            <div className="space-y-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                                <span className="text-[#34D399] text-lg">◉</span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold tracking-tight text-white">Founder</h3>
                                <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
                                  You have an idea, a team, or a problem worth solving. Get funded as you finish work, one milestone at a time.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#34D399] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-3 shrink-0">
                              Select <ArrowRight className="h-2.5 w-2.5" />
                            </div>
                          </button>

                          {/* Investor */}
                          <button
                            type="button"
                            id="role-investor-btn"
                            onClick={() => { setRole("investor"); goNext() }}
                            className={cn(
                              "group relative rounded-xl border p-5 text-left cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px] w-full",
                              role === "investor"
                                ? "border-[#E3C27A]/60 bg-[#E3C27A]/[0.04] shadow-[0_0_24px_rgba(227,194,122,0.08)]"
                                : "border-white/8 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]"
                            )}
                          >
                            <div className="space-y-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(227,194,122,0.08)", border: "1px solid rgba(227,194,122,0.2)" }}>
                                <span className="text-[#E3C27A] text-lg">◈</span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold tracking-tight text-white">Investor</h3>
                                <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
                                  You back early-stage founders. Discover deals, run diligence with AI, and release funds as milestones are completed.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#E3C27A] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-3 shrink-0">
                              Select <ArrowRight className="h-2.5 w-2.5" />
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 2: Details ── */}
                    {step === 2 && (
                      <motion.div
                        key="step-details"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-6"
                      >
                        <div>
                          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                            Join the waitlist
                          </h1>
                          <p className="mt-1.5 text-sm text-white/40">
                            Enter your email to secure early access.
                          </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-5">
                          {/* Email input (REQUIRED) */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1"><Mail className="h-3 w-3" /> Email Address <span className="text-emerald-400">*</span></label>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={cn(
                                "h-11 bg-white/[0.02] border-white/8 text-sm text-white placeholder:text-white/20 rounded-xl",
                                email.length > 0 && !emailValid && "border-rose-500/50 focus:border-rose-500 focus-visible:ring-rose-500/20"
                              )}
                              id="signup-email"
                              required
                            />
                          </div>

                          {/* Name input (OPTIONAL) */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1"><User className="h-3 w-3" /> Full Name <span className="text-white/15">(optional)</span></label>
                            <Input
                              placeholder="Jane Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-11 bg-white/[0.02] border-white/8 text-sm text-white placeholder:text-white/20 rounded-xl"
                              id="signup-name"
                            />
                          </div>

                          {/* Generic Dynamic Social Link Inputs (OPTIONAL) */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5" /> Social / Website Links <span className="text-white/15">(optional)</span>
                            </label>
                            <div className="space-y-2">
                              {links.map((link, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <Input
                                    placeholder="e.g. LinkedIn, X, website, portfolio..."
                                    value={link}
                                    onChange={(e) => {
                                      const newLinks = [...links]
                                      newLinks[idx] = e.target.value
                                      setLinks(newLinks)
                                    }}
                                    className="h-10 bg-white/[0.02] border-white/8 text-sm text-white placeholder:text-white/20 rounded-xl flex-1"
                                  />
                                  {idx === links.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => setLinks([...links, ""])}
                                      className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/8 cursor-pointer shrink-0 transition-colors font-medium text-lg"
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                                      className="h-10 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/20 cursor-pointer shrink-0 transition-colors text-sm font-medium"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Expertise / Interests selection (OPTIONAL) */}
                          {role === "founder" ? (
                            <div className="space-y-2">
                              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                               <Award className="h-3.5 w-3.5" /> Core Expertise <span className="text-white/15">(optional)</span>
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set([...FOUNDER_EXPERTISE_OPTS, ...expertise])).map((opt) => {
                                  const active = expertise.includes(opt)
                                  return (
                                    <button
                                      type="button"
                                      key={opt}
                                      onClick={() => toggleExpertise(opt)}
                                      className={cn(
                                        "text-[11px] rounded-full px-3 py-1.5 border transition-all duration-200 font-medium cursor-pointer",
                                        active
                                          ? "border-[#34D399]/60 bg-[#34D399]/10 text-[#34D399]"
                                          : "border-white/8 bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white/70"
                                      )}
                                    >
                                      {active && <Check className="inline h-2.5 w-2.5 mr-1" />}
                                      {opt}
                                    </button>
                                  )
                                })}
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Input
                                  placeholder="Add custom skill..."
                                  value={newExpertise}
                                  onChange={(e) => setNewExpertise(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomExpertise() } }}
                                  className="h-9 bg-white/[0.02] border-white/8 text-xs text-white placeholder:text-white/20 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={addCustomExpertise}
                                  className="px-3 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 text-xs transition-colors cursor-pointer border border-white/8"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                <Compass className="h-3.5 w-3.5" /> Investment Interests <span className="text-white/15">(optional)</span>
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set([...INVESTOR_INTEREST_OPTS, ...interests])).map((opt) => {
                                  const active = interests.includes(opt)
                                  return (
                                    <button
                                      type="button"
                                      key={opt}
                                      onClick={() => toggleInterest(opt)}
                                      className={cn(
                                        "text-[11px] rounded-full px-3 py-1.5 border transition-all duration-200 font-medium cursor-pointer",
                                        active
                                          ? "border-[#E3C27A]/60 bg-[#E3C27A]/10 text-[#E3C27A]"
                                          : "border-white/8 bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white/70"
                                      )}
                                    >
                                      {active && <Check className="inline h-2.5 w-2.5 mr-1" />}
                                      {opt}
                                    </button>
                                  )
                                })}
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Input
                                  placeholder="Add custom interest..."
                                  value={newInterest}
                                  onChange={(e) => setNewInterest(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest() } }}
                                  className="h-9 bg-white/[0.02] border-white/8 text-xs text-white placeholder:text-white/20 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={addCustomInterest}
                                  className="px-3 rounded-lg bg-[#ffffff]/8 hover:bg-[#ffffff]/12 text-white/70 text-xs transition-colors cursor-pointer border border-white/8"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Error message */}
                          {error && (
                            <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                              {error}
                            </p>
                          )}

                          {/* Buttons */}
                          <div className="flex gap-3 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={goBack}
                              className="flex-1 h-11 border border-white/8 hover:bg-white/5 text-white/60 cursor-pointer"
                              id="details-back-btn"
                            >
                              <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading || !emailValid}
                              className="flex-2 h-11 px-8 font-semibold transition-all rounded-lg cursor-pointer text-black disabled:opacity-40"
                              style={{ background: accentColor }}
                              id="signup-submit-btn"
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Join Waitlist
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
