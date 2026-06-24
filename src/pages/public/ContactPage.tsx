import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { MapPreview } from '../../components/common/MapPreview'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { useContactData } from '../../hooks/usePublicData'
import { createContactMessage, type ContactMessageInput } from '../../lib/publicData'

const inquiryTypes: Array<{ label: string; value: ContactMessageInput['type'] }> = [
  { label: '입단 문의', value: 'join' },
  { label: '공연 의뢰', value: 'concert_request' },
  { label: '후원 문의', value: 'support' },
  { label: '일반 문의', value: 'general' },
]

type ContactFormValues = {
  email: string
  message: string
  name: string
  phone: string
  privacy_agreed: boolean
  title: string
  type: ContactMessageInput['type']
  website: string
}

const initialFormValues: ContactFormValues = {
  email: '',
  message: '',
  name: '',
  phone: '',
  privacy_agreed: false,
  title: '',
  type: 'general',
  website: '',
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function ContactPage() {
  const contactData = useContactData()
  const [values, setValues] = useState<ContactFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const settings = contactData.data.siteSettings
  const location = contactData.data.location

  const setValue = <TKey extends keyof ContactFormValues>(
    key: TKey,
    value: ContactFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = values.name.trim()
    const email = values.email.trim()
    const message = values.message.trim()

    if (!name || !email || !message) {
      setError('이름, 이메일, 문의 내용을 입력해 주세요.')
      return
    }

    if (!isValidEmail(email)) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }

    if (!values.privacy_agreed) {
      setError('개인정보 수집 및 이용에 동의해 주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const result = await createContactMessage({
      email,
      message,
      name,
      phone: values.phone.trim() || null,
      privacy_agreed: values.privacy_agreed,
      title: values.title.trim() || null,
      type: values.type,
      website: values.website,
    })

    setIsSubmitting(false)

    if (!result.data) {
      setError(result.error)
      return
    }

    setValues(initialFormValues)
    setSuccessMessage('문의가 접수되었습니다. 확인 후 연락드리겠습니다.')
  }

  const address = location?.address || settings.address

  return (
    <>
      <PageHero
        description="공연 의뢰, 후원, 입단 문의를 공식 채널로 보내 주세요."
        eyebrow="HELP DESK"
        title="후원·문의"
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {contactData.isLoading ? (
          <div className="mb-6">
            <LoadingState label="문의 정보를 불러오는 중입니다" />
          </div>
        ) : null}

        {contactData.error ? (
          <div className="mb-6">
            <ErrorState description={contactData.error} />
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="space-y-5">
            <Card className="p-6">
              <p className="text-sm font-semibold text-gold-warm">CONTACT</p>
              <h2 className="mt-3 text-2xl font-semibold text-navy-deep">
                공식 문의 채널
              </h2>
              <dl className="mt-5 grid gap-3 text-sm leading-6 text-text-muted">
                <div>
                  <dt className="font-semibold text-navy-deep">전화</dt>
                  <dd>{settings.phone || '등록 예정'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-deep">FAX</dt>
                  <dd>{settings.fax || '등록 예정'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-deep">이메일</dt>
                  <dd>{settings.email || '등록 예정'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-deep">주소</dt>
                  <dd>{address || '등록 예정'}</dd>
                </div>
              </dl>
            </Card>
            <MapPreview
              address={address}
              embedUrl={location?.map_embed_url}
              kakaoMapUrl={location?.kakao_map_url}
              naverMapUrl={location?.naver_map_url}
              placeName={location?.place_name || '서울모테트음악재단'}
            />
          </Reveal>

          <Reveal>
            <Card className="p-6 sm:p-7">
              <h2 className="text-2xl font-semibold text-navy-deep">
                문의 보내기
              </h2>
              <p className="mt-2 break-keep text-sm leading-6 text-text-muted">
                보내주신 문의는 운영진에게만 전달되며 공개 화면에는 표시되지 않습니다.
              </p>
              <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="contact-website">웹사이트</label>
                  <input
                    autoComplete="off"
                    id="contact-website"
                    name="website"
                    onChange={(event) => setValue('website', event.target.value)}
                    tabIndex={-1}
                    value={values.website}
                  />
                </div>

                <label>
                  <span className="text-sm font-semibold text-navy-deep">문의 유형</span>
                  <select
                    className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                    onChange={(event) =>
                      setValue('type', event.target.value as ContactMessageInput['type'])
                    }
                    value={values.type}
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold text-navy-deep">이름</span>
                    <input
                      autoComplete="name"
                      className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                      onChange={(event) => setValue('name', event.target.value)}
                      required
                      value={values.name}
                    />
                  </label>
                  <label>
                    <span className="text-sm font-semibold text-navy-deep">이메일</span>
                    <input
                      autoComplete="email"
                      className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                      inputMode="email"
                      onChange={(event) => setValue('email', event.target.value)}
                      required
                      type="email"
                      value={values.email}
                    />
                  </label>
                </div>

                <label>
                  <span className="text-sm font-semibold text-navy-deep">전화번호</span>
                  <input
                    autoComplete="tel"
                    className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                    inputMode="tel"
                    onChange={(event) => setValue('phone', event.target.value)}
                    value={values.phone}
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-navy-deep">제목</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                    onChange={(event) => setValue('title', event.target.value)}
                    value={values.title}
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-navy-deep">문의 내용</span>
                  <textarea
                    className="mt-2 min-h-40 w-full rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                    onChange={(event) => setValue('message', event.target.value)}
                    required
                    value={values.message}
                  />
                </label>

                <label className="flex items-start gap-3 rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-6 text-text-muted">
                  <input
                    checked={values.privacy_agreed}
                    className="mt-1 size-5 shrink-0 accent-gold-warm"
                    onChange={(event) =>
                      setValue('privacy_agreed', event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>
                    문의 접수를 위한 개인정보 수집 및 이용에 동의합니다. 입력한 정보는
                    문의 확인 목적으로만 사용합니다.
                  </span>
                </label>

                {error ? (
                  <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
                    {error}
                  </p>
                ) : null}
                {successMessage ? (
                  <p className="rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success" role="status">
                    {successMessage}
                  </p>
                ) : null}

                <Button
                  aria-busy={isSubmitting}
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                  variant="primary"
                >
                  {isSubmitting ? '전송 중' : '문의 전송'}
                </Button>
              </form>
            </Card>
          </Reveal>
        </div>
      </Container>
    </>
  )
}
