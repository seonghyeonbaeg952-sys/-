import { useEffect, useId, useState } from 'react'

import { getJoinRecruitment } from '../../lib/joinRecruitment'
import type { JoinInfoRow } from '../../types/cms'
import type { FAQItem } from '../../types/content'
import { TransitionLink } from '../common/TransitionLink'

export type JoinGuideSection = 'eligibility' | 'process' | 'practice' | 'faq'

type JoinGuideProps = {
  activeSection: JoinGuideSection | 'all'
  applicationHref: string
  faqs: FAQItem[]
  getSectionHref: (section: JoinGuideSection) => string
  joinInfo: JoinInfoRow
}

const guideSections: { value: JoinGuideSection; label: string }[] = [
  { value: 'eligibility', label: '모집 대상' },
  { value: 'process', label: '오디션·절차' },
  { value: 'practice', label: '연습 안내' },
  { value: 'faq', label: '자주 묻는 질문' },
]

function publicCopy(value: string | null | undefined, fallback: string) {
  const copy = value?.trim()
  return copy && !copy.includes('CMS') ? copy : fallback
}

function targetRows(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.match(/^(.+?)(?:\s+[-–—]\s+|\s*:\s*)(.+)$/)
      return { label: parts?.[1] ?? '', content: parts?.[2] ?? line }
    })
}

export function JoinGuide({ activeSection, applicationHref, faqs, getSectionHref, joinInfo }: JoinGuideProps) {
  const faqPrefix = useId()
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [periodNow, setPeriodNow] = useState(() => Date.now())
  const visibleFaqs = faqs.filter(faq => faq.is_visible !== false)
  const targets = targetRows(joinInfo.target)
  const recruitment = getJoinRecruitment(joinInfo, new Date(periodNow))

  useEffect(() => {
    const nextChange = recruitment.nextChangeAt
    if (nextChange === null) return
    const update = () => setPeriodNow(Date.now())
    const timer = setTimeout(update, Math.min(Math.max(nextChange - Date.now(), 0) + 25, 2_147_483_647))
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [recruitment.nextChangeAt])

  useEffect(() => {
    if (activeSection !== 'all') {
      document.getElementById(activeSection)?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }, [activeSection])

  const applicationLink = (
    <TransitionLink className="join-guide__apply-link" to={applicationHref}>
      입단지원서 작성하기 <span aria-hidden="true">→</span>
    </TransitionLink>
  )

  return (
    <div className="join-guide">
      <section aria-labelledby="join-guide-title" className="join-guide__intro join-guide__container">
        <div className="join-guide__invitation">
          <p className="join-guide__eyebrow">{joinInfo.title?.trim() || '입단 안내'}</p>
          <h1 id="join-guide-title">함께 노래할<br />단원을 기다립니다.</h1>
          <p className="join-guide__description">
            {publicCopy(joinInfo.description, '모집 대상과 오디션, 연습 안내를 확인하고 지원서를 작성해 주세요.')}
          </p>
        </div>
        <div className="join-guide__intro-action">
          <p>서울모테트청소년합창단</p>
          {recruitment.label ? (
            <p className="join-guide__recruitment" role="status">
              <strong>{recruitment.label}</strong>
              {recruitment.periodLabel ? <span>{recruitment.periodLabel}</span> : null}
            </p>
          ) : null}
          {applicationLink}
          <p className="join-guide__action-note">모집 대상과 오디션 안내를 확인한 뒤 지원해 주세요.</p>
        </div>
      </section>

      <nav aria-label="입단 안내 바로가기" className="join-guide__nav join-guide__container">
        <div>
          {guideSections.map(section => (
            <TransitionLink
              aria-current={activeSection === section.value ? 'location' : undefined}
              key={section.value}
              to={getSectionHref(section.value)}
            >
              {section.label}
            </TransitionLink>
          ))}
        </div>
      </nav>

      <section aria-labelledby="join-eligibility-title" id="eligibility" className="join-guide__section">
        <div className="join-guide__section-grid join-guide__container">
          <h2 id="join-eligibility-title">모집 대상</h2>
          <div className="join-guide__content">
            {targets.length ? (
              <ul className="join-guide__targets">
                {targets.map((target, index) => (
                  <li key={`${target.label}-${index}`}>
                    {target.label ? <strong>{target.label}</strong> : null}
                    <p className={target.label ? undefined : 'join-guide__target-full'}>{target.content}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="join-guide__body">모집 대상은 입단 문의를 통해 확인해 주세요.</p>}
            <div className="join-guide__subsection">
              <h3>모집 파트</h3>
              <p className="join-guide__lead">{publicCopy(joinInfo.parts, '모집 파트는 입단 문의를 통해 확인해 주세요.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="join-process-title" id="process" className="join-guide__section join-guide__section--cool">
        <div className="join-guide__section-grid join-guide__container">
          <h2 id="join-process-title">오디션·절차</h2>
          <div className="join-guide__content" id="audition-guide">
            <p className="join-guide__lead join-guide__steps">안내 확인 → 문의 또는 신청 → 상담 및 오디션 → 합창단 활동 시작</p>
            <p className="join-guide__body">{publicCopy(joinInfo.audition_process, '오디션 절차와 일정은 입단 문의를 통해 확인해 주세요.')}</p>
            <div className="join-guide__subsection">
              <h3>준비사항</h3>
              <p className="join-guide__lead">{publicCopy(joinInfo.preparation, '필요한 준비사항은 입단 문의를 통해 확인해 주세요.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="join-practice-title" id="practice" className="join-guide__section">
        <div className="join-guide__section-grid join-guide__container">
          <h2 id="join-practice-title">연습 안내</h2>
          <div className="join-guide__content join-guide__practice">
            <h3>정기연습</h3>
            <p className="join-guide__schedule">{publicCopy(joinInfo.rehearsal_time, '연습 시간은 입단 문의를 통해 확인해 주세요.')}</p>
            <p className="join-guide__body">{publicCopy(joinInfo.rehearsal_location, '연습 장소는 입단 문의를 통해 확인해 주세요.')}</p>
            <TransitionLink className="join-guide__text-link" to="/contact?section=location">
              오시는 길 <span aria-hidden="true">↗</span>
            </TransitionLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="join-faq-title" id="faq" className="join-guide__section">
        <div className="join-guide__section-grid join-guide__container">
          <h2 id="join-faq-title">자주 묻는 질문</h2>
          <div className="join-guide__faqs">
            {visibleFaqs.length ? visibleFaqs.map((faq, index) => {
              const isOpen = openFaqId === faq.id
              const questionId = `${faqPrefix}-question-${index}`
              const answerId = `${faqPrefix}-answer-${index}`
              return (
                <div className="join-guide__faq-item" key={faq.id}>
                  <h3>
                    <button
                      aria-controls={answerId}
                      aria-expanded={isOpen}
                      className="join-guide__faq-question"
                      id={questionId}
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      type="button"
                    >
                      <span>{faq.question}</span>
                      <span aria-hidden="true" className="join-guide__faq-chevron">⌄</span>
                    </button>
                  </h3>
                  <div aria-labelledby={questionId} className="join-guide__faq-answer" hidden={!isOpen} id={answerId}>
                    {faq.answer}
                  </div>
                </div>
              )
            }) : (
              <div className="join-guide__faq-empty">
                <p className="join-guide__body">등록된 질문이 없습니다. 궁금한 내용은 입단 문의로 남겨 주세요.</p>
                <TransitionLink className="join-guide__text-link" to="/contact#form">입단 문의하기</TransitionLink>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="join-ready-title" className="join-guide__ready join-guide__section--cool">
        <div className="join-guide__ready-grid join-guide__container">
          <div>
            <h2 id="join-ready-title">안내를 확인하셨나요?</h2>
            <TransitionLink className="join-guide__text-link" to="/contact#form">입단 관련 문의하기 <span aria-hidden="true">↗</span></TransitionLink>
          </div>
          {applicationLink}
        </div>
      </section>
    </div>
  )
}
