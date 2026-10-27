import { EditableLayout } from '../site-editor/EditableLayout'
import { SiteImage } from '../../features/site-photos/SiteImage'
import { FormattedCopy } from '../site-editor/FormattedCopy'
import { SiteCopy } from '../site-editor/SiteCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import {
  MotionConfig,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import {
  legacyFlowSteps,
  voiceConstellationCopy,
} from '../../constants/spiritContent'
import type { SpiritCopy } from '../../constants/spiritContent'
import {
  getAcceleratedTimelineProgress,
  getMilestoneRevealProgress,
  getSpiritAnchorScrollTop,
  resolveSpiritSectionId,
} from '../../lib/spiritHeritage'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { OptimizedImage } from '../common/OptimizedImage'
import { LineageMotetOrnament } from './LineageMotetOrnament'
import { LINEAGE_CURVE_PATH } from './lineageMotetModel'
import { useSampleLanguage } from '../../features/sample-language/useSampleLanguage'
import { routeLanguageHref } from '../../features/sample-language/sampleLanguageModel'

import '../../styles/spirit-heritage.css'

type SpiritHeritageExperienceProps = {
  cta: SpiritCopy
  hero: SpiritCopy
  heroImageUrl?: string | null
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

const HERO_FALLBACK_IMAGE = '/images/spirit/tour-2025/choir-performance.webp'
const HERITAGE_IMAGE = '/images/spirit/tour-2025/choir-rehearsal.webp'
const COMMUNITY_IMAGE = '/images/spirit/tour-2025/singing-together.webp'
const EASE_OUT = [0.22, 1, 0.36, 1] as const

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

        const target = document.getElementById(resolveSpiritSectionId(targetId))
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
  const { copy: editorCopy } = useSiteEditor()
  const reducedMotion = usePrefersReducedMotion()
  const yearId = year === '현재' ? 'spirit.lineage.now' : year === '미래' ? 'spirit.lineage.next' : undefined
  const reveal = useTransform(progress, (value) =>
    getMilestoneRevealProgress(value, index, total),
  )
  const opacity = useTransform(reveal, [0, 0.16, 1], [0, 1, 1])
  const rowY = useTransform(reveal, [0, 1], [22, 0])
  const yearX = useTransform(
    reveal,
    [0, 1],
    [yearId || index % 2 === 0 ? 62 : -62, 0],
  )
  const yearScale = useTransform(reveal, [0, 1], [index === 2 ? 0.86 : 0.9, 1])
  const dotScale = useTransform(
    reveal,
    [0, 0.42, 0.68, 1],
    [0.34, 1.26, 1, 1],
  )
  const renderedYear = year === '현재' ? editorCopy('spirit', 'spirit.lineage.now', 'NOW')
    : year === '미래' ? editorCopy('spirit', 'spirit.lineage.next', 'NEXT') : year
  const dot = <motion.span
    aria-hidden="true"
    className="spirit-heritage__milestone-dot"
    style={reducedMotion ? undefined : { scale: dotScale }}
  />

  return (
    <motion.article
      className="spirit-heritage__milestone"
      data-active={index === 2 ? 'true' : undefined}
      style={reducedMotion ? undefined : { opacity }}
    >
      {yearId ? null : dot}
      <EditableLayout id={yearId ?? ''} nativeTag="p">
        <motion.p
          className="spirit-heritage__milestone-year"
          style={reducedMotion || yearId ? undefined : { scale: yearScale, x: yearX }}
        >
          {yearId ? <EditableLayout id={`${yearId}.dot`} nativeTag="span">{dot}</EditableLayout> : null}
          {yearId ? (
            <motion.span
              className="spirit-heritage__milestone-label"
              style={reducedMotion ? undefined : { scale: yearScale, x: yearX }}
            >
              <FormattedCopy page="spirit" id={yearId} text={renderedYear} layoutTarget={false}>{renderedYear}</FormattedCopy>
            </motion.span>
          ) : renderedYear}
        </motion.p>
      </EditableLayout>
      <motion.div
        className="spirit-heritage__milestone-copy"
        style={reducedMotion ? undefined : { y: rowY }}
      >
        <h3><FormattedCopy page="spirit" id={`spirit.lineage.${index}.title`} text={title}>{title}</FormattedCopy></h3>
        <p><FormattedCopy page="spirit" id={`spirit.lineage.${index}.body`} text={body}>{body}</FormattedCopy></p>
      </motion.div>
    </motion.article>
  )
}

function SpiritHero({ copy }: { copy: SpiritCopy }) {
  const { copy: copyText } = useSiteEditor()
  const { copy: editorCopy } = useSiteEditor()
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
          alt={editorCopy("spirit", "spirit.spiritHero.alt1", "2025 유스비전투어에서 지휘에 맞춰 악보를 보며 함께 노래하는 합창단")}
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
        <div className="spirit-heritage__eyebrow spirit-heritage__eyebrow--hero">{<FormattedCopy page="spirit" id="spirit.fixed.SpiritHeritageExperience.12198036a1" text={copyText("spirit", "spirit.fixed.SpiritHeritageExperience.12198036a1", "SEOUL MOTET YOUTH CHOIR · ")}>{copyText("spirit", "spirit.fixed.SpiritHeritageExperience.12198036a1", "SEOUL MOTET YOUTH CHOIR · ")}</FormattedCopy>}<SiteCopy page="spirit" id="spirit.spiritHero.english1" fallback={"SPIRIT"} /></div>
        <EditableLayout id="spirit.intro.title" nativeTag="h1"><motion.h1
          className="spirit-heritage__display-title"
          data-node-id="45:2"
          id="spirit-heritage-title"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.955, x: -150 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.92, ease: EASE_OUT }}
        ><SiteCopy page="spirit" id="spirit.spiritHero.english2" fallback={"SPIRIT"} /></motion.h1></EditableLayout>

        <div className="spirit-heritage__hero-heading spirit-heritage__hero-heading--desktop">
          <motion.p
            data-node-id="6:2"
            initial={reducedMotion ? false : { opacity: 0, y: 42 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.74, ease: EASE_OUT }}
          ><SiteCopy page="spirit" id="spirit.spiritHero.text2" fallback={"정신은 선언이 아니라"} /></motion.p>
          <motion.p
            className="spirit-heritage__hero-promise"
            data-node-id="6:3"
            initial={reducedMotion ? false : { opacity: 0, y: 52 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.8, ease: EASE_OUT }}
          >
            <strong><SiteCopy page="spirit" id="spirit.spiritHero.text3" fallback={"이어 온"} /></strong>
            <span>
              <em><SiteCopy page="spirit" id="spirit.spiritHero.text4" fallback={"선택"} /></em><SiteCopy page="spirit" id="spirit.spiritHero.text5" fallback={"입니다."} /></span>
          </motion.p>
        </div>

        <div className="spirit-heritage__hero-heading spirit-heritage__hero-heading--mobile">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.68, ease: EASE_OUT }}
          ><SiteCopy page="spirit" id="spirit.spiritHero.text6" fallback={"마음을 담은"} /><br /><SiteCopy page="spirit" id="spirit.spiritHero.text7" fallback={"음악으로"} /></motion.p>
          <motion.p
            className="spirit-heritage__hero-promise"
            initial={reducedMotion ? false : { opacity: 0, y: 32 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.72, ease: EASE_OUT }}
          >
            <span className="spirit-heritage__hero-promise-line"><SiteCopy page="spirit" id="spirit.spiritHero.text8" fallback={"다음 "} /><em><SiteCopy page="spirit" id="spirit.spiritHero.text9" fallback={"세대"} /></em><SiteCopy page="spirit" id="spirit.spiritHero.text10" fallback={"를"} /></span>
            <span className="spirit-heritage__hero-promise-line spirit-heritage__hero-promise-line--indented"><SiteCopy page="spirit" id="spirit.spiritHero.text11" fallback={"세웁니다."} /></span>
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

        <EditableLayout id="spirit.intro.description" nativeTag="p"><motion.p
          className="spirit-heritage__hero-body"
          data-node-id="2:23"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: EASE_OUT }}
        >
          <SiteCopy page="spirit" id="spirit.content.hero.body" fallback={copy.body} />
        </motion.p></EditableLayout>

        <motion.div
          className="spirit-heritage__origin-card spirit-heritage__open-frame"
          data-node-id="2:24"
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 1.06, duration: 0.58, ease: EASE_OUT }}
        >
          <strong>1989</strong>
          <p><SiteCopy page="spirit" id="spirit.spiritHero.text12" fallback={"정직한 음악에서 시작해"} /><br /><SiteCopy page="spirit" id="spirit.spiritHero.text13" fallback={"다음 세대의 성장으로 이어집니다."} /></p>
        </motion.div>
      </div>
    </section>
  )
}

function HeritageTimeline() {
  const { copy: editorCopy, device } = useSiteEditor()
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
          <p className="spirit-heritage__eyebrow"><SiteCopy page="spirit" id="spirit.heritageTimeline.english1" fallback={"OUR LINEAGE"} /></p>
          <Reveal className="spirit-heritage__lineage-title" y={34}>
            <p><SiteCopy page="spirit" id="spirit.heritageTimeline.text1" fallback={"시간은 흘렀지만"} /></p>
            <h2><SiteCopy page="spirit" id="spirit.heritageTimeline.text2" fallback={"정신은"} /><span><SiteCopy page="spirit" id="spirit.heritageTimeline.text3" fallback={"이어졌습니다."} /></span>
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
          <p className="spirit-heritage__lineage-lead"><SiteCopy page="spirit" id="spirit.heritageTimeline.text4" fallback={"한 세대의 음악적 헌신이 재단과 청소년 교육으로 이어지고, 오늘의 공동체가 되었습니다."} /></p>
          <Reveal className="spirit-heritage__heritage-photo" scale={1.035} x={-46} y={0}>
            <OptimizedImage
              alt={editorCopy("spirit", "spirit.heritageTimeline.alt5", "2025 유스비전투어에서 나란히 앉아 악보를 보며 소리를 맞추는 단원들")}
              fallbackVariant="gallery"
              imageClassName="spirit-heritage__media-image"
              sizes="(max-width: 899px) calc(100vw - 48px), 36vw"
              src={HERITAGE_IMAGE}
            >
              <span className="spirit-heritage__image-label"><SiteCopy page="spirit" id="spirit.heritageTimeline.text6" fallback={"연습에서 삶으로 이어지는 합창교육"} /></span>
            </OptimizedImage>
          </Reveal>
        </div>

        <div className="spirit-heritage__lineage-track">
          {device === 'desktop' ? (
            <LineageMotetOrnament progress={pathProgress} reducedMotion={reducedMotion} />
          ) : (
            <svg
              aria-hidden="true"
              className="spirit-heritage__timeline-curve"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 129.825 1040.96"
            >
              <path d={LINEAGE_CURVE_PATH} stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
              <motion.path
                d={LINEAGE_CURVE_PATH}
                data-node-id="2:35"
                pathLength={1}
                stroke="var(--spirit-orange)"
                strokeLinecap="round"
                strokeWidth="3"
                style={reducedMotion ? { pathLength: 1 } : { pathLength: pathProgress }}
              />
            </svg>
          )}
          <div className="spirit-heritage__milestones">
            {legacyFlowSteps.map((item, index) => (
              <LineageMilestone
                body={editorCopy('spirit', `spirit.lineage.${index}.body`, item.body)}
                index={index}
                key={item.year}
                progress={pathProgress}
                title={editorCopy('spirit', `spirit.lineage.${index}.title`, item.title)}
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

function CommunitySection() {
  const { copy: editorCopy } = useSiteEditor()
  return (
    <section className="spirit-heritage__community" id="spirit-community" tabIndex={-1}>
      <Reveal className="spirit-heritage__community-watermark" x={64} y={0}><SiteCopy page="spirit" id="spirit.communitySection.english1" fallback={"LISTEN"} /></Reveal>
      <div className="spirit-heritage__section-shell">
        <div className="spirit-heritage__community-heading">
          <Reveal y={24}>
            <h2>
              <span className="spirit-heritage__community-line"><SiteCopy page="spirit" id="spirit.communitySection.text1" fallback={"서로 "} /><em><SiteCopy page="spirit" id="spirit.communitySection.text2" fallback={"다른"} /></em><SiteCopy page="spirit" id="spirit.communitySection.text3" fallback={" 목소리가"} /></span>
              <span className="spirit-heritage__community-line spirit-heritage__community-line--middle">
                <strong><SiteCopy page="spirit" id="spirit.communitySection.text4" fallback={"하나의"} /></strong>
              </span>
              <span className="spirit-heritage__community-line spirit-heritage__community-line--last"><SiteCopy page="spirit" id="spirit.communitySection.text5" fallback={"공동체가 됩니다."} /></span>
            </h2>
          </Reveal>
          <p><SiteCopy page="spirit" id="spirit.community.lead" fallback={voiceConstellationCopy.lead} lineBreaks={false} /></p>
        </div>
        <Reveal className="spirit-heritage__community-photo" scale={1.032} x={-54} y={0}>
          <OptimizedImage
            alt={editorCopy("spirit", "spirit.communitySection.alt6", "2025 유스비전투어에서 야외에 모여 함께 노래하는 단원들")}
            fallbackVariant="gallery"
            height={1467}
            imageClassName="spirit-heritage__media-image"
            sizes="(max-width: 899px) calc(100vw - 48px), 90vw"
            src={COMMUNITY_IMAGE}
            width={2200}
          >
            <span className="spirit-heritage__image-label"><SiteCopy page="spirit" id="spirit.community.centerLabel" fallback={voiceConstellationCopy.centerLabel} lineBreaks={false} /></span>
          </OptimizedImage>
        </Reveal>
        <div className="spirit-heritage__voices">
          {voiceConstellationCopy.voices.map((voice, index) => (
            <Reveal className="spirit-heritage__voice" delay={index * 0.05} key={voice.part} y={18}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <h3><SiteCopy page="spirit" id={`spirit.voices.${index}.part`} fallback={voice.part} lineBreaks={false} /></h3>
              <p><SiteCopy page="spirit" id={`spirit.voices.${index}.meaning`} fallback={voice.meaning} lineBreaks={false} /></p>
            </Reveal>
          ))}
        </div>
        <Reveal className="spirit-heritage__community-closing" y={24}>
          <SiteCopy page="spirit" id="spirit.community.closing" fallback={voiceConstellationCopy.closing.replace(' 서로를', '\n서로를')} lineBreaks={false} />
        </Reveal>
      </div>
    </section>
  )
}

function ClosingCta({ copy }: { copy: SpiritCopy }) {
  const { copy: editorCopy } = useSiteEditor()
  const { language, translate } = useSampleLanguage()
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
        <SiteImage
          alt=""
          aria-hidden="true"
          className="spirit-heritage__closing-logo"
          src="/images/brand/smyc-symbol-vector.svg"
        />
        <div className="spirit-heritage__closing-copy">
          <p className="spirit-heritage__eyebrow">{copy.eyebrow || editorCopy('spirit', 'spirit.action.eyebrowFallback', 'JOIN THE HARMONY')}</p>
          <h2 aria-label={translate(copy.title)}><SiteCopy page="spirit" id="spirit.closingCta.text1" fallback={"함께 부르는"} /><span><SiteCopy page="spirit" id="spirit.closingCta.text2" fallback={"다음 세대의"} /></span>
            <span><SiteCopy page="spirit" id="spirit.closingCta.text3" fallback={"울림에"} /></span>
            <strong><SiteCopy page="spirit" id="spirit.closingCta.text4" fallback={"동참하세요."} /></strong>
          </h2>
          <p><SiteCopy page="spirit" id="spirit.content.cta.body" fallback={copy.body} /></p>
          <div className="spirit-heritage__closing-actions">
            <Link className="spirit-heritage__button spirit-heritage__button--primary" to={routeLanguageHref(copy.ctaUrl || '/join', language)}>
              {translate(copy.ctaLabel || editorCopy('spirit', 'spirit.action.joinFallback', '입단 안내'))}
            </Link>
            <Link
              className="spirit-heritage__button spirit-heritage__button--secondary"
              to={routeLanguageHref(copy.secondaryCtaUrl || '/contact?section=support', language)}
            >
              <SiteCopy page="spirit" id="spirit.content.cta.supportLabel" fallback={copy.secondaryCtaLabel || editorCopy('spirit', 'spirit.action.supportFallback', '후원 참여')} />
            </Link>
          </div>
        </div>
        <Reveal className="spirit-heritage__one-voice" scale={0.94} x={84} y={0}>
          <span><SiteCopy page="spirit" id="spirit.closingCta.english1" fallback={"ONE"} /></span>
          <span><SiteCopy page="spirit" id="spirit.closingCta.english2" fallback={"VOICE"} /></span>
        </Reveal>
      </Reveal>
    </section>
  )
}

export function SpiritHeritageExperience({
  cta,
  hero,
}: SpiritHeritageExperienceProps) {
  useSpiritAnchorNavigation()
  const { device } = useSiteEditor()

  return (
    <MotionConfig reducedMotion="user">
      <div className="spirit-heritage" data-spirit-device={device}>
        <SpiritHero copy={hero} />
        <HeritageTimeline />
        <CommunitySection />
        <ClosingCta copy={cta} />
      </div>
    </MotionConfig>
  )
}
