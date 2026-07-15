import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import { SupportPledgeForm } from '../../components/contact/SupportPledgeForm'
import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { MapPreview } from '../../components/common/MapPreview'
import { PageHero } from '../../components/common/PageHero'
import { SeoHead } from '../../components/common/SeoHead'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { ImageTile } from '../../components/home/ImageTile'
import { JoinInquiryForm } from '../../components/join/JoinInquiryForm'
import { SponsorsSection } from '../../components/sponsors/SponsorsSection'
import { useContactData } from '../../hooks/usePublicData'
import { createContactMessage, type ContactMessageInput } from '../../lib/publicData'

const inquiryTypes: Array<{ label: string; value: ContactMessageInput['type'] }> = [
  { label: '일반 문의', value: 'general' },
  { label: '입단 관련 문의', value: 'join' },
  { label: '후원 관련 문의', value: 'support' },
  { label: '공연 관련 문의', value: 'concert_request' },
  { label: '기타', value: 'other' },
]

type ContactSectionKey =
  | 'all'
  | 'join'
  | 'location'
  | 'performance'
  | 'sponsors'
  | 'support'

const contactSections: Array<{
  inquiryType?: ContactMessageInput['type']
  label: string
  value: Exclude<ContactSectionKey, 'all'>
}> = [
  {
    inquiryType: 'support',
    label: '후원 안내',
    value: 'support',
  },
  {
    label: '후원사',
    value: 'sponsors',
  },
  {
    inquiryType: 'concert_request',
    label: '문의',
    value: 'performance',
  },
  {
    inquiryType: 'join',
    label: '입단지원서 작성',
    value: 'join',
  },
  {
    label: '오시는 길·지도',
    value: 'location',
  },
]

const contactSectionTabs: Array<{
  href: string
  label: string
  value: ContactSectionKey
}> = [
  { href: '/contact', label: '전체', value: 'all' },
  ...contactSections.map((section) => ({
    href: `/contact?section=${section.value}`,
    label: section.label,
    value: section.value,
  })),
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

function getContactSection(value: string | null): ContactSectionKey {
  if (
    value === 'support' ||
    value === 'sponsors' ||
    value === 'performance' ||
    value === 'join' ||
    value === 'location'
  ) {
    return value
  }

  return 'all'
}

function getInitialInquiryType(section: ContactSectionKey): ContactMessageInput['type'] {
  if (section === 'support') {
    return 'support'
  }

  if (section === 'performance') {
    return 'concert_request'
  }

  if (section === 'join') {
    return 'join'
  }

  return 'general'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getContactSuccessMessage(type: ContactMessageInput['type']) {
  if (type === 'support') {
    return '후원 문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 안내드리겠습니다.'
  }

  return '문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 답변을 보내드립니다.'
}

export function ContactPage() {
  const contactData = useContactData()
  const [searchParams] = useSearchParams()
  const activeSection = getContactSection(searchParams.get('section'))
  const [values, setValues] = useState<ContactFormValues>(() => ({
    ...initialFormValues,
    type: getInitialInquiryType(activeSection),
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const settings = contactData.data.siteSettings
  const supportSettings = contactData.data.supportSettings
  const location = contactData.data.location
  const sponsors = contactData.data.sponsors
  const showAll = activeSection === 'all'
  const showSupport = showAll || activeSection === 'support'
  const showSponsorPreview = activeSection === 'support'
  const showSponsors = showAll || activeSection === 'sponsors'
  const showForm =
    showAll ||
    activeSection === 'performance'
  const showJoinInquiry = activeSection === 'join'
  const showLocation = showAll || activeSection === 'location'

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

    setValues({
      ...initialFormValues,
      type: getInitialInquiryType(activeSection),
    })
    setSuccessMessage(getContactSuccessMessage(values.type))
  }

  const address = location?.address || settings.address
  const contactDetails = [
    { label: '전화', value: settings.phone?.trim() },
    { label: 'FAX', value: settings.fax?.trim() },
    { label: '이메일', value: settings.email?.trim() },
    { label: '주소', value: address?.trim() },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail.value))
  const formTitle =
    activeSection === 'support'
      ? '후원 관련 문의 보내기'
      : activeSection === 'performance'
        ? '문의 보내기'
        : activeSection === 'join'
          ? '입단지원서 작성'
          : '문의 보내기'

  return (
    <>
      <SeoHead
        description="서울모테트청소년합창단 후원, 공연, 입단과 일반 문의를 공식 채널로 접수합니다."
        path="/contact"
        title="후원·문의"
      />
      <PageHero
        description="후원, 공연 의뢰, 일반 문의를 공식 채널로 보내 주세요. 입단지원서는 별도 양식으로 접수합니다."
        eyebrow="HELP DESK"
        title="후원·문의"
      />
      <Container className="page-main">
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

        <Reveal>
          <AnimatedSectionTabs
            activeValue={activeSection}
            ariaLabel="후원·문의 섹션 선택"
            className="mb-8 rounded-formal border border-line-default bg-bg-warm-white p-2 shadow-card"
            onChange={(value) => {
              const nextSection = contactSections.find((section) => section.value === value)

              if (nextSection?.inquiryType) {
                setValue('type', nextSection.inquiryType)
              }
            }}
            tabs={contactSectionTabs}
          />
        </Reveal>

        <div className="space-y-10 lg:space-y-14">
          {showSupport ? (
            <Reveal rootMargin="0px 0px -2% 0px" threshold={0.01}>
              <div className="space-y-8">
                {showSponsorPreview ? (
                  <SponsorsSection compact showEmpty={false} sponsors={sponsors} />
                ) : null}
                <SupportPledgeForm
                  settings={supportSettings}
                  siteSettings={settings}
                />
              </div>
            </Reveal>
          ) : null}

          {showSponsors ? (
            <Reveal rootMargin="0px 0px -2% 0px" threshold={0.01}>
              <SponsorsSection sponsors={sponsors} />
            </Reveal>
          ) : null}

          {showForm ? (
          <Reveal rootMargin="0px 0px -2% 0px" threshold={0.01}>
            <div className="inquiry-layout">
            <Card
              className="relative overflow-hidden p-6 sm:p-7"
              id={activeSection === 'performance' ? 'performance' : 'form'}
              radius="formal"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
              <h2 className="text-2xl font-semibold text-navy-deep">
                {formTitle}
              </h2>
              <p className="mt-2 break-keep text-sm leading-6 text-text-muted">
                궁금한 내용을 남겨주시면 담당자가 확인 후 입력하신 이메일로 답변을 보내드립니다.
                <br className="hidden sm:block" />
                정확한 답변을 위해 이메일 주소를 올바르게 입력해 주세요.
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
                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      답변을 받을 이메일 주소를 정확히 입력해 주세요.
                    </p>
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
                  <p className="whitespace-pre-line rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success" role="status">
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
                  {isSubmitting ? '전송 중' : '문의 보내기'}
                </Button>
              </form>
            </Card>
            <Card className="inquiry-guide-card p-6" radius="formal">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-warm">
                PRIVATE INQUIRY
              </p>
              <h2 className="mt-3 break-keep text-xl font-semibold leading-7 text-navy-deep">
                문의 내용은 공개 화면에 표시되지 않습니다.
              </h2>
              <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
                보내주신 문의는 운영진에게만 전달되며, 문의 유형에 맞춰 확인 후 연락드립니다.
              </p>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-text-muted">
                <li className="rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                  공연 관련 문의는 일정, 장소, 요청 내용을 함께 적어 주세요.
                </li>
                <li className="rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                  입단지원서는 별도 전용 양식에서 접수합니다.
                </li>
              </ul>
            </Card>
            </div>
          </Reveal>
          ) : null}

          {showJoinInquiry ? (
            <Reveal rootMargin="0px 0px -2% 0px" threshold={0.01}>
              <section id="join" className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
                <Card
                  className="relative overflow-hidden border-gold-soft/60 bg-bg-warm-white p-6 shadow-card"
                  radius="formal"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-10 size-32 rounded-full bg-gold-soft/20 sm:-right-10 sm:-top-12 sm:size-40"
                  />
                  <div className="relative">
                    <p className="text-xs font-bold tracking-[0.22em] text-gold-warm">
                      JOIN APPLICATION
                    </p>
                    <h2 className="mt-4 break-keep text-2xl font-semibold text-navy-deep">
                      입단지원서 작성
                    </h2>
                    <p className="mt-5 break-keep text-base leading-8 text-text-muted">
                      서울모테트청소년합창단 입단을 희망하는 학생은 아래 지원서를 작성해 주세요.
                      일반 문의와 별도로 접수되며, 담당자가 확인한 후 보호자 연락처로 안내드립니다.
                    </p>
                    <div className="mt-5">
                      <Button href="/join?section=contact#application" variant="secondary">
                        입단 안내에서 작성하기
                      </Button>
                    </div>
                    <div className="mt-6 grid gap-3 text-sm leading-6 text-text-muted">
                      <p className="rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                        추천서는 선택 항목입니다. 추천서가 없어도 지원서를 제출할 수 있습니다.
                      </p>
                      <p className="rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                        사진은 최근 반명함판 사진 기준으로 첨부해 주세요.
                      </p>
                    </div>
                  </div>
                </Card>
                <JoinInquiryForm />
              </section>
            </Reveal>
          ) : null}

          {showLocation ? (
            <Reveal rootMargin="0px 0px -2% 0px" threshold={0.01}>
              <section id="location">
                <SectionTitle
                  description="주소, 교통 안내와 지도 앱 바로가기를 확인합니다."
                  eyebrow="LOCATION"
                  title="오시는 길"
                />
                <div className="location-grid mt-8">
                  <div className="space-y-5">
                    <Card className="relative overflow-hidden p-6" radius="formal">
                      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
                      <p className="text-sm font-semibold text-gold-warm">CONTACT</p>
                      <h2 className="mt-3 text-2xl font-semibold text-navy-deep">
                        공식 문의 채널
                      </h2>
                      {contactDetails.length > 0 ? (
                        <dl className="mt-5 grid gap-3 text-sm leading-6 text-text-muted sm:grid-cols-2">
                          {contactDetails.map((detail) => (
                            <div
                              className="rounded-button border border-line-default bg-bg-ivory px-4 py-3"
                              key={detail.label}
                            >
                              <dt className="font-semibold text-navy-deep">
                                {detail.label}
                              </dt>
                              <dd className="break-words">{detail.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="mt-5 rounded-button border border-line-default bg-bg-ivory px-4 py-3 text-sm leading-6 text-text-muted">
                          공식 문의 정보는 문의 양식을 통해 안내해 드립니다.
                        </p>
                      )}
                    </Card>
                    {location?.transit_info || location?.parking_info ? (
                      <Card className="p-6" radius="formal">
                        <h3 className="text-xl font-semibold text-navy-deep">
                          교통 안내
                        </h3>
                        {location.transit_info ? (
                          <p className="mt-4 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
                            {location.transit_info}
                          </p>
                        ) : null}
                        {location.parking_info ? (
                          <p className="mt-4 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
                            {location.parking_info}
                          </p>
                        ) : null}
                      </Card>
                    ) : null}
                  </div>
                  <div className="space-y-5">
                    {location?.image_url ? (
                      <Card className="overflow-hidden" radius="balanced">
                        <ImageTile
                          alt={location.image_alt || `${location.place_name || '오시는 길'} 사진`}
                          className="aspect-[16/10]"
                          objectFit="cover"
                          sizes="(min-width: 1024px) 50vw, calc(100vw - 40px)"
                          src={location.image_url}
                          transform={{
                            quality: 88,
                            resize: 'cover',
                            width: 1800,
                            widths: [960, 1400, 1800],
                          }}
                        />
                        {location.image_caption ? (
                          <p className="border-t border-line-default bg-bg-warm-white p-4 text-sm leading-6 text-text-muted">
                            {location.image_caption}
                          </p>
                        ) : null}
                      </Card>
                    ) : null}
                    <MapPreview
                      address={address}
                      embedUrl={location?.map_embed_url}
                      kakaoMapUrl={location?.kakao_map_url}
                      naverMapUrl={location?.naver_map_url}
                      placeName={location?.place_name || '서울모테트음악재단'}
                    />
                  </div>
                </div>
              </section>
            </Reveal>
          ) : null}
        </div>
      </Container>
    </>
  )
}

