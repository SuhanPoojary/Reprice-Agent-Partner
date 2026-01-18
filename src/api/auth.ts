import { apiFetch } from './client'

export type BackendUserType = 'customer' | 'agent' | 'partner'

export type AuthMeResponse = {
  success: boolean
  data: {
    id: string
    name: string
    phone: string
    email?: string | null
    userType: BackendUserType
  }
}

export type LoginResponse = {
  success: boolean
  data: {
    user: {
      id: string
      name: string
      phone: string
      email?: string | null
      userType: BackendUserType
    }
    token: string
  }
}

export type SignupResponse = LoginResponse

export async function loginAgent(phone: string, password: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, userType: 'agent' }),
  })
}

export async function loginPartner(phone: string, password: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, userType: 'partner' }),
  })
}

export async function signupAgent(name: string, phone: string, password: string, email?: string) {
  return apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password, email, userType: 'agent' }),
  })
}

export async function signupPartner(name: string, phone: string, password: string, email?: string) {
  return apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password, email, userType: 'partner' }),
  })
}

export async function me() {
  return apiFetch<AuthMeResponse>('/auth/me', {
    method: 'GET',
  })
}
