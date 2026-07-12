import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Badge } from '../../components/common/Badge'
import { BrandLogo } from '../../components/common/BrandLogo'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { MapPreview } from '../../components/common/MapPreview'
import { PageHero } from '../../components/common/PageHero'
import { SeoHead } from '../../components/common/SeoHead'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { StaffLines } from '../../components/common/StaffLines'
import { StaffSectionLabel } from '../../components/common/StaffSectionLabel'
import {
  HarmonyBreathEffect,
  MotetMeaningCard,
  SpiritRibbon,
  SpiritStatementBlock,
  SpiritValueCards,
} from '../../components/common/Spirit'
import { VisualArchivePanel } from '../../components/common/VisualArchivePanel'
import { ImageTile } from '../../components/home/ImageTile'
import { ConductorProfileDocument } from '../../components/about/ConductorProfileDocument'
import {
  legacyAboutSections,
  legacyChoirIntro,
  legacyHistorySeed,
  legacyLocationSeed,
} from '../../constants/legacyContent'
import {
  accompanistRoleCopy,
  defaultEducationCopy,
  defaultMotetMeaning,
  defaultPeaceCopy,
  defaultSpiritCta,
  defaultSpiritHero,
  getAboutSectionCopy,
  spiritManifestoCopy,
  spiritTimeline,
  spiritValues,
} from '../../constants/spiritContent'
import { useAboutData } from '../../hooks/usePublicData'
import type {
  AboutSectionRow,
  HistoryRow,
  MemberRow,
  PersonProfileRow,
} from '../../types/cms'
import { classNames } from '../../utils/classNames'
import {
  getMemberGroupLabel,
  getMemberPartLabel,
  getMemberStatus,
  getProtectedMemberName,
} from '../../utils/memberName'

type MemberFilterValue = MemberRow['part'] | 'all' | 'staff' | 'alumni'

const partFilters: Array<{ label: string; value: MemberFilterValue }> = [
  { label: '전체', value: 'all' },
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
  { label: '스태프', value: 'staff' },
  { label: '역대단원', value: 'alumni' },
]

type AboutSectionKey =
  | 'all'
  | 'overview'
  | 'spirit'
  | 'conductor'
  | 'accompanist'
  | 'members'
  | 'history'

const sectionTabs: Array<{
  href: string
  label: string
  value: AboutSectionKey
}> = [
  { href: '/about', label: '전체', value: 'all' },
  { href: '/about?section=overview', label: '합창단 소개', value: 'overview' },
  { href: '/about?section=spirit', label: '정신과 교육철학', value: 'spirit' },
  { href: '/about?section=conductor', label: '지휘자 소개', value: 'conductor' },
  { href: '/about?section=accompanist', label: '반주자 소개', value: 'accompanist' },
  { href: '/about?section=members', label: '단원 소개', value: 'members' },
  { href: '/about?section=history', label: '연혁', value: 'history' },
]

const aboutSectionValues = new Set<AboutSectionKey>(
  sectionTabs.map((section) => section.value),
)

function getActiveAboutSection(value: string | null): AboutSectionKey {
  if (!value) {
    return 'all'
  }

  return aboutSectionValues.has(value as AboutSectionKey)
    ? (value as AboutSectionKey)
    : 'overview'
}

function AboutSectionSelector({ activeSection }: { activeSection: AboutSectionKey }) {
  return (
    <Reveal>
      <div
        className="section-tabs-wrap relative overflow-hidden rounded-formal border border-line-default bg-bg-warm-white p-3 shadow-card"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
        <AnimatedSectionTabs
          activeValue={activeSection}
          ariaLabel="소개 섹션 선택"
          tabs={sectionTabs}
          tone="navy"
        />
      </div>
    </Reveal>
  )
}

function PersonCard({
  fallbackRole,
  featured = false,
  person,
}: {
  fallbackRole: string
  featured?: boolean
  person: PersonProfileRow
}) {
  const role = person.role || fallbackRole

  if (featured) {
    return (
      <div className="mx-auto grid max-w-[860px] gap-7 lg:grid-cols-[minmax(130px,170px)_1fr] lg:items-start">
        <ImageTile
          alt={`${person.name ?? role} 사진`}
          className="mx-auto aspect-[3/4] w-full max-w-[170px] bg-none lg:max-w-none"
          fallbackVariant="profile"
          objectFit="contain"
          sizes="(min-width: 1024px) 170px, 170px"
          src={person.photo_url ?? ''}
        />
        <div className="relative min-w-0 py-1">
          <StaffLines className="absolute inset-x-0 top-0 opacity-45" density="light" variant="gold" />
          <Badge variant="gold">{role}</Badge>
          <h3 className="mt-4 text-2xl font-semibold text-navy-deep">
            {person.name || role}
          </h3>
          {person.description ? (
            <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
              {person.description}
            </p>
          ) : null}
          {person.bio ? (
            <p className="mt-5 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
              {person.bio}
            </p>
          ) : null}
          {person.message ? (
            <p className="mt-5 max-w-2xl border-l-2 border-gold-warm bg-bg-ivory/70 px-4 py-3 break-keep text-sm leading-7 text-navy-deep">
              {person.message}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <Card
      className={classNames(
        'overflow-hidden',
        'max-w-[360px]',
      )}
      hoverable
      radius="balanced"
    >
      <ImageTile
        alt={`${person.name ?? role} 사진`}
        className="mx-auto aspect-[2/3] w-full max-w-[240px] bg-bg-warm-white"
        fallbackVariant="profile"
        objectFit="contain"
        sizes="(min-width: 1280px) 300px, (min-width: 768px) 45vw, calc(100vw - 40px)"
        src={person.photo_url ?? ''}
      />
      <div className="relative p-5">
        <StaffLines className="absolute inset-x-6 top-5 !w-auto opacity-55" density="light" variant="gold" />
        <Badge variant="gold">{role}</Badge>
        <h3
          className="mt-4 text-xl font-semibold text-navy-deep"
        >
          {person.name || role}
        </h3>
        {person.description ? (
          <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
            {person.description}
          </p>
        ) : null}
        {person.bio ? (
          <p className="mt-5 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
            {person.bio}
          </p>
        ) : null}
        {person.message ? (
          <p className="mt-5 rounded-button border border-line-default bg-bg-ivory px-4 py-3 break-keep text-sm leading-7 text-navy-deep">
            {person.message}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

function AboutSectionList({ sections }: { sections: AboutSectionRow[] }) {
  if (sections.length === 0) {
    return <EmptyState title="등록된 소개 문구가 없습니다" />
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {sections.map((section, index) => (
        <Reveal key={section.id}>
          <Card
            className="relative min-h-full overflow-hidden p-6 sm:p-8"
            hoverable
            radius="balanced"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-12 bg-linear-to-r from-navy-deep via-gold-warm/35 to-transparent opacity-10"
            />
            <StaffLines className="absolute inset-x-6 top-7 !w-auto opacity-70" density="light" variant="gold" />
            <p className="text-sm font-semibold tracking-[0.14em] text-gold-warm">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-3 break-keep text-2xl font-semibold text-navy-deep">
              {section.title || section.section_key}
            </h3>
            <p className="mt-4 whitespace-pre-line break-keep text-base leading-8 text-text-muted">
              {section.content}
            </p>
          </Card>
        </Reveal>
      ))}
    </div>
  )
}

function SpiritEducationSection({ sections }: { sections: AboutSectionRow[] }) {
  const hero = getAboutSectionCopy(sections, 'spirit_hero', defaultSpiritHero)
  const motet = getAboutSectionCopy(sections, 'spirit_motet', defaultMotetMeaning)
  const education = getAboutSectionCopy(sections, 'spirit_education', defaultEducationCopy)
  const peace = getAboutSectionCopy(sections, 'spirit_peace', defaultPeaceCopy)
  const cta = getAboutSectionCopy(sections, 'spirit_cta', defaultSpiritCta)
  const compactManifesto = {
    body: spiritManifestoCopy.paragraphs.slice(0, 2).join('\n\n'),
    ctaLabel: '더 깊이 보기',
    ctaUrl: '/spirit',
    eyebrow: spiritManifestoCopy.eyebrow,
    title: spiritManifestoCopy.title,
  }

  return (
    <section id="spirit" className="space-y-8">
      <SectionTitle
        description="합창단이 지향하는 음악 교육, 신앙 교육, 공동체 교육의 방향을 소개합니다."
        eyebrow="SPIRIT"
        title="정신과 교육철학"
      />
      <SpiritStatementBlock copy={hero} />
      <SpiritStatementBlock copy={compactManifesto} tone="navy" />
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <MotetMeaningCard copy={motet} />
        <SpiritValueCards values={spiritValues} />
      </div>
      <SpiritRibbon items={spiritTimeline} />
      <div className="grid gap-5 lg:grid-cols-2">
        <SpiritStatementBlock copy={education} />
        <SpiritStatementBlock copy={peace} tone="navy" />
      </div>
      <HarmonyBreathEffect />
      <SpiritStatementBlock
        align="center"
        copy={{
          ...cta,
          ctaLabel: '합창단 정신 더 깊이 보기',
          ctaUrl: '/spirit',
        }}
      />
    </section>
  )
}

function MemberHarmonyMap({ members }: { members: MemberRow[] }) {
  const activeMembers = members.filter((member) => getMemberStatus(member) === 'active')
  const alumniCount = members.length
  const staffCount = activeMembers.filter((member) => member.group_type === 'staff').length
  const partCounts = ['soprano', 'alto', 'tenor', 'bass'].map((part) => ({
    label: getMemberPartLabel(part as MemberRow['part']),
    value: activeMembers.filter((member) => member.part === part).length,
  }))

  if (members.length === 0) {
    return null
  }

  return (
    <div className="member-harmony-map mt-8 rounded-balanced border border-line-default bg-bg-warm-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-warm">
            HARMONY MAP
          </p>
          <h3 className="mt-2 break-keep text-2xl font-semibold text-navy-deep">
            현재 단원과 역대 단원의 흐름
          </h3>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={classNames('member-stat-card rounded-formal border border-gold-warm/30 bg-gold-soft/25 p-4', activeMembers.length === 0 && 'is-zero')}>
          <p className="text-xs font-semibold text-text-muted">현재단원</p>
          <p className="mt-1 text-2xl font-bold text-navy-deep">{activeMembers.length}</p>
        </div>
        {partCounts.map((part) => (
          <div className={classNames('member-stat-card rounded-formal border border-line-default bg-bg-ivory p-4', part.value === 0 && 'is-zero')} key={part.label}>
            <p className="text-xs font-semibold text-text-muted">{part.label}</p>
            <p className="mt-1 text-2xl font-bold text-navy-deep">{part.value}</p>
          </div>
        ))}
        <div className={classNames('member-stat-card rounded-formal border border-line-default bg-bg-ivory p-4', staffCount === 0 && 'is-zero')}>
          <p className="text-xs font-semibold text-text-muted">스태프</p>
          <p className="mt-1 text-2xl font-bold text-navy-deep">{staffCount}</p>
        </div>
        <div className={classNames('member-stat-card rounded-formal border border-line-default bg-bg-ivory p-4', alumniCount === 0 && 'is-zero')}>
          <p className="text-xs font-semibold text-text-muted">역대단원 전체</p>
          <p className="mt-1 text-2xl font-bold text-navy-deep">{alumniCount}</p>
        </div>
      </div>
    </div>
  )
}

function HistoryList({
  history,
  shouldUseLegacyFallback,
}: {
  history: HistoryRow[]
  shouldUseLegacyFallback: boolean
}) {
  if (history.length === 0 && shouldUseLegacyFallback) {
    return (
      <div className="history-timeline history-timeline--legacy">
        {legacyHistorySeed.map((item) => (
          <Card className="history-timeline-card history-timeline-card--legacy" key={item.id}>
            <StaffLines className="history-timeline-card__lines" density="light" variant="gold" />
            <div className="history-timeline-card__date">
              <p className="history-timeline-card__year">{item.year}</p>
            </div>
            <div className="history-timeline-card__body">
              <h3 className="history-timeline-card__title">
                {item.title}
              </h3>
              {item.description ? (
                <p className="history-timeline-card__content">
                  {item.description}
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return <EmptyState title="등록된 연혁이 없습니다" />
  }

  return (
    <div aria-label="합창단 연혁" className="history-timeline">
      <StaffLines
        className="history-timeline__rail"
        density="light"
        direction="vertical"
        variant="gold"
      />
      {history.map((item) => (
        <Reveal key={item.id}>
          <Card className="history-timeline-card" hoverable>
            <span
              aria-hidden="true"
              className="history-timeline-card__dot"
            />
            <StaffLines
              className="history-timeline-card__lines"
              density="light"
              variant="gold"
            />
            <div className="history-timeline-card__date">
              <p className="history-timeline-card__year">{item.year}</p>
              {item.month ? (
                <p className="history-timeline-card__month">
                  {item.month}
                </p>
              ) : null}
            </div>
            <div className={item.image_url ? 'history-timeline-card__body has-image' : 'history-timeline-card__body'}>
              {item.image_url ? (
                <ImageTile
                  alt={`${item.year} ${item.title ?? '연혁'} 이미지`}
                  className="history-timeline-card__image"
                  sizes="(min-width: 768px) 168px, 100vw"
                  src={item.image_url}
                  transform={{
                    quality: 84,
                    resize: 'cover',
                    width: 520,
                    widths: [260, 380, 520, 720],
                  }}
                />
              ) : null}
              <div>
                <h3 className="history-timeline-card__title">
                  {item.title || item.content}
                </h3>
                <p className="history-timeline-card__content">
                  {item.content}
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  )
}

export function AboutPage() {
  const aboutData = useAboutData()
  const [searchParams] = useSearchParams()
  const [activePart, setActivePart] = useState<MemberFilterValue>('all')
  const {
    aboutSections,
    accompanists,
    conductor,
    galleryImages,
    history,
    location,
    members,
    siteSettings,
  } = aboutData.data
  const allAboutSections = aboutData.error ? legacyAboutSections : aboutSections
  const aboutIntroSections = allAboutSections.filter(
    (section) => !section.section_key.startsWith('spirit_') && !section.section_key.startsWith('home_') && !section.section_key.startsWith('join_') && !section.section_key.startsWith('footer_'),
  )
  const visibleMembers = members.filter((member) => {
    const status = getMemberStatus(member)

    if (activePart === 'alumni') {
      return true
    }

    if (status !== 'active') {
      return false
    }

    if (activePart === 'staff') {
      return member.group_type === 'staff'
    }

    const partMatches = activePart === 'all' || member.part === activePart

    return partMatches
  })
  const locationAddress =
    location?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()
  const introSummary =
    siteSettings?.about_summary ||
    aboutIntroSections[0]?.content ||
    legacyChoirIntro.summary
  const aboutVisualImage = galleryImages.find((image) => image.image_url.trim())
  const activeSection = getActiveAboutSection(searchParams.get('section'))
  const shouldShowAll = activeSection === 'all'
  const shouldShowOverview = shouldShowAll || activeSection === 'overview'
  const shouldShowSpirit = shouldShowAll || activeSection === 'spirit'
  const shouldShowConductor = shouldShowAll || activeSection === 'conductor'
  const shouldShowAccompanists = shouldShowAll || activeSection === 'accompanist'
  const shouldShowMembers = shouldShowAll || activeSection === 'members'
  const shouldShowHistory = shouldShowAll || activeSection === 'history'

  return (
    <>
      <SeoHead
        description={
          introSummary ||
          '서울모테트청소년합창단의 지휘자, 반주자, 단원과 연혁을 소개합니다.'
        }
        path="/about"
        title="합창단 소개"
      />
      <PageHero
        description={introSummary}
        eyebrow="ABOUT"
        title="합창단 소개"
      />

      <Container className="page-main space-y-12 lg:space-y-16">
        {aboutData.error ? (
          <ErrorState
            description="Supabase 공개 데이터를 불러오지 못해 기본 소개 정보를 표시합니다."
            title="기본 소개 정보로 표시 중입니다"
          />
        ) : null}

        <AboutSectionSelector activeSection={activeSection} />

        {shouldShowOverview ? (
          <>
            <section id="overview">
              <Reveal>
                <div className="grid gap-6 rounded-balanced border border-line-default bg-bg-warm-white p-6 shadow-card md:grid-cols-[1fr_320px] md:p-8 lg:p-9">
                  <div>
                    <StaffSectionLabel className="max-w-md">
                      INTRO STATEMENT
                    </StaffSectionLabel>
                    <h2 className="mt-4 max-w-3xl break-keep text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.1] text-navy-deep">
                      청소년의 목소리로 전하는 깊은 울림
                    </h2>
                    <StaffLines className="mt-5 max-w-xl opacity-70" density="light" variant="gold" />
                    <p className="mt-6 max-w-3xl break-keep text-base leading-8 text-text-muted md:text-lg">
                      {introSummary}
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <VisualArchivePanel
                      className="min-h-[240px]"
                      description={aboutVisualImage?.description}
                      eyebrow="ABOUT VISUAL"
                      imageAlt={aboutVisualImage?.title || '합창단 소개 대표 이미지'}
                      imageUrl={aboutVisualImage?.image_url}
                      title={aboutVisualImage?.title || '맑은 목소리가 모이는 자리'}
                    />
                    <div className="rounded-balanced border border-gold-warm/25 bg-bg-ivory p-5">
                      <BrandLogo brand="smf" size="md" theme="light" />
                      <p className="mt-5 break-keep text-sm font-semibold leading-7 text-navy-deep">
                        {legacyChoirIntro.affiliation}
                      </p>
                      <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
                        서울모테트음악재단의 음악적 가치 위에서 청소년 합창 교육과 무대 경험을 이어갑니다.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            <section>
              <SectionTitle eyebrow="ABOUT SMYC" title="기관 소개" />
              <div className="mt-8">
                <AboutSectionList sections={aboutIntroSections} />
              </div>
            </section>
          </>
        ) : null}

        {shouldShowSpirit ? (
          <SpiritEducationSection sections={allAboutSections} />
        ) : null}

        {shouldShowConductor ? (
        <section id="conductor">
          <SectionTitle
            description="합창단의 음악적 방향과 교육 흐름을 이끄는 지휘자를 소개합니다."
            eyebrow="CONDUCTOR"
            title="지휘자 소개"
          />
          <div className="mt-7">
            {conductor ? (
              <ConductorProfileDocument person={conductor} />
            ) : null}
          </div>
          {!conductor ? (
            <div className="mt-8">
              <EmptyState title="등록된 지휘자 소개가 없습니다" />
            </div>
          ) : null}
        </section>
        ) : null}

        {shouldShowAccompanists ? (
        <section id="accompanist">
          <SectionTitle
            description="연습과 무대를 함께 만들어 가는 반주자를 소개합니다."
            eyebrow="ACCOMPANIST"
            title="반주자 소개"
          />
          <div className="mt-6">
            <SpiritRibbon
              items={accompanistRoleCopy.roles}
            />
          </div>
          <div className="mt-7">
            <SpiritStatementBlock
              copy={{
                body: accompanistRoleCopy.body,
                eyebrow: accompanistRoleCopy.eyebrow,
                title: accompanistRoleCopy.title,
              }}
              tone="navy"
            />
          </div>
          <div className="accompanist-grid mt-7">
            {accompanists.map((accompanist) => (
              <PersonCard
                fallbackRole="반주자"
                key={accompanist.id}
                person={accompanist}
              />
            ))}
          </div>
          {accompanists.length === 0 ? (
            <div className="mt-8">
              <EmptyState title="등록된 반주자 소개가 없습니다" />
            </div>
          ) : null}
        </section>
        ) : null}

        {shouldShowMembers ? (
        <section id="members">
          <SectionTitle
            eyebrow="MEMBERS"
            title="단원 소개"
          />
          <MemberHarmonyMap members={members} />
          <div aria-label="파트 필터" className="mt-6 flex flex-wrap gap-2" role="tablist">
            {partFilters.map((filter) => (
              <button
                aria-selected={activePart === filter.value}
                className={[
                  'min-h-10 rounded-pill border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                  activePart === filter.value
                    ? 'border-gold-warm bg-gold-warm text-navy-midnight'
                    : 'border-line-default bg-bg-warm-white text-text-muted hover:border-gold-warm hover:text-navy-deep',
                ].join(' ')}
                key={filter.value}
                onClick={() => setActivePart(filter.value)}
                role="tab"
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          {visibleMembers.length === 0 ? (
            <div className="mt-8">
              <EmptyState title="등록된 단원이 없습니다" />
            </div>
          ) : (
            <div className="member-list mt-8">
              {visibleMembers.map((member) => (
                <Card className="member-row min-h-20 p-4" key={member.id} radius="formal">
                  <div>
                    <p className="text-[11px] font-semibold leading-5 text-gold-warm">
                      {getMemberGroupLabel(member.group_type)} · {getMemberPartLabel(member.part)}
                    </p>
                    <h3 className="break-keep text-base font-semibold text-navy-deep">
                      {getProtectedMemberName(member)}
                    </h3>
                    {member.description ? (
                      <p className="hidden">
                        {member.description}
                      </p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
        ) : null}

        {shouldShowHistory ? (
        <section id="history">
          <SectionTitle eyebrow="ARCHIVE" title="연혁" />
          <div className="mt-8">
            <HistoryList
              history={history}
              shouldUseLegacyFallback={Boolean(aboutData.error)}
            />
          </div>
        </section>
        ) : null}

        {shouldShowAll ? (
        <section>
          <SectionTitle eyebrow="LOCATION" title="오시는 길" />
          <div className="mt-8">
            <MapPreview
              address={locationAddress}
              embedUrl={location?.map_embed_url}
              kakaoMapUrl={location?.kakao_map_url}
              naverMapUrl={location?.naver_map_url}
              placeName={location?.place_name || '서울모테트음악재단'}
            />
          </div>
        </section>
        ) : null}
      </Container>
    </>
  )
}
