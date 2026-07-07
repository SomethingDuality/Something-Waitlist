"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import apiClient from "@/lib/axios"

type User = { id?: string; name?: string; email?: string; role?: string; demo?: boolean } | null

type AuthContextShape = {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  demoLogin: () => void
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error("useAuth must be used within AuthProvider")
  return c
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) {
        setLoading(false)
        return
      }

      if (token === "demo-token" || token.startsWith("mock-token")) {
        const storedName = localStorage.getItem("demo_name") || "Demo User"
        const storedEmail = localStorage.getItem("demo_email") || "demo@something.to"
        const storedRole = localStorage.getItem("demo_role") || "founder"
        setUser({ name: storedName, email: storedEmail, role: storedRole, demo: true })
        setLoading(false)
        return
      }

      try {
        const res = await apiClient.get("/auth/me")
        setUser(res.data || null)
      } catch (err) {
        console.warn("Auth check failed", err)
        localStorage.removeItem("token")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
    // Listen for cross-component login events (signup or demo) so we can revalidate
    const handler = () => {
      ;(async () => {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (token === "demo-token" || (token && token.startsWith("mock-token"))) {
          const storedName = localStorage.getItem("demo_name") || "Demo User"
          const storedEmail = localStorage.getItem("demo_email") || "demo@something.to"
          const storedRole = localStorage.getItem("demo_role") || "founder"
          setUser({ name: storedName, email: storedEmail, role: storedRole, demo: true })
          setLoading(false)
          return
        }
        try {
          const res = await apiClient.get("/auth/me")
          setUser(res.data || null)
        } catch {
          setUser(null)
        } finally {
          setLoading(false)
        }
      })()
    }
    window.addEventListener("auth:login", handler)

    return () => {
      window.removeEventListener("auth:login", handler)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.post("/auth/login", { email, password })
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token)
        const me = await apiClient.get("/auth/me")
        setUser(me.data || null)
      } else {
        throw new Error("No token returned from login")
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Backend login failed, using demo login fallback", err)
        const demoToken = "demo-token"
        const inferredRole = email.includes("investor") ? "investor" : "founder"
        localStorage.setItem("token", demoToken)
        localStorage.setItem("demo_name", "Demo User")
        localStorage.setItem("demo_email", email)
        localStorage.setItem("demo_role", inferredRole)
        setUser({ name: "Demo User", email: email || "demo@something.to", role: inferredRole, demo: true })
      } else {
        throw err
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("demo_name")
    localStorage.removeItem("demo_email")
    localStorage.removeItem("demo_role")
    setUser(null)
    // optional: tell server to logout if endpoint exists
  }

  const demoLogin = () => {
    // Only enable demo behavior in non-production
    if (process.env.NODE_ENV === "production") return
    const demoToken = "demo-token"
    localStorage.setItem("token", demoToken)
    localStorage.setItem("demo_name", "Demo User")
    localStorage.setItem("demo_email", "demo@something.to")
    localStorage.setItem("demo_role", "founder")
    setUser({ name: "Demo User", email: "demo@something.to", role: "founder", demo: true })
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, demoLogin }}>{children}</AuthContext.Provider>
}

export default AuthContext
