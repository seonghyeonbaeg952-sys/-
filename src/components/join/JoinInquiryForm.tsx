import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import {
  createJoinApplication,
  type JoinApplicationInput,
} from '../../lib/publicData'
import { Button } from '../common/Button'
import { Card } from '../common/Card'

type DesiredPart = JoinApplicationInput['desired_part']
type ContactTime = JoinApplicationInput['contact_time']

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
        {required ? <span className="ml-1 text-state-error">*</span> : null}
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

function getMissingMessage(values: JoinFormValues, photoFile: File | null) {
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

  const missingField = requiredFields.find(([key]) => {
    const value = values[key]

    return typeof value === 'string' ? value.trim().length === 0 : !value
  })

  if (missingField) {
    return `${missingField[1]}을(를) 입력해 주세요.`
  }

  if (!photoFile) {
    return '지원자 사진을 첨부해 주세요.'
  }

  if (!values.privacy_agreed) {
    return '개인정보 수집 및 이용에 동의해 주세요.'
  }

  return null
}

export function JoinInquiryForm() {
  const [values, setValues] = useState<JoinFormValues>(initialValues)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [recommendationFile, setRecommendationFile] = useState<File | null>(null)
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
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const handleFileChange =
    (kind: 'photo' | 'recommendation') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null

      if (kind === 'photo') {
        setPhotoFile(file)
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
    const missingMessage = getMissingMessage(trimmedValues, photoFile)

    if (missingMessage) {
      setSubmitError(missingMessage)
      setSubmitSuccess(null)
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

      <form className="mt-7 grid gap-7" encType="multipart/form-data" onSubmit={handleSubmit}>
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
                autoComplete="name"
                className={fieldClassName}
                id="join-name-ko"
                onChange={(event) => setValue('applicant_name', event.target.value)}
                required
                value={values.applicant_name}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-name-hanja" required>
                지원자 이름 한자
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-name-hanja"
                onChange={(event) => setValue('applicant_name_hanja', event.target.value)}
                required
                value={values.applicant_name_hanja}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-name-en" required>
                지원자 이름 영문
              </FieldLabel>
              <input
                autoComplete="name"
                className={fieldClassName}
                id="join-name-en"
                onChange={(event) => setValue('applicant_name_english', event.target.value)}
                required
                value={values.applicant_name_english}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-birth-date" required>
                생년월일
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-birth-date"
                onChange={(event) => setValue('birth_date', event.target.value)}
                required
                type="date"
                value={values.birth_date}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-age" required>
                나이
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-age"
                inputMode="numeric"
                onChange={(event) => setValue('age', event.target.value)}
                required
                value={values.age}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-gender" required>
                성별
              </FieldLabel>
              <select
                className={fieldClassName}
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
            </div>
            <div>
              <FieldLabel htmlFor="join-religion" required>
                종교
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-religion"
                onChange={(event) => setValue('religion', event.target.value)}
                required
                value={values.religion}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-part" required>
                지원 희망 파트
              </FieldLabel>
              <select
                className={fieldClassName}
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
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-address" required>
                주소
              </FieldLabel>
              <textarea
                autoComplete="street-address"
                className={textareaClassName}
                id="join-address"
                onChange={(event) => setValue('address', event.target.value)}
                required
                value={values.address}
              />
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
                className={fieldClassName}
                id="join-school"
                onChange={(event) => setValue('school', event.target.value)}
                required
                value={values.school}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-grade" required>
                학년
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-grade"
                onChange={(event) => setValue('grade', event.target.value)}
                required
                value={values.grade}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-education" required>
                최종학력 또는 현재 재학 정보
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-education"
                onChange={(event) => setValue('education_status', event.target.value)}
                required
                value={values.education_status}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-student-phone" required>
                지원자 휴대폰
              </FieldLabel>
              <input
                autoComplete="tel"
                className={fieldClassName}
                id="join-student-phone"
                inputMode="tel"
                onChange={(event) => setValue('applicant_phone', event.target.value)}
                required
                value={values.applicant_phone}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-email" required>
                이메일
              </FieldLabel>
              <input
                autoComplete="email"
                className={fieldClassName}
                id="join-email"
                inputMode="email"
                onChange={(event) => setValue('email', event.target.value)}
                required
                type="email"
                value={values.email}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-guardian-name" required>
                보호자 성함
              </FieldLabel>
              <input
                autoComplete="name"
                className={fieldClassName}
                id="join-guardian-name"
                onChange={(event) => setValue('guardian_name', event.target.value)}
                required
                value={values.guardian_name}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-guardian-phone" required>
                보호자 휴대폰
              </FieldLabel>
              <input
                autoComplete="tel"
                className={fieldClassName}
                id="join-guardian-phone"
                inputMode="tel"
                onChange={(event) => setValue('guardian_phone', event.target.value)}
                required
                value={values.guardian_phone}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-parent-job" required>
                부모님 직업
              </FieldLabel>
              <input
                className={fieldClassName}
                id="join-parent-job"
                onChange={(event) => setValue('parent_occupation', event.target.value)}
                required
                value={values.parent_occupation}
              />
            </div>
            <div>
              <FieldLabel htmlFor="join-contact-time" required>
                연락 가능 시간대
              </FieldLabel>
              <select
                className={fieldClassName}
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
                className={fieldClassName}
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
            </div>
            <div>
              <FieldLabel htmlFor="join-lesson-experience" required>
                레슨 경험
              </FieldLabel>
              <select
                className={fieldClassName}
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
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-music-experience" required>
                음악활동 경험
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-music-experience"
                onChange={(event) => setValue('music_experience', event.target.value)}
                required
                value={values.music_experience}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-awards" required>
                특기사항 및 수상경력
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-awards"
                onChange={(event) => setValue('awards', event.target.value)}
                placeholder="없으면 없음이라고 적어 주세요."
                required
                value={values.awards}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-self-introduction" required>
                자기소개
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-self-introduction"
                onChange={(event) => setValue('self_introduction', event.target.value)}
                required
                value={values.self_introduction}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-motivation" required>
                지원 동기
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-motivation"
                onChange={(event) => setValue('motivation', event.target.value)}
                required
                value={values.motivation}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="join-vision" required>
                장래희망 또는 비전
              </FieldLabel>
              <textarea
                className={textareaClassName}
                id="join-vision"
                onChange={(event) => setValue('vision', event.target.value)}
                required
                value={values.vision}
              />
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
                className={fieldClassName}
                id="join-photo"
                onChange={handleFileChange('photo')}
                ref={photoInputRef}
                required
                type="file"
              />
              <p className="mt-2 text-xs leading-5 text-text-muted">
                반명함판 또는 얼굴이 확인 가능한 사진을 첨부해 주세요. jpg, png, webp 파일을 사용할 수 있습니다.
              </p>
              {photoFile ? (
                <p className="mt-2 break-all text-xs font-semibold text-navy-deep">
                  선택됨: {photoFile.name}
                </p>
              ) : null}
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

        <label className="flex items-start gap-3 rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-6 text-text-muted">
          <input
            checked={values.privacy_agreed}
            className="mt-1 size-5 shrink-0 accent-gold-warm"
            onChange={(event) => setValue('privacy_agreed', event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            입단지원서 접수를 위한 개인정보 수집 및 이용에 동의합니다. 입력하신 정보는 입단 절차 안내와 확인 목적으로만 사용됩니다.
          </span>
        </label>

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
