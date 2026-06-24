import { useState } from 'react'

import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { useJoinData } from '../../hooks/usePublicData'

const defaultSteps = ['안내 확인', '문의 또는 신청', '상담 및 오디션', '합창단 활동 시작']

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
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const joinInfo = joinData.data.joinInfo

  return (
    <>
      <PageHero
        description={joinInfo?.description || '입단 안내와 자주 묻는 질문을 확인합니다.'}
        eyebrow="JOIN"
        title={joinInfo?.title || '입단 안내'}
      />
      <Container className="py-section-mobile lg:py-section-desktop">
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
          <div className="space-y-section-mobile lg:space-y-section-desktop">
            <section>
              <SectionTitle
                description="지원 흐름을 확인하고, 궁금한 점은 문의 페이지에서 남겨 주세요."
                eyebrow="APPLICATION"
                title="입단 절차"
              />
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                {defaultSteps.map((step, index) => (
                  <Reveal key={step}>
                    <Card className="p-5" hoverable>
                      <span className="flex size-10 items-center justify-center rounded-full bg-gold-warm text-sm font-bold text-navy-midnight">
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

            <section>
              <SectionTitle
                description={joinInfo.description ?? undefined}
                eyebrow="GUIDE"
                title={joinInfo.title || '입단 안내'}
              />
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <Card className="p-6" hoverable>
                  <h2 className="text-xl font-semibold text-navy-deep">모집 대상</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.target)} />
                  </div>
                </Card>
                <Card className="p-6" hoverable>
                  <h2 className="text-xl font-semibold text-navy-deep">모집 파트</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.parts)} />
                  </div>
                </Card>
                <Card className="p-6" hoverable>
                  <h2 className="text-xl font-semibold text-navy-deep">오디션 절차</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.audition_process)} />
                  </div>
                </Card>
                <Card className="p-6" hoverable>
                  <h2 className="text-xl font-semibold text-navy-deep">준비사항</h2>
                  <div className="mt-4">
                    <InfoList items={splitLines(joinInfo.preparation)} />
                  </div>
                </Card>
              </div>
            </section>

            <section>
              <Card className="grid gap-5 p-6 md:grid-cols-2">
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
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {joinInfo.application_url ? (
                  <Button href={joinInfo.application_url} size="lg" variant="gold">
                    입단 신청하기
                  </Button>
                ) : null}
                <Button href="/contact" size="lg" variant="gold">
                  입단 문의하기
                </Button>
                <Button href="/contact" size="lg" variant="secondary">
                  공연 문의하기
                </Button>
              </div>
            </section>

            <section>
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
                      <Card className="overflow-hidden" key={faq.id}>
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
          </div>
        ) : null}
      </Container>
    </>
  )
}
