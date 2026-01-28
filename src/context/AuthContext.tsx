import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  loginAgent,
  loginPartner,
  signupAgent,
  signupPartner,
  verifyPartnerEmail,
  type PartnerApplicationInput,
} from '../api/auth'

export type Role = 'partner' | 'agent'

export type AuthUser = {
  id: string
  name: string
  role: Role
  phone?: string

  // partner-only (optional)
  company_name?: string | null
  business_address?: string | null
  gst_number?: string | null
  pan_number?: string | null
  verification_status?: string | null
  is_active?: boolean | null
  rejection_reason?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loginAs: (role: Role) => void
  loginAgentWithPassword: (phone: string, password: string) => Promise<void>
  loginPartnerWithPassword: (phone: string, password: string) => Promise<void>
  signupAgentWithPassword: (name: string, phone: string, password: string, email?: string) => Promise<void>
  signupPartnerWithPassword: (
    name: string,
    phone: string,
    password: string,
    email?: string,
    application?: PartnerApplicationInput,
  ) => Promise<{ message: string; partner_id?: string }>
  verifyPartnerEmailCode: (partnerId: string, code: string) => Promise<string>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'apdash.auth'
const TOKEN_KEY = 'token'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser())
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    // IMPORTANT: do not auto-call /auth/me.
    // If a token exists but we don't have a cached user, force a fresh login.
    if (!token) return
    if (!user) {
      setToken(null)
      localStorage.removeItem(TOKEN_KEY)
      return
    }
    if (user.role !== 'agent' && user.role !== 'partner') {
      setUser(null)
      setToken(null)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loginAs: (role) => {
        const next: AuthUser = {
          id: role === 'partner' ? 'partner-1' : 'agent-1',
          name: role === 'partner' ? 'Partner Admin' : 'Field Agent',
          role,
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      loginAgentWithPassword: async (phone, password) => {
        const resp = await loginAgent(phone, password)
        if (!resp.success) throw new Error('Login failed')
        localStorage.setItem(TOKEN_KEY, resp.data.token)
        setToken(resp.data.token)

        const next: AuthUser = {
          id: resp.data.user.id,
          name: resp.data.user.name,
          phone: resp.data.user.phone,
          role: 'agent',
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      loginPartnerWithPassword: async (phone, password) => {
        const resp = await loginPartner(phone, password)
        if (!resp.success) throw new Error('Login failed')
        localStorage.setItem(TOKEN_KEY, resp.data.token)
        setToken(resp.data.token)

        const next: AuthUser = {
          id: resp.data.user.id,
          name: resp.data.user.name,
          phone: resp.data.user.phone,
          role: 'partner',
          company_name: resp.data.user.company_name ?? null,
          business_address: resp.data.user.business_address ?? null,
          gst_number: resp.data.user.gst_number ?? null,
          pan_number: resp.data.user.pan_number ?? null,
          verification_status: (resp.data.user as any).verification_status ?? null,
          is_active: (resp.data.user as any).is_active ?? null,
          rejection_reason: (resp.data.user as any).rejection_reason ?? null,
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      signupAgentWithPassword: async (name, phone, password, email) => {
        const resp = await signupAgent(name, phone, password, email)
        if (!resp.success) throw new Error('Signup failed')
        localStorage.setItem(TOKEN_KEY, resp.data.token)
        setToken(resp.data.token)

        const next: AuthUser = {
          id: resp.data.user.id,
          name: resp.data.user.name,
          phone: resp.data.user.phone,
          role: 'agent',
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      signupPartnerWithPassword: async (name, phone, password, email, application) => {
        const resp = await signupPartner(name, phone, password, email, application)
        if (!resp.success) throw new Error('Signup failed')
        return {
          message:
            resp.message || 'Verification code sent to your email. Please verify to submit your application.',
          partner_id: resp.data?.partner_id,
        }
      },
      verifyPartnerEmailCode: async (partnerId, code) => {
        const resp = await verifyPartnerEmail(partnerId, code)
        if (!resp.success) throw new Error(resp.message || 'Verification failed')
        return resp.message || 'Email verified. Your application is now pending admin review.'
      },
      logout: () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TOKEN_KEY)
      },
    }),
    [user, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
