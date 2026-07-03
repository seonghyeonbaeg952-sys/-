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
    value: '음악을 사랑하고, 친구들과 함께 듣고 맞추며 성장하고 싶은 청소년',
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
                  '노래를 잘하는 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다'}
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line break-keep text-base leading-8 text-text-muted">
                {text ||
                  '서울모테트청소년합창단은 합창을 통해 청소년이 자신의 소리를 발견하고,\n타인의 소리를 존중하며, 공동체 안에서 따뜻하게 성장하도록 돕습니다. 처음 합창을 시작하는 학생도 차분히 배울 수 있도록 안내합니다.'}
              </p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                {summaryItems.map((item) => (
                  <div
                    className="min-w-0 border-l-2 border-gold-warm/55 pl-4"
                    key={item.label}
                  >
                    <dt className="text-xs font-semibold text-gold-warm">
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
              href="/join"
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
