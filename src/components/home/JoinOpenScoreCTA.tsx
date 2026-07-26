import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { Button } from '../common/Button'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import type { JoinInfoRow } from '../../types/cms'

type JoinOpenScoreCTAProps = {
  buttonLabel?: string | null
  joinInfo?: JoinInfoRow | null
}

type RevealStyle = CSSProperties & {
  '--join-reveal-delay': string
}

const joiningSteps = [
  {
    description: '지원자의 기본 정보와 활동 희망을 남깁니다.',
    mobileTitle: '지원서 작성',
    title: '지원서 작성',
  },
  {
    description: '담당자가 보호자 연락처로 다음 일정을 안내합니다.',
    mobileTitle: '보호자 연락',
    title: '보호자 연락·일정 확인',
  },
  {
    description: '현재 음역과 리듬을 확인하고 성장 방향을 이야기합니다.',
    mobileTitle: '음악 상담',
    title: '간단한 음악 확인·상담',
  },
  {
    description: '결과와 첫 연습 일정을 안내받고 함께 시작합니다.',
    mobileTitle: '첫 연습 합류',
    title: '결과 안내·연습 합류',
  },
]

const guardianNotes = [
  '보호자 연락으로 일정 안내',
  '사진·개인정보 동의는 별도',
  '지원 전 궁금한 점 상담',
]

function getRevealStyle(delay: number): RevealStyle {
  return {
    '--join-reveal-delay': `${delay}ms`,
  }
}

function useOpenScoreReveal() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const section = ref.current

    if (!section || !('IntersectionObserver' in window)) {
      const frame = window.requestAnimationFrame(() => setHasEntered(true))

      return () => window.cancelAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true)
          observer.unobserve(entry.target)
        }
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.25,
      },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return { isVisible: prefersReducedMotion || hasEntered, ref }
}

function FactItem({
  delay,
  label,
  value,
}: {
  delay: number
  label: string
  value: ReactNode
}) {
  return (
    <div
      className="join-open-score__fact join-open-score__reveal"
      style={getRevealStyle(delay)}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function JoinOpenScoreCTA({
  buttonLabel,
  joinInfo,
}: JoinOpenScoreCTAProps) {
  const { isVisible, ref } = useOpenScoreReveal()
  const targetItems =
    joinInfo?.target
      ?.split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  const target =
    targetItems.length > 0
      ? targetItems.join(' · ')
      : '정기 연습에 참여할 수 있는 청소년'

  return (
    <section
      aria-labelledby="join-open-score-title"
      className="flow-section home-section join-open-score"
      data-flow-section="join-letter"
      data-join-visible={isVisible ? 'true' : 'false'}
      ref={ref}
    >
      <div aria-hidden="true" className="join-open-score__surface" />
      <div aria-hidden="true" className="join-open-score__mobile-rail">
        <span className="join-open-score__mobile-rail-note">♫</span>
        <span className="join-open-score__mobile-rail-label">입단</span>
        <span className="join-open-score__mobile-rail-node" />
      </div>
      <HomeSectionStaffCue
        className="home-section-staff-cue--join"
        label="입단"
        noteOffset={30}
        symbol="♫"
      />

      <div
        aria-hidden="true"
        className="join-open-score__transition join-open-score__reveal join-open-score__reveal--line"
        style={getRevealStyle(0)}
      >
        <img
          alt=""
          decoding="async"
          src="/images/sample/join-open-score-m.svg"
        />
      </div>
      <span aria-hidden="true" className="join-open-score__ghost">
        JOIN
        <br />
        THE
        <br />
        CHOIR
      </span>

      <div className="join-open-score__layout">
        <div className="join-open-score__intro">
          <p
            className="join-open-score__eyebrow join-open-score__reveal"
            style={getRevealStyle(120)}
          >
            JOIN · NEXT VOICE
          </p>
          <h2
            className="join-open-score__title join-open-score__reveal"
            id="join-open-score-title"
            style={getRevealStyle(200)}
          >
            <span>함께 배우고,</span>
            <span>함께 무대에 서는</span>
            <span>다음 목소리를 기다립니다</span>
          </h2>
          <p
            className="join-open-score__description join-open-score__reveal"
            style={getRevealStyle(300)}
          >
            발성·악보 읽기·파트 연습부터 공연까지,
            <br />
            <span className="join-open-score__description--desktop">
              청소년이 음악 안에서 자신을 발견하고 함께 성장하는 과정입니다.
            </span>
            <span className="join-open-score__description--compact">
              음악 안에서 함께 성장하는 과정입니다.
            </span>
          </p>

          <div
            aria-label="입단 안내 바로가기"
            className="join-open-score__actions join-open-score__reveal"
            style={getRevealStyle(720)}
          >
            <Button
              className="join-open-score__cta join-open-score__cta--primary"
              href="/join?section=contact#application"
              showArrow={false}
              size="lg"
            >
              <span>{buttonLabel || '입단지원서 작성하기'}</span>
              <span aria-hidden="true">→</span>
            </Button>
            <Button
              className="join-open-score__cta join-open-score__cta--secondary"
              href="/join?section=process"
              showArrow={false}
              size="lg"
              variant="secondary"
            >
              <span>모집 일정·절차 확인</span>
              <span aria-hidden="true">→</span>
            </Button>
          </div>

          <dl className="join-open-score__facts">
            <FactItem delay={420} label="모집 대상" value={target} />
            <FactItem
              delay={500}
              label="연습 안내"
              value="일정·장소는 입단 안내에서 확인"
            />
            <FactItem
              delay={580}
              label="보호자 안내"
              value="지원 후 보호자 연락처로 안내"
            />
          </dl>
        </div>

        <div className="join-open-score__process">
          <div
            className="join-open-score__process-heading join-open-score__reveal"
            style={getRevealStyle(280)}
          >
            <p>THE JOINING SCORE · 04 STEPS</p>
            <h3>입단은 네 번의 분명한 확인으로 시작됩니다</h3>
          </div>

          <ol className="join-open-score__steps">
            {joiningSteps.map((step, index) => (
              <li
                className="join-open-score__step join-open-score__reveal"
                key={step.title}
                style={getRevealStyle(380 + index * 90)}
              >
                <span aria-hidden="true" className="join-open-score__step-dot" />
                <span className="join-open-score__step-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4>
                    <span className="join-open-score__step-title--desktop">
                      {step.title}
                    </span>
                    <span className="join-open-score__step-title--mobile">
                      {step.mobileTitle}
                    </span>
                  </h4>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside
            aria-label="보호자 안내"
            className="join-open-score__guardian join-open-score__reveal"
            style={getRevealStyle(840)}
          >
            <p>FOR PARENTS &amp; GUARDIANS</p>
            <ul>
              {guardianNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
