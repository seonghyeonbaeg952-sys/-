import {
  AnimatePresence,
  MotionConfig,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Link } from 'react-router'

import {
  educationJourneySteps,
  legacyFlowSteps,
  songOfMemoryCopy,
  spiritManifestoCopy,
  voiceConstellationCopy,
} from '../../constants/spiritContent'
import type { SpiritCopy, SpiritValue } from '../../constants/spiritContent'
import {
  getAcceleratedTimelineProgress,
  getMilestoneRevealProgress,
  getNextSpiritIndex,
  getSpiritAnchorScrollTop,
} from '../../lib/spiritHeritage'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { OptimizedImage } from '../common/OptimizedImage'

import '../../styles/spirit-heritage.css'

type SpiritHeritageExperienceProps = {
  cta: SpiritCopy
  hero: SpiritCopy
  heroImageUrl?: string | null
  manifestoText: string
  motetMeaning: SpiritCopy
  values: SpiritValue[]
}

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  scale?: number
  x?: number
  y?: number
}

type LineageMilestoneProps = {
  index: number
  progress: MotionValue<number>
  total: number
  year: string
  title: string
  body: string
}

const HERO_FALLBACK_IMAGE = '/images/home-v6/hero-performance.jpg'
const HERITAGE_IMAGE = '/images/home-v6/practice-rehearsal.jpg'
const COMMUNITY_IMAGE = '/images/home-v6/community-rehearsal.jpg'
const EASE_OUT = [0.22, 1, 0.36, 1] as const

const manifestoStatementTitles = [
  '합창 기본기',
  '함께 듣는 연습',
  '공연 활동',
  '이어지는 정신',
] as const

function getParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function useSpiritAnchorNavigation() {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    let animationFrame = 0
    let settleTimer = 0
    let restoreTimer = 0
    let restoreScrollBehavior = () => {}
    let cancelled = false
    let navigationVersion = 0
    const initialHash = window.location.hash

    const moveToHash = (behavior: ScrollBehavior, version: number) => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(settleTimer)
      animationFrame = window.requestAnimationFrame(() => {
        if (cancelled || version !== navigationVersion) {
          return
        }

        const hash = window.location.hash.slice(1)
        if (!hash) {
          return
        }

        const targetId = (() => {
          try {
            return decodeURIComponent(hash)
          } catch {
            return hash
          }
        })()

        const target = document.getElementById(targetId)
        if (!target?.closest('.spirit-heritage')) {
          return
        }

        const scrollToTarget = (settleBehavior: ScrollBehavior) => {
          const top = getSpiritAnchorScrollTop(
            window.scrollY,
            target.getBoundingClientRect().top,
          )

          if (settleBehavior === 'auto') {
            const root = document.documentElement
            window.clearTimeout(restoreTimer)
            restoreScrollBehavior()
            const previousValue = root.style.getPropertyValue('scroll-behavior')
            const previousPriority = root.style.getPropertyPriority('scroll-behavior')
            root.style.setProperty('scroll-behavior', 'auto', 'important')
            window.scrollTo({ top, behavior: 'auto' })

            restoreScrollBehavior = () => {
              if (previousValue) {
                root.style.setProperty('scroll-behavior', previousValue, previousPriority)
              } else {
                root.style.removeProperty('scroll-behavior')
              }
              restoreScrollBehavior = () => {}
            }

            restoreTimer = window.setTimeout(() => {
              const correctedTop = getSpiritAnchorScrollTop(
                window.scrollY,
                target.getBoundingClientRect().top,
              )
              window.scrollTo({ top: correctedTop, behavior: 'auto' })
              restoreScrollBehavior()
            }, 32)
            return
          }

          window.scrollTo({ top, behavior: settleBehavior })
        }

        scrollToTarget(behavior)
        target.focus({ preventScroll: true })

        if (behavior === 'smooth') {
          settleTimer = window.setTimeout(() => {
            if (
              cancelled ||
              version !== navigationVersion ||
              window.location.hash.slice(1) !== hash
            ) {
              return
            }

            scrollToTarget('auto')
          }, 520)
        }
      })
    }

    const handleHashChange = () => {
      navigationVersion += 1
      moveToHash(reducedMotion ? 'auto' : 'smooth', navigationVersion)
    }

    moveToHash('auto', navigationVersion)
    void document.fonts.ready.then(() => {
      if (
        cancelled ||
        navigationVersion !== 0 ||
        window.location.hash !== initialHash
      ) {
        return
      }

      moveToHash('auto', navigationVersion)
    })
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(settleTimer)
      window.clearTimeout(restoreTimer)
      restoreScrollBehavior()
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [reducedMotion])
}

function Reveal({
  children,
  className,
  delay = 0,
  scale = 1,
  x = 0,
  y = 34,
}: RevealProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, scale, x, y }}
      transition={{ delay, duration: 0.76, ease: EASE_OUT }}
      viewport={{ amount: 0.22, once: true }}
      whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1, x: 0, y: 0 }}
    >
      {children}
    </motion.div>
  )
}

function LineageMilestone({
  body,
  index,
  progress,
  title,
  total,
  year,
}: LineageMilestoneProps) {
  const reducedMotion = usePrefersReducedMotion()
  const reveal = useTransform(progress, (value) =>
    getMilestoneRevealProgress(value, index, total),
  )
  const opacity = useTransform(reveal, [0, 0.16, 1], [0, 1, 1])
  const rowY = useTransform(reveal, [0, 1], [22, 0])
  const yearX = useTransform(
    reveal,
    [0, 1],
    [index % 2 === 0 ? 62 : -62, 0],
  )
  const yearScale = useTransform(reveal, [0, 1], [index === 2 ? 0.86 : 0.9, 1])
  const dotScale = useTransform(
    reveal,
    [0, 0.42, 0.68, 1],
    [0.34, 1.26, 1, 1],
  )
  const renderedYear = year === '현재' ? 'NOW' : year === '미래' ? 'NEXT' : year

  return (
    <motion.article
      className="spirit-heritage__milestone"
      data-active={index === 2 ? 'true' : undefined}
      style={reducedMotion ? undefined : { opacity }}
    >
      <motion.span
        aria-hidden="true"
        className="spirit-heritage__milestone-dot"
        style={reducedMotion ? undefined : { scale: dotScale }}
      />
      <motion.p
        className="spirit-heritage__milestone-year"
        style={reducedMotion ? undefined : { scale: yearScale, x: yearX }}
      >
        {renderedYear}
      </motion.p>
      <motion.div
        className="spirit-heritage__milestone-copy"
        style={reducedMotion ? undefined : { y: rowY }}
      >
        <h3>{title}</h3>
        <p>{body}</p>
      </motion.div>
    </motion.article>
  )
}

function moveTabFocus(
  event: KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  itemCount: number,
  setActiveIndex: (index: number) => void,
  buttonRefs: { current: Array<HTMLButtonElement | null> },
) {
  let nextIndex: number

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = getNextSpiritIndex(currentIndex, itemCount, -1)
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = getNextSpiritIndex(currentIndex, itemCount, 1)
  } else if (event.key === 'Home') {
    nextIndex = itemCount > 0 ? 0 : -1
  } else if (event.key === 'End') {
    nextIndex = itemCount > 0 ? itemCount - 1 : -1
  } else {
    return
  }

  event.preventDefault()
  if (nextIndex >= 0) {
    setActiveIndex(nextIndex)
    buttonRefs.current[nextIndex]?.focus()
  }
}

function SpiritHero({ copy }: { copy: SpiritCopy }) {
  const reducedMotion = usePrefersReducedMotion()
  const heroImage = HERO_FALLBACK_IMAGE

  return (
    <section
      aria-labelledby="spirit-heritage-title"
      className="spirit-heritage__hero"
      id="spirit-overview"
      tabIndex={-1}
    >
      <motion.div
        className="spirit-heritage__hero-photo"
        data-node-id="2:18"
        initial={reducedMotion ? false : { opacity: 0, scale: 1.045, x: 64 }}
        animate={reducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 1.08, ease: EASE_OUT }}
      >
        <OptimizedImage
          alt="지휘자와 함께 연습하는 서울모테트청소년합창단"
          fallbackSrcs={[HERO_FALLBACK_IMAGE]}
          fallbackVariant="hero"
          imageClassName="spirit-heritage__hero-photo-image"
          priority
          sizes="(max-width: 767px) calc(100vw - 48px), 50vw"
          src={heroImage}
        />
      </motion.div>
      <div aria-hidden="true" className="spirit-heritage__hero-veil" />

      <div className="spirit-heritage__hero-inner">
        <div className="spirit-heritage__eyebrow spirit-heritage__eyebrow--hero">
          SEOUL MOTET YOUTH CHOIR · SPIRIT
        </div>
        <motion.h1
          className="spirit-heritage__display-title"
          data-node-id="45:2"
          id="spirit-heritage-title"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.955, x: -150 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.92, ease: EASE_OUT }}
        >
          SPIRIT
        </motion.h1>

        <div className="spirit-heritage__hero-heading spirit-heritage__hero-heading--desktop">
          <motion.p
            data-node-id="6:2"
            initial={reducedMotion ? false : { opacity: 0, y: 42 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.74, ease: EASE_OUT }}
          >
            정신은 선언이 아니라
          </motion.p>
          <motion.p
            className="spirit-heritage__hero-promise"
            data-node-id="6:3"
            initial={reducedMotion ? false : { opacity: 0, y: 52 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.8, ease: EASE_OUT }}
          >
            <strong>이어 온</strong>
            <span>
              <em>선택</em>입니다.
            </span>
          </motion.p>
        </div>

        <div className="spirit-heritage__hero-heading spirit-heritage__hero-heading--mobile">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.68, ease: EASE_OUT }}
          >
            마음을 담은
            <br />
            음악으로
          </motion.p>
          <motion.p
            className="spirit-heritage__hero-promise"
            initial={reducedMotion ? false : { opacity: 0, y: 32 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.72, ease: EASE_OUT }}
          >
            <span className="spirit-heritage__hero-promise-line">
              다음 <em>세대</em>를
            </span>
            <span className="spirit-heritage__hero-promise-line spirit-heritage__hero-promise-line--indented">
              세웁니다.
            </span>
          </motion.p>
        </div>

        <div aria-hidden="true" className="spirit-heritage__reading-stroke">
          <motion.span
            data-node-id="75:3"
            initial={reducedMotion ? false : { opacity: 0, scaleX: 0.024 }}
            animate={reducedMotion ? undefined : { opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.44, ease: EASE_OUT }}
          />
          <i />
        </div>

        <motion.p
          className="spirit-heritage__hero-body"
          data-node-id="2:23"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: EASE_OUT }}
        >
          {copy.body}
        </motion.p>

        <motion.div
          className="spirit-heritage__origin-card spirit-heritage__open-frame"
          data-node-id="2:24"
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 1.06, duration: 0.58, ease: EASE_OUT }}
        >
          <strong>1989</strong>
          <p>
            정직한 음악에서 시작해
            <br />
            다음 세대의 성장으로 이어집니다.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function HeritageTimeline() {
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.82', 'end 0.28'],
  })
  const acceleratedProgress = useTransform(scrollYProgress, (value) =>
    getAcceleratedTimelineProgress(value),
  )
  const pathProgress = useSpring(acceleratedProgress, {
    damping: 34,
    mass: 0.3,
    stiffness: 160,
  })

  return (
    <section
      className="spirit-heritage__lineage"
      id="spirit-lineage"
      ref={sectionRef}
      tabIndex={-1}
    >
      <div className="spirit-heritage__section-shell spirit-heritage__lineage-grid">
        <div className="spirit-heritage__lineage-intro">
          <p className="spirit-heritage__eyebrow">OUR LINEAGE</p>
          <Reveal className="spirit-heritage__lineage-title" y={34}>
            <p>시간은 흘렀지만</p>
            <h2>
              정신은
              <span>이어졌습니다.</span>
            </h2>
          </Reveal>
          <div aria-hidden="true" className="spirit-heritage__lineage-rule">
            <motion.span
              data-node-id="75:8"
              initial={reducedMotion ? false : { opacity: 0, scaleX: 0.02 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, scaleX: 1 }}
              viewport={{ amount: 0.8, once: true }}
              transition={{ duration: 0.54, ease: EASE_OUT }}
            />
          </div>
          <p className="spirit-heritage__lineage-lead">
            한 세대의 음악적 헌신이 재단과 청소년 교육으로 이어지고,
            오늘의 공동체가 되었습니다.
          </p>
          <Reveal className="spirit-heritage__heritage-photo" scale={1.035} x={-46} y={0}>
            <OptimizedImage
              alt="서울모테트청소년합창단 연습 장면"
              fallbackVariant="gallery"
              imageClassName="spirit-heritage__media-image"
              sizes="(max-width: 899px) calc(100vw - 48px), 36vw"
              src={HERITAGE_IMAGE}
            >
              <span className="spirit-heritage__image-label">연습에서 삶으로 이어지는 합창교육</span>
            </OptimizedImage>
          </Reveal>
        </div>

        <div className="spirit-heritage__lineage-track">
          <svg
            aria-hidden="true"
            className="spirit-heritage__timeline-curve"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 129.825 1040.96"
          >
            <path
              d="M66.4009 0.514496C-23.5991 150.514 -18.5991 250.514 68.4009 345.514C154.401 438.514 146.401 565.514 58.4009 646.514C-18.5991 717.514 -8.59906 858.514 82.4009 1040.51"
              stroke="currentColor"
              strokeOpacity="0.18"
              strokeWidth="2"
            />
            <motion.path
              d="M66.4009 0.514496C-23.5991 150.514 -18.5991 250.514 68.4009 345.514C154.401 438.514 146.401 565.514 58.4009 646.514C-18.5991 717.514 -8.59906 858.514 82.4009 1040.51"
              data-node-id="2:35"
              pathLength={1}
              stroke="var(--spirit-orange)"
              strokeLinecap="round"
              strokeWidth="3"
              style={reducedMotion ? { pathLength: 1 } : { pathLength: pathProgress }}
            />
          </svg>
          <div className="spirit-heritage__milestones">
            {legacyFlowSteps.map((item, index) => (
              <LineageMilestone
                body={item.body}
                index={index}
                key={item.year}
                progress={pathProgress}
                title={item.title}
                total={legacyFlowSteps.length}
                year={item.year}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MotetMeaning({ copy }: { copy: SpiritCopy }) {
  return (
    <section className="spirit-heritage__motet" id="spirit-motet" tabIndex={-1}>
      <motion.p
        aria-hidden="true"
        className="spirit-heritage__backdrop-word"
        data-node-id="3:3"
        initial={{ opacity: 0, x: -110 }}
        transition={{ duration: 1.04, ease: EASE_OUT }}
        viewport={{ amount: 0.3, once: true }}
        whileInView={{ opacity: 0.14, x: 0 }}
      >
        MOTET
      </motion.p>
      <div className="spirit-heritage__section-shell spirit-heritage__motet-grid">
        <div className="spirit-heritage__motet-title-block">
          <p className="spirit-heritage__eyebrow">THE NAME · THE ROOT · THE STANDARD</p>
          <Reveal y={28}>
            <p className="spirit-heritage__motet-prelude">모테트는</p>
          </Reveal>
          <Reveal className="spirit-heritage__motet-title" delay={0.08} y={42}>
            <h2>
              <span className="spirit-heritage__motet-line">
                여러 <em>목소리</em>로,
              </span>
              <span className="spirit-heritage__motet-line spirit-heritage__motet-line--middle">
                하나의 원칙을
              </span>
              <span className="spirit-heritage__motet-line spirit-heritage__motet-line--last">
                만듭니다.
              </span>
            </h2>
          </Reveal>
          <motion.span
            aria-hidden="true"
            className="spirit-heritage__vertical-stroke"
            data-node-id="75:10"
            initial={{ opacity: 0, scaleY: 0.01 }}
            transition={{ duration: 0.52, ease: EASE_OUT }}
            viewport={{ amount: 0.7, once: true }}
            whileInView={{ opacity: 1, scaleY: 1 }}
          />
        </div>

        <Reveal className="spirit-heritage__motet-glass spirit-heritage__open-frame" scale={0.975} x={70} y={0}>
          <motion.span
            aria-hidden="true"
            className="spirit-heritage__panel-dropcap"
            data-node-id="56:3"
            initial={{ opacity: 0, x: 36 }}
            viewport={{ amount: 0.6, once: true }}
            whileInView={{ opacity: 0.06, x: 0 }}
          >
            M
          </motion.span>
          <Reveal className="spirit-heritage__calligraphic-note" x={42} y={0}>
            many voices — one intention
          </Reveal>
          <p className="spirit-heritage__motet-body">{copy.body}</p>
          <Reveal className="spirit-heritage__quote-card spirit-heritage__open-frame" scale={0.985} y={24}>
            <blockquote>
              {copy.quote ||
                '하나가 되기 위해 같아지는 것이 아니라, 다름을 들으며 정확히 맞춰 갑니다.'}
            </blockquote>
          </Reveal>
        </Reveal>
      </div>
    </section>
  )
}

function SpiritManifesto({ text }: { text: string }) {
  const paragraphs = useMemo(() => {
    const resolved = getParagraphs(text)
    return resolved.length >= 4 ? resolved.slice(0, 4) : spiritManifestoCopy.paragraphs
  }, [text])

  return (
    <section className="spirit-heritage__manifesto" id="spirit-manifesto" tabIndex={-1}>
      <div className="spirit-heritage__section-shell">
        <Reveal className="spirit-heritage__manifesto-heading" y={52}>
          <h2>
            <span className="spirit-heritage__manifesto-line">
              합창은 더 크게 부르는 법보다,
            </span>
            <span className="spirit-heritage__manifesto-line spirit-heritage__manifesto-line--listen">
              함께 듣는 <strong>태도</strong>를
            </span>
            <span className="spirit-heritage__manifesto-line spirit-heritage__manifesto-line--final">
              배우는 일입니다.
            </span>
          </h2>
        </Reveal>
        <div aria-hidden="true" className="spirit-heritage__manifesto-rule">
          <motion.span
            data-node-id="75:15"
            initial={{ opacity: 0, scaleX: 0.02 }}
            viewport={{ amount: 0.8, once: true }}
            whileInView={{ opacity: 1, scaleX: 1 }}
          />
        </div>
        <div className="spirit-heritage__manifesto-list">
          {paragraphs.map((paragraph, index) => (
            <Reveal
              className="spirit-heritage__manifesto-row"
              delay={index * 0.05}
              key={manifestoStatementTitles[index]}
              x={index % 2 === 0 ? -34 : -22}
              y={0}
            >
              <p className="spirit-heritage__manifesto-number">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3>{manifestoStatementTitles[index]}</h3>
              <p>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaithSection() {
  return (
    <section className="spirit-heritage__faith" id="spirit-faith" tabIndex={-1}>
      <Reveal className="spirit-heritage__faith-watermark" x={74} y={0}>
        HONEST
      </Reveal>
      <div className="spirit-heritage__section-shell spirit-heritage__faith-grid">
        <div className="spirit-heritage__faith-copy">
          <Reveal className="spirit-heritage__faith-title" y={26}>
            <h2>
              <span className="spirit-heritage__faith-line">
                <strong>정직한</strong> 음악은
              </span>
              <span className="spirit-heritage__faith-line spirit-heritage__faith-line--generation">다음 세대의</span>
              <span className="spirit-heritage__faith-line spirit-heritage__faith-line--last">
                <em>기준</em>이 됩니다.
              </span>
            </h2>
          </Reveal>
          <p className="spirit-heritage__faith-lead">{songOfMemoryCopy.lead}</p>
          {songOfMemoryCopy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="spirit-heritage__scripture-list">
          {songOfMemoryCopy.scriptureCards.map((card, index) => (
            <Reveal
              className="spirit-heritage__scripture-card spirit-heritage__open-frame"
              delay={index * 0.08}
              key={card.label}
              scale={0.985}
              x={index === 0 ? 58 : -58}
              y={0}
            >
              <p>{card.label}</p>
              <blockquote>{card.text}</blockquote>
              <small>{card.note}</small>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValuesSection({ values }: { values: SpiritValue[] }) {
  const [activeIndex, setActiveIndex] = useState(Math.min(2, values.length - 1))
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeValue = values[activeIndex]

  if (!activeValue) {
    return null
  }

  return (
    <section className="spirit-heritage__values" id="spirit-values" tabIndex={-1}>
      <div className="spirit-heritage__section-shell spirit-heritage__values-grid">
        <div className="spirit-heritage__values-navigation">
          <Reveal className="spirit-heritage__values-heading" y={38}>
            <h2>
              <span className="spirit-heritage__values-line">
                우리가 <strong>한 음</strong>을
              </span>
              <span className="spirit-heritage__values-line spirit-heritage__values-line--middle">
                대하는 네 가지
              </span>
              <span className="spirit-heritage__values-line spirit-heritage__values-line--last">
                태도
              </span>
            </h2>
          </Reveal>
          <p className="spirit-heritage__values-lead">
            네 가지 원칙은 연습과 공연, 공동체 안에서 함께 작동하는 하나의 기준입니다.
          </p>
          <div aria-label="합창단 핵심 가치" className="spirit-heritage__tab-list" role="tablist">
            {values.map((value, index) => (
              <button
                aria-controls="spirit-value-panel"
                aria-selected={activeIndex === index}
                className="spirit-heritage__value-tab"
                key={value.number}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  moveTabFocus(
                    event,
                    index,
                    values.length,
                    setActiveIndex,
                    buttonRefs,
                  )
                }
                ref={(node) => {
                  buttonRefs.current[index] = node
                }}
                role="tab"
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                <span>{value.number}</span>
                <strong>{value.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="spirit-heritage__value-panel-wrap">
          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              className="spirit-heritage__value-panel spirit-heritage__open-frame"
              data-node-id="3:64"
              exit={{ opacity: 0, scale: 0.985, x: -24 }}
              id="spirit-value-panel"
              initial={{ opacity: 0, scale: 0.972, x: 62, y: 30 }}
              key={activeValue.number}
              role="tabpanel"
              transition={{ duration: 0.56, ease: EASE_OUT }}
            >
              <p className="spirit-heritage__value-number">{activeValue.number}</p>
              <h3>{activeValue.title}</h3>
              <strong>{activeValue.summary}</strong>
              <p>{activeValue.description}</p>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function CommunitySection() {
  return (
    <section className="spirit-heritage__community" id="spirit-community" tabIndex={-1}>
      <Reveal className="spirit-heritage__community-watermark" x={64} y={0}>
        LISTEN
      </Reveal>
      <div className="spirit-heritage__section-shell">
        <div className="spirit-heritage__community-heading">
          <Reveal y={24}>
            <h2>
              <span className="spirit-heritage__community-line">
                서로 <em>다른</em> 목소리가
              </span>
              <span className="spirit-heritage__community-line spirit-heritage__community-line--middle">
                <strong>하나의</strong>
              </span>
              <span className="spirit-heritage__community-line spirit-heritage__community-line--last">
                공동체가 됩니다.
              </span>
            </h2>
          </Reveal>
          <p>{voiceConstellationCopy.lead}</p>
        </div>
        <Reveal className="spirit-heritage__community-photo" scale={1.032} x={-54} y={0}>
          <OptimizedImage
            alt="함께 악보를 들고 연습하는 서울모테트청소년합창단"
            fallbackVariant="gallery"
            imageClassName="spirit-heritage__media-image"
            sizes="(max-width: 899px) calc(100vw - 48px), 90vw"
            src={COMMUNITY_IMAGE}
          >
            <span className="spirit-heritage__image-label">{voiceConstellationCopy.centerLabel}</span>
          </OptimizedImage>
        </Reveal>
        <div className="spirit-heritage__voices">
          {voiceConstellationCopy.voices.map((voice, index) => (
            <Reveal className="spirit-heritage__voice" delay={index * 0.05} key={voice.part} y={18}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <h3>{voice.part}</h3>
              <p>{voice.meaning}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="spirit-heritage__community-closing" y={24}>
          {voiceConstellationCopy.closing.replace(' 서로를', '\n서로를')}
        </Reveal>
      </div>
    </section>
  )
}

function EducationSection() {
  const [activeIndex, setActiveIndex] = useState(2)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeStep = educationJourneySteps[activeIndex]

  return (
    <section className="spirit-heritage__education" id="spirit-education" tabIndex={-1}>
      <div className="spirit-heritage__section-shell spirit-heritage__education-grid">
        <div className="spirit-heritage__education-copy">
          <Reveal className="spirit-heritage__education-label" x={-88} y={0}>
            HOW WE GROW
          </Reveal>
          <Reveal className="spirit-heritage__education-title" y={34}>
            <p>음악을 배우는</p>
            <h2>
              <span className="spirit-heritage__education-line">다섯 가지</span>
              <span className="spirit-heritage__education-line spirit-heritage__education-line--growth">
                <strong>성장</strong>의 장면
              </span>
            </h2>
          </Reveal>
          <p className="spirit-heritage__education-lead">
            좋은 합창은 무대에서 갑자기 완성되지 않습니다. 듣고, 이해하고, 조율하고,
            약속을 지키는 일상의 반복이 사람을 세웁니다.
          </p>
        </div>

        <div className="spirit-heritage__education-interactive">
          <div aria-label="성장의 다섯 단계" className="spirit-heritage__education-tabs" role="tablist">
            {educationJourneySteps.map((step, index) => (
              <motion.button
                aria-controls="spirit-education-panel"
                aria-selected={activeIndex === index}
                initial={{ opacity: 0 }}
                key={step.step}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  moveTabFocus(
                    event,
                    index,
                    educationJourneySteps.length,
                    setActiveIndex,
                    buttonRefs,
                  )
                }
                ref={(node) => {
                  buttonRefs.current[index] = node
                }}
                role="tab"
                tabIndex={activeIndex === index ? 0 : -1}
                transition={{ delay: index * 0.04, duration: 0.44, ease: EASE_OUT }}
                type="button"
                viewport={{ amount: 0.6, once: true }}
                whileInView={{ opacity: 1 }}
              >
                <small>{String(index + 1).padStart(2, '0')}</small>
                <span>{step.step}</span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="spirit-heritage__education-panel spirit-heritage__open-frame"
              exit={{ opacity: 0, scale: 0.986, x: -24 }}
              id="spirit-education-panel"
              initial={{ opacity: 0, scale: 0.978, x: 62 }}
              key={activeStep.step}
              role="tabpanel"
              transition={{ duration: 0.58, ease: EASE_OUT }}
            >
              <p>{activeStep.step}</p>
              <h3>{activeStep.title}</h3>
              <span>{activeStep.body}</span>
              <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function ClosingCta({ copy }: { copy: SpiritCopy }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <section className="spirit-heritage__closing" id="spirit-join" tabIndex={-1}>
      <motion.div
        aria-hidden="true"
        className="spirit-heritage__closing-glow"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.78 }}
        viewport={{ amount: 0.3, once: true }}
        whileInView={reducedMotion ? undefined : { opacity: 0.78, scale: 1 }}
        transition={{ duration: 0.86, ease: EASE_OUT }}
      />
      <Reveal className="spirit-heritage__closing-card spirit-heritage__open-frame" scale={0.985} y={44}>
        <img
          alt=""
          aria-hidden="true"
          className="spirit-heritage__closing-logo"
          src="/images/brand/smyc-symbol-vector.svg"
        />
        <div className="spirit-heritage__closing-copy">
          <p className="spirit-heritage__eyebrow">{copy.eyebrow || 'JOIN THE HARMONY'}</p>
          <h2 aria-label={copy.title}>
            함께 부르는
            <span>다음 세대의</span>
            <span>울림에</span>
            <strong>동참하세요.</strong>
          </h2>
          <p>{copy.body}</p>
          <div className="spirit-heritage__closing-actions">
            <Link className="spirit-heritage__button spirit-heritage__button--primary" to={copy.ctaUrl || '/join'}>
              {copy.ctaLabel || '입단 안내'}
            </Link>
            <Link
              className="spirit-heritage__button spirit-heritage__button--secondary"
              to={copy.secondaryCtaUrl || '/contact?section=support'}
            >
              {copy.secondaryCtaLabel || '후원 참여'}
            </Link>
          </div>
        </div>
        <Reveal className="spirit-heritage__one-voice" scale={0.94} x={84} y={0}>
          <span>ONE</span>
          <span>VOICE</span>
        </Reveal>
      </Reveal>
    </section>
  )
}

export function SpiritHeritageExperience({
  cta,
  hero,
  manifestoText,
  motetMeaning,
  values,
}: SpiritHeritageExperienceProps) {
  useSpiritAnchorNavigation()

  return (
    <MotionConfig reducedMotion="user">
      <div className="spirit-heritage">
      <SpiritHero copy={hero} />
        <HeritageTimeline />
        <MotetMeaning copy={motetMeaning} />
        <SpiritManifesto text={manifestoText} />
        <FaithSection />
        <ValuesSection values={values} />
        <CommunitySection />
        <EducationSection />
        <ClosingCta copy={cta} />
      </div>
    </MotionConfig>
  )
}
