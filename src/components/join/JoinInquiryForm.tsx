import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import {
  createJoinApplication,
  type JoinApplicationInput,
} from '../../lib/publicData'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { Card } from '../common/Card'

type DesiredPart = JoinApplicationInput['desired_part']
type ContactTime = JoinApplicationInput['contact_time']
type JoinFormErrorKey = keyof JoinFormValues | 'photo_file'
type JoinFormErrors = Partial<Record<JoinFormErrorKey, string>>

type JoinFormValues = {
  address: string
  age: string
  applicant_name: string
  applicant_name_english: string
  applicant_name_hanja: string
  applicant_phone: string
  awards: string
  birth_date: string
  choir_experience: '' | 'no' | 'yes'
  contact_time: '' | ContactTime
  desired_part: '' | DesiredPart
  education_status: string
  email: string
  gender: '' | 'female' | 'male'
  grade: string
  guardian_name: string
  guardian_phone: string
  lesson_experience: '' | 'no' | 'yes'
  motivation: string
  music_experience: string
  parent_occupation: string
  privacy_agreed: boolean
  recommender_affiliation: string
  recommender_name: string
  recommender_reason: string
  religion: string
  school: string
  self_introduction: string
  vision: string
  website: string
}

const initialValues: JoinFormValues = {
  address: '',
  age: '',
  applicant_name: '',
  applicant_name_english: '',
  applicant_name_hanja: '',
  applicant_phone: '',
  awards: '',
  birth_date: '',
  choir_experience: '',
  contact_time: '',
  desired_part: '',
  education_status: '',
  email: '',
  gender: '',
  grade: '',
  guardian_name: '',
  guardian_phone: '',
  lesson_experience: '',
  motivation: '',
  music_experience: '',
  parent_occupation: '',
  privacy_agreed: false,
  recommender_affiliation: '',
  recommender_name: '',
  recommender_reason: '',
  religion: '',
  school: '',
  self_introduction: '',
  vision: '',
  website: '',
}

const fieldClassName =
  'mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'

const textareaClassName =
  'mt-2 min-h-32 w-full rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'

const partOptions: Array<{ label: string; value: DesiredPart }> = [
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
  { label: '잘 모르겠습니다', value: 'unsure' },
]

const contactTimeOptions: Array<{ label: string; value: ContactTime }> = [
  { label: '문자 먼저', value: 'text_first' },
  { label: '오전', value: 'morning' },
  { label: '오후', value: 'afternoon' },
  { label: '저녁', value: 'evening' },
  { label: '통화 가능', value: 'call_available' },
]

const requiredFields: Array<[keyof JoinFormValues, string]> = [
  ['applicant_name', '지원자 이름 한글'],
  ['applicant_name_hanja', '지원자 이름 한자'],
  ['applicant_name_english', '지원자 이름 영문'],
  ['birth_date', '생년월일'],
  ['age', '나이'],
  ['gender', '성별'],
  ['religion', '종교'],
  ['address', '주소'],
  ['school', '학교'],
  ['grade', '학년'],
  ['education_status', '최종학력 또는 현재 재학 정보'],
  ['desired_part', '지원 희망 파트'],
  ['applicant_phone', '지원자 휴대폰'],
  ['guardian_name', '보호자 성함'],
  ['guardian_phone', '보호자 휴대폰'],
  ['email', '이메일'],
  ['parent_occupation', '부모님 직업'],
  ['contact_time', '연락 가능 시간대'],
  ['choir_experience', '합창 경험'],
  ['lesson_experience', '레슨 경험'],
  ['music_experience', '음악활동 경험'],
  ['awards', '특기사항 및 수상경력'],
  ['self_introduction', '자기소개'],
  ['motivation', '지원 동기'],
  ['vision', '장래희망 또는 비전'],
]

const errorFocusOrder: JoinFormErrorKey[] = [
  ...requiredFields.map(([key]) => key),
  'photo_file',
  'privacy_agreed',
]

const fieldElementIds: Partial<Record<JoinFormErrorKey, string>> = {
  address: 'join-address',
  age: 'join-age',
  applicant_name: 'join-name-ko',
  applicant_name_english: 'join-name-en',
  applicant_name_hanja: 'join-name-hanja',
  applicant_phone: 'join-student-phone',
  awards: 'join-awards',
  birth_date: 'join-birth-date',
  choir_experience: 'join-choir-experience',
  contact_time: 'join-contact-time',
  desired_part: 'join-part',
  education_status: 'join-education',
  email: 'join-email',
  gender: 'join-gender',
  grade: 'join-grade',
  guardian_name: 'join-guardian-name',
  guardian_phone: 'join-guardian-phone',
  lesson_experience: 'join-lesson-experience',
  motivation: 'join-motivation',
  music_experience: 'join-music-experience',
  parent_occupation: 'join-parent-job',
  photo_file: 'join-photo',
  privacy_agreed: 'join-privacy',
  religion: 'join-religion',
  school: 'join-school',
  self_introduction: 'join-self-introduction',
  vision: 'join-vision',
}

function FieldLabel({
  children,
  htmlFor,
  required = false,
}: {
  children: string
  htmlFor: string
  required?: boolean
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-sm font-semibold text-navy-deep">
        {children}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-state-error">
              *
            </span>
            <span className="sr-only">필수</span>
          </>
        ) : null}
      </span>
    </label>
  )
}

function trimValues(values: JoinFormValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  ) as JoinFormValues
}

function isMissingValue(values: JoinFormValues, key: keyof JoinFormValues) {
  const value = values[key]

  return typeof value === 'string' ? value.trim().length === 0 : !value
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateJoinForm(values: JoinFormValues, photoFile: File | null): JoinFormErrors {
  const errors: JoinFormErrors = {}

  requiredFields.forEach(([key, label]) => {
    if (isMissingValue(values, key)) {
      errors[key] = `${label}을(를) 입력해 주세요.`
    }
  })

  if (values.email.trim() && !isValidEmail(values.email.trim())) {
    errors.email = '이메일 형식을 확인해 주세요.'
  }

  if (!photoFile) {
    errors.photo_file = '지원자 사진을 첨부해 주세요.'
  }

  if (!values.privacy_agreed) {
    errors.privacy_agreed = '개인정보 수집 및 이용 동의가 필요합니다.'
  }

  return errors
}

function getErrorId(key: JoinFormErrorKey) {
  return `join-error-${key}`
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-2 text-xs font-semibold leading-5 text-state-error" id={id}>
      {message}
    </p>
  )
}

export function JoinInquiryForm() {
  const [values, setValues] = useState<JoinFormValues>(initialValues)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [recommendationFile, setRecommendationFile] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<JoinFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const recommendationInputRef = useRef<HTMLInputElement>(null)

  const setValue = <TKey extends keyof JoinFormValues>(
    key: TKey,
    value: JoinFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      if (!current[key]) {
        return current
      }

      const next = { ...current }
      delete next[key]
      return next
    })
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const clearFieldError = (key: JoinFormErrorKey) => {
    setFieldErrors((current) => {
      if (!current[key]) {
        return current
      }

      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const getDescribedBy = (key: JoinFormErrorKey, descriptionId?: string) =>
    classNames(descriptionId, fieldErrors[key] ? getErrorId(key) : undefined) || undefined

  const getFieldClassName = (baseClassName: string, key: JoinFormErrorKey) =>
    classNames(
      baseClassName,
      fieldErrors[key] &&
        'border-state-error bg-state-error/5 focus:border-state-error focus:ring-state-error/20',
    )

  const getAriaInvalid = (key: JoinFormErrorKey) =>
    fieldErrors[key] ? true : undefined

  const focusFirstError = (errors: JoinFormErrors) => {
    const firstErrorKey = errorFocusOrder.find((key) => errors[key])

    if (!firstErrorKey) {
      return
    }

    window.requestAnimationFrame(() => {
      const elementId = fieldElementIds[firstErrorKey]

      if (elementId) {
        document.getElementById(elementId)?.focus()
      }
    })
  }

  const handleFileChange =
    (kind: 'photo' | 'recommendation') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null

      if (kind === 'photo') {
        setPhotoFile(file)
        clearFieldError('photo_file')
      } else {
        setRecommendationFile(file)
      }

      setSubmitError(null)
      setSubmitSuccess(null)
    }

  const resetForm = () => {
    setValues(initialValues)
    setPhotoFile(null)
    setRecommendationFile(null)
    setFieldErrors({})

    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }

    if (recommendationInputRef.current) {
      recommendationInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedValues = trimValues(values)
    const nextFieldErrors = validateJoinForm(trimmedValues, photoFile)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setSubmitError('필수 항목을 확인해 주세요. 오류가 있는 항목 아래에 안내를 표시했습니다.')
      setSubmitSuccess(null)
      focusFirstError(nextFieldErrors)
      return
    }

    const currentPhotoFile = photoFile

    if (!currentPhotoFile) {
      setSubmitError('지원자 사진을 첨부해 주세요.')
      setSubmitSuccess(null)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    const result = await createJoinApplication({
      address: trimmedValues.address,
      age: trimmedValues.age,
      applicant_name: trimmedValues.applicant_name,
      applicant_name_english: trimmedValues.applicant_name_english,
      applicant_name_hanja: trimmedValues.applicant_name_hanja,
      applicant_phone: trimmedValues.applicant_phone,
      awards: trimmedValues.awards,
      birth_date: trimmedValues.birth_date,
      choir_experience: trimmedValues.choir_experience || 'no',
      contact_time: trimmedValues.contact_time || 'text_first',
      desired_part: trimmedValues.desired_part || 'unsure',
      education_status: trimmedValues.education_status,
      email: trimmedValues.email,
      gender: trimmedValues.gender || 'not_specified',
      grade: trimmedValues.grade,
      guardian_name: trimmedValues.guardian_name,
      guardian_phone: trimmedValues.guardian_phone,
      lesson_experience: trimmedValues.lesson_experience || 'no',
      motivation: trimmedValues.motivation,
      music_experience: trimmedValues.music_experience,
      parent_occupation: trimmedValues.parent_occupation,
      photo_file: currentPhotoFile,
      privacy_agreed: trimmedValues.privacy_agreed,
      recommendation_file: recommendationFile,
      recommender_affiliation: trimmedValues.recommender_affiliation || null,
      recommender_name: trimmedValues.recommender_name || null,
      recommender_reason: trimmedValues.recommender_reason || null,
      religion: trimmedValues.religion,
      school: trimmedValues.school,
      self_introduction: trimmedValues.self_introduction,
      vision: trimmedValues.vision,
      website: trimmedValues.website,
    })

    setIsSubmitting(false)

    if (!result.data) {
      setSubmitError(result.error)
      return
    }

    resetForm()
    setSubmitSuccess(
      '입단지원서가 접수되었습니다.\n서울모테트청소년합창단 담당자가 확인 후 보호자 연락처로 안내드리겠습니다.',
    )
  }

  return (
    <Card className="overflow-hidden p-5 sm:p-7" radius="formal">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-warm">
        APPLICATION
      </p>
      <h3 className="mt-3 break-keep text-2xl font-semibold text-navy-deep">
        입단지원서
      </h3>
      <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
        서울모테트청소년합창단 입단을 희망하는 학생은 아래 지원서를 작성해 주세요.
        제출하신 내용을 확인한 후 담당자가 보호자 연락처로 안내드립니다.
      </p>
      <p className="mt-4 rounded-button border border-gold-warm/25 bg-gold-soft/20 px-4 py-3 break-keep text-sm font-semibold leading-7 text-navy-deep">
        추천서는 선택 항목입니다. 추천서가 없어도 지원서를 제출할 수 있습니다.
      </p>
      <p className="mt-4 text-sm leading-6 text-text-muted">
        <span className="font-semibold text-state-error">*</span> 표시 항목과 개인정보 동의는 필수입니다.
      </p>

      <form
        className="mt-7 grid gap-7"
        encType="multipart/form-data"
        noValidate
        onSubmit={handleSubmit}
      >
        <div aria-hidden="true" className="hidden">
          <label htmlFor="join-website">웹사이트</label>
          <input
            autoComplete="off"
            id="join-website"
            onChange={(event) => setValue('website', event.target.value)}
            tabIndex={-1}
            value={values.website}
          />
        </div>

        <fieldset className="grid gap-4">
          <legend className="text-lg font-semibold text-navy-deep">지원자 기본 정보</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="join-name-ko" required>
                지원자 이름 한글
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('applicant_name')}
                aria-invalid={getAriaInvalid('applicant_name')}
                autoComplete="name"
                className={getFieldClassName(fieldClassName, 'applicant_name')}
                id="join-name-ko"
                onChange={(event) => setValue('applicant_name', event.target.value)}
                required
                value={values.applicant_name}
              />
              <FieldError id={getErrorId('applicant_name')} message={fieldErrors.applicant_name} />
            </div>
            <div>
              <FieldLabel htmlFor="join-name-hanja" required>
                지원자 이름 한자
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('applicant_name_hanja')}
                aria-invalid={getAriaInvalid('applicant_name_hanja')}
                className={getFieldClassName(fieldClassName, 'applicant_name_hanja')}
                id="join-name-hanja"
                onChange={(event) => setValue('applicant_name_hanja', event.target.value)}
                required
                value={values.applicant_name_hanja}
              />
              <FieldError
                id={getErrorId('applicant_name_hanja')}
                message={fieldErrors.applicant_name_hanja}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-name-en" required>
                지원자 이름 영문
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('applicant_name_english')}
                aria-invalid={getAriaInvalid('applicant_name_english')}
                autoComplete="name"
                className={getFieldClassName(fieldClassName, 'applicant_name_english')}
                id="join-name-en"
                onChange={(event) => setValue('applicant_name_english', event.target.value)}
                required
                value={values.applicant_name_english}
              />
              <FieldError
                id={getErrorId('applicant_name_english')}
                message={fieldErrors.applicant_name_english}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-birth-date" required>
                생년월일
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('birth_date')}
                aria-invalid={getAriaInvalid('birth_date')}
                className={getFieldClassName(fieldClassName, 'birth_date')}
                id="join-birth-date"
                onChange={(event) => setValue('birth_date', event.target.value)}
                required
                type="date"
                value={values.birth_date}
              />
              <FieldError id={getErrorId('birth_date')} message={fieldErrors.birth_date} />
            </div>
            <div>
              <FieldLabel htmlFor="join-age" required>
                나이
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('age')}
                aria-invalid={getAriaInvalid('age')}
                className={getFieldClassName(fieldClassName, 'age')}
                id="join-age"
                inputMode="numeric"
                onChange={(event) => setValue('age', event.target.value)}
                required
                value={values.age}
              />
              <FieldError id={getErrorId('age')} message={fieldErrors.age} />
            </div>
            <div>
              <FieldLabel htmlFor="join-gender" required>
                성별
              </FieldLabel>
              <select
                aria-describedby={getDescribedBy('gender')}
                aria-invalid={getAriaInvalid('gender')}
                className={getFieldClassName(fieldClassName, 'gender')}
                id="join-gender"
                onChange={(event) =>
                  setValue('gender', event.target.value as JoinFormValues['gender'])
                }
                required
                value={values.gender}
              >
                <option value="">선택해 주세요</option>
                <option value="female">여</option>
                <option value="male">남</option>
              </select>
              <FieldError id={getErrorId('gender')} message={fieldErrors.gender} />
            </div>
            <div>
              <FieldLabel htmlFor="join-religion" required>
                종교
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('religion')}
                aria-invalid={getAriaInvalid('religion')}
                className={getFieldClassName(fieldClassName, 'religion')}
                id="join-religion"
                onChange={(event) => setValue('religion', event.target.value)}
                required
                value={values.religion}
              />
              <FieldError id={getErrorId('religion')} message={fieldErrors.religion} />
            </div>
            <div>
              <FieldLabel htmlFor="join-part" required>
                지원 희망 파트
              </FieldLabel>
              <select
                aria-describedby={getDescribedBy('desired_part')}
                aria-invalid={getAriaInvalid('desired_part')}
                className={getFieldClassName(fieldClassName, 'desired_part')}
                id="join-part"
                onChange={(event) =>
                  setValue('desired_part', event.target.value as JoinFormValues['desired_part'])
                }
                required
                value={values.desired_part}
              >
                <option value="">선택해 주세요</option>
                {partOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError id={getErrorId('desired_part')} message={fieldErrors.desired_part} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-address" required>
                주소
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('address')}
                aria-invalid={getAriaInvalid('address')}
                autoComplete="street-address"
                className={getFieldClassName(textareaClassName, 'address')}
                id="join-address"
                onChange={(event) => setValue('address', event.target.value)}
                required
                value={values.address}
              />
              <FieldError id={getErrorId('address')} message={fieldErrors.address} />
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-lg font-semibold text-navy-deep">학교 및 연락처</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="join-school" required>
                학교
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('school')}
                aria-invalid={getAriaInvalid('school')}
                className={getFieldClassName(fieldClassName, 'school')}
                id="join-school"
                onChange={(event) => setValue('school', event.target.value)}
                required
                value={values.school}
              />
              <FieldError id={getErrorId('school')} message={fieldErrors.school} />
            </div>
            <div>
              <FieldLabel htmlFor="join-grade" required>
                학년
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('grade')}
                aria-invalid={getAriaInvalid('grade')}
                className={getFieldClassName(fieldClassName, 'grade')}
                id="join-grade"
                onChange={(event) => setValue('grade', event.target.value)}
                required
                value={values.grade}
              />
              <FieldError id={getErrorId('grade')} message={fieldErrors.grade} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-education" required>
                최종학력 또는 현재 재학 정보
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('education_status')}
                aria-invalid={getAriaInvalid('education_status')}
                className={getFieldClassName(fieldClassName, 'education_status')}
                id="join-education"
                onChange={(event) => setValue('education_status', event.target.value)}
                required
                value={values.education_status}
              />
              <FieldError
                id={getErrorId('education_status')}
                message={fieldErrors.education_status}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-student-phone" required>
                지원자 휴대폰
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('applicant_phone')}
                aria-invalid={getAriaInvalid('applicant_phone')}
                autoComplete="tel"
                className={getFieldClassName(fieldClassName, 'applicant_phone')}
                id="join-student-phone"
                inputMode="tel"
                onChange={(event) => setValue('applicant_phone', event.target.value)}
                required
                value={values.applicant_phone}
              />
              <FieldError id={getErrorId('applicant_phone')} message={fieldErrors.applicant_phone} />
            </div>
            <div>
              <FieldLabel htmlFor="join-email" required>
                이메일
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('email')}
                aria-invalid={getAriaInvalid('email')}
                autoComplete="email"
                className={getFieldClassName(fieldClassName, 'email')}
                id="join-email"
                inputMode="email"
                onChange={(event) => setValue('email', event.target.value)}
                required
                type="email"
                value={values.email}
              />
              <FieldError id={getErrorId('email')} message={fieldErrors.email} />
            </div>
            <div>
              <FieldLabel htmlFor="join-guardian-name" required>
                보호자 성함
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('guardian_name')}
                aria-invalid={getAriaInvalid('guardian_name')}
                autoComplete="name"
                className={getFieldClassName(fieldClassName, 'guardian_name')}
                id="join-guardian-name"
                onChange={(event) => setValue('guardian_name', event.target.value)}
                required
                value={values.guardian_name}
              />
              <FieldError id={getErrorId('guardian_name')} message={fieldErrors.guardian_name} />
            </div>
            <div>
              <FieldLabel htmlFor="join-guardian-phone" required>
                보호자 휴대폰
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('guardian_phone')}
                aria-invalid={getAriaInvalid('guardian_phone')}
                autoComplete="tel"
                className={getFieldClassName(fieldClassName, 'guardian_phone')}
                id="join-guardian-phone"
                inputMode="tel"
                onChange={(event) => setValue('guardian_phone', event.target.value)}
                required
                value={values.guardian_phone}
              />
              <FieldError id={getErrorId('guardian_phone')} message={fieldErrors.guardian_phone} />
            </div>
            <div>
              <FieldLabel htmlFor="join-parent-job" required>
                부모님 직업
              </FieldLabel>
              <input
                aria-describedby={getDescribedBy('parent_occupation')}
                aria-invalid={getAriaInvalid('parent_occupation')}
                className={getFieldClassName(fieldClassName, 'parent_occupation')}
                id="join-parent-job"
                onChange={(event) => setValue('parent_occupation', event.target.value)}
                required
                value={values.parent_occupation}
              />
              <FieldError
                id={getErrorId('parent_occupation')}
                message={fieldErrors.parent_occupation}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-contact-time" required>
                연락 가능 시간대
              </FieldLabel>
              <select
                aria-describedby={getDescribedBy('contact_time')}
                aria-invalid={getAriaInvalid('contact_time')}
                className={getFieldClassName(fieldClassName, 'contact_time')}
                id="join-contact-time"
                onChange={(event) =>
                  setValue('contact_time', event.target.value as JoinFormValues['contact_time'])
                }
                required
                value={values.contact_time}
              >
                <option value="">선택해 주세요</option>
                {contactTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError id={getErrorId('contact_time')} message={fieldErrors.contact_time} />
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-lg font-semibold text-navy-deep">음악 경험과 지원 동기</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="join-choir-experience" required>
                합창 경험
              </FieldLabel>
              <select
                aria-describedby={getDescribedBy('choir_experience')}
                aria-invalid={getAriaInvalid('choir_experience')}
                className={getFieldClassName(fieldClassName, 'choir_experience')}
                id="join-choir-experience"
                onChange={(event) =>
                  setValue(
                    'choir_experience',
                    event.target.value as JoinFormValues['choir_experience'],
                  )
                }
                required
                value={values.choir_experience}
              >
                <option value="">선택해 주세요</option>
                <option value="yes">있음</option>
                <option value="no">없음</option>
              </select>
              <FieldError
                id={getErrorId('choir_experience')}
                message={fieldErrors.choir_experience}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-lesson-experience" required>
                레슨 경험
              </FieldLabel>
              <select
                aria-describedby={getDescribedBy('lesson_experience')}
                aria-invalid={getAriaInvalid('lesson_experience')}
                className={getFieldClassName(fieldClassName, 'lesson_experience')}
                id="join-lesson-experience"
                onChange={(event) =>
                  setValue(
                    'lesson_experience',
                    event.target.value as JoinFormValues['lesson_experience'],
                  )
                }
                required
                value={values.lesson_experience}
              >
                <option value="">선택해 주세요</option>
                <option value="yes">있음</option>
                <option value="no">없음</option>
              </select>
              <FieldError
                id={getErrorId('lesson_experience')}
                message={fieldErrors.lesson_experience}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-music-experience" required>
                음악활동 경험
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('music_experience')}
                aria-invalid={getAriaInvalid('music_experience')}
                className={getFieldClassName(textareaClassName, 'music_experience')}
                id="join-music-experience"
                onChange={(event) => setValue('music_experience', event.target.value)}
                required
                value={values.music_experience}
              />
              <FieldError
                id={getErrorId('music_experience')}
                message={fieldErrors.music_experience}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-awards" required>
                특기사항 및 수상경력
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('awards')}
                aria-invalid={getAriaInvalid('awards')}
                className={getFieldClassName(textareaClassName, 'awards')}
                id="join-awards"
                onChange={(event) => setValue('awards', event.target.value)}
                placeholder="없으면 없음이라고 적어 주세요."
                required
                value={values.awards}
              />
              <FieldError id={getErrorId('awards')} message={fieldErrors.awards} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-self-introduction" required>
                자기소개
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('self_introduction')}
                aria-invalid={getAriaInvalid('self_introduction')}
                className={getFieldClassName(textareaClassName, 'self_introduction')}
                id="join-self-introduction"
                onChange={(event) => setValue('self_introduction', event.target.value)}
                required
                value={values.self_introduction}
              />
              <FieldError
                id={getErrorId('self_introduction')}
                message={fieldErrors.self_introduction}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-motivation" required>
                지원 동기
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('motivation')}
                aria-invalid={getAriaInvalid('motivation')}
                className={getFieldClassName(textareaClassName, 'motivation')}
                id="join-motivation"
                onChange={(event) => setValue('motivation', event.target.value)}
                required
                value={values.motivation}
              />
              <FieldError id={getErrorId('motivation')} message={fieldErrors.motivation} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-vision" required>
                장래희망 또는 비전
              </FieldLabel>
              <textarea
                aria-describedby={getDescribedBy('vision')}
                aria-invalid={getAriaInvalid('vision')}
                className={getFieldClassName(textareaClassName, 'vision')}
                id="join-vision"
                onChange={(event) => setValue('vision', event.target.value)}
                required
                value={values.vision}
              />
              <FieldError id={getErrorId('vision')} message={fieldErrors.vision} />
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-lg font-semibold text-navy-deep">첨부 파일</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="join-photo" required>
                사진 첨부
              </FieldLabel>
              <input
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                aria-describedby={getDescribedBy('photo_file', 'join-photo-help')}
                aria-invalid={getAriaInvalid('photo_file')}
                className={getFieldClassName(fieldClassName, 'photo_file')}
                id="join-photo"
                onChange={handleFileChange('photo')}
                ref={photoInputRef}
                required
                type="file"
              />
              <p className="mt-2 text-xs leading-5 text-text-muted" id="join-photo-help">
                반명함판 또는 얼굴이 확인 가능한 사진을 첨부해 주세요. jpg, png, webp 파일을 사용할 수 있습니다.
              </p>
              {photoFile ? (
                <p className="mt-2 break-all text-xs font-semibold text-navy-deep">
                  선택됨: {photoFile.name}
                </p>
              ) : null}
              <FieldError id={getErrorId('photo_file')} message={fieldErrors.photo_file} />
            </div>
            <div>
              <FieldLabel htmlFor="join-recommendation">
                추천서 파일
              </FieldLabel>
              <input
                accept=".pdf,.hwp,.hwpx,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                className={fieldClassName}
                id="join-recommendation"
                onChange={handleFileChange('recommendation')}
                ref={recommendationInputRef}
                type="file"
              />
              <p className="mt-2 text-xs leading-5 text-text-muted">
                선택 항목입니다. 추천서가 없어도 지원서를 제출할 수 있습니다.
              </p>
              {recommendationFile ? (
                <p className="mt-2 break-all text-xs font-semibold text-navy-deep">
                  선택됨: {recommendationFile.name}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-lg font-semibold text-navy-deep">추천인 정보</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="join-recommender-name">
                추천인 성함
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-recommender-name"
                onChange={(event) => setValue('recommender_name', event.target.value)}
                value={values.recommender_name}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-recommender-affiliation">
                추천인 소속
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-recommender-affiliation"
                onChange={(event) => setValue('recommender_affiliation', event.target.value)}
                value={values.recommender_affiliation}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-recommender-reason">
                추천 사유
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-recommender-reason"
                onChange={(event) => setValue('recommender_reason', event.target.value)}
                value={values.recommender_reason}
              />
            </div>
          </div>
        </fieldset>

        <label
          className={classNames(
            'flex items-start gap-3 rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-6 text-text-muted',
            fieldErrors.privacy_agreed && 'border-state-error bg-state-error/5',
          )}
        >
          <input
            aria-describedby={getDescribedBy('privacy_agreed')}
            aria-invalid={getAriaInvalid('privacy_agreed')}
            checked={values.privacy_agreed}
            className="mt-1 size-5 shrink-0 accent-gold-warm"
            id="join-privacy"
            onChange={(event) => setValue('privacy_agreed', event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            <span className="font-semibold text-navy-deep">개인정보 수집 및 이용 동의</span>
            <span className="ml-1 font-semibold text-state-error">(필수)</span>
            <br />
            입단지원서 접수를 위한 개인정보 수집 및 이용에 동의합니다. 입력하신 정보는 입단 절차 안내와 확인 목적으로만 사용됩니다.
          </span>
        </label>
        <FieldError id={getErrorId('privacy_agreed')} message={fieldErrors.privacy_agreed} />

        {submitError ? (
          <p
            className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}
        {submitSuccess ? (
          <p
            className="whitespace-pre-line rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success"
            role="status"
          >
            {submitSuccess}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            aria-busy={isSubmitting}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            size="lg"
            type="submit"
            variant="primary"
          >
            {isSubmitting ? '제출 중' : '입단지원서 제출하기'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
