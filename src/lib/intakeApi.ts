import { getSupabaseClientSafe } from './auth'
import { isSiteEditorPreview, PREVIEW_SUBMISSION_MESSAGE } from './siteEditorPreview'
import { INTAKE_CHANGED_MESSAGE, INTAKE_INVALID_MESSAGE, INTAKE_RATE_LIMIT_MESSAGE, SUPPORT_CLOSED_MESSAGE, isSettingsId, isSubmissionId, validateContactIntake, validateSupportIntake } from './intakeModel'
import type { ContactIntakePayload, IntakeResult, SupportIntakePayload } from '../types/intake'

const publicErrors = new Set([INTAKE_CHANGED_MESSAGE, INTAKE_INVALID_MESSAGE, INTAKE_RATE_LIMIT_MESSAGE, SUPPORT_CLOSED_MESSAGE, '개인정보 수집 및 이용에 동의해 주세요.'])

async function submit(rpc: string, args: Record<string, unknown>, fallback: string): Promise<IntakeResult> {
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return { data: null, error: fallback }
    const { data, error } = await client.data.rpc(rpc, args)
    if (error || data !== true) {
      if (error?.code === 'PGRST202' || error?.code === '42883') return { data: null, error: '안전한 접수 기능이 아직 준비되지 않았습니다. 관리자에게 문의해 주세요.' }
      return { data: null, error: error && publicErrors.has(error.message) ? error.message : fallback }
    }
    return { data: true, error: null }
  } catch { return { data: null, error: fallback } }
}

export async function submitContactIntake(input: ContactIntakePayload & { website?: string | null }, submissionId: string): Promise<IntakeResult> {
  if (isSiteEditorPreview()) return { data: null, error: PREVIEW_SUBMISSION_MESSAGE }
  if (input.website?.trim()) return { data: true, error: null }
  const payload = { ...input }
  delete payload.website
  const error = validateContactIntake(payload)
  if (error || !isSubmissionId(submissionId)) return { data: null, error: error ?? INTAKE_INVALID_MESSAGE }
  return submit('submit_contact_message', { p_submission_id: submissionId, p_payload: payload }, '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
}

export async function submitSupportIntake(input: SupportIntakePayload & { website?: string | null }, submissionId: string, settingsId: string): Promise<IntakeResult> {
  if (isSiteEditorPreview()) return { data: null, error: PREVIEW_SUBMISSION_MESSAGE }
  if (input.website?.trim()) return { data: true, error: null }
  const payload = { ...input }
  delete payload.website
  const error = validateSupportIntake(payload)
  if (error || !isSubmissionId(submissionId) || !isSettingsId(settingsId)) return { data: null, error: error ?? INTAKE_INVALID_MESSAGE }
  return submit('submit_support_pledge', { p_submission_id: submissionId, p_support_settings_id: settingsId, p_payload: payload }, '후원약정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
}
