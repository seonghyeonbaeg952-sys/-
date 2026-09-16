import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { createContactMessage, type ContactMessageInput } from '../../lib/publicData'
import { FilterSelect } from '../common/FilterSelect'
import { buildContactMessageInput, inquiryTypes, validateContactForm, type ContactFieldErrors, type ContactFormValues } from './contactFormModel'

const fields = [
  { name: 'name', label: '이름', required: true, type: 'text', autoComplete: 'name', placeholder: '이름을 입력해 주세요' },
  { name: 'email', label: '이메일', required: true, type: 'email', autoComplete: 'email', placeholder: '답변받을 이메일을 입력해 주세요' },
  { name: 'phone', label: '전화번호', required: false, type: 'tel', autoComplete: 'tel', placeholder: '연락 가능한 번호' },
  { name: 'title', label: '제목', required: false, type: 'text', autoComplete: 'off', placeholder: '문의 제목' },
] as const

export function ContactInquiryForm({ initialType, hidden = false }: { initialType: ContactMessageInput['type']; hidden?: boolean }) {
  const [stored, setStored] = useState<ContactFormValues & { preset: ContactMessageInput['type'] }>(() => ({
    name: '', email: '', phone: '', title: '', message: '', type: initialType, privacy_agreed: false, website: '', preset: initialType,
  }))
  const values = stored.preset === initialType ? stored : { ...stored, preset: initialType, type: initialType }
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const feedbackRef = useRef<HTMLParagraphElement>(null)

  function setValue<K extends keyof ContactFormValues>(name: K, value: ContactFormValues[K]) {
    setStored({ ...values, [name]: value })
    setErrors(current => ({ ...current, [name]: undefined }))
    setSubmitError(null)
    setSuccess(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setSubmitError(null)
    setSuccess(null)
    const nextErrors = validateContactForm(values)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      document.getElementById(`contact-${firstError}`)?.focus()
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const result = await createContactMessage(buildContactMessageInput(values))
      if (result.data !== true || result.error) {
        setSubmitError(result.error || '접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.')
        return
      }
      setSuccess(values.type === 'support'
        ? '후원 문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 안내드리겠습니다.'
        : '문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 답변을 보내드립니다.')
      setStored({ name: '', email: '', phone: '', title: '', message: '', type: initialType, privacy_agreed: false, website: '', preset: initialType })
    } catch {
      setSubmitError('문의 전송에 실패했습니다. 입력 내용은 유지됩니다. 연결을 확인한 뒤 다시 시도해 주세요.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
      requestAnimationFrame(() => feedbackRef.current?.focus())
    }
  }

  return (
    <section className="contact-atelier__section" hidden={hidden} id={hidden ? undefined : 'form'} aria-labelledby="contact-inquiry-title">
      <div className="contact-atelier__shell contact-atelier__columns">
        <div className="contact-atelier__aside">
          <p className="contact-atelier__eyebrow">문의하기</p>
          <h2 id="contact-inquiry-title">이야기를 <br />들려주세요.</h2>
          <p>후원, 공연 의뢰, 일반 문의를 남겨 주세요.<br />담당자가 확인한 뒤 입력하신 이메일로 답변드립니다.</p>
          <p className="contact-atelier__privacy">문의 내용은 공개되지 않습니다.</p>
          <p>보내주신 문의는 운영진에게만 전달되며, 문의 유형에 맞춰 확인 후 연락드립니다.</p>
          <p>공연 관련 문의는 일정, 장소, 요청 내용을 함께 적어 주세요.</p>
          <p>입단지원서는 별도 전용 양식에서 접수합니다.</p>
          <Link className="contact-atelier__action" to="/join?section=contact#application">입단지원서로 이동 <span aria-hidden="true">↗</span></Link>
        </div>
        <form className="contact-atelier__form" onSubmit={submit} noValidate aria-busy={submitting}>
          <div hidden aria-hidden="true">
            <label htmlFor="contact-website">웹사이트</label>
            <input id="contact-website" name="website" autoComplete="off" tabIndex={-1} value={values.website} onChange={e => setValue('website', e.target.value)} />
          </div>
          <div className="contact-atelier__field">
            <span className="contact-atelier__field-label">문의 유형</span>
            <FilterSelect label="문의 유형" value={values.type} options={inquiryTypes} onChange={value => {
              const type = inquiryTypes.find(item => item.value === value)
              if (type && !submittingRef.current) setValue('type', type.value)
            }} />
          </div>
          <div className="contact-atelier__field-row">
            {fields.map(field => (
              <div className="contact-atelier__field" key={field.name}>
                <label htmlFor={`contact-${field.name}`}>{field.label} ({field.required ? '필수' : '선택'})</label>
                <input id={`contact-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} required={field.required} placeholder={field.placeholder} disabled={submitting} value={values[field.name]} onChange={e => setValue(field.name, e.target.value)} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `contact-${field.name}-error` : undefined} />
                {errors[field.name] ? <p className="contact-atelier__field-error" id={`contact-${field.name}-error`}>{errors[field.name]}</p> : null}
              </div>
            ))}
          </div>
          <div className="contact-atelier__field">
            <label htmlFor="contact-message">문의 내용 (필수)</label>
            <textarea id="contact-message" name="message" required placeholder="궁금한 내용이나 요청 사항을 남겨 주세요." value={values.message} disabled={submitting} onChange={e => setValue('message', e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined} />
            {errors.message ? <p className="contact-atelier__field-error" id="contact-message-error">{errors.message}</p> : null}
          </div>
          <div>
            <label className="contact-atelier__consent">
              <input id="contact-privacy_agreed" type="checkbox" required checked={values.privacy_agreed} disabled={submitting} onChange={e => setValue('privacy_agreed', e.target.checked)} aria-invalid={Boolean(errors.privacy_agreed)} aria-describedby={errors.privacy_agreed ? 'contact-privacy-error' : 'contact-privacy-notice'} />
              <span>문의 접수를 위한 개인정보 수집 및 이용에 동의합니다. (필수)</span>
            </label>
            <p className="contact-atelier__hint" id="contact-privacy-notice">입력한 정보는 문의 확인 목적으로만 사용합니다.</p>
            {errors.privacy_agreed ? <p className="contact-atelier__field-error" id="contact-privacy-error">{errors.privacy_agreed}</p> : null}
          </div>
          {submitError || success ? <p className="contact-atelier__feedback" ref={feedbackRef} tabIndex={-1} role={submitError ? 'alert' : 'status'}>{submitError || success}</p> : null}
          <div className="contact-atelier__submit">
            <button className="contact-atelier__action contact-atelier__action--primary" type="submit" disabled={submitting}>{submitting ? '전송 중' : '문의 보내기'} <span aria-hidden="true">→</span></button>
            <p className="contact-atelier__hint">답변받을 이메일을 한 번 더 확인해 주세요.</p>
          </div>
        </form>
      </div>
    </section>
  )
}
