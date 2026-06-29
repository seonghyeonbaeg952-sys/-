import { Link } from 'react-router'

import {
  defaultMotetMeaning,
  educationJourneySteps,
  legacyFlowSteps,
  songOfMemoryCopy,
  spiritManifestoCopy,
  voiceConstellationCopy,
} from '../../constants/spiritContent'
import type { SpiritCopy, SpiritValue } from '../../constants/spiritContent'
import { classNames } from '../../utils/classNames'
import { Container } from '../common/Container'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'

type SpiritHeroVariant = 'compact' | 'home' | 'page'

type SpiritHeroProps = {
  backgroundImageUrl?: string | null
  copy: SpiritCopy
  variant?: SpiritHeroVariant
}

type MottoBadgesProps = {
  className?: string
  mode?: 'floating' | 'mobile'
}

const heroVariantClasses: Record<SpiritHeroVariant, string> = {
  compact: 'py-14 sm:py-16 lg:py-20',
  home: 'py-20 sm:py-24 lg:min-h-[calc(100svh-80px)] lg:py-28',
  page: 'py-16 sm:py-20 lg:py-24',
}

const floatingMottoBadges = ['정직한 음악', '다음세대의 울림']
const mobileMottoBadges = ['정직한 음악', '함께 듣는 공동체', '지성 · 인성 · 영성']

const voiceNodePositions = [
  { cx: 180, cy: 110 },
  { cx: 300, cy: 250 },
  { cx: 450, cy: 140 },
  { cx: 560, cy: 295 },
  { cx: 360, cy: 70 },
]

const voiceNodes = voiceConstellationCopy.voices.map((voice, index) => ({
  ...voiceNodePositions[index],
  key: voice.part,
  label: voice.part,
  text: voice.meaning,
}))

const voiceCenter = { cx: 360, cy: 210 }
const manifestoStatementTitles = [
  '정직하게 듣는 음악',
  '함께 책임지는 공동체',
  '사람을 세우는 교육',
] as const

function getTextParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {getTextParagraphs(text).map((paragraph) => (
          <p className="whitespace-pre-line break-keep" key={paragraph}>
            {paragraph}
          </p>
        ))}
    </>
  )
}

function MottoBadges({ className, mode = 'floating' }: MottoBadgesProps) {
  const badges = mode === 'floating' ? floatingMottoBadges : mobileMottoBadges

  return (
    <div
      aria-label="합창단 핵심 문구"
      className={classNames(
        mode === 'mobile' ? 'motto-badges-mobile' : 'motto-badges-floating',
        className,
      )}
    >
      {badges.map((badge, index) => (
        <span
          className={classNames('motto-badge', mode === 'floating' && `motto-badge-${index + 1}`)}
          key={badge}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

function SpiritValueIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <span aria-hidden="true" className="value-icon">
        <svg viewBox="0 0 56 56">
          <path d="M18 8v21c0 7.2 4.7 12 10 12s10-4.8 10-12V8" />
          <path d="M18 19h20" />
          <path d="M28 41v8" />
          <path d="M39 18c6 0 8 3 8 7v15" />
          <path d="M47 40c-3-1.7-8-1-9.2 2.1-1.3 3.4 2 6.3 5.6 5.2 2.8-.9 3.6-3.4 3.6-7.3z" />
        </svg>
      </span>
    )
  }

  if (index === 1) {
    return (
      <span aria-hidden="true" className="value-icon">
        <svg viewBox="0 0 56 56">
          <path d="M12 48V28c0-9.4 7.1-17 16-17s16 7.6 16 17v20" />
          <path d="M20 48V29c0-4.8 3.5-8.6 8-8.6s8 3.8 8 8.6v19" />
          <path d="M28 11v37" />
          <path d="M15 31h26" />
          <path d="M18 40h20" />
        </svg>
      </span>
    )
  }

  if (index === 2) {
    return (
      <span aria-hidden="true" className="value-icon">
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="5.5" />
          <circle cx="14" cy="18" r="6" />
          <circle cx="42" cy="18" r="6" />
          <circle cx="17" cy="41" r="6" />
          <circle cx="39" cy="41" r="6" />
          <path d="M19 20.8 23.5 25" />
          <path d="M37 20.8 32.5 25" />
          <path d="M21.8 38 25 32.8" />
          <path d="M34.2 38 31 32.8" />
        </svg>
      </span>
    )
  }

  return (
    <span aria-hidden="true" className="value-icon">
      <svg viewBox="0 0 56 56">
        <path d="M10 42c10-1.8 18.5-8.2 25-19" />
        <path d="m34 23 1.6 8.7 8.4-2.8" />
        <path d="M36 11v24" />
        <path d="M36 11h10v7H36" />
        <path d="M18 45c-3.4-1.6-6.8-.2-7.6 2.3-.8 2.7 1.8 5 5.1 4.1 2.2-.6 2.9-2.4 2.9-6.4z" />
        <path d="m46 9 1.1 2.7 2.9.2-2.2 1.9.7 2.8-2.5-1.5-2.5 1.5.7-2.8-2.2-1.9 2.9-.2z" />
      </svg>
    </span>
  )
}

function VoiceConstellationSvg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 720 420">
      <circle className="voice-wave" cx={voiceCenter.cx} cy={voiceCenter.cy} r="92" />
      <circle className="voice-wave" cx={voiceCenter.cx} cy={voiceCenter.cy} r="152" />
      <circle className="voice-wave" cx={voiceCenter.cx} cy={voiceCenter.cy} r="218" />
      {voiceNodes.map((node) => (
        <line
          className="voice-line"
          key={`${node.key}-line`}
          x1={node.cx}
          x2={voiceCenter.cx}
          y1={node.cy}
          y2={voiceCenter.cy}
        />
      ))}
      {voiceNodes.map((node) => (
        <g key={node.key}>
          <circle className="voice-node" cx={node.cx} cy={node.cy} r="22" />
          <circle className="voice-node-dot" cx={node.cx} cy={node.cy} r="5" />
        </g>
      ))}
      <circle className="voice-center" cx={voiceCenter.cx} cy={voiceCenter.cy} r="34" />
      <path className="voice-center-mark" d="M343 211c10-18 25-18 35 0 8 14 23 12 31-1" />
    </svg>
  )
}

export function SpiritHero({
  backgroundImageUrl,
  copy,
  variant = 'page',
}: SpiritHeroProps) {
  const isCompact = variant === 'compact'
  const isPage = variant === 'page'

  return (
    <section
      className={classNames(
        'motet-stage-hero relative isolate overflow-hidden bg-navy-midnight text-bg-warm-white',
        heroVariantClasses[variant],
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(201,164,92,0.22),transparent_30rem),linear-gradient(135deg,#071526_0%,#10233f_58%,#071526_100%)]"
      />
      <div aria-hidden="true" className="spotlight-glow" />
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-hero" />
      <StaffLines
        aria-hidden="true"
        className="absolute left-1/2 top-16 hidden w-[46rem] -translate-x-1/2 opacity-35 lg:flex"
        density="light"
        variant="inverted"
      />
      <Container className="relative z-10">
        <div
          className={classNames(
            'grid items-center gap-10',
            isCompact
              ? 'lg:grid-cols-[1fr_0.75fr]'
              : isPage
                ? 'lg:grid-cols-[1fr_0.78fr] lg:gap-14 xl:gap-16'
                : 'lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 xl:gap-20',
          )}
        >
          <div className="max-w-3xl">
            <StaffSectionLabel className="max-w-md" variant="inverted">
              {copy.eyebrow}
            </StaffSectionLabel>
            <h1 className="mt-5 whitespace-pre-line break-keep text-[clamp(2.5rem,8vw,5.25rem)] font-bold leading-[1.04] tracking-[-0.045em]">
              {copy.title}
            </h1>
            {copy.subtitle ? (
              <p className="mt-6 max-w-2xl break-keep text-xl font-semibold leading-8 text-gold-soft">
                {copy.subtitle}
              </p>
            ) : null}
            <div className="mt-6 max-w-2xl space-y-4 text-base leading-[1.82] text-bg-ivory/82 sm:text-lg">
              <Paragraphs text={copy.body} />
            </div>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-pill bg-gold-warm px-6 text-base font-bold text-navy-midnight shadow-[0_14px_32px_rgb(201_164_92/0.24)] transition hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                to={copy.ctaUrl || '/spirit'}
              >
                {copy.ctaLabel || '합창단 정신 보기'}
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-pill border border-bg-warm-white/65 px-6 text-base font-bold text-bg-warm-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                to={copy.secondaryCtaUrl || '/join'}
              >
                {copy.secondaryCtaLabel || '입단 안내'}
              </Link>
            </div>
          </div>

          <div
            className={classNames(
              'hero-visual-frame relative mx-auto w-full max-w-[36rem] overflow-hidden rounded-[24px] border border-bg-warm-white/14 bg-bg-warm-white/[0.04] p-2 shadow-[0_28px_100px_rgb(0_0_0/0.34)] sm:rounded-[28px] sm:p-3',
              isCompact
                ? 'aspect-[16/10] lg:aspect-[4/5]'
                : isPage
                  ? 'max-w-[32rem] aspect-[16/10] lg:aspect-[16/11]'
                  : 'aspect-[16/11] lg:aspect-[4/5]',
            )}
          >
            {backgroundImageUrl ? (
              <img
                alt="서울모테트청소년합창단 대표 이미지"
                className="h-full w-full rounded-[18px] object-contain object-center sm:rounded-[20px]"
                loading={variant === 'page' ? 'eager' : 'lazy'}
                src={backgroundImageUrl}
              />
            ) : (
              <div className="flex h-full rounded-[20px] bg-[radial-gradient(circle_at_34%_26%,rgba(231,213,163,0.22),transparent_18rem),linear-gradient(145deg,rgba(255,253,248,0.08),rgba(255,253,248,0.02))]">
                <StaffLines className="m-auto w-4/5 opacity-75" variant="inverted" />
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 rounded-[20px] bg-linear-to-t from-navy-midnight/18 via-transparent to-transparent"
            />
            <MottoBadges className="hidden lg:block" />
          </div>
          <MottoBadges className="lg:hidden" mode="mobile" />
        </div>
      </Container>
    </section>
  )
}

export function SpiritManifesto({
  compact = false,
  text,
}: {
  compact?: boolean
  text: string
}) {
  const paragraphs = getTextParagraphs(text)
  const statementCards = manifestoStatementTitles.map((title, index) => ({
    body: paragraphs[index] || paragraphs[0] || '',
    title,
  }))
  const remainingParagraphs = paragraphs.slice(manifestoStatementTitles.length)

  return (
    <section className={classNames('relative overflow-hidden', compact ? 'py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-manifesto" />
      <Container className="relative z-10">
        <div className="spirit-manifesto-layout">
          <div>
            <StaffSectionLabel className="max-w-sm">
              {spiritManifestoCopy.eyebrow}
            </StaffSectionLabel>
            <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.12] text-navy-deep">
              {spiritManifestoCopy.title}
            </h2>
          </div>
          <div>
            <div className="spirit-manifesto-cards">
              {statementCards.map((statement, index) => (
                <article className="spirit-manifesto-card" key={statement.title}>
                  <p className="text-sm font-black text-gold-warm">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 break-keep text-xl font-bold leading-tight text-navy-deep">
                    {statement.title}
                  </h3>
                  <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
                    {statement.body}
                  </p>
                </article>
              ))}
            </div>
            {remainingParagraphs.length > 0 ? (
              <div className="spirit-manifesto-note">
                {remainingParagraphs.map((paragraph) => (
                  <p className="break-keep" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}

export function MotetMeaningSection({
  copy = defaultMotetMeaning,
}: {
  copy?: SpiritCopy
}) {
  return (
    <section className="relative overflow-hidden bg-navy-midnight py-14 text-bg-warm-white sm:py-16 lg:py-20">
      <div aria-hidden="true" className="spotlight-glow spotlight-glow-left" />
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-hero opacity-35" />
      <Container className="relative z-10">
        <div className="motet-meaning-grid">
          <div>
            <p className="motet-meaning-wordmark">
              Motet
            </p>
            <StaffSectionLabel className="mt-4 max-w-sm" variant="inverted">
              {copy.eyebrow}
            </StaffSectionLabel>
          </div>
          <div className="motet-meaning-card relative rounded-formal border border-bg-warm-white/12 bg-bg-warm-white/[0.045] p-6 shadow-premium sm:p-7 lg:p-8">
            <div
              aria-hidden="true"
              className="absolute -left-3 top-8 hidden h-24 w-px bg-linear-to-b from-transparent via-gold-warm to-transparent lg:block"
            />
            <h2 className="motet-meaning-title whitespace-pre-line break-keep">
              {copy.title}
            </h2>
            <p className="mt-6 whitespace-pre-line break-keep text-base leading-8 text-bg-ivory/78 sm:text-lg">
              {copy.body}
            </p>
            {copy.quote ? (
              <blockquote className="mt-7 rounded-balanced border border-gold-soft/24 bg-gold-soft/10 px-5 py-4 break-keep text-sm font-semibold leading-7 text-gold-soft sm:text-base">
                {copy.quote}
              </blockquote>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}

export function SongOfMemorySection() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-manifesto" />
      <Container className="relative z-10">
        <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:gap-14">
          <div>
            <StaffSectionLabel className="max-w-sm">
              {songOfMemoryCopy.eyebrow}
            </StaffSectionLabel>
            <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.12] text-navy-deep">
              {songOfMemoryCopy.title}
            </h2>
            <p className="mt-5 break-keep text-lg font-semibold leading-8 text-navy-deep">
              {songOfMemoryCopy.lead}
            </p>
          </div>
          <div>
            <div className="space-y-4 break-keep text-base leading-[1.82] text-text-muted">
              {songOfMemoryCopy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {songOfMemoryCopy.scriptureCards.map((card) => (
                <article
                  className="rounded-formal border border-gold-warm/28 bg-bg-ivory p-5 shadow-card"
                  key={card.label}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-warm">
                    {card.label}
                  </p>
                  <p className="mt-3 break-keep text-base font-semibold leading-7 text-navy-deep">
                    {card.text}
                  </p>
                  <p className="mt-3 break-keep text-sm leading-6 text-text-muted">
                    {card.note}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function SpiritValueCardsSection({
  compact = false,
  values,
}: {
  compact?: boolean
  values: SpiritValue[]
}) {
  return (
    <section className={classNames('bg-bg-ivory', compact ? 'py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <StaffSectionLabel className="max-w-sm">VALUES</StaffSectionLabel>
            <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.12] text-navy-deep">
              합창단 정신의 네 가지 축
            </h2>
          </div>
        </div>
        <div className="spirit-values-grid">
          {values.map((value, index) => (
            <article
              className="spirit-value-card paper-surface"
              data-number={value.number || String(index + 1).padStart(2, '0')}
              key={value.title}
            >
              <SpiritValueIcon index={index} />
              <h3 className="mt-5 break-keep text-xl font-bold leading-tight text-navy-deep">
                {value.title}
              </h3>
              {value.summary ? (
                <p className="mt-4 break-keep text-sm font-semibold leading-6 text-navy-deep">
                  {value.summary}
                </p>
              ) : null}
              <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function VoiceConstellation({ compact = false }: { compact?: boolean }) {
  return (
    <section className={classNames(compact ? 'py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <Container>
        <div aria-hidden="true" className="score-ribbon mb-5" />
        <div className="spirit-constellation-card paper-surface">
          <div className="voice-constellation-layout">
            <div>
              <StaffSectionLabel className="max-w-sm">
                {voiceConstellationCopy.eyebrow}
              </StaffSectionLabel>
              <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-navy-deep">
                {voiceConstellationCopy.title}
              </h2>
              <p className="mt-5 break-keep text-base leading-8 text-text-muted">
                {voiceConstellationCopy.lead}
              </p>
            </div>
            <div>
              <div className="voice-constellation-visual">
                <VoiceConstellationSvg />
              </div>
              <ul className="voice-constellation-list">
                {voiceNodes.map((part) => (
                  <li className="voice-constellation-list-item" key={part.key}>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-warm">
                      {part.label}
                    </span>
                    <span className="break-keep text-sm font-semibold text-navy-deep">
                      {part.text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 break-keep text-sm font-semibold leading-7 text-navy-deep">
                {voiceConstellationCopy.closing}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function LegacyFlow({ compact = false }: { compact?: boolean }) {
  return (
    <section className={classNames('relative overflow-hidden bg-navy-midnight text-bg-warm-white', compact ? 'py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <div aria-hidden="true" className="spotlight-glow spotlight-glow-left" />
      <Container>
        <StaffSectionLabel className="max-w-sm" variant="inverted">
          LEGACY
        </StaffSectionLabel>
        <h2 className="mt-4 max-w-3xl break-keep text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight">
          모테트의 전통은 청소년 교육으로 이어집니다
        </h2>
        <div className="legacy-flow-grid mt-9">
          {legacyFlowSteps.map((item) => (
            <article
              className="legacy-card paper-surface"
              key={item.title}
            >
              <p className="legacy-year">{item.year}</p>
              <h3 className="mt-4 break-keep text-lg font-bold">{item.title}</h3>
              <p className="mt-3 break-keep text-sm leading-7 text-text-muted">{item.body}</p>
            </article>
          ))}
        </div>
        <div aria-hidden="true" className="score-ribbon mt-10" />
      </Container>
    </section>
  )
}

export function EducationJourney({ compact = false }: { compact?: boolean }) {
  return (
    <section className={classNames(compact ? 'py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16">
          <div>
            <StaffSectionLabel className="max-w-sm">EDUCATION</StaffSectionLabel>
            <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-navy-deep">
              합창으로 배우는 성장의 순서
            </h2>
          </div>
          <ol className="education-journey-grid">
            {educationJourneySteps.map((step, index) => (
              <li className="education-step paper-surface" key={step.step}>
                <p className="education-step-index">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-3 text-sm font-bold text-gold-warm">{step.step}</p>
                <h3 className="mt-2 break-keep text-xl font-bold text-navy-deep">{step.title}</h3>
                <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

export function ImpactStatsBand({ compact = false }: { compact?: boolean }) {
  const stats = [
    ['4', '핵심 가치'],
    ['1', '하나의 울림'],
    ['∞', '이어지는 성장'],
  ]

  return (
    <section className={classNames('bg-bg-ivory', compact ? 'py-12 lg:py-14' : 'py-12 lg:py-16')}>
      <Container>
        <div className="grid gap-4 rounded-[30px] border border-gold-warm/22 bg-bg-warm-white p-5 shadow-card sm:grid-cols-3 sm:p-7">
          {stats.map(([value, label]) => (
            <div className="rounded-[20px] bg-bg-ivory p-5 text-center" key={label}>
              <p className="text-4xl font-bold leading-none text-gold-warm">{value}</p>
              <p className="mt-3 text-sm font-semibold text-navy-deep">{label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function SpiritCTA({ copy }: { copy: SpiritCopy }) {
  return (
    <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-support" />
      <Container>
        <div className="spirit-final-cta rounded-[30px] border border-navy-deep/10 bg-navy-deep text-bg-warm-white shadow-[0_28px_100px_rgb(0_0_0/0.24)] lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <StaffSectionLabel className="max-w-sm" variant="inverted">
              {copy.eyebrow}
            </StaffSectionLabel>
            <h2 className="mt-4 break-keep text-[clamp(2rem,4vw,3rem)] font-bold leading-tight">
              {copy.title}
            </h2>
            <p className="mt-5 whitespace-pre-line break-keep text-base leading-8 text-bg-ivory/78">
              {copy.body}
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:flex lg:mt-0">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-pill bg-gold-warm px-6 font-bold text-navy-midnight transition hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
              to={copy.ctaUrl || '/join'}
            >
              {copy.ctaLabel || '입단 안내'}
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-pill border border-bg-warm-white/58 px-6 font-bold text-bg-warm-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
              to={copy.secondaryCtaUrl || '/contact?section=support'}
            >
              {copy.secondaryCtaLabel || '후원 참여'}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
