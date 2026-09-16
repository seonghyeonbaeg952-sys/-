export type ContactIntakePayload = {
  name: string
  email: string
  phone: string | null
  type: 'concert_request' | 'general' | 'join' | 'other' | 'support'
  title: string | null
  message: string
  privacy_agreed: boolean
}

export type SupportIntakePayload = {
  name: string
  email: string
  phone: string
  address: string | null
  amount: number
  custom_amount: number | null
  birth_date: string | null
  gender: 'female' | 'male' | 'none' | null
  member_type: 'corporate' | 'individual'
  depositor: string | null
  pledge_date: string | null
  signer_name: string | null
  signature_image_url: string | null
  privacy_agreed: boolean
}

export type IntakeResult = { data: true; error: null } | { data: null; error: string }
export type IntakeSubmissionTracker = { idFor: (payload: object) => string; reset: () => void }
