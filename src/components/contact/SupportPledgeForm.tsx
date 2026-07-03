import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'

import {
  donorCareItems,
  supportSpiritCopy,
  supportMethodItems,
} from '../../constants/spiritContent'
import { createSupportPledge } from '../../lib/publicData'
import type { SiteSettings, SupportSettings } from '../../types/content'
import { Button } from '../common/Button'
import { StaffLines } from '../common/StaffLines'
import { SpiritRibbon } from '../common/Spirit'

type SupportPledgeFormProps = {
  settings: SupportSettings
  siteSettings: SiteSettings
}

type MemberType = 'corporate' | 'individual'

type PledgeFormValues = {
  address: string
  amount: string
  birthDate: string
  customAmount: string
  depositor: string
  email: string
  gender: string
  memberType: MemberType
  name: string
  phone: string
  pledgeDate: string
  signature: string
  signatureImageUrl: string | null
  privacyAgreed: boolean
  website: string
}

type SignaturePoint = {
  x: number
  y: number
}

const fieldClassName =
  'mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-3 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'

const textareaClassName =
  'mt-2 min-h-20 w-full rounded-button border border-line-default bg-bg-warm-white px-3 py-3 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatAmount(amount: number) {
  return `월 ${amount.toLocaleString('ko-KR')}원`
}

function getInitialAmount(settings: SupportSettings) {
  return String(settings.individual_amounts[0] ?? 10000)
}

function getInitialValues(settings: SupportSettings): PledgeFormValues {
  return {
    address: '',
    amount: getInitialAmount(settings),
    birthDate: '',
    customAmount: '',
    depositor: '',
    email: '',
    gender: '',
    memberType: 'individual',
    name: '',
    phone: '',
    pledgeDate: getTodayInputValue(),
    privacyAgreed: false,
    signature: '',
    signatureImageUrl: null,
    website: '',
  }
}

function prepareSignatureContext(context: CanvasRenderingContext2D) {
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 4.2
  context.strokeStyle = '#10233F'
  context.fillStyle = '#10233F'
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string
  htmlFor: string
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-sm font-semibold text-navy-deep">{children}</span>
    </label>
  )
}

type PrintableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function syncPrintableFormValues(source: HTMLElement, clone: HTMLElement) {
  const sourceFields = Array.from(
    source.querySelectorAll<PrintableField>('input, select, textarea'),
  )
  const cloneFields = Array.from(
    clone.querySelectorAll<PrintableField>('input, select, textarea'),
  )

  sourceFields.forEach((sourceField, index) => {
    const cloneField = cloneFields[index]

    if (!cloneField) {
      return
    }

    if (sourceField instanceof HTMLInputElement) {
      if (sourceField.type === 'checkbox' || sourceField.type === 'radio') {
        ;(cloneField as HTMLInputElement).checked = sourceField.checked
      } else {
        cloneField.value = sourceField.value
      }
      return
    }

    cloneField.value = sourceField.value
  })

  const sourceCanvases = Array.from(source.querySelectorAll('canvas'))
  const cloneCanvases = Array.from(clone.querySelectorAll('canvas'))

  sourceCanvases.forEach((sourceCanvas, index) => {
    const cloneCanvas = cloneCanvases[index]

    if (!cloneCanvas) {
      return
    }

    const signatureImage = document.createElement('img')
    signatureImage.alt = sourceCanvas.getAttribute('aria-label') || '서명 이미지'
    signatureImage.className = sourceCanvas.className
    signatureImage.src = sourceCanvas.toDataURL('image/png')
    cloneCanvas.replaceWith(signatureImage)
  })
}

export function SupportPledgeForm({
  settings,
  siteSettings,
}: SupportPledgeFormProps) {
  const [values, setValues] = useState<PledgeFormValues>(() =>
    getInitialValues(settings),
  )
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingSignatureRef = useRef(false)
  const lastSignaturePointRef = useRef<SignaturePoint | null>(null)

  const amountOptions = useMemo(() => {
    return values.memberType === 'individual'
      ? settings.individual_amounts
      : settings.corporate_amounts
  }, [settings.corporate_amounts, settings.individual_amounts, values.memberType])

  const contactPhone = settings.contact_phone || siteSettings.phone || '등록 예정'
  const contactEmail = settings.contact_email || siteSettings.email || '등록 예정'
  const homepageUrl = settings.homepage_url || '등록 예정'
  const hasBankAccount = Boolean(settings.bank_account_number)

  useEffect(() => {
    const canvas = signatureCanvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    prepareSignatureContext(context)

    if (!values.signatureImageUrl) {
      return
    }

    const signatureImage = new Image()
    signatureImage.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(signatureImage, 0, 0, canvas.width, canvas.height)
      prepareSignatureContext(context)
    }
    signatureImage.src = values.signatureImageUrl
  }, [values.signatureImageUrl])

  const setValue = <TKey extends keyof PledgeFormValues>(
    key: TKey,
    value: PledgeFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const setMemberType = (memberType: MemberType) => {
    const nextAmounts =
      memberType === 'individual'
        ? settings.individual_amounts
        : settings.corporate_amounts

    setValues((current) => ({
      ...current,
      amount: String(nextAmounts[0] ?? ''),
      customAmount: '',
      memberType,
    }))
  }

  const handlePrint = () => {
    const previousScrollX = window.scrollX
    const previousScrollY = window.scrollY
    const sourcePrintArea = document.querySelector<HTMLElement>(
      '.support-pledge-print-area',
    )
    const printHost = document.createElement('div')

    printHost.id = 'support-pledge-print-host'

    if (sourcePrintArea) {
      const printableClone = sourcePrintArea.cloneNode(true) as HTMLElement

      syncPrintableFormValues(sourcePrintArea, printableClone)
      printHost.append(printableClone)
      document.body.append(printHost)
    }

    document.body.classList.add('is-printing-support-pledge')
    window.scrollTo(0, 0)

    const cleanup = () => {
      document.body.classList.remove('is-printing-support-pledge')
      window.removeEventListener('afterprint', cleanup)
      printHost.remove()
      window.scrollTo(previousScrollX, previousScrollY)
    }

    window.addEventListener('afterprint', cleanup)
    window.requestAnimationFrame(() => {
      window.print()
    })
  }

  const handleCopyAccount = async () => {
    if (!hasBankAccount) {
      return
    }

    try {
      await navigator.clipboard.writeText(settings.bank_account_number)
      setCopyStatus('계좌번호를 복사했습니다.')
    } catch {
      setCopyStatus('복사할 수 없습니다. 계좌번호를 직접 선택해 주세요.')
    }
  }

  const selectedAmount = Number(
    values.amount === 'custom' ? values.customAmount : values.amount,
  )
  const selectedAmountLabel =
    Number.isFinite(selectedAmount) && selectedAmount > 0
      ? formatAmount(selectedAmount)
      : '선택 예정'
  const memberTypeLabel =
    values.memberType === 'individual' ? '개인회원' : '기업회원'

  const getSignaturePoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): SignaturePoint | null => {
    const canvas = signatureCanvasRef.current

    if (!canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) {
      return null
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const saveSignatureImage = () => {
    const canvas = signatureCanvasRef.current

    if (!canvas) {
      return
    }

    setValue('signatureImageUrl', canvas.toDataURL('image/png'))
  }

  const drawSignatureLine = (
    fromPoint: SignaturePoint,
    toPoint: SignaturePoint,
  ) => {
    const context = signatureCanvasRef.current?.getContext('2d')

    if (!context) {
      return
    }

    prepareSignatureContext(context)
    context.beginPath()
    context.moveTo(fromPoint.x, fromPoint.y)
    context.lineTo(toPoint.x, toPoint.y)
    context.stroke()
  }

  const handleSignaturePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getSignaturePoint(event)
    const context = signatureCanvasRef.current?.getContext('2d')

    if (!point || !context) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    isDrawingSignatureRef.current = true
    lastSignaturePointRef.current = point
    prepareSignatureContext(context)
    context.beginPath()
    context.arc(point.x, point.y, 1.8, 0, Math.PI * 2)
    context.fill()
  }

  const handleSignaturePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingSignatureRef.current || !lastSignaturePointRef.current) {
      return
    }

    const point = getSignaturePoint(event)

    if (!point) {
      return
    }

    event.preventDefault()
    drawSignatureLine(lastSignaturePointRef.current, point)
    lastSignaturePointRef.current = point
  }

  const finishSignatureDrawing = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingSignatureRef.current) {
      return
    }

    event.preventDefault()
    isDrawingSignatureRef.current = false
    lastSignaturePointRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    saveSignatureImage()
  }

  const clearSignatureDrawing = () => {
    const canvas = signatureCanvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      setValue('signatureImageUrl', null)
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    prepareSignatureContext(context)
    setValue('signatureImageUrl', null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!settings.enable_online_submission) {
      setSubmitError('현재 온라인 제출은 닫혀 있습니다. 약정서를 인쇄해 제출해 주세요.')
      return
    }

    const name = values.name.trim()
    const phone = values.phone.trim()
    const email = values.email.trim()

    if (!name || !phone || !email) {
      setSubmitError('이름, 핸드폰, E-mail을 입력해 주세요.')
      return
    }

    if (!Number.isFinite(selectedAmount) || selectedAmount <= 0) {
      setSubmitError('후원금 금액을 선택하거나 기타 금액을 입력해 주세요.')
      return
    }

    if (!values.privacyAgreed) {
      setSubmitError('개인정보 수집 및 이용에 동의해 주세요.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    const result = await createSupportPledge({
      address: values.address.trim() || null,
      amount: selectedAmount,
      birth_date: values.birthDate || null,
      custom_amount: values.amount === 'custom' ? selectedAmount : null,
      depositor: values.depositor.trim() || null,
      email,
      gender:
        values.gender === 'male' ||
        values.gender === 'female' ||
        values.gender === 'none'
          ? values.gender
          : null,
      member_type: values.memberType,
      name,
      phone,
      pledge_date: values.pledgeDate || null,
      privacy_agreed: values.privacyAgreed,
      signature_image_url: values.signatureImageUrl,
      signer_name: values.signature.trim() || name,
      website: values.website,
    })

    setIsSubmitting(false)

    if (!result.data) {
      setSubmitError(result.error)
      return
    }

    setSubmitSuccess(settings.success_message)
  }

  return (
    <section id="support" className="relative mx-auto max-w-5xl overflow-hidden">
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-support" />
      <div className="support-print-hidden">
        <div className="mb-8">
          <div className="flex items-center gap-4 text-gold-warm">
            <span className="size-2.5 rounded-full bg-gold-warm" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em]">
              {supportSpiritCopy.eyebrow}
            </p>
            <StaffLines className="hidden w-44 opacity-70 sm:block" density="light" variant="gold" />
          </div>
          <h2 className="mt-4 break-keep text-4xl font-bold leading-tight text-navy-deep md:text-5xl">
            {supportSpiritCopy.title}
          </h2>
          <p className="mt-4 break-keep text-lg font-semibold leading-8 text-navy-deep">
            {supportSpiritCopy.body}
          </p>
          <p className="mt-3 max-w-3xl break-keep text-sm leading-7 text-text-muted md:text-base">
            {settings.description}
          </p>
          <p className="mt-4 max-w-3xl rounded-button border border-gold-warm/25 bg-gold-soft/20 px-4 py-3 break-keep text-sm font-semibold leading-7 text-navy-deep">
            {supportSpiritCopy.notice}
          </p>
        </div>
        <div className="mb-8 space-y-6">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-formal border border-line-default bg-bg-warm-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-warm">
                SUPPORT METHOD
              </p>
              <h3 className="mt-3 break-keep text-2xl font-semibold text-navy-deep">
                후원은 이렇게 연결됩니다
              </h3>
              <div className="mt-5 space-y-3">
                {supportMethodItems.map((item) => (
                  <div className="rounded-button border border-line-default bg-bg-ivory p-4" key={item.title}>
                    <p className="font-semibold text-navy-deep">{item.title}</p>
                    <p className="mt-2 break-keep text-sm leading-6 text-text-muted">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-formal border border-line-default bg-navy-deep p-5 text-white shadow-premium">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">
                DONOR CARE
              </p>
              <h3 className="mt-3 break-keep text-2xl font-semibold">
                안전한 후원 접수
              </h3>
              <div className="mt-5 space-y-4">
                {donorCareItems.map((item) => (
                  <div key={item.title}>
                    <p className="font-semibold text-gold-soft">{item.title}</p>
                    <p className="mt-2 break-keep text-sm leading-6 text-white/76">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SpiritRibbon
            items={['청소년 음악교육', '정기연주와 초청연주', '봉사와 나눔의 무대']}
          />
        </div>
      </div>

      <form
        className="support-pledge-print-area relative overflow-hidden rounded-formal border border-line-default bg-bg-warm-white p-5 shadow-card sm:p-8 lg:p-10"
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
        <div aria-hidden="true" className="hidden">
          <label htmlFor="support-pledge-website">웹사이트</label>
          <input
            autoComplete="off"
            id="support-pledge-website"
            onChange={(event) => setValue('website', event.target.value)}
            tabIndex={-1}
            value={values.website}
          />
        </div>
        <div className="border-b border-line-default pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-warm">
            {settings.organization_name}
          </p>
          <h3 className="mt-3 text-3xl font-bold text-navy-deep md:text-4xl">
            {settings.title}
          </h3>
          <p className="mt-3 break-keep text-base font-semibold text-navy-deep">
            {settings.subtitle}
          </p>
        </div>

        <div className="mt-7 rounded-button border border-gold-soft/70 bg-bg-ivory p-5">
          <p className="whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
            {settings.message}
          </p>
          {settings.form_note ? (
            <p className="support-print-hidden mt-3 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
              {settings.form_note}
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="size-2 rounded-full bg-gold-warm" aria-hidden="true" />
            <h4 className="text-lg font-semibold text-navy-deep">후원자 정보</h4>
            <div className="h-px flex-1 bg-line-default" aria-hidden="true" />
          </div>
          <div className="support-print-donor-grid grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="support-name">이름</FieldLabel>
              <input
                autoComplete="name"
                className={fieldClassName}
                id="support-name"
                onChange={(event) => setValue('name', event.target.value)}
                required
                value={values.name}
              />
            </div>
            <div>
              <FieldLabel htmlFor="support-gender">성별</FieldLabel>
              <select
                className={fieldClassName}
                id="support-gender"
                onChange={(event) => setValue('gender', event.target.value)}
                value={values.gender}
              >
                <option value="">선택 안 함</option>
                <option value="male">남</option>
                <option value="female">여</option>
                <option value="none">응답하지 않음</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="support-birth-date">생년월일</FieldLabel>
              <input
                className={fieldClassName}
                id="support-birth-date"
                onChange={(event) => setValue('birthDate', event.target.value)}
                type="date"
                value={values.birthDate}
              />
            </div>
            <div>
              <FieldLabel htmlFor="support-phone">핸드폰</FieldLabel>
              <input
                autoComplete="tel"
                className={fieldClassName}
                id="support-phone"
                inputMode="tel"
                onChange={(event) => setValue('phone', event.target.value)}
                required
                value={values.phone}
              />
            </div>
            <div>
              <FieldLabel htmlFor="support-email">E-mail</FieldLabel>
              <input
                autoComplete="email"
                className={fieldClassName}
                id="support-email"
                inputMode="email"
                onChange={(event) => setValue('email', event.target.value)}
                required
                type="email"
                value={values.email}
              />
            </div>
            <div>
              <FieldLabel htmlFor="support-depositor">예금주</FieldLabel>
              <input
                className={fieldClassName}
                id="support-depositor"
                onChange={(event) => setValue('depositor', event.target.value)}
                value={values.depositor}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="support-address">주소</FieldLabel>
              <textarea
                autoComplete="street-address"
                className={textareaClassName}
                id="support-address"
                onChange={(event) => setValue('address', event.target.value)}
                value={values.address}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="size-2 rounded-full bg-gold-warm" aria-hidden="true" />
            <h4 className="text-lg font-semibold text-navy-deep">후원금 선택</h4>
            <div className="h-px flex-1 bg-line-default" aria-hidden="true" />
          </div>
          <div className="support-print-only rounded-button border border-line-default bg-bg-ivory px-3 py-2 text-sm leading-6 text-text-muted">
            <dl className="grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-navy-deep">후원 구분</dt>
                <dd>{memberTypeLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-deep">약정 금액</dt>
                <dd>{selectedAmountLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-deep">납입자명</dt>
                <dd>{values.depositor || values.name || '작성 예정'}</dd>
              </div>
            </dl>
          </div>
          <div className="support-print-amount-controls grid gap-3 sm:grid-cols-2">
            <button
              className={[
                'donation-option min-h-12 rounded-button border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                values.memberType === 'individual'
                  ? 'is-selected border-gold-warm bg-gold-warm text-navy-midnight'
                  : 'border-line-default bg-bg-warm-white text-text-muted hover:border-gold-warm/50 hover:text-navy-deep',
              ].join(' ')}
              aria-pressed={values.memberType === 'individual'}
              onClick={() => setMemberType('individual')}
              type="button"
            >
              개인회원
            </button>
            <button
              className={[
                'donation-option min-h-12 rounded-button border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                values.memberType === 'corporate'
                  ? 'is-selected border-gold-warm bg-gold-warm text-navy-midnight'
                  : 'border-line-default bg-bg-warm-white text-text-muted hover:border-gold-warm/50 hover:text-navy-deep',
              ].join(' ')}
              aria-pressed={values.memberType === 'corporate'}
              onClick={() => setMemberType('corporate')}
              type="button"
            >
              기업회원
            </button>
          </div>
          <div className="support-print-amount-controls mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amountOptions.map((amount) => (
              <label
                className={[
                  'donation-option flex min-h-12 cursor-pointer items-center justify-center rounded-button border px-4 text-center text-sm font-semibold transition',
                  values.amount === String(amount)
                    ? 'is-selected border-navy-deep bg-navy-deep text-bg-warm-white'
                    : 'border-line-default bg-bg-warm-white text-navy-deep hover:border-gold-warm/60',
                ].join(' ')}
                key={amount}
              >
                <input
                  checked={values.amount === String(amount)}
                  className="sr-only"
                  name="support-amount"
                  onChange={() => {
                    setValue('amount', String(amount))
                    setValue('customAmount', '')
                  }}
                  type="radio"
                  value={amount}
                />
                {formatAmount(amount)}
              </label>
            ))}
            {settings.allow_custom_amount ? (
              <label
                className={[
                  'donation-option flex min-h-12 cursor-pointer items-center justify-center rounded-button border px-4 text-center text-sm font-semibold transition',
                  values.amount === 'custom'
                    ? 'is-selected border-navy-deep bg-navy-deep text-bg-warm-white'
                    : 'border-line-default bg-bg-warm-white text-navy-deep hover:border-gold-warm/60',
                ].join(' ')}
              >
                <input
                  checked={values.amount === 'custom'}
                  className="sr-only"
                  name="support-amount"
                  onChange={() => setValue('amount', 'custom')}
                  type="radio"
                  value="custom"
                />
                기타
              </label>
            ) : null}
          </div>
          {values.amount === 'custom' ? (
            <div className="support-print-amount-controls mt-4 max-w-sm">
              <FieldLabel htmlFor="support-custom-amount">기타 금액</FieldLabel>
              <input
                className={fieldClassName}
                id="support-custom-amount"
                inputMode="numeric"
                onChange={(event) => setValue('customAmount', event.target.value)}
                placeholder="예: 70000"
                value={values.customAmount}
              />
            </div>
          ) : null}
        </div>

        <div className="support-print-bank-confirm-grid mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-button border border-line-default bg-bg-ivory p-5">
            <h4 className="text-lg font-semibold text-navy-deep">후원 계좌 안내</h4>
            <dl className="mt-4 grid gap-3 text-sm leading-6 text-text-muted">
              <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                <dt className="font-semibold text-navy-deep">은행명</dt>
                <dd>{settings.bank_name || '관리자 등록 예정'}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                <dt className="font-semibold text-navy-deep">계좌번호</dt>
                <dd>{settings.bank_account_number || '관리자 등록 예정'}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                <dt className="font-semibold text-navy-deep">예금주</dt>
                <dd>{settings.bank_account_holder || '관리자 등록 예정'}</dd>
              </div>
            </dl>
            <p className="mt-4 whitespace-pre-line break-keep text-sm leading-6 text-text-muted">
              {settings.bank_note}
            </p>
            <div className="support-print-hidden mt-4">
              <Button
                disabled={!hasBankAccount}
                onClick={handleCopyAccount}
                size="sm"
                type="button"
                variant="secondary"
              >
                계좌번호 복사
              </Button>
              {copyStatus ? (
                <p className="mt-2 text-sm text-text-muted" role="status">
                  {copyStatus}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-button border border-line-default bg-bg-warm-white p-5">
            <h4 className="text-lg font-semibold text-navy-deep">약정 확인</h4>
            <div className="mt-4 grid gap-4">
              <div>
                <FieldLabel htmlFor="support-pledge-date">날짜</FieldLabel>
                <input
                  className={fieldClassName}
                  id="support-pledge-date"
                  onChange={(event) => setValue('pledgeDate', event.target.value)}
                  type="date"
                  value={values.pledgeDate}
                />
              </div>
              <div>
                <FieldLabel htmlFor="support-signer-name">이름</FieldLabel>
                <input
                  className={fieldClassName}
                  id="support-signer-name"
                  onChange={(event) => setValue('signature', event.target.value)}
                  placeholder={values.name || '성명을 입력하세요'}
                  value={values.signature}
                />
              </div>
              <div className="support-print-signature-box rounded-button border border-dashed border-gold-warm/70 bg-bg-ivory px-4 py-5 text-center">
                <div className="flex items-center justify-between gap-3 text-left">
                  <div>
                    <p className="text-sm font-semibold text-navy-deep">인 / 서명</p>
                    <p className="support-print-hidden mt-1 text-xs leading-5 text-text-muted">
                      마우스나 손가락으로 직접 서명할 수 있습니다.
                    </p>
                  </div>
                  <button
                    className="support-print-hidden min-h-9 shrink-0 rounded-button border border-line-default bg-bg-warm-white px-3 text-xs font-semibold text-text-muted transition hover:border-gold-warm hover:text-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                    onClick={clearSignatureDrawing}
                    type="button"
                  >
                    지우기
                  </button>
                </div>
                <canvas
                  aria-label="마우스 또는 터치로 그리는 인/서명 영역"
                  className="support-signature-canvas mt-4 h-36 w-full touch-none rounded-button border border-line-default bg-bg-warm-white shadow-inner"
                  height={220}
                  onPointerCancel={finishSignatureDrawing}
                  onPointerDown={handleSignaturePointerDown}
                  onPointerLeave={finishSignatureDrawing}
                  onPointerMove={handleSignaturePointerMove}
                  onPointerUp={finishSignatureDrawing}
                  ref={signatureCanvasRef}
                  width={900}
                />
                <p className="mt-3 min-h-7 border-b border-line-default text-left text-sm font-semibold text-navy-deep">
                  {values.signature || values.name || '서명 이름'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-7 text-text-muted">
          <p className="break-keep">
            {settings.privacy_notice}
          </p>
          <p className="mt-2 whitespace-pre-line break-keep">{settings.print_note}</p>
          <label className="support-print-hidden mt-4 flex items-start gap-3 rounded-button border border-line-default bg-bg-warm-white p-4 text-sm leading-6 text-text-muted">
            <input
              checked={values.privacyAgreed}
              className="mt-1 size-5 shrink-0 accent-gold-warm"
              onChange={(event) => setValue('privacyAgreed', event.target.checked)}
              required
              type="checkbox"
            />
            <span>개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </div>

        <div className="mt-7 border-t border-line-default pt-5 text-sm leading-7 text-text-muted">
          <dl className="grid gap-2 md:grid-cols-3">
            <div>
              <dt className="font-semibold text-navy-deep">문의 전화</dt>
              <dd>{contactPhone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-deep">문의 이메일</dt>
              <dd>{contactEmail}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-deep">홈페이지</dt>
              <dd>{homepageUrl}</dd>
            </div>
          </dl>
          <p className="mt-4 whitespace-pre-line break-keep">{settings.footer_note}</p>
        </div>
        <div className="support-print-hidden mt-6">
          {submitError ? (
            <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
              {submitError}
            </p>
          ) : null}
          {submitSuccess ? (
            <p className="rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success" role="status">
              {submitSuccess}
            </p>
          ) : null}
        </div>

        <div className="support-print-hidden mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {settings.enable_online_submission ? (
            <Button
              aria-busy={isSubmitting}
              disabled={isSubmitting}
              size="lg"
              type="submit"
              variant="primary"
            >
              {isSubmitting ? '저장 중' : settings.submit_button_label}
            </Button>
          ) : null}
          <Button onClick={handlePrint} size="lg" type="button" variant="gold">
            {settings.print_button_label}
          </Button>
        </div>
      </form>
    </section>
  )
}
