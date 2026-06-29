import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { SpiritStatementBlock } from '../../components/common/Spirit'
import { joinSpiritCopy } from '../../constants/spiritContent'
import { useJoinData } from '../../hooks/usePublicData'

const defaultSteps = ['안내 확인', '문의 또는 신청', '상담 및 오디션', '합창단 활동 시작']

type JoinSectionKey =
  | 'all'
  | 'contact'
  | 'eligibility'
  | 'faq'
  | 'practice'
  | 'process'

const joinSections: Array<{
  label: string
  value: Exclude<JoinSectionKey, 'all'>
}> = [
  { label: '모집 대상', value: 'eligibility' },
  { label: '오디션·절차', value: 'process' },
  { label: '연습 안내', value: 'practice' },
  { label: 'FAQ', value: 'faq' },
  { label: '입단 문의', value: 'contact' },
]

const joinSectionTabs: Array<{
  href: string
  label: string
  value: JoinSectionKey
}> = [
  { href: '/join', label: '전체', value: 'all' },
  ...joinSections.map((section) => ({
    href: `/join?section=${section.value}`,
    label: section.label,
    value: section.value,
  })),
]

function getJoinSection(value: string | null): JoinSectionKey {
  if (
    value === 'eligibility' ||
    value === 'process' ||
    value === 'practice' ||
    value === 'faq' ||
    value === 'contact'
  ) {
    return value
  }

  return 'all'
}

function splitLines(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function InfoList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-muted">등록된 내용이 없습니다.</p>
  }

  return (
    <ul className="grid gap-2 text-sm leading-6 text-text-muted">
      {items.map((item, index) => (
        <li className="flex gap-3 rounded-button border border-line-default bg-bg-ivory px-4 py-3" key={item}>
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-warm text-[11px] font-bold leading-none text-navy-midnight">
            {index + 1}
          </span>
          <span className="break-keep">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function displayPublicPlaceholder(value: string | null | undefined, fallback: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue || trimmedValue.includes('CMS')) {
    return fallback
  }

  return trimmedValue
}

export function JoinPage() {
  const joinData = useJoinData()
  const [searchParams] = useSearchParams()
  const activeSection = getJoinSection(searchParams.get('section'))
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const joinInfo = joinData.data.joinInfo
  const showAll = activeSection === 'all'
  const showEligibility = showAll || activeSection === 'eligibility'
  const showProcess = showAll || activeSection === 'process'
  const showPractice = showAll || activeSection === 'practice'
  const showFaq = showAll || activeSection === 'faq'
  const showContact = showAll || activeSection === 'contact'

  return (
    <>
      <PageHero
        description={joinInfo?.description || '입단 안내와 자주 묻는 질문을 확인합니다.'}
        eyebrow="JOIN"
        title={joinInfo?.title || '입단 안내'}
      />
      <Container className="page-main">
        {joinData.error ? (
          <div className="mb-6">
            <ErrorState
              description="공개 입단 안내 데이터를 불러오지 못했습니다. 입단 문의는 문의 페이지를 이용해 주세요."
              title="입단 안내를 불러오지 못했습니다"
            />
          </div>
        ) : null}

        {joinData.isLoading ? (
          <LoadingState label="입단 안내를 불러오는 중입니다" />
        ) : null}

        {!joinData.isLoading && !joinInfo ? (
          <EmptyState
            action={
              <Button href="/contact" variant="gold">
                입단 문의하기
              </Button>
            }
            description="입단 안내가 등록되면 이 페이지에 표시됩니다."
            title="등록된 입단 안내가 없습니다"
          />
        ) : null}

        {!joinData.isLoading && joinInfo ? (
          <div className="space-y-10 lg:space-y-14">
            <Reveal>
              <AnimatedSectionTabs
                activeValue={activeSection}
                ariaLabel="입단 안내 섹션 선택"
                className="rounded-formal border border-line-default bg-bg-warm-white p-2 shadow-card"
                tabs={joinSectionTabs}
              />
            </Reveal>

            {showAll ? (
            <Reveal>
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <SpiritStatementBlock
                  copy={{
                    body: joinSpiritCopy.body,
                    ctaLabel: joinSpiritCopy.ctaLabel,
                    ctaUrl: '/join?section=process',
                    eyebrow: joinSpiritCopy.eyebrow,
                    title: joinSpiritCopy.title,
                  }}
                />
                <Card className="p-6" radius="formal">
                  <h2 className="break-keep text-xl font-semibold text-navy-deep">
                    입단 전 함께 확인할 가치
                  </h2>
                  <ul className="mt-5 grid gap-3 text-sm leading-6 text-text-muted">
                    {joinSpiritCopy.points.map((point, index) => (
                      <li className="flex gap-3 rounded-button border border-line-default bg-bg-ivory px-4 py-3" key={point}>
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-warm text-[11px] font-bold leading-none text-navy-midnight">
                          {index + 1}
                        </span>
                        <span className="break-keep">{point}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </Reveal>
            ) : null}

            {showProcess ? (
            <section id="process">
              <SectionTitle
                description="지원 흐름을 확인하고, 궁금한 점은 문의 페이지에서 남겨 주세요."
                eyebrow="APPLICATION"
                title="입단 절차"
              />
              <div className="relative mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  aria-hidden="true"
                  className="absolute left-8 right-8 top-10 hidden h-px bg-linear-to-r from-gold-warm via-gold-soft to-line-default md:block"
                />
                {defaultSteps.map((step, index) => (
                  <Reveal key={step}>
                    <Card className="process-card relative min-h-40 p-5" hoverable radius="formal">
                      <span className="flex size-11 items-center justify-center rounded-full border-4 border-bg-warm-white bg-gold-warm text-sm font-bold text-navy-midnight shadow-[0_0_0_1px_rgb(201_164_92/0.35)]">
                        {index + 1}
                      </span>
                      <h2 className="mt-4 break-keep text-lg font-semibold text-navy-deep">
                        {step}
                      </h2>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </section>
            ) : null}

            {showEligibility ? (
            <section id="eligibility">
              <SectionTitle
                description={joinInfo.description ?? undefined}
                eyebrow="GUIDE"
                title={joinInfo.title || '입단 안내'}
              />
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <Card className="p-6" hoverable radius="balanced">
                  <h2 className="text-xl font-semibold text-navy-deep">모집 대상</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.target)} />
                  </div>
                </Card>
                <Card className="p-6" hoverable radius="balanced">
                  <h2 className="text-xl font-semibold text-navy-deep">모집 파트</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.parts)} />
                  </div>
                </Card>
              </div>
            </section>
            ) : null}

            {showProcess ? (
            <section id="audition-guide">
              <SectionTitle
                description="오디션과 준비사항을 따로 확인할 수 있습니다."
                eyebrow="AUDITION"
                title="오디션 안내"
              />
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <Card className="p-6" hoverable radius="formal">
                  <h2 className="text-xl font-semibold text-navy-deep">오디션 절차</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.audition_process)} />
                  </div>
                </Card>
                <Card className="p-6" hoverable radius="formal">
                  <h2 className="text-xl font-semibold text-navy-deep">준비사항</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.preparation)} />
                  </div>
                </Card>
              </div>
            </section>
            ) : null}

            {showPractice ? (
            <section id="practice">
              <Card
                className="relative grid gap-5 overflow-hidden p-6 md:grid-cols-2"
                radius="balanced"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
                <div>
                  <p className="text-sm font-semibold text-gold-warm">REHEARSAL</p>
                  <h2 className="mt-3 text-2xl font-semibold text-navy-deep">
                    정기연습
                  </h2>
                </div>
                <dl className="grid gap-3 text-sm leading-6 text-text-muted">
                  <div>
                    <dt className="font-semibold text-navy-deep">시간</dt>
                    <dd>
                      {displayPublicPlaceholder(
                        joinInfo.rehearsal_time,
                        '최신 연습 정보를 준비 중입니다.',
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-navy-deep">장소</dt>
                    <dd>
                      {displayPublicPlaceholder(
                        joinInfo.rehearsal_location,
                        '최신 연습 장소를 준비 중입니다.',
                      )}
                    </dd>
                  </div>
                </dl>
              </Card>
            </section>
            ) : null}

            {showContact ? (
            <section id="contact">
              <SectionTitle
                description="궁금한 점은 공식 문의 페이지에서 입단 문의 유형으로 남겨 주세요."
                eyebrow="CONTACT"
                title="입단 문의"
              />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {joinInfo.application_url ? (
                  <Button href={joinInfo.application_url} size="lg" variant="gold">
                    입단 신청하기
                  </Button>
                ) : null}
                <Button href="/contact?section=join" size="lg" variant="gold">
                  입단 문의하기
                </Button>
                <Button href="/contact?section=performance" size="lg" variant="secondary">
                  공연 문의하기
                </Button>
              </div>
            </section>
            ) : null}

            {showFaq ? (
            <section id="faq">
              <SectionTitle eyebrow="FAQ" title="자주 묻는 질문" />
              {joinData.data.faqs.length === 0 ? (
                <div className="mt-8">
                  <EmptyState title="등록된 FAQ가 없습니다" />
                </div>
              ) : (
                <div className="mt-8 grid gap-3">
                  {joinData.data.faqs.map((faq) => {
                    const isOpen = openFaqId === faq.id

                    return (
                      <Card className="overflow-hidden" key={faq.id} radius="formal">
                        <button
                          aria-expanded={isOpen}
                          className="flex min-h-16 w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          type="button"
                        >
                          <span className="break-keep text-base font-semibold text-navy-deep">
                            {faq.question}
                          </span>
                          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-soft text-gold-warm">
                            {isOpen ? '-' : '+'}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-line-default bg-bg-ivory/60 px-5 py-4 break-keep text-sm leading-7 text-text-muted">
                            {faq.answer}
                          </div>
                        ) : null}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
            ) : null}
          </div>
        ) : null}
      </Container>
    </>
  )
}
