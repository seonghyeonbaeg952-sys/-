import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'

import {
  donorCareItems,
  supportSpiritCopy,
  supportMethodItems,
} from '../../constants/spiritContent'
import { createSupportPledge } from '../../lib/publicData'
import type { SupportPledgeInput } from '../../lib/publicData'
import { createIntakeSubmissionTracker } from '../../lib/intakeModel'
import type { SiteSettings, SupportSettings } from '../../types/content'
import { Button } from '../common/Button'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import '../../styles/support-pledge.css'

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
  'support-pledge__input'

const textareaClassName =
  'support-pledge__input support-pledge__textarea'

const supportFallbackMessage =
  '후원 관련 자세한 안내는 문의를 통해 도와드리겠습니다.'

const forbiddenSupportValues = new Set([
  '#',
  'href="#"',
  'placeholder',
  'todo',
  'undefined',
  'null',
  '관리자 등록 예정',
  '등록 예정',
  '미정',
  '준비중',
])

function getTodayInputValue() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function normalizeSupportDisplayText(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  if (forbiddenSupportValues.has(trimmedValue.toLowerCase())) {
    return null
  }

  return trimmedValue
}

function formatAmount(amount: number) {
  return `월 ${amount.toLocaleString('ko-KR')}원`
}

function getInitialAmount(settings: SupportSettings) {
  return String(settings.individual_amounts[0] ?? '')
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
  const { copy } = useSiteEditor()
  return (
    <label className="support-pledge__label" htmlFor={htmlFor}>
      {copy('contact', `contact.pledge.${htmlFor}`, children)}
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

    const printedValue = document.createElement('span')
    printedValue.className = 'support-pledge__printed-value'
    if (sourceField instanceof HTMLInputElement) {
      if (sourceField.type === 'checkbox' || sourceField.type === 'radio') {
        printedValue.textContent = sourceField.checked ? '☑ 동의함' : '☐ 동의하지 않음'
      } else {
        printedValue.textContent = sourceField.value || '미작성'
      }
    } else if (sourceField instanceof HTMLSelectElement) {
      printedValue.textContent = sourceField.selectedOptions[0]?.textContent || '미작성'
    } else {
      printedValue.textContent = sourceField.value || '미작성'
    }
    cloneField.replaceWith(printedValue)
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
  clone.querySelectorAll<HTMLElement>('[data-print-fields]').forEach((node) => {
    node.hidden = false
  })
}

export function SupportPledgeForm({
  settings,
  siteSettings,
}: SupportPledgeFormProps) {
  const { copy: copyText } = useSiteEditor()
  const [values, setValues] = useState<PledgeFormValues>(() =>
    getInitialValues(settings),
  )
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const isSubmittingRef = useRef(false)
  const submission = useRef(createIntakeSubmissionTracker())
  const wasSubmittedRef = useRef(false)
  const printAreaRef = useRef<HTMLFormElement>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const wasReviewingRef = useRef(false)
  const printCleanupRef = useRef<(() => void) | null>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingSignatureRef = useRef(false)
  const lastSignaturePointRef = useRef<SignaturePoint | null>(null)

  useEffect(() => {
    const returningToEdit = wasReviewingRef.current && !isReviewing
    wasReviewingRef.current = isReviewing
    if (!isReviewing && !returningToEdit) return

    const frame = window.requestAnimationFrame(() => {
      const target = isReviewing ? reviewHeadingRef.current
        : printAreaRef.current?.querySelector<HTMLInputElement>('#support-name')
      if (!target || target.closest('[hidden]')) return
      target.focus({ preventScroll: true })
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isReviewing])

  useEffect(() => () => printCleanupRef.current?.(), [])

  const amountOptions = useMemo(() => {
    return values.memberType === 'individual'
      ? settings.individual_amounts
      : settings.corporate_amounts
  }, [settings.corporate_amounts, settings.individual_amounts, values.memberType])

  const bankName = normalizeSupportDisplayText(settings.bank_name)
  const bankAccountNumber = normalizeSupportDisplayText(
    settings.bank_account_number,
  )
  const bankAccountHolder = normalizeSupportDisplayText(
    settings.bank_account_holder,
  )
  const bankNote = normalizeSupportDisplayText(settings.bank_note)
  const hasBankAccount = Boolean(bankAccountNumber)
  const hasCompleteBankAccount = Boolean(
    bankName && bankAccountNumber && bankAccountHolder,
  )
  const contactItems = [
    {
      label: '문의 전화',
      value: normalizeSupportDisplayText(
        settings.contact_phone || siteSettings.phone,
      ),
    },
    {
      label: '문의 이메일',
      value: normalizeSupportDisplayText(
        settings.contact_email || siteSettings.email,
      ),
    },
    {
      label: '홈페이지',
      value: normalizeSupportDisplayText(settings.homepage_url),
    },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  )

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
    let cancelled = false
    signatureImage.onload = () => {
      if (cancelled) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(signatureImage, 0, 0, canvas.width, canvas.height)
      prepareSignatureContext(context)
    }
    signatureImage.src = values.signatureImageUrl
    return () => { cancelled = true }
  }, [values.signatureImageUrl])

  const setValue = <TKey extends keyof PledgeFormValues>(
    key: TKey,
    value: PledgeFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsReviewing(false)
    wasSubmittedRef.current = false
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
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsReviewing(false)
    wasSubmittedRef.current = false
  }

  const handlePrint = () => {
    const previousScrollX = window.scrollX
    const previousScrollY = window.scrollY
    const sourcePrintArea = printAreaRef.current
    if (!sourcePrintArea) return
    printCleanupRef.current?.()
    const printHost = document.createElement('div')

    printHost.id = 'support-pledge-print-host'
    printHost.className = 'support-pledge'

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
      printCleanupRef.current = null
      window.scrollTo(previousScrollX, previousScrollY)
    }

    printCleanupRef.current = cleanup
    window.addEventListener('afterprint', cleanup)
    window.requestAnimationFrame(() => {
      try {
        window.print()
      } catch {
        cleanup()
        setSubmitError('인쇄 창을 열지 못했습니다. 브라우저에서 다시 시도해 주세요.')
      }
    })
  }

  const handleCopyAccount = async () => {
    if (!hasBankAccount) {
      return
    }

    try {
      await navigator.clipboard.writeText(bankAccountNumber ?? '')
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

  const validatePledge = () => {
    if (!settings.enable_online_submission) {
      return '현재 온라인 제출은 닫혀 있습니다. 약정서를 인쇄해 제출해 주세요.'
    }
    if (!values.name.trim() || !values.phone.trim() || !values.email.trim()) {
      return '이름, 핸드폰, E-mail을 입력해 주세요.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      return 'E-mail 주소를 확인해 주세요.'
    }
    if (!Number.isFinite(selectedAmount) || selectedAmount <= 0 || !Number.isSafeInteger(selectedAmount)) {
      return '후원금 금액을 선택하거나 기타 금액을 입력해 주세요.'
    }
    if (!values.privacyAgreed) return '개인정보 수집 및 이용에 동의해 주세요.'
    return null
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmittingRef.current || wasSubmittedRef.current) return
    const error = validatePledge()
    setSubmitError(error)
    if (!error) setIsReviewing(true)
  }

  const handleConfirm = async () => {
    if (!isReviewing || isSubmittingRef.current || wasSubmittedRef.current) return
    const error = validatePledge()
    if (error) {
      setSubmitError(error)
      setIsReviewing(false)
      return
    }
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    const name = values.name.trim()
    try {
      const payload: SupportPledgeInput = {
        address: values.address.trim() || null,
        amount: selectedAmount,
        birth_date: values.birthDate || null,
        custom_amount: values.amount === 'custom' ? selectedAmount : null,
        depositor: values.depositor.trim() || null,
        email: values.email.trim(),
        gender: values.gender === 'male' || values.gender === 'female' || values.gender === 'none'
          ? values.gender : null,
        member_type: values.memberType,
        name,
        phone: values.phone.trim(),
        pledge_date: values.pledgeDate || null,
        privacy_agreed: values.privacyAgreed,
        signature_image_url: values.signatureImageUrl,
        signer_name: values.signature.trim() || name,
        website: values.website,
      }
      const result = await createSupportPledge(payload, submission.current.idFor({ ...payload, settingsId: settings.id }), settings.id)
      if (!result.data) {
        setSubmitError(result.error || '후원약정을 접수하지 못했습니다. 입력 내용을 유지한 채 다시 시도해 주세요.')
        return
      }
      wasSubmittedRef.current = true
      setSubmitSuccess(settings.success_message)
      setIsReviewing(false)
    } catch {
      setSubmitError('후원약정을 접수하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요. 작성 내용은 유지됩니다.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const reviewItems = [
    ['후원 구분', memberTypeLabel],
    ['약정 금액', selectedAmountLabel],
    ['이름', values.name.trim()],
    ['성별', values.gender === 'male' ? '남' : values.gender === 'female' ? '여' : values.gender === 'none' ? '응답하지 않음' : '선택 안 함'],
    ['생년월일', values.birthDate || '미작성'],
    ['핸드폰', values.phone.trim()],
    ['E-mail', values.email.trim()],
    ['예금주', values.depositor || '미작성'],
    ['주소', values.address || '미작성'],
    ['약정 날짜', values.pledgeDate || '미작성'],
    ['서명 이름', values.signature || values.name || '미작성'],
    ['인 / 서명', values.signatureImageUrl ? '직접 서명 완료' : '직접 서명 미작성'],
    ['개인정보 수집 및 이용', values.privacyAgreed ? '동의함' : '동의하지 않음'],
  ]

  return (
    <section id="support" className="support-pledge" aria-labelledby="support-pledge-title">
      <div className="support-pledge__layout">
        <aside className="support-pledge__guidance support-print-hidden">
          <p className="support-pledge__eyebrow">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.4d6b2e4d52" text={copyText("contact", "contact.fixed.SupportPledgeForm.4d6b2e4d52", "SUPPORT PLEDGE")}>{copyText("contact", "contact.fixed.SupportPledgeForm.4d6b2e4d52", "SUPPORT PLEDGE")}</FormattedCopy>}</p>
          <h2 id="support-pledge-title">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.4f366fcc24" text={copyText("contact", "contact.fixed.SupportPledgeForm.4f366fcc24", "약정 정보를")}>{copyText("contact", "contact.fixed.SupportPledgeForm.4f366fcc24", "약정 정보를")}</FormattedCopy>}<br />{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.5e885eeb1f" text={copyText("contact", "contact.fixed.SupportPledgeForm.5e885eeb1f", "확인해 주세요.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.5e885eeb1f", "확인해 주세요.")}</FormattedCopy>}</h2>
          <p>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.c004f885b7" text={copyText("contact", "contact.fixed.SupportPledgeForm.c004f885b7", "필수 항목을 작성한 뒤 내용을 확인하고 보내주세요.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.c004f885b7", "필수 항목을 작성한 뒤 내용을 확인하고 보내주세요.")}</FormattedCopy>}<br />{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.2ab6e86ebe" text={copyText("contact", "contact.fixed.SupportPledgeForm.2ab6e86ebe", "후원 관련 문의는 아래 연락처로 안내받으실 수 있습니다.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.2ab6e86ebe", "후원 관련 문의는 아래 연락처로 안내받으실 수 있습니다.")}</FormattedCopy>}</p>
          <dl className="support-pledge__contacts">
            {contactItems.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <Button className="support-pledge__button" onClick={handlePrint} type="button" variant="secondary">
            {settings.print_button_label}
          </Button>
          <a className="support-pledge__back" href="/contact">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.4637af5f7d" text={copyText("contact", "contact.fixed.SupportPledgeForm.4637af5f7d", "후원·문의로 돌아가기 ")}>{copyText("contact", "contact.fixed.SupportPledgeForm.4637af5f7d", "후원·문의로 돌아가기 ")}</FormattedCopy>}<span aria-hidden="true">←</span></a>
        </aside>

        <form className="support-pledge-print-area support-pledge__form" aria-describedby={submitError ? 'support-pledge-error' : undefined} onSubmit={handleSubmit} ref={printAreaRef}>
          <div aria-hidden="true" className="support-print-hidden hidden">
            <label htmlFor="support-pledge-website">웹사이트</label>
            <input autoComplete="off" id="support-pledge-website" onChange={(event) => setValue('website', event.target.value)} tabIndex={-1} value={values.website} />
          </div>
          <div className="support-pledge__document-heading">
            <p className="support-pledge__eyebrow">{settings.organization_name}</p>
            <h3>{settings.title}</h3>
            <p className="support-pledge__subtitle">{settings.subtitle}</p>
            <p className="support-pledge__copy">{settings.description}</p>
          </div>
          <div className="support-pledge__original">
            <p className="support-pledge__copy">{settings.message}</p>
            {settings.form_note ? <p className="support-pledge__copy">{settings.form_note}</p> : null}
          </div>

          <div data-print-fields hidden={isReviewing || Boolean(submitSuccess)}>
            <fieldset className="support-pledge__fieldset" disabled={isSubmitting}>
              <legend>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.7548f47214" text={copyText("contact", "contact.fixed.SupportPledgeForm.7548f47214", "후원금 선택")}>{copyText("contact", "contact.fixed.SupportPledgeForm.7548f47214", "후원금 선택")}</FormattedCopy>}</legend>
              <div className="support-print-only support-pledge__print-summary">
                <dl>
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.8ccb1fb226" text={copyText("contact", "contact.fixed.SupportPledgeForm.8ccb1fb226", "후원 구분")}>{copyText("contact", "contact.fixed.SupportPledgeForm.8ccb1fb226", "후원 구분")}</FormattedCopy>}</dt><dd>{memberTypeLabel}</dd></div>
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.f44dd0ef78" text={copyText("contact", "contact.fixed.SupportPledgeForm.f44dd0ef78", "약정 금액")}>{copyText("contact", "contact.fixed.SupportPledgeForm.f44dd0ef78", "약정 금액")}</FormattedCopy>}</dt><dd>{selectedAmountLabel}</dd></div>
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.b5c634d8c3" text={copyText("contact", "contact.fixed.SupportPledgeForm.b5c634d8c3", "납입자명")}>{copyText("contact", "contact.fixed.SupportPledgeForm.b5c634d8c3", "납입자명")}</FormattedCopy>}</dt><dd>{values.depositor || values.name || '미작성'}</dd></div>
                </dl>
              </div>
              <div className="support-print-amount-controls support-pledge__type-options" role="group" aria-label={copyText("contact", "contact.fixed.SupportPledgeForm.8ccb1fb226", "후원 구분")}>
                <button className={`support-pledge__option${values.memberType === 'individual' ? ' is-selected' : ''}`} aria-pressed={values.memberType === 'individual'} onClick={() => setMemberType('individual')} type="button">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.5c44fdce11" text={copyText("contact", "contact.fixed.SupportPledgeForm.5c44fdce11", "개인회원")}>{copyText("contact", "contact.fixed.SupportPledgeForm.5c44fdce11", "개인회원")}</FormattedCopy>}</button>
                <button className={`support-pledge__option${values.memberType === 'corporate' ? ' is-selected' : ''}`} aria-pressed={values.memberType === 'corporate'} onClick={() => setMemberType('corporate')} type="button">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.b4e56985cb" text={copyText("contact", "contact.fixed.SupportPledgeForm.b4e56985cb", "기업회원")}>{copyText("contact", "contact.fixed.SupportPledgeForm.b4e56985cb", "기업회원")}</FormattedCopy>}</button>
              </div>
              <div className="support-print-amount-controls support-pledge__amount-options" role="group" aria-label={copyText("contact", "contact.fixed.SupportPledgeForm.add9ff2579", "매월 후원 금액")}>
                {amountOptions.map((amount) => (
                  <label className={`support-pledge__option${values.amount === String(amount) ? ' is-selected' : ''}`} key={amount}>
                    <input checked={values.amount === String(amount)} className="sr-only" name="support-amount" onChange={() => { setValue('amount', String(amount)); setValue('customAmount', '') }} type="radio" value={amount} />
                    {formatAmount(amount)}
                  </label>
                ))}
                {settings.allow_custom_amount ? (
                  <label className={`support-pledge__option${values.amount === 'custom' ? ' is-selected' : ''}`}>
                    <input checked={values.amount === 'custom'} className="sr-only" name="support-amount" onChange={() => setValue('amount', 'custom')} type="radio" value="custom" />{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.2991f61ced" text={copyText("contact", "contact.fixed.SupportPledgeForm.2991f61ced", "기타")}>{copyText("contact", "contact.fixed.SupportPledgeForm.2991f61ced", "기타")}</FormattedCopy>}</label>
                ) : null}
              </div>
              {values.amount === 'custom' ? (
                <div className="support-print-amount-controls support-pledge__custom-amount">
                  <FieldLabel htmlFor="support-custom-amount">기타 금액 (원)</FieldLabel>
                  <input className={fieldClassName} id="support-custom-amount" inputMode="numeric" onChange={(event) => setValue('customAmount', event.target.value)} min="1" step="1" type="number" required value={values.customAmount} />
                </div>
              ) : null}
            </fieldset>

            <fieldset className="support-pledge__fieldset" disabled={isSubmitting}>
              <legend>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.b959ef0bbf" text={copyText("contact", "contact.fixed.SupportPledgeForm.b959ef0bbf", "후원자 정보")}>{copyText("contact", "contact.fixed.SupportPledgeForm.b959ef0bbf", "후원자 정보")}</FormattedCopy>}</legend>
              <p className="support-pledge__field-hint">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.7f8bf7a633" text={copyText("contact", "contact.fixed.SupportPledgeForm.7f8bf7a633", "이름, 핸드폰, E-mail은 필수 항목입니다.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.7f8bf7a633", "이름, 핸드폰, E-mail은 필수 항목입니다.")}</FormattedCopy>}</p>
              <div className="support-pledge__fields support-print-donor-grid">
                <div>
                  <FieldLabel htmlFor="support-name">이름 (필수)</FieldLabel>
                  <input autoComplete="name" className={fieldClassName} id="support-name" onChange={(event) => setValue('name', event.target.value)} required value={values.name} />
                </div>
                <div>
                  <FieldLabel htmlFor="support-phone">핸드폰 (필수)</FieldLabel>
                  <input autoComplete="tel" className={fieldClassName} id="support-phone" inputMode="tel" type="tel" onChange={(event) => setValue('phone', event.target.value)} required value={values.phone} />
                </div>
                <div className="support-pledge__wide">
                  <FieldLabel htmlFor="support-email">E-mail (필수)</FieldLabel>
                  <input autoComplete="email" className={fieldClassName} id="support-email" inputMode="email" onChange={(event) => setValue('email', event.target.value)} required type="email" value={values.email} />
                </div>
                <div>
                  <FieldLabel htmlFor="support-gender">성별</FieldLabel>
                  <select className={fieldClassName} id="support-gender" onChange={(event) => setValue('gender', event.target.value)} value={values.gender}>
                    <option value="">{copyText("contact", "contact.fixed.SupportPledgeForm.f1be19b8ba", "선택 안 함")}</option><option value="male">{copyText("contact", "contact.fixed.SupportPledgeForm.e43a28aa55", "남")}</option><option value="female">{copyText("contact", "contact.fixed.SupportPledgeForm.945f5f4b0d", "여")}</option><option value="none">{copyText("contact", "contact.fixed.SupportPledgeForm.70295d091e", "응답하지 않음")}</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="support-birth-date">생년월일</FieldLabel>
                  <input className={fieldClassName} id="support-birth-date" onChange={(event) => setValue('birthDate', event.target.value)} type="date" value={values.birthDate} />
                </div>
                <div className="support-pledge__wide">
                  <FieldLabel htmlFor="support-depositor">예금주</FieldLabel>
                  <input className={fieldClassName} id="support-depositor" onChange={(event) => setValue('depositor', event.target.value)} value={values.depositor} />
                </div>
                <div className="support-pledge__wide">
                  <FieldLabel htmlFor="support-address">주소</FieldLabel>
                  <textarea autoComplete="street-address" className={textareaClassName} id="support-address" onChange={(event) => setValue('address', event.target.value)} value={values.address} />
                </div>
              </div>
            </fieldset>

            {hasCompleteBankAccount ? (
              <section className="support-pledge__bank" aria-labelledby="support-bank-title">
                <h4 id="support-bank-title">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.320d5b016b" text={copyText("contact", "contact.fixed.SupportPledgeForm.320d5b016b", "후원 계좌 안내")}>{copyText("contact", "contact.fixed.SupportPledgeForm.320d5b016b", "후원 계좌 안내")}</FormattedCopy>}</h4>
                <dl className="support-pledge__review-list">
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.1f1859979a" text={copyText("contact", "contact.fixed.SupportPledgeForm.1f1859979a", "은행명")}>{copyText("contact", "contact.fixed.SupportPledgeForm.1f1859979a", "은행명")}</FormattedCopy>}</dt><dd>{bankName}</dd></div>
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.e93f44ec04" text={copyText("contact", "contact.fixed.SupportPledgeForm.e93f44ec04", "계좌번호")}>{copyText("contact", "contact.fixed.SupportPledgeForm.e93f44ec04", "계좌번호")}</FormattedCopy>}</dt><dd>{bankAccountNumber}</dd></div>
                  <div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.71b9138c69" text={copyText("contact", "contact.fixed.SupportPledgeForm.71b9138c69", "예금주")}>{copyText("contact", "contact.fixed.SupportPledgeForm.71b9138c69", "예금주")}</FormattedCopy>}</dt><dd>{bankAccountHolder}</dd></div>
                </dl>
                {bankNote ? <p className="support-pledge__copy">{bankNote}</p> : null}
                <div className="support-print-hidden">
                  <Button className="support-pledge__button" disabled={!hasBankAccount} onClick={handleCopyAccount} size="sm" type="button" variant="secondary">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.2c270028c3" text={copyText("contact", "contact.fixed.SupportPledgeForm.2c270028c3", "계좌번호 복사")}>{copyText("contact", "contact.fixed.SupportPledgeForm.2c270028c3", "계좌번호 복사")}</FormattedCopy>}</Button>
                  {copyStatus ? <p className="support-pledge__field-hint" role="status">{copyStatus}</p> : null}
                </div>
              </section>
            ) : null}

            <fieldset className="support-pledge__fieldset" disabled={isSubmitting}>
              <legend>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.b250029234" text={copyText("contact", "contact.fixed.SupportPledgeForm.b250029234", "약정 확인")}>{copyText("contact", "contact.fixed.SupportPledgeForm.b250029234", "약정 확인")}</FormattedCopy>}</legend>
              <div className="support-pledge__fields">
                <div>
                  <FieldLabel htmlFor="support-pledge-date">날짜</FieldLabel>
                  <input className={fieldClassName} id="support-pledge-date" onChange={(event) => setValue('pledgeDate', event.target.value)} type="date" value={values.pledgeDate} />
                </div>
                <div>
                  <FieldLabel htmlFor="support-signer-name">서명 이름</FieldLabel>
                  <input className={fieldClassName} id="support-signer-name" onChange={(event) => setValue('signature', event.target.value)} placeholder={values.name || '성명을 입력하세요'} value={values.signature} />
                </div>
              </div>
              <div className="support-print-signature-box support-pledge__signature">
                <div className="support-pledge__signature-heading">
                  <div>
                    <p className="support-pledge__label">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.0ad855d230" text={copyText("contact", "contact.fixed.SupportPledgeForm.0ad855d230", "인 / 서명")}>{copyText("contact", "contact.fixed.SupportPledgeForm.0ad855d230", "인 / 서명")}</FormattedCopy>}</p>
                    <p className="support-print-hidden support-pledge__field-hint" id="support-signature-help">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.8cf9c4e00e" text={copyText("contact", "contact.fixed.SupportPledgeForm.8cf9c4e00e", "마우스나 손가락으로 직접 서명할 수 있습니다. 키보드 이용 시 위 서명 이름을 입력해 주세요.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.8cf9c4e00e", "마우스나 손가락으로 직접 서명할 수 있습니다. 키보드 이용 시 위 서명 이름을 입력해 주세요.")}</FormattedCopy>}</p>
                  </div>
                  <button className="support-print-hidden support-pledge__clear" onClick={clearSignatureDrawing} type="button">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.c8dbc399b9" text={copyText("contact", "contact.fixed.SupportPledgeForm.c8dbc399b9", "지우기")}>{copyText("contact", "contact.fixed.SupportPledgeForm.c8dbc399b9", "지우기")}</FormattedCopy>}</button>
                </div>
                <canvas aria-label={copyText("contact", "contact.fixed.SupportPledgeForm.ee44810cdb", "마우스 또는 터치로 그리는 인/서명 영역")} aria-describedby="support-signature-help" className="support-signature-canvas" height={220} onPointerCancel={finishSignatureDrawing} onPointerDown={handleSignaturePointerDown} onPointerLeave={finishSignatureDrawing} onPointerMove={handleSignaturePointerMove} onPointerUp={finishSignatureDrawing} ref={signatureCanvasRef} width={900} />
                <p className="support-pledge__signer">{values.signature || values.name || '서명 이름'}</p>
              </div>
            </fieldset>
            <div className="support-pledge__privacy">
              <p className="support-pledge__copy">{settings.privacy_notice}</p>
              <p className="support-pledge__copy">{settings.print_note}</p>
              <label className="support-pledge__consent">
                <input checked={values.privacyAgreed} onChange={(event) => setValue('privacyAgreed', event.target.checked)} required type="checkbox" />
                <span>개인정보 수집 및 이용에 동의합니다.</span>
              </label>
            </div>
          </div>

          {isReviewing ? (
            <section className="support-print-hidden support-pledge__review" aria-label={copyText("contact", "contact.fixed.SupportPledgeForm.d9796f81d6", "후원약정 작성 내용 확인")}>
              <h4 ref={reviewHeadingRef} tabIndex={-1}>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.6073524827" text={copyText("contact", "contact.fixed.SupportPledgeForm.6073524827", "작성 내용을 확인해 주세요.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.6073524827", "작성 내용을 확인해 주세요.")}</FormattedCopy>}</h4>
              <p className="support-pledge__copy">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.560a5275f4" text={copyText("contact", "contact.fixed.SupportPledgeForm.560a5275f4", "아래 내용이 맞는지 확인한 뒤 약정서를 보내주세요. 아직 접수되지 않았습니다.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.560a5275f4", "아래 내용이 맞는지 확인한 뒤 약정서를 보내주세요. 아직 접수되지 않았습니다.")}</FormattedCopy>}</p>
              <dl className="support-pledge__review-list">
                {reviewItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              {values.signatureImageUrl ? <img className="support-pledge__review-signature" src={values.signatureImageUrl} alt={copyText("contact", "contact.fixed.SupportPledgeForm.5cc6723f8c", "작성한 인/서명")} /> : null}
              {hasCompleteBankAccount ? <dl className="support-pledge__review-list"><div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.1f1859979a" text={copyText("contact", "contact.fixed.SupportPledgeForm.1f1859979a", "은행명")}>{copyText("contact", "contact.fixed.SupportPledgeForm.1f1859979a", "은행명")}</FormattedCopy>}</dt><dd>{bankName}</dd></div><div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.e93f44ec04" text={copyText("contact", "contact.fixed.SupportPledgeForm.e93f44ec04", "계좌번호")}>{copyText("contact", "contact.fixed.SupportPledgeForm.e93f44ec04", "계좌번호")}</FormattedCopy>}</dt><dd>{bankAccountNumber}</dd></div><div><dt>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.71b9138c69" text={copyText("contact", "contact.fixed.SupportPledgeForm.71b9138c69", "예금주")}>{copyText("contact", "contact.fixed.SupportPledgeForm.71b9138c69", "예금주")}</FormattedCopy>}</dt><dd>{bankAccountHolder}</dd></div></dl> : null}
              {hasCompleteBankAccount && bankNote ? <p className="support-pledge__copy">{bankNote}</p> : null}
              <p className="support-pledge__copy">{settings.privacy_notice}</p>
              <p className="support-pledge__copy">{settings.print_note}</p>
            </section>
          ) : null}

          <div className="support-pledge__document-footer">
            <dl className="support-pledge__contacts">
              {contactItems.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>
            {contactItems.length === 0 ? <p>{supportFallbackMessage}</p> : null}
            <p className="support-pledge__copy">{settings.footer_note}</p>
          </div>

          {submitError ? <p className="support-print-hidden support-pledge__feedback is-error" id="support-pledge-error" role="alert">{submitError}</p> : null}
          {submitSuccess ? <p className="support-print-hidden support-pledge__feedback is-success" role="status">{submitSuccess}</p> : null}
          {!settings.enable_online_submission ? <p className="support-print-hidden support-pledge__feedback">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.45cda4bcf7" text={copyText("contact", "contact.fixed.SupportPledgeForm.45cda4bcf7", "현재 온라인 제출은 닫혀 있습니다. 약정서를 인쇄해 제출해 주세요.")}>{copyText("contact", "contact.fixed.SupportPledgeForm.45cda4bcf7", "현재 온라인 제출은 닫혀 있습니다. 약정서를 인쇄해 제출해 주세요.")}</FormattedCopy>}</p> : null}

          <div className="support-print-hidden support-pledge__actions">
            {settings.enable_online_submission && !submitSuccess ? (
              isReviewing ? <>
                <Button className="support-pledge__button is-primary" aria-busy={isSubmitting} disabled={isSubmitting} onClick={handleConfirm} type="button" variant="primary">{isSubmitting ? '저장 중' : settings.submit_button_label}</Button>
                <Button className="support-pledge__button" disabled={isSubmitting} onClick={() => { setIsReviewing(false); setSubmitError(null) }} type="button" variant="secondary">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.ae5b437795" text={copyText("contact", "contact.fixed.SupportPledgeForm.ae5b437795", "수정하기")}>{copyText("contact", "contact.fixed.SupportPledgeForm.ae5b437795", "수정하기")}</FormattedCopy>}</Button>
              </> : <Button className="support-pledge__button is-primary" type="submit" variant="primary">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.317302ecaa" text={copyText("contact", "contact.fixed.SupportPledgeForm.317302ecaa", "작성 내용 확인 ")}>{copyText("contact", "contact.fixed.SupportPledgeForm.317302ecaa", "작성 내용 확인 ")}</FormattedCopy>}<span aria-hidden="true">→</span></Button>
            ) : null}
            <Button className="support-pledge__button" onClick={handlePrint} type="button" variant="secondary">{settings.print_button_label}</Button>
            {submitSuccess ? <Button className="support-pledge__button" onClick={() => { submission.current.reset(); setValues(getInitialValues(settings)); wasSubmittedRef.current = false; setSubmitSuccess(null); setSubmitError(null) }} type="button" variant="secondary">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.c1d9e990fc" text={copyText("contact", "contact.fixed.SupportPledgeForm.c1d9e990fc", "새 약정서 작성")}>{copyText("contact", "contact.fixed.SupportPledgeForm.c1d9e990fc", "새 약정서 작성")}</FormattedCopy>}</Button> : null}
          </div>
        </form>
      </div>

      <details className="support-pledge__background support-print-hidden">
        <summary>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.9cefa2a311" text={copyText("contact", "contact.fixed.SupportPledgeForm.9cefa2a311", "후원 안내")}>{copyText("contact", "contact.fixed.SupportPledgeForm.9cefa2a311", "후원 안내")}</FormattedCopy>}</summary>
        <p className="support-pledge__eyebrow">{supportSpiritCopy.eyebrow}</p>
        <h3>{supportSpiritCopy.title}</h3>
        <p className="support-pledge__copy">{supportSpiritCopy.body}</p>
        <p className="support-pledge__copy">{supportSpiritCopy.notice}</p>
        <div className="support-pledge__background-grid">
          <div><h4>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.0c5170bd78" text={copyText("contact", "contact.fixed.SupportPledgeForm.0c5170bd78", "후원은 이렇게 연결됩니다")}>{copyText("contact", "contact.fixed.SupportPledgeForm.0c5170bd78", "후원은 이렇게 연결됩니다")}</FormattedCopy>}</h4>{supportMethodItems.map(item => <div key={item.title}><h5>{item.title}</h5><p>{item.description}</p></div>)}</div>
          <div><h4>{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.7850a98e79" text={copyText("contact", "contact.fixed.SupportPledgeForm.7850a98e79", "안전한 후원 접수")}>{copyText("contact", "contact.fixed.SupportPledgeForm.7850a98e79", "안전한 후원 접수")}</FormattedCopy>}</h4>{donorCareItems.map(item => <div key={item.title}><h5>{item.title}</h5><p>{item.description}</p></div>)}</div>
        </div>
        <p className="support-pledge__copy">{<FormattedCopy page="contact" id="contact.fixed.SupportPledgeForm.97207df43d" text={copyText("contact", "contact.fixed.SupportPledgeForm.97207df43d", "청소년 음악교육 · 정기연주와 초청연주 · 봉사와 나눔의 무대")}>{copyText("contact", "contact.fixed.SupportPledgeForm.97207df43d", "청소년 음악교육 · 정기연주와 초청연주 · 봉사와 나눔의 무대")}</FormattedCopy>}</p>
      </details>
    </section>
  )
}
