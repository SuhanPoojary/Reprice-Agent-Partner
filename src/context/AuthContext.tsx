import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginAgent, loginPartner, me, signupAgent, signupPartner } from '../api/auth'

export type Role = 'partner' | 'agent'

export type AuthUser = {
  id: string
  name: string
  role: Role
  phone?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loginAs: (role: Role) => void
  loginAgentWithPassword: (phone: string, password: string) => Promise<void>
  loginPartnerWithPassword: (phone: string, password: string) => Promise<void>
  signupAgentWithPassword: (name: string, phone: string, password: string, email?: string) => Promise<void>
  signupPartnerWithPassword: (name: string, phone: string, password: string, email?: string) => Promise<void>
  refreshMe: () => Promise<void>
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
    // If a token exists but user isn't hydrated (or stale), try loading /auth/me.
    if (!token) return
    if (user?.role === 'agent' || user?.role === 'partner') return
    ;(async () => {
      try {
        const resp = await me()
        if (!resp.success) return
        if (resp.data.userType !== 'agent' && resp.data.userType !== 'partner') return
        const next: AuthUser = {
          id: resp.data.id,
          name: resp.data.name,
          phone: resp.data.phone,
          role: resp.data.userType,
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore; token might be invalid/expired.
      }
    })()
  }, [token])

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
      signupPartnerWithPassword: async (name, phone, password, email) => {
        const resp = await signupPartner(name, phone, password, email)
        if (!resp.success) throw new Error('Signup failed')
        localStorage.setItem(TOKEN_KEY, resp.data.token)
        setToken(resp.data.token)

        const next: AuthUser = {
          id: resp.data.user.id,
          name: resp.data.user.name,
          phone: resp.data.user.phone,
          role: 'partner',
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      refreshMe: async () => {
        const resp = await me()
        if (!resp.success) return
        if (resp.data.userType !== 'agent' && resp.data.userType !== 'partner') return
        const next: AuthUser = {
          id: resp.data.id,
          name: resp.data.name,
          phone: resp.data.phone,
          role: resp.data.userType,
        }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
