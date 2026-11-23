import { useSampleLanguage } from '../../features/sample-language/useSampleLanguage'
import { SAMPLE_SUBMISSION_MESSAGES } from '../../lib/sampleSubmissionGuard'
import { SampleDateInput } from '../../features/sample-language/SampleDateInput'
import { workflowRecruitmentPeriod } from '../common/workflowCopy'
import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { pageCopyDefaults } from '../../content/siteCopyPagesCatalog'
import { getJoinApplicationConfig, submitJoinApplication } from '../../lib/joinApplications'
import { getJoinRecruitment } from '../../lib/joinRecruitment'
import type { JoinInfoRow } from '../../types/cms'
import { TransitionLink } from '../common/TransitionLink'
import { usePageCopy } from '../site-editor/usePageCopy'
import {
  createInitialJoinApplicationValues,
  getJoinApplicationFileError,
  joinApplicationFileRules,
  joinPartOptions,
  validateJoinApplicationValues,
  type JoinApplicationAttachmentKind,
  type JoinApplicationValues,
} from './joinApplicationModel'
import '../../styles/join-application.css'

type ApplicationConfig = NonNullable<Awaited<ReturnType<typeof getJoinApplicationConfig>>['data']>
type ConfigState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: ApplicationConfig; serverTime: number; receivedAt: number }
type FieldErrors = Partial<Record<keyof JoinApplicationValues, string>>
type Stage = 'edit' | 'review' | 'success'

const fieldIds: Partial<Record<keyof JoinApplicationValues, string>> = {
  applicant_name: 'join-v2-name',
  birth_date: 'join-v2-birth-date',
  gender: 'join-v2-gender',
  school_level: 'join-v2-school-level',
  school: 'join-v2-school',
  grade: 'join-v2-grade',
  department: 'join-v2-department',
  applicant_phone: 'join-v2-applicant-phone',
  guardian_phone: 'join-v2-guardian-phone',
  desired_parts: 'join-v2-parts',
  motivation: 'join-v2-motivation',
  photo_file: 'join-v2-photo',
  recommendation_file: 'join-v2-recommendation',
  privacy_agreed: 'join-v2-privacy',
}

const schoolLevels = [
  ['elementary', 'elementarySchool'], ['middle', 'middleSchool'], ['high', 'highSchool'],
  ['university', 'university'], ['other', 'otherSchool'],
] as const
const genderOptions = [['female', 'female'], ['male', 'male'], ['not_specified', 'genderNotSpecified']] as const
const oldApplicationDescription = '모든 항목은 필수입니다. 연락 가능한 전화번호와 학교·학년을 정확히 작성해 주세요.'

function ApplicationField({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: boolean; children: ReactNode }) {
  const { translate } = useSampleLanguage()
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('join')
  return (
    <div className="join-application__field">
      <label htmlFor={id}>{label}{optional
        ? <span className="join-application__optional"> ({t('optionalField')})</span>
        : <> <span aria-hidden="true">*</span><span className="sr-only">{copyText("join", "join.fixed.JoinApplicationForm.82e405d221", " 필수")}</span></>}</label>
      {children}
      {error ? <p className="join-application__field-error" id={`${id}-error`}>{translate(error)}</p> : null}
    </div>
  )
}

async function preparePortraitPhoto(file: File): Promise<{ file: File } | { error: string }> {
  const url = URL.createObjectURL(file)
  const readError = '사진을 읽지 못했습니다. JPG 또는 PNG 사진을 다시 선택해 주세요.'
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const width = image.naturalWidth
    const height = image.naturalHeight
    if (!width || !height || width > 6000 || height > 6000 || width * height > 16_000_000) return { error: readError }
    if (Math.abs(width / height - 0.75) > 0.02) {
      return { error: '가로 3, 세로 4 비율로 자른 반명함판 사진을 선택해 주세요.' }
    }
    // Re-encoding keeps the displayed orientation and strips camera metadata.
    const scale = Math.min(1, 900 / width, 1200 / height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const context = canvas.getContext('2d')
    if (!context) return { error: readError }
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!jpeg || jpeg.type !== 'image/jpeg' || jpeg.size > joinApplicationFileRules.photo.maxBytes) return { error: readError }
    return { file: new File([jpeg], file.name.replace(/\.[^.]+$/, '.jpg'), { type: jpeg.type }) }
  } catch {
    return { error: readError }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function PhotoPreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const image = imageRef.current
    if (!image) return
    const url = URL.createObjectURL(file)
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <img alt="" className="join-application__photo-preview" ref={imageRef} />
}

function AttachmentField({ kind, file, error, checking, onChange }: {
  kind: JoinApplicationAttachmentKind
  file: File | null
  error?: string
  checking?: boolean
  onChange: (file: File | null) => void
}) {
  const t = usePageCopy('join')
  const id = kind === 'photo' ? 'join-v2-photo' : 'join-v2-recommendation'
  const label = t(kind === 'photo' ? 'portraitPhoto' : 'recommendationFile')
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ApplicationField id={id} label={label} optional error={error}>
      <div className="join-application__file-row">
        <input
          accept={joinApplicationFileRules[kind].accept}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          aria-invalid={Boolean(error)}
          aria-label={`${label} (${t('optionalField')})`}
          className="sr-only join-application__file-input"
          id={id}
          onChange={event => {
            const selected = event.currentTarget.files?.[0]
            if (selected) onChange(selected)
            event.currentTarget.value = ''
          }}
          ref={inputRef}
          type="file"
        />
        <label className="join-application__file-picker" htmlFor={id}>{t(file ? 'replaceFile' : 'chooseFile')}</label>
        {file || error || checking ? <button
          aria-label={`${t('removeFile')} · ${label}`}
          className="join-application__file-clear"
          onClick={() => { onChange(null); inputRef.current?.focus() }}
          type="button"
        >{t('removeFile')}</button> : null}
      </div>
      <p className="join-application__field-help" id={`${id}-help`}>{t(kind === 'photo' ? 'portraitPhotoHelp' : 'recommendationHelp')}</p>
      {checking ? <p className="join-application__field-help" role="status">{t('checkingPhoto')}</p> : null}
      {file ? <div className="join-application__file-summary" role="status">
        {kind === 'photo' ? <PhotoPreview file={file} /> : null}
        <span>{file.name}</span>
      </div> : null}
    </ApplicationField>
  )
}

export function JoinApplicationForm({ joinInfo }: { joinInfo: JoinInfoRow }) {
  const { isSample, translate } = useSampleLanguage()
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('join')
  const publishedDescription = t('applicationDescription')
  const description = publishedDescription === oldApplicationDescription || publishedDescription === translate(oldApplicationDescription)
    ? translate(pageCopyDefaults.join.applicationDescription)
    : publishedDescription
  const [values, setValues] = useState<JoinApplicationValues>(createInitialJoinApplicationValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [stage, setStage] = useState<Stage>('edit')
  const [configState, setConfigState] = useState<ConfigState>({ kind: 'loading' })
  const [configAttempt, setConfigAttempt] = useState(0)
  const [clock, setClock] = useState(() => performance.now())
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasUnconfirmedRequest, setHasUnconfirmedRequest] = useState(false)
  const [checkingPhoto, setCheckingPhoto] = useState(false)
  const photoSelection = useRef(0)
  const submissionId = useRef<string | null>(null)
  const attemptedSubmissionId = useRef<string | null>(null)
  const submitGuard = useRef(false)
  const previousStage = useRef<Stage>('edit')
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let active = true
    void getJoinApplicationConfig(joinInfo.id).then(result => {
      if (!active) return
      const serverTime = Date.parse(result.data?.server_now ?? '')
      if (result.error || !result.data || !Number.isFinite(serverTime)) {
        setConfigState({ kind: 'error', message: result.error || '신청 서버 정보를 확인할 수 없습니다. 다시 불러와 주세요.' })
        return
      }
      const receivedAt = performance.now()
      setClock(receivedAt)
      setConfigState({ kind: 'ready', data: result.data, serverTime, receivedAt })
    }).catch(() => {
      if (active) setConfigState({ kind: 'error', message: '신청 서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 불러와 주세요.' })
    })
    return () => { active = false }
  }, [joinInfo.id, configAttempt])

  useEffect(() => {
    if (configState.kind !== 'ready') return
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      const tick = performance.now()
      setClock(tick)
      if (timer !== undefined) clearTimeout(timer)
      const serverNow = configState.serverTime + Math.max(0, tick - configState.receivedAt)
      const period = getJoinRecruitment(configState.data, new Date(serverNow))
      if (period.nextChangeAt !== null) {
        timer = setTimeout(update, Math.min(Math.max(period.nextChangeAt - serverNow, 0) + 25, 2_147_483_647))
      }
    }
    const serverNow = configState.serverTime + Math.max(0, performance.now() - configState.receivedAt)
    const period = getJoinRecruitment(configState.data, new Date(serverNow))
    if (period.nextChangeAt !== null) timer = setTimeout(update, Math.min(Math.max(period.nextChangeAt - serverNow, 0) + 25, 2_147_483_647))
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      if (timer !== undefined) clearTimeout(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [configState])

  useEffect(() => {
    if (stage === 'review') reviewHeading.current?.focus()
    if (stage === 'success') successHeading.current?.focus()
    if (stage === 'edit' && previousStage.current === 'review') document.getElementById('join-v2-name')?.focus()
    previousStage.current = stage
  }, [stage])

  const recruitment = configState.kind === 'ready'
    ? getJoinRecruitment(configState.data, new Date(configState.serverTime + Math.max(0, clock - configState.receivedAt)))
    : null
  const canConfirmExistingRequest = stage === 'review' && hasUnconfirmedRequest
  const submissionReady = configState.kind === 'ready' && configState.data.form_version === 3

  function refreshConfig() {
    if (submitGuard.current) return
    setConfigState({ kind: 'loading' })
    setConfigAttempt(attempt => attempt + 1)
  }

  function changeValue<Key extends keyof JoinApplicationValues>(key: Key, value: JoinApplicationValues[Key]) {
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
    setSubmitError(null)
    submissionId.current = null
    attemptedSubmissionId.current = null
    setHasUnconfirmedRequest(false)
  }

  function changePart(part: JoinApplicationValues['desired_parts'][number], checked: boolean) {
    setValues(current => ({
      ...current,
      desired_parts: checked
        ? [...new Set([...current.desired_parts, part])]
        : current.desired_parts.filter(value => value !== part),
    }))
    setErrors(current => ({ ...current, desired_parts: undefined }))
    setSubmitError(null)
    submissionId.current = null
    attemptedSubmissionId.current = null
    setHasUnconfirmedRequest(false)
  }

  function changeSchoolLevel(level: JoinApplicationValues['school_level']) {
    changeValue('school_level', level)
    if (level !== 'university') changeValue('department', '')
  }

  async function selectAttachment(kind: JoinApplicationAttachmentKind, file: File | null) {
    const key = kind === 'photo' ? 'photo_file' : 'recommendation_file'
    if (kind === 'photo') photoSelection.current += 1
    const selection = photoSelection.current
    changeValue(key, null)
    if (kind === 'photo') setCheckingPhoto(false)
    if (!file) return

    const error = getJoinApplicationFileError(file, kind)
    if (error) {
      setErrors(current => ({ ...current, [key]: error }))
      return
    }
    if (kind === 'photo') {
      setCheckingPhoto(true)
      const result = await preparePortraitPhoto(file)
      if (selection !== photoSelection.current) return
      setCheckingPhoto(false)
      if ('error' in result) {
        setErrors(current => ({ ...current, photo_file: result.error }))
        return
      }
      changeValue(key, result.file)
      return
    }
    changeValue(key, file)
  }

  function currentServerTime() {
    return configState.kind === 'ready'
      ? new Date(configState.serverTime + Math.max(0, performance.now() - configState.receivedAt))
      : null
  }

  function canSubmitNow() {
    const now = currentServerTime()
    return configState.kind === 'ready' && now && getJoinRecruitment(configState.data, now).canApply
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitGuard.current || checkingPhoto || !canSubmitNow()) return
    const nextErrors = validateJoinApplicationValues(values, currentServerTime() ?? undefined)
    if (errors.photo_file) nextErrors.photo_file = errors.photo_file
    if (errors.recommendation_file) nextErrors.recommendation_file = errors.recommendation_file
    setErrors(nextErrors)
    setSubmitError(null)
    const firstError = Object.keys(nextErrors).find(key => nextErrors[key as keyof JoinApplicationValues]) as keyof JoinApplicationValues | undefined
    if (firstError) {
      document.getElementById(fieldIds[firstError] ?? 'join-v2-name')?.focus()
      return
    }
    if (!submissionId.current) submissionId.current = crypto.randomUUID()
    setStage('review')
  }

  async function submit() {
    if (submitGuard.current || stage !== 'review') return
    if (isSample) {
      setSubmitError(SAMPLE_SUBMISSION_MESSAGES.application)
      return
    }
    const confirmingExistingRequest = attemptedSubmissionId.current !== null && attemptedSubmissionId.current === submissionId.current
    if (!canSubmitNow() && !confirmingExistingRequest) {
      setClock(performance.now())
      setSubmitError('현재는 접수할 수 없습니다. 모집 정보를 다시 확인해 주세요.')
      return
    }
    submitGuard.current = true
    setSubmitting(true)
    setSubmitError(null)
    const requestId = submissionId.current ?? crypto.randomUUID()
    submissionId.current = requestId
    attemptedSubmissionId.current = requestId
    setHasUnconfirmedRequest(true)
    try {
      const result = await submitJoinApplication(values, joinInfo.id, requestId, currentServerTime() ?? undefined)
      if (result.data === true && !result.error) {
        setValues(createInitialJoinApplicationValues())
        setErrors({})
        setHasUnconfirmedRequest(false)
        setStage('success')
      } else {
        setSubmitError(result.error || '접수 결과를 확인하지 못했습니다. 작성한 내용은 유지됩니다. 같은 내용으로 다시 시도해 주세요.')
      }
    } catch {
      setSubmitError('접수 결과를 확인하지 못했습니다. 연결을 확인한 뒤 같은 내용으로 다시 시도해 주세요.')
    } finally {
      submitGuard.current = false
      setSubmitting(false)
    }
  }

  const inputState = (key: keyof JoinApplicationValues) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${fieldIds[key]}-error` : undefined,
  })
  const partDescription = ['join-v2-parts-help', errors.desired_parts ? 'join-v2-parts-error' : ''].filter(Boolean).join(' ')
  const level = schoolLevels.find(([value]) => value === values.school_level)
  const gender = genderOptions.find(([value]) => value === values.gender)
  const reviewRows = [
    [t('name'), values.applicant_name], [t('birth'), values.birth_date],
    [t('gender'), gender ? t(gender[1]) : ''],
    [t('schoolLevel'), level ? t(level[1]) : ''], [t('schoolName'), values.school], [t('grade'), values.grade],
    ...(values.school_level === 'university' && values.department.trim() ? [[t('department'), values.department]] : []),
    [t('applicantPhone'), values.applicant_phone], [t('guardianPhone'), values.guardian_phone],
    [t('desiredParts'), joinPartOptions.filter(part => values.desired_parts.includes(part.value)).map(part => translate(part.label)).join(' · ')],
    [t('motivation'), values.motivation],
    ...(values.photo_file ? [[t('portraitPhoto'), values.photo_file.name]] : []),
    ...(values.recommendation_file ? [[t('recommendationFile'), values.recommendation_file.name]] : []),
  ]

  return (
    <section className="join-application" id="application" aria-labelledby="join-application-title">
      <header className="join-application__heading join-application__container">
        <p className="join-application__eyebrow">{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.9bb6e639c7" text={copyText("join", "join.fixed.JoinApplicationForm.9bb6e639c7", "서울모테트청소년합창단")}>{copyText("join", "join.fixed.JoinApplicationForm.9bb6e639c7", "서울모테트청소년합창단")}</FormattedCopy>}</p>
        <h1 id="join-application-title">{<FormattedCopy page="join" id="join.applicationTitle" text={t('applicationTitle')}>{t('applicationTitle')}</FormattedCopy>}</h1>
        <p><FormattedCopy page="join" id="join.applicationDescription" text={description}>{description}</FormattedCopy></p>
        {recruitment?.periodLabel ? <p className="join-application__period"><strong>{translate(recruitment.label)}</strong><span>{workflowRecruitmentPeriod(recruitment.periodLabel, translate)}</span></p> : null}
      </header>

      <div className="join-application__body join-application__container">
        <aside className="join-application__sidebar" aria-label={copyText("join", "join.fixed.JoinApplicationForm.c04713a10b", "지원서 구성")}>{<FormattedCopy page="join" id="join.applicant" text={t('applicant')}>{t('applicant')}</FormattedCopy>}<br />{<FormattedCopy page="join" id="join.contact" text={t('contact')}>{t('contact')}</FormattedCopy>}<br />{<FormattedCopy page="join" id="join.content" text={t('content')}>{t('content')}</FormattedCopy>}<br /><FormattedCopy page="join" id="join.attachments" text={t('attachments')}>{t('attachments')}</FormattedCopy></aside>
        <div className="join-application__content">
          {stage === 'success' ? (
            <div className="join-application__state" role="status">
              <h2 ref={successHeading} tabIndex={-1}>{<FormattedCopy page="join" id="join.success" text={t('success')}>{t('success')}</FormattedCopy>}</h2>
              <p>{<FormattedCopy page="join" id="join.successHelp" text={t('successHelp')}>{t('successHelp')}</FormattedCopy>}</p>
              <TransitionLink className="join-application__primary" to="/join#join-guide-title">{<FormattedCopy page="join" id="join.back" text={t('back')}>{t('back')}</FormattedCopy>}</TransitionLink>
            </div>
          ) : configState.kind === 'loading' ? (
            <div className="join-application__state" aria-busy="true" role="status">
              <p>{<FormattedCopy page="join" id="join.loading" text={t('loading')}>{t('loading')}</FormattedCopy>}</p>
              <div className="join-application__skeleton" aria-hidden="true"><span /><span /><span /></div>
            </div>
          ) : configState.kind === 'error' ? (
            <div className="join-application__state" role="alert">
              <h2>{<FormattedCopy page="join" id="join.connectionError" text={t('connectionError')}>{t('connectionError')}</FormattedCopy>}</h2>
              <p>{translate(configState.message)}</p>
              <p>{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.575ae39474" text={copyText("join", "join.fixed.JoinApplicationForm.575ae39474", "서버 연결이 확인되기 전에는 지원서를 제출할 수 없습니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.575ae39474", "서버 연결이 확인되기 전에는 지원서를 제출할 수 없습니다.")}</FormattedCopy>}</p>
              <button className="join-application__primary" onClick={refreshConfig} type="button">{<FormattedCopy page="join" id="join.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</button>
            </div>
          ) : !recruitment?.canApply && !submitting && !canConfirmExistingRequest ? (
            <div className="join-application__state" role="status">
              <h2>{recruitment?.status === 'before' ? <FormattedCopy page="join" id="join.fixed.JoinApplicationForm.ed306ce8c4" text={copyText("join", "join.fixed.JoinApplicationForm.ed306ce8c4", "아직 모집이 시작되지 않았습니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.ed306ce8c4", "아직 모집이 시작되지 않았습니다.")}</FormattedCopy> : recruitment?.status === 'closed' ? <FormattedCopy page="join" id="join.fixed.JoinApplicationForm.f0f5ccebf3" text={copyText("join", "join.fixed.JoinApplicationForm.f0f5ccebf3", "모집이 마감되었습니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.f0f5ccebf3", "모집이 마감되었습니다.")}</FormattedCopy> : <FormattedCopy page="join" id="join.fixed.JoinApplicationForm.cea3d70866" text={copyText("join", "join.fixed.JoinApplicationForm.cea3d70866", "모집 일정을 확인해 주세요.")}>{copyText("join", "join.fixed.JoinApplicationForm.cea3d70866", "모집 일정을 확인해 주세요.")}</FormattedCopy>}</h2>
              <p>{recruitment?.periodLabel || <FormattedCopy page="join" id="join.fixed.JoinApplicationForm.2a9cfcef5c" text={copyText("join", "join.fixed.JoinApplicationForm.2a9cfcef5c", "모집 일정은 입단 문의를 통해 확인해 주세요.")}>{copyText("join", "join.fixed.JoinApplicationForm.2a9cfcef5c", "모집 일정은 입단 문의를 통해 확인해 주세요.")}</FormattedCopy>}</p>
              <p>{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.8c5a2d8937" text={copyText("join", "join.fixed.JoinApplicationForm.8c5a2d8937", "이미 작성한 내용은 이 화면에 유지됩니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.8c5a2d8937", "이미 작성한 내용은 이 화면에 유지됩니다.")}</FormattedCopy>}</p>
              {submitError ? <p className="join-application__error" role="alert">{translate(submitError)}</p> : null}
              <button className="join-application__secondary" onClick={refreshConfig} type="button">{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.c81c65009e" text={copyText("join", "join.fixed.JoinApplicationForm.c81c65009e", "모집 정보 다시 확인")}>{copyText("join", "join.fixed.JoinApplicationForm.c81c65009e", "모집 정보 다시 확인")}</FormattedCopy>}</button>
            </div>
          ) : stage === 'review' ? (
            <div className="join-application__review" aria-busy={submitting}>
              <h2 ref={reviewHeading} tabIndex={-1}>{<FormattedCopy page="join" id="join.reviewTitle" text={t('reviewTitle')}>{t('reviewTitle')}</FormattedCopy>}</h2>
              <dl>{reviewRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <p>{translate('개인정보 수집 및 이용에 동의했습니다.')}</p>
              {!submissionReady ? <p role="status">{t('updatedFormPending')}</p> : null}
              {!recruitment?.canApply && canConfirmExistingRequest ? <p role="status">{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.b9f2d76803" text={copyText("join", "join.fixed.JoinApplicationForm.b9f2d76803", "모집 기간이 지나 이전 요청의 접수 결과만 확인할 수 있습니다. 새로운 내용으로는 제출할 수 없습니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.b9f2d76803", "모집 기간이 지나 이전 요청의 접수 결과만 확인할 수 있습니다. 새로운 내용으로는 제출할 수 없습니다.")}</FormattedCopy>}</p> : null}
              {submitError ? <p className="join-application__error" role="alert">{translate(submitError)}</p> : null}
              <div className="join-application__actions">
                <button className="join-application__secondary" disabled={submitting || !recruitment?.canApply} onClick={() => { setStage('edit'); setSubmitError(null) }} type="button">{<FormattedCopy page="join" id="join.edit" text={t('edit')}>{t('edit')}</FormattedCopy>}</button>
                <button className="join-application__primary" disabled={submitting || !submissionReady} onClick={() => void submit()} type="button">{submitting ? <FormattedCopy page="join" id="join.submitting" text={t('submitting')}>{t('submitting')}</FormattedCopy> : !recruitment?.canApply && canConfirmExistingRequest ? <FormattedCopy page="join" id="join.confirmPrevious" text={t('confirmPrevious')}>{t('confirmPrevious')}</FormattedCopy> : <FormattedCopy page="join" id="join.submit" text={t('submit')}>{t('submit')}</FormattedCopy>}</button>
              </div>
            </div>
          ) : (
            <form className="join-application__form" noValidate onSubmit={review}>
              <div className="join-application__honeypot" aria-hidden="true"><label htmlFor="join-v2-website">{translate('웹사이트')}</label><input autoComplete="off" id="join-v2-website" onChange={event => changeValue('website', event.target.value)} tabIndex={-1} value={values.website} /></div>
              {Object.values(errors).some(Boolean) ? <p className="join-application__error" role="alert">{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.a71c878907" text={copyText("join", "join.fixed.JoinApplicationForm.a71c878907", "입력 내용을 확인해 주세요. 표시된 항목을 수정한 뒤 다시 확인할 수 있습니다.")}>{copyText("join", "join.fixed.JoinApplicationForm.a71c878907", "입력 내용을 확인해 주세요. 표시된 항목을 수정한 뒤 다시 확인할 수 있습니다.")}</FormattedCopy>}</p> : null}
              <fieldset className="join-application__group">
                <legend>{<FormattedCopy page="join" id="join.applicant" text={t('applicant')}>{t('applicant')}</FormattedCopy>}</legend>
                <div className="join-application__field-grid">
                  <ApplicationField id="join-v2-name" label={t('name')} error={errors.applicant_name}><input {...inputState('applicant_name')} autoComplete="name" id="join-v2-name" onChange={event => changeValue('applicant_name', event.target.value)} placeholder={t('namePlaceholder')} required value={values.applicant_name} /></ApplicationField>
                  <ApplicationField id="join-v2-birth-date" label={t('birth')} error={errors.birth_date}><SampleDateInput ariaDescribedBy={errors.birth_date ? 'join-v2-birth-date-error' : undefined} ariaInvalid={Boolean(errors.birth_date)} autoComplete="bday" className="join-application__date-control" id="join-v2-birth-date" label={t('birth')} onChange={value => changeValue('birth_date', value)} required value={values.birth_date} /></ApplicationField>
                  <ApplicationField id="join-v2-gender" label={t('gender')} error={errors.gender}>
                    <select {...inputState('gender')} id="join-v2-gender" onChange={event => changeValue('gender', event.target.value as JoinApplicationValues['gender'])} required value={values.gender}>
                      <option value="">{t('chooseGender')}</option>
                      {genderOptions.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
                    </select>
                  </ApplicationField>
                  <ApplicationField id="join-v2-school-level" label={t('schoolLevel')} error={errors.school_level}>
                    <select {...inputState('school_level')} id="join-v2-school-level" onChange={event => changeSchoolLevel(event.target.value as JoinApplicationValues['school_level'])} required value={values.school_level}>
                      <option value="">{t('chooseSchoolLevel')}</option>
                      {schoolLevels.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
                    </select>
                  </ApplicationField>
                  <ApplicationField id="join-v2-school" label={t('schoolName')} error={errors.school}><input {...inputState('school')} autoComplete="organization" id="join-v2-school" maxLength={200} onChange={event => changeValue('school', event.target.value)} placeholder={t('schoolNamePlaceholder')} required value={values.school} /></ApplicationField>
                  <ApplicationField id="join-v2-grade" label={t('grade')} error={errors.grade}><input {...inputState('grade')} id="join-v2-grade" maxLength={24} onChange={event => changeValue('grade', event.target.value)} placeholder={t('gradePlaceholder')} required value={values.grade} /></ApplicationField>
                  {values.school_level === 'university' ? <ApplicationField id="join-v2-department" label={t('department')} error={errors.department} optional><input {...inputState('department')} id="join-v2-department" maxLength={120} onChange={event => changeValue('department', event.target.value)} placeholder={t('departmentPlaceholder')} value={values.department} /></ApplicationField> : null}
                </div>
              </fieldset>

              <fieldset className="join-application__group">
                <legend>{<FormattedCopy page="join" id="join.contact" text={t('contact')}>{t('contact')}</FormattedCopy>}</legend>
                <div className="join-application__field-grid">
                  <ApplicationField id="join-v2-applicant-phone" label={t('applicantPhone')} error={errors.applicant_phone}><input {...inputState('applicant_phone')} autoComplete="section-applicant tel" id="join-v2-applicant-phone" onChange={event => changeValue('applicant_phone', event.target.value)} placeholder="010-0000-0000" required type="tel" value={values.applicant_phone} /></ApplicationField>
                  <ApplicationField id="join-v2-guardian-phone" label={t('guardianPhone')} error={errors.guardian_phone}><input {...inputState('guardian_phone')} autoComplete="section-guardian tel" id="join-v2-guardian-phone" onChange={event => changeValue('guardian_phone', event.target.value)} placeholder="010-0000-0000" required type="tel" value={values.guardian_phone} /></ApplicationField>
                </div>
              </fieldset>

              <fieldset className="join-application__group">
                <legend>{<FormattedCopy page="join" id="join.content" text={t('content')}>{t('content')}</FormattedCopy>}</legend>
                <fieldset className="join-application__parts" aria-describedby={partDescription} aria-invalid={Boolean(errors.desired_parts)}>
                  <legend>{<FormattedCopy page="join" id="join.desiredParts" text={t('desiredParts')}>{t('desiredParts')}</FormattedCopy>} <span aria-hidden="true">*</span><span className="sr-only">{copyText("join", "join.fixed.JoinApplicationForm.82e405d221", " 필수")}</span>{<FormattedCopy page="join" id="join.fixed.JoinApplicationForm.a961ad9606" text={copyText("join", "join.fixed.JoinApplicationForm.a961ad9606", " · 복수 선택 가능")}>{copyText("join", "join.fixed.JoinApplicationForm.a961ad9606", " · 복수 선택 가능")}</FormattedCopy>}</legend>
                  <p id="join-v2-parts-help">{<FormattedCopy page="join" id="join.partsHelp" text={t('partsHelp')}>{t('partsHelp')}</FormattedCopy>}</p>
                  <div className="join-application__part-options">
                    {joinPartOptions.map((part, index) => <label key={part.value}><input aria-describedby={partDescription} aria-invalid={Boolean(errors.desired_parts)} checked={values.desired_parts.includes(part.value)} id={index === 0 ? 'join-v2-parts' : `join-v2-parts-${part.value}`} onChange={event => changePart(part.value, event.target.checked)} type="checkbox" value={part.value} />{translate(part.label)}</label>)}
                  </div>
                  {errors.desired_parts ? <p className="join-application__field-error" id="join-v2-parts-error">{translate(errors.desired_parts)}</p> : null}
                </fieldset>
                <ApplicationField id="join-v2-motivation" label={t('motivation')} error={errors.motivation}><textarea {...inputState('motivation')} id="join-v2-motivation" onChange={event => changeValue('motivation', event.target.value)} placeholder={t('motivationPlaceholder')} required rows={4} value={values.motivation} /></ApplicationField>
              </fieldset>

              <fieldset className="join-application__group">
                <legend><FormattedCopy page="join" id="join.attachments" text={t('attachments')}>{t('attachments')}</FormattedCopy></legend>
                <div className="join-application__field-grid">
                  <AttachmentField checking={checkingPhoto} error={errors.photo_file} file={values.photo_file} kind="photo" onChange={file => void selectAttachment('photo', file)} />
                  <AttachmentField error={errors.recommendation_file} file={values.recommendation_file} kind="recommendation" onChange={file => void selectAttachment('recommendation', file)} />
                </div>
              </fieldset>

              <div className="join-application__privacy">
                <label><input {...inputState('privacy_agreed')} checked={values.privacy_agreed} id="join-v2-privacy" onChange={event => changeValue('privacy_agreed', event.target.checked)} required type="checkbox" /><span><strong>{translate('개인정보 수집 및 이용 동의 (필수)')}</strong><br />{translate('입단지원서 접수를 위한 개인정보 수집 및 이용에 동의합니다. 입력하신 정보는 입단 절차 안내와 확인 목적으로만 사용됩니다.')}</span></label>
                {errors.privacy_agreed ? <p className="join-application__field-error" id="join-v2-privacy-error">{translate(errors.privacy_agreed)}</p> : null}
              </div>
              <button className="join-application__primary" disabled={checkingPhoto} type="submit">{<FormattedCopy page="join" id="join.review" text={t('review')}>{t('review')}</FormattedCopy>}</button>
            </form>
          )}

          <div className="join-application__contact">
            <h2>{<FormattedCopy page="join" id="join.auditionInquiry" text={t('auditionInquiry')}>{t('auditionInquiry')}</FormattedCopy>}</h2>
            <TransitionLink to="/contact#form">{<FormattedCopy page="join" id="join.foundationInquiry" text={t('foundationInquiry')}>{t('foundationInquiry')}</FormattedCopy>}</TransitionLink>
          </div>
          {stage !== 'success' ? <TransitionLink className="join-application__secondary" to="/join#join-guide-title">{<FormattedCopy page="join" id="join.back" text={t('back')}>{t('back')}</FormattedCopy>}</TransitionLink> : null}
        </div>
      </div>
    </section>
  )
}
