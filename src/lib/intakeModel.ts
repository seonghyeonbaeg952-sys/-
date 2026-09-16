import type { IntakeSubmissionTracker } from '../types/intake'

export const INTAKE_INVALID_MESSAGE = '필수 항목과 입력 내용을 확인해 주세요.'
export const INTAKE_RATE_LIMIT_MESSAGE = '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.'
export const INTAKE_CHANGED_MESSAGE = '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.'
export const SUPPORT_CLOSED_MESSAGE = '현재 온라인 후원약정을 접수할 수 없습니다. 최신 후원 안내를 확인해 주세요.'

const contactKeys = ['name', 'email', 'phone', 'type', 'title', 'message', 'privacy_agreed']
const supportKeys = ['name', 'email', 'phone', 'address', 'amount', 'custom_amount', 'birth_date', 'gender', 'member_type', 'depositor', 'pledge_date', 'signer_name', 'signature_image_url', 'privacy_agreed']
const encoder = new TextEncoder()

export function isSubmissionId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isSettingsId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
}

function objectWithKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return (prototype === Object.prototype || prototype === null)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key))
}

function text(value: unknown, max: number, required = false): value is string | null {
  if (value === null) return !required
  return typeof value === 'string' && (!required || value.trim().length > 0)
    && [...value].length <= max && encoder.encode(value).length <= max * 4
    && !Array.from(value).some(character => {
      const code = character.charCodeAt(0)
      return code < 32 && code !== 9 && code !== 10 && code !== 13
    })
}

function email(value: unknown) {
  return text(value, 254, true) && typeof value === 'string' && encoder.encode(value).length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function phone(value: unknown, required: boolean) {
  return !required && value === null || typeof value === 'string' && text(value, 40, true)
    && /^[+]?[0-9 ()-]+$/.test(value.trim()) && value.replace(/\D/g, '').length >= 9 && value.replace(/\D/g, '').length <= 15
}

function date(value: unknown) {
  if (value === null) return true
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const instant = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === value
}

// Restrict signatures to bounded, structurally complete PNG data, never arbitrary URLs or SVG.
// This verifies the transport/container, not the identity or legal authenticity of the signer.
export function isSignaturePng(value: unknown): boolean {
  if (value === null) return true
  if (typeof value !== 'string' || value.length > 200000 || !/^data:image\/png;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return false
  try {
    const raw = atob(value.slice(22))
    if (btoa(raw) !== value.slice(22)) return false
    const bytes = Uint8Array.from(raw, character => character.charCodeAt(0))
    const view = new DataView(bytes.buffer)
    if (bytes.length < 57 || view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) return false
    let offset = 8
    let seenData = false
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset)
      const kind = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
      if (length > bytes.length - offset - 12 || !/^[A-Za-z]{4}$/.test(kind)) return false
      if (offset === 8) {
        if (kind !== 'IHDR' || length !== 13) return false
        const width = view.getUint32(offset + 8)
        const height = view.getUint32(offset + 12)
        if (width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > 4000000) return false
      } else if (kind === 'IHDR') return false
      if (kind === 'IDAT') seenData = true
      if (kind === 'IEND') return length === 0 && seenData && offset + 12 === bytes.length
      offset += 12 + length
    }
    return false
  } catch { return false }
}

export function validateContactIntake(value: unknown): string | null {
  if (!objectWithKeys(value, contactKeys) || !text(value.name, 100, true) || !email(value.email)
    || !phone(value.phone, false) || !text(value.title, 200) || !text(value.message, 5000, true)
    || !['concert_request', 'general', 'join', 'other', 'support'].includes(value.type as string)) return INTAKE_INVALID_MESSAGE
  return value.privacy_agreed === true ? null : '개인정보 수집 및 이용에 동의해 주세요.'
}

export function validateSupportIntake(value: unknown): string | null {
  if (!objectWithKeys(value, supportKeys) || !text(value.name, 100, true) || !email(value.email)
    || !phone(value.phone, true) || !text(value.address, 1000) || !text(value.depositor, 100)
    || !text(value.signer_name, 100) || !date(value.birth_date) || !date(value.pledge_date)
    || ![null, 'female', 'male', 'none'].includes(value.gender as string | null)
    || !['individual', 'corporate'].includes(value.member_type as string)
    || typeof value.amount !== 'number' || !Number.isSafeInteger(value.amount) || value.amount < 1 || value.amount > 2147483647
    || value.custom_amount !== null && value.custom_amount !== value.amount
    || !isSignaturePng(value.signature_image_url)) return INTAKE_INVALID_MESSAGE
  return value.privacy_agreed === true ? null : '개인정보 수집 및 이용에 동의해 주세요.'
}

export function createIntakeSubmissionTracker(createId = () => globalThis.crypto.randomUUID()): IntakeSubmissionTracker {
  const attempts = new Map<string, string>()
  return {
    idFor(payload) {
      const key = JSON.stringify(payload, Object.keys(payload).sort())
      const prior = attempts.get(key)
      if (prior) return prior
      const id = createId()
      if (!isSubmissionId(id)) throw new Error('Secure submission identity is unavailable.')
      attempts.set(key, id)
      return id
    },
    reset() { attempts.clear() },
  }
}
