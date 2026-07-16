import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'

type JoinCTAProps = {
  buttonLabel?: string | null
  kicker?: string | null
  process?: string | null
  schedule?: string | null
  target?: string | null
  text?: string | null
  title?: string | null
}

const joinSummary = [
  {
    label: '모집 대상',
    value: '합창 활동에 관심이 있고 정기 연습에 참여할 수 있는 청소년',
  },
  {
    label: '연습 안내',
    value: '정기 연습과 특별 연습, 공연 준비 일정은 입단 안내에서 확인',
  },
  {
    label: '입단 절차',
    value: '지원서 작성 → 보호자 연락처로 안내 → 간단한 음역 확인과 입단 상담',
  },
]

export function JoinCTA({
  buttonLabel,
  kicker,
  process,
  schedule,
  target,
  text,
  title,
}: JoinCTAProps) {
  const summaryItems = [
    { label: joinSummary[0].label, value: target || joinSummary[0].value },
    { label: joinSummary[1].label, value: schedule || joinSummary[1].value },
    { label: joinSummary[2].label, value: process || joinSummary[2].value },
  ]

  return (
    <section
      className="flow-section home-section relative overflow-hidden bg-bg-ivory"
      data-flow-section="join-letter"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--join"
        label="입단"
        noteOffset={30}
        symbol="♬"
      />
      <Container>
        <Reveal variant="card-rise">
          <div className="relative grid min-w-0 gap-7 overflow-hidden rounded-soft border border-line-default bg-linear-to-br from-bg-warm-white via-bg-warm-white to-gold-soft/45 p-6 shadow-card md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:p-8">
            <StaffLines
              className="absolute inset-x-6 top-7 hidden !w-auto opacity-35 md:block"
              density="light"
              variant="gold"
            />
            <div className="relative min-w-0">
              <StaffSectionLabel className="max-w-xs">
                {kicker || 'JOIN'}
              </StaffSectionLabel>
              <h2 className="mt-4 max-w-3xl whitespace-pre-line break-keep text-[clamp(2rem,3.6vw,2.9rem)] font-semibold leading-[1.16] text-navy-deep">
                {title ||
                  '입단 대상과 지원 절차를 안내합니다'}
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line break-keep text-base leading-8 text-text-muted">
                {text ||
                  '모집 대상, 연습 일정, 오디션 절차를 확인한 뒤 입단지원서를 제출할 수 있습니다. 제출 후 담당자가 보호자 연락처로 안내합니다.'}
              </p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                {summaryItems.map((item) => (
                  <div
                    className="min-w-0 border-l-2 border-gold-warm/55 pl-4"
                    key={item.label}
                  >
                    <dt className="text-xs font-semibold text-gold-ink">
                      {item.label}
                    </dt>
                    <dd className="mt-1 break-keep text-sm leading-6 text-text-muted">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <Button
              className="relative w-full max-w-full justify-self-start sm:w-auto"
              href="/join?section=contact#application"
              size="lg"
              variant="primary"
            >
              {buttonLabel || '입단 안내 보기'}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
