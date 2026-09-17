import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { createContactMessage, type ContactMessageInput } from '../../lib/publicData'
import { createIntakeSubmissionTracker } from '../../lib/intakeModel'
import { FilterSelect } from '../common/FilterSelect'
import { buildContactMessageInput, inquiryTypes as defaultInquiryTypes, validateContactForm, type ContactFieldErrors, type ContactFormValues } from './contactFormModel'
import { usePageCopy } from '../site-editor/usePageCopy'
import { CopyLines } from '../site-editor/SiteCopy'

const fields = [
  { name: 'name', label: '이름', required: true, type: 'text', autoComplete: 'name', placeholder: '이름을 입력해 주세요' },
  { name: 'email', label: '이메일', required: true, type: 'email', autoComplete: 'email', placeholder: '답변받을 이메일을 입력해 주세요' },
  { name: 'phone', label: '전화번호', required: false, type: 'tel', autoComplete: 'tel', placeholder: '연락 가능한 번호' },
  { name: 'title', label: '제목', required: false, type: 'text', autoComplete: 'off', placeholder: '문의 제목' },
] as const

export function ContactInquiryForm({ initialType, hidden = false }: { initialType: ContactMessageInput['type']; hidden?: boolean }) {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('contact')
  const inquiryTypes = defaultInquiryTypes.map(item => ({ ...item, label: copyText('contact', `contact.options.${item.value}`, item.label) }))
  const [stored, setStored] = useState<ContactFormValues & { preset: ContactMessageInput['type'] }>(() => ({
    name: '', email: '', phone: '', title: '', message: '', type: initialType, privacy_agreed: false, website: '', preset: initialType,
  }))
  const values = stored.preset === initialType ? stored : { ...stored, preset: initialType, type: initialType }
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const submission = useRef(createIntakeSubmissionTracker())
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
      const payload = buildContactMessageInput(values)
      const result = await createContactMessage(payload, submission.current.idFor(payload))
      if (result.data !== true || result.error) {
        setSubmitError(result.error || '접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.')
        return
      }
      setSuccess(values.type === 'support'
        ? '후원 문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 안내드리겠습니다.'
        : '문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 답변을 보내드립니다.')
      setStored({ name: '', email: '', phone: '', title: '', message: '', type: initialType, privacy_agreed: false, website: '', preset: initialType })
      submission.current.reset()
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
          <p className="contact-atelier__eyebrow">{<FormattedCopy page="contact" id="contact.inquiry" text={t('inquiry')}>{t('inquiry')}</FormattedCopy>}</p>
          <h2 id="contact-inquiry-title"><FormattedCopy page="contact" id="contact.inquiryTitle" text={t('inquiryTitle')} lineBreaks><CopyLines text={t('inquiryTitle')} /></FormattedCopy></h2>
          <p><FormattedCopy page="contact" id="contact.inquiryDescription" text={t('inquiryDescription')} lineBreaks><CopyLines text={t('inquiryDescription')} /></FormattedCopy></p>
          <p className="contact-atelier__privacy">{<FormattedCopy page="contact" id="contact.inquiryPrivacy" text={t('inquiryPrivacy')}>{t('inquiryPrivacy')}</FormattedCopy>}</p>
          <p>{<FormattedCopy page="contact" id="contact.inquiryDelivery" text={t('inquiryDelivery')}>{t('inquiryDelivery')}</FormattedCopy>}</p>
          <p>{<FormattedCopy page="contact" id="contact.inquiryPerformance" text={t('inquiryPerformance')}>{t('inquiryPerformance')}</FormattedCopy>}</p>
          <p>{<FormattedCopy page="contact" id="contact.inquiryJoin" text={t('inquiryJoin')}>{t('inquiryJoin')}</FormattedCopy>}</p>
          <Link className="contact-atelier__action" to="/join?section=contact#application">{<FormattedCopy page="contact" id="contact.joinAction" text={t('joinAction')}>{t('joinAction')}</FormattedCopy>} <span aria-hidden="true">↗</span></Link>
        </div>
        <form className="contact-atelier__form" onSubmit={submit} noValidate aria-busy={submitting}>
          <div hidden aria-hidden="true">
            <label htmlFor="contact-website">웹사이트</label>
            <input id="contact-website" name="website" autoComplete="off" tabIndex={-1} value={values.website} onChange={e => setValue('website', e.target.value)} />
          </div>
          <div className="contact-atelier__field">
            <span className="contact-atelier__field-label">{<FormattedCopy page="contact" id="contact.inquiryType" text={t('inquiryType')}>{t('inquiryType')}</FormattedCopy>}</span>
            <FilterSelect label={t('inquiryType')} value={values.type} options={inquiryTypes} onChange={value => {
              const type = inquiryTypes.find(item => item.value === value)
              if (type && !submittingRef.current) setValue('type', type.value)
            }} />
          </div>
          <div className="contact-atelier__field-row">
            {fields.map(field => (
              <div className="contact-atelier__field" key={field.name}>
                <label htmlFor={`contact-${field.name}`}><FormattedCopy page="contact" id={`contact.${field.name}Label`} text={t(`${field.name}Label`)}>{t(`${field.name}Label`)}</FormattedCopy> ({field.required ? <FormattedCopy page="contact" id="contact.required" text={t('required')}>{t('required')}</FormattedCopy> : <FormattedCopy page="contact" id="contact.optional" text={t('optional')}>{t('optional')}</FormattedCopy>})</label>
                <input id={`contact-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} required={field.required} placeholder={t(`${field.name}Placeholder`)} disabled={submitting} value={values[field.name]} onChange={e => setValue(field.name, e.target.value)} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `contact-${field.name}-error` : undefined} />
                {errors[field.name] ? <p className="contact-atelier__field-error" id={`contact-${field.name}-error`}>{errors[field.name]}</p> : null}
              </div>
            ))}
          </div>
          <div className="contact-atelier__field">
            <label htmlFor="contact-message">{<FormattedCopy page="contact" id="contact.messageLabel" text={t('messageLabel')}>{t('messageLabel')}</FormattedCopy>}</label>
            <textarea id="contact-message" name="message" required placeholder={t('messagePlaceholder')} value={values.message} disabled={submitting} onChange={e => setValue('message', e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined} />
            {errors.message ? <p className="contact-atelier__field-error" id="contact-message-error">{errors.message}</p> : null}
          </div>
          <div>
            <label className="contact-atelier__consent">
              <input id="contact-privacy_agreed" type="checkbox" required checked={values.privacy_agreed} disabled={submitting} onChange={e => setValue('privacy_agreed', e.target.checked)} aria-invalid={Boolean(errors.privacy_agreed)} aria-describedby={errors.privacy_agreed ? 'contact-privacy-error' : 'contact-privacy-notice'} />
              <span>문의 접수를 위한 개인정보 수집 및 이용에 동의합니다. (필수)</span>
            </label>
            <p className="contact-atelier__hint" id="contact-privacy-notice">{<FormattedCopy page="contact" id="contact.fixed.ContactInquiryForm.59fc2fb46e" text={copyText("contact", "contact.fixed.ContactInquiryForm.59fc2fb46e", "입력한 정보는 문의 확인 목적으로만 사용합니다.")}>{copyText("contact", "contact.fixed.ContactInquiryForm.59fc2fb46e", "입력한 정보는 문의 확인 목적으로만 사용합니다.")}</FormattedCopy>}</p>
            {errors.privacy_agreed ? <p className="contact-atelier__field-error" id="contact-privacy-error">{errors.privacy_agreed}</p> : null}
          </div>
          {submitError || success ? <p className="contact-atelier__feedback" ref={feedbackRef} tabIndex={-1} role={submitError ? 'alert' : 'status'}>{submitError || success}</p> : null}
          <div className="contact-atelier__submit">
            <button className="contact-atelier__action contact-atelier__action--primary" type="submit" disabled={submitting}>{submitting ? <FormattedCopy page="contact" id="contact.sending" text={t('sending')}>{t('sending')}</FormattedCopy> : <FormattedCopy page="contact" id="contact.send" text={t('send')}>{t('send')}</FormattedCopy>} <span aria-hidden="true">→</span></button>
            <p className="contact-atelier__hint">{<FormattedCopy page="contact" id="contact.emailCheck" text={t('emailCheck')}>{t('emailCheck')}</FormattedCopy>}</p>
          </div>
        </form>
      </div>
    </section>
  )
}
