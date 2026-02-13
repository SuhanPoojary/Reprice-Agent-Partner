import { apiFetch } from './client'

export type BackendUserType = 'customer' | 'agent' | 'partner'

export type PartnerVerificationStatus = 'approved' | 'pending' | 'rejected' | 'clarification' | string

export type PartnerApplicationInput = {
  companyName?: string
  businessAddress?: string
  pincode?: string
  gstNumber?: string
  panNumber?: string
  messageFromPartner?: string
}

export type AuthMeResponse = {
  success: boolean
  data: {
    id: string
    name: string
    phone: string
    email?: string | null
    userType: BackendUserType

    // partner-only (backend may omit for non-partners)
    company_name?: string | null
    business_address?: string | null
    gst_number?: string | null
    pan_number?: string | null
    verification_status?: PartnerVerificationStatus | null
    is_active?: boolean | null
    rejection_reason?: string | null
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

      // partner-only (backend may omit for non-partners)
      company_name?: string | null
      business_address?: string | null
      gst_number?: string | null
      pan_number?: string | null
      verification_status?: PartnerVerificationStatus | null
      is_active?: boolean | null
      rejection_reason?: string | null
    }
    token: string
  }
}

export type SignupResponse = LoginResponse

export type PartnerSignupResponse = {
  success: boolean
  message: string
  data?: {
    application_submitted?: boolean
    partner_id?: string
    email_verification_required?: boolean

    // Temporary fallback: backend may include code in response (opt-in via env flags)
    verification_code?: string
    delivery?: {
      ok?: boolean
      skipped?: boolean
      reason?: string
      error?: string
    }
  }
}

export type PartnerVerifyEmailResponse = {
  success: boolean
  message?: string
}

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

export async function signupPartner(
  name: string,
  phone: string,
  password: string,
  email?: string,
  application?: PartnerApplicationInput,
) {
  return apiFetch<PartnerSignupResponse>('/auth/signup', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      phone,
      password,
      email,
      userType: 'partner',
      company_name: application?.companyName,
      business_address: application?.businessAddress,
      pincode: application?.pincode,
      gst_number: application?.gstNumber,
      pan_number: application?.panNumber,
      message_from_partner: application?.messageFromPartner,
    }),
  })
}

export async function verifyPartnerEmail(partner_id: string, code: string) {
  return apiFetch<PartnerVerifyEmailResponse>('/auth/partner/verify-email', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partner_id, code }),
  })
}

export async function me() {
  return apiFetch<AuthMeResponse>('/auth/me', {
    method: 'GET',
  })
}
