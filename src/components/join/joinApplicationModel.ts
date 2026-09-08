export const joinPartOptions = [
  { value: 'soprano', label: '소프라노' },
  { value: 'alto', label: '알토' },
  { value: 'tenor', label: '테너' },
  { value: 'bass', label: '베이스' },
] as const

export type JoinPart = typeof joinPartOptions[number]['value']
export type JoinApplicationValues = {
  applicant_name: string
  birth_date: string
  school: string
  applicant_phone: string
  guardian_phone: string
  desired_parts: JoinPart[]
  motivation: string
  privacy_agreed: boolean
  website: string
}

export function createInitialJoinApplicationValues(): JoinApplicationValues {
  return { applicant_name: '', birth_date: '', school: '', applicant_phone: '', guardian_phone: '', desired_parts: [], motivation: '', privacy_agreed: false, website: '' }
}

function validPhone(value: string) {
  return /^\+?[0-9 ()-]+$/.test(value.trim()) && /^\d{9,15}$/.test(value.replace(/[^0-9]/g, ''))
}

export function validateJoinApplicationValues(values: JoinApplicationValues, now = new Date()) {
  const errors: Partial<Record<keyof JoinApplicationValues, string>> = {}
  if (!values.applicant_name.trim() || values.applicant_name.trim().length > 100) errors.applicant_name = '이름을 100자 이내로 입력해 주세요.'
  const birth = /^\d{4}-\d{2}-\d{2}$/.test(values.birth_date) ? new Date(`${values.birth_date}T00:00:00Z`) : null
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  if (!birth || Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== values.birth_date || values.birth_date > today) errors.birth_date = '올바른 생년월일을 입력해 주세요. 미래 날짜는 사용할 수 없습니다.'
  if (!values.school.trim() || values.school.trim().length > 200) errors.school = '학교와 학년을 200자 이내로 입력해 주세요.'
  if (!validPhone(values.applicant_phone)) errors.applicant_phone = '연락 가능한 본인 전화번호를 입력해 주세요.'
  if (!validPhone(values.guardian_phone)) errors.guardian_phone = '연락 가능한 보호자 전화번호를 입력해 주세요.'
  if (!values.desired_parts.length || values.desired_parts.length > 4 || values.desired_parts.some(part => !joinPartOptions.some(option => option.value === part))) errors.desired_parts = '지원 파트를 한 개 이상 선택해 주세요.'
  if (!values.motivation.trim() || values.motivation.trim().length > 5000) errors.motivation = '지원 동기를 5,000자 이내로 입력해 주세요.'
  if (values.privacy_agreed !== true) errors.privacy_agreed = '개인정보 수집 및 이용에 동의해 주세요.'
  return errors
}

export function buildJoinApplicationPayload(values: JoinApplicationValues, joinInfoId: string, submissionId: string) {
  return {
    p_join_info_id: joinInfoId,
    p_submission_id: submissionId,
    p_applicant_name: values.applicant_name.trim(),
    p_birth_date: values.birth_date,
    p_applicant_phone: values.applicant_phone.replace(/[^0-9+]/g, ''),
    p_guardian_phone: values.guardian_phone.replace(/[^0-9+]/g, ''),
    p_school: values.school.trim(),
    p_desired_parts: joinPartOptions.filter(option => values.desired_parts.includes(option.value)).map(option => option.value),
    p_motivation: values.motivation.trim(),
    p_privacy_agreed: values.privacy_agreed,
  }
}
