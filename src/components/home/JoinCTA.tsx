import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'
import type { JoinInfoRow } from '../../types/cms'

type JoinCTAProps = {
  buttonLabel?: string | null
  kicker?: string | null
  joinInfo?: JoinInfoRow | null
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
  joinInfo,
  text,
  title,
}: JoinCTAProps) {
  const { copy: copyText } = useSiteEditor()
  const rehearsalSummary = [
    joinInfo?.rehearsal_time?.trim(),
    joinInfo?.rehearsal_location?.trim(),
  ]
    .filter(Boolean)
    .join(' · ')
  const summaryItems = [
    {
      label: copyText('home', 'home.joinSummary.targetLabel', joinSummary[0].label),
      value: joinInfo?.target?.trim() || copyText('home', 'home.joinSummary.targetFallback', joinSummary[0].value),
    },
    {
      label: copyText('home', 'home.joinSummary.rehearsalLabel', joinSummary[1].label),
      value: rehearsalSummary || copyText('home', 'home.joinSummary.rehearsalFallback', joinSummary[1].value),
    },
    {
      label: copyText('home', 'home.joinSummary.processLabel', joinSummary[2].label),
      value: joinInfo?.audition_process?.trim() || copyText('home', 'home.joinSummary.processFallback', joinSummary[2].value),
    },
  ]

  return (
    <section
      className="flow-section home-section relative overflow-hidden bg-bg-ivory"
      data-flow-section="join-letter"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--join"
        label={copyText("home", "home.fixed.JoinCTA.4e9d6b0799", "입단")}
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
                {kicker || <FormattedCopy page="home" id="home.fixed.JoinCTA.a9e153ee4b" text={copyText("home", "home.fixed.JoinCTA.a9e153ee4b", "JOIN")}>{copyText("home", "home.fixed.JoinCTA.a9e153ee4b", "JOIN")}</FormattedCopy>}
              </StaffSectionLabel>
              <h2 className="mt-4 max-w-3xl whitespace-pre-line break-keep text-[clamp(2rem,3.6vw,2.9rem)] font-semibold leading-[1.16] text-navy-deep">
                {title ||
                  <FormattedCopy page="home" id="home.fixed.JoinCTA.5a9231788b" text={copyText("home", "home.fixed.JoinCTA.5a9231788b", "입단 대상과 지원 절차를 안내합니다")}>{copyText("home", "home.fixed.JoinCTA.5a9231788b", "입단 대상과 지원 절차를 안내합니다")}</FormattedCopy>}
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line break-keep text-base leading-8 text-text-muted">
                {text ||
                  <FormattedCopy page="home" id="home.fixed.JoinCTA.3f2b0e1aef" text={copyText("home", "home.fixed.JoinCTA.3f2b0e1aef", "모집 대상, 연습 일정, 오디션 절차를 확인한 뒤 입단지원서를 제출할 수 있습니다. 제출 후 담당자가 보호자 연락처로 안내합니다.")}>{copyText("home", "home.fixed.JoinCTA.3f2b0e1aef", "모집 대상, 연습 일정, 오디션 절차를 확인한 뒤 입단지원서를 제출할 수 있습니다. 제출 후 담당자가 보호자 연락처로 안내합니다.")}</FormattedCopy>}
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
              {buttonLabel || <FormattedCopy page="home" id="home.fixed.JoinCTA.277e5754e8" text={copyText("home", "home.fixed.JoinCTA.277e5754e8", "입단 안내 보기")}>{copyText("home", "home.fixed.JoinCTA.277e5754e8", "입단 안내 보기")}</FormattedCopy>}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
