import type { HomeEditorDevice } from '../../../lib/homeDeviceContent'
import { isValidHomePublicText } from '../../../lib/homeContent'
import type { HomeContentSiteTextDefinition } from '../../../types/homeContent'

export const homeEditorDevices = [
  { id: 'desktop', label: '데스크톱', width: 1440, height: 900 },
  { id: 'tablet', label: '태블릿', width: 834, height: 1112 },
  { id: 'mobile', label: '모바일', width: 390, height: 844 },
] as const

export type HomeEditorValues = Record<string, string>

export function validateHomeEditorField(definition: HomeContentSiteTextDefinition, value: string) {
  if (!value.trim()) return '빈 값은 저장할 수 없습니다. 기본값 복원을 사용해 주세요.'
  if (!isValidHomePublicText(value) || /href\s*=\s*["']?#["']?/i.test(value)) {
    return '공개 홈에서 사용할 수 없는 임시·위험 문구입니다. 미정·준비중·테스트 같은 문구나 HTML을 제거해 주세요.'
  }
  if (definition.maxLength && value.trim().length > definition.maxLength) return `${definition.maxLength}자 이내로 입력해 주세요.`
  if (definition.inputType === 'boolean' && !['true', 'false'].includes(value)) return '공개 여부 값이 올바르지 않습니다.'
  if (definition.inputType === 'number') {
    const numberValue = Number(value.trim())
    if (!Number.isInteger(numberValue) ||
      (definition.min !== undefined && numberValue < definition.min) ||
      (definition.max !== undefined && numberValue > definition.max)) {
      return `${definition.min ?? 0}~${definition.max ?? '최대값'} 사이의 숫자를 입력해 주세요.`
    }
  }
  return null
}

export type HomeEditorDraftState = {
  values: HomeEditorValues
  baseline: HomeEditorValues
}

type HomeEditorField = { key: string; defaultValue: string }

export type HomeDeviceSubmission = {
  device: HomeEditorDevice
  draftValues: HomeEditorValues
  persistedValues: HomeEditorValues
}

export function createHomeEditorDraft(values: HomeEditorValues): HomeEditorDraftState {
  return { values: { ...values }, baseline: { ...values } }
}

export function updateHomeEditorDraft(state: HomeEditorDraftState, key: string, value: string): HomeEditorDraftState {
  if (!Object.hasOwn(state.values, key)) return state
  return { ...state, values: { ...state.values, [key]: value } }
}

export function getHomeEditorDirtyKeys(state: HomeEditorDraftState, fields: readonly HomeEditorField[]) {
  return fields.filter((field) =>
    (state.values[field.key] ?? field.defaultValue) !== (state.baseline[field.key] ?? field.defaultValue),
  ).map((field) => field.key)
}

function keyBelongsToDevice(key: string, device: HomeEditorDevice) {
  if (device === 'desktop') return !key.startsWith('home.mobile.') && !key.startsWith('home.tablet.')
  return key.startsWith(`home.${device}.`)
}

export function captureHomeDeviceSubmission(state: HomeEditorDraftState, device: HomeEditorDevice, fields: readonly HomeEditorField[]): HomeDeviceSubmission {
  if (fields.some((field) => !keyBelongsToDevice(field.key, device))) {
    throw new Error('선택한 화면과 다른 화면의 문구는 함께 저장할 수 없습니다.')
  }
  const dirtyKeys = getHomeEditorDirtyKeys(state, fields)
  const draftValues = Object.fromEntries(dirtyKeys.map((key) => [key, state.values[key]]))
  const persistedValues = Object.fromEntries(dirtyKeys.map((key) => [key, state.values[key].trim()]))
  return { device, draftValues, persistedValues }
}

export function acceptHomeDeviceSubmission(state: HomeEditorDraftState, submission: HomeDeviceSubmission): HomeEditorDraftState {
  const values = { ...state.values }
  const baseline = { ...state.baseline }
  for (const [key, persistedValue] of Object.entries(submission.persistedValues)) {
    baseline[key] = persistedValue
    if (values[key] === submission.draftValues[key]) values[key] = persistedValue
  }
  return { values, baseline }
}

export function reconcileHomeEditorDraft(state: HomeEditorDraftState, serverValues: HomeEditorValues): HomeEditorDraftState {
  const values = { ...state.values }
  const baseline = { ...state.baseline }
  for (const [key, serverValue] of Object.entries(serverValues)) {
    if (values[key] !== baseline[key]) continue
    values[key] = serverValue
    baseline[key] = serverValue
  }
  return { values, baseline }
}

export function restoreHomeEditorFields(state: HomeEditorDraftState, fields: readonly HomeEditorField[]): HomeEditorDraftState {
  const values = { ...state.values }
  for (const field of fields) values[field.key] = field.defaultValue
  return { ...state, values }
}
