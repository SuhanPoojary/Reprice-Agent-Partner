import { apiFetch } from './client'
import type { PartnerApplicationInput } from './auth'

export type PartnerApplicationSubmitResponse = {
  success: boolean
  message: string
  data?: {
    application_submitted?: boolean
    partner_id?: string
  }
}

export async function submitPartnerApplication(input: {
  name: string
  phone: string
  email: string
  password: string
  application?: PartnerApplicationInput
}) {
  return apiFetch<PartnerApplicationSubmitResponse>('/auth/signup', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      email: input.email,
      password: input.password,
      userType: 'partner',
      company_name: input.application?.companyName,
      business_address: input.application?.businessAddress,
      gst_number: input.application?.gstNumber,
      pan_number: input.application?.panNumber,
      message_from_partner: input.application?.messageFromPartner,
    }),
  })
}
