import { useState } from 'react'

import { Badge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { MapPreview } from '../../components/common/MapPreview'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { ImageTile } from '../../components/home/ImageTile'
import {
  legacyAboutSections,
  legacyChoirIntro,
  legacyHistorySeed,
  legacyLocationSeed,
} from '../../constants/legacyContent'
import { useAboutData } from '../../hooks/usePublicData'
import type {
  AboutSectionRow,
  HistoryRow,
  MemberRow,
  PersonProfileRow,
} from '../../types/cms'
import { getMemberPartLabel, getProtectedMemberName } from '../../utils/memberName'

const partFilters: Array<{ label: string; value: MemberRow['part'] | 'all' }> = [
  { label: '전체', value: 'all' },
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
  { label: '기타', value: 'other' },
]

function PersonCard({
  fallbackRole,
  person,
}: {
  fallbackRole: string
  person: PersonProfileRow
}) {
  const role = person.role || fallbackRole

  return (
    <Card className="overflow-hidden" hoverable>
      <ImageTile
        alt={`${person.name ?? role} 사진`}
        className="aspect-[4/5]"
        src={person.photo_url ?? ''}
      />
      <div className="p-6">
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
          <Card className="relative overflow-hidden p-6 sm:p-8" hoverable>
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
            <p className="text-sm font-semibold text-gold-warm">
              {String(index + 1).padStart(2, '0')} · {section.section_key}
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

function HistoryList({
  history,
  shouldUseLegacyFallback,
}: {
  history: HistoryRow[]
  shouldUseLegacyFallback: boolean
}) {
  if (history.length === 0 && shouldUseLegacyFallback) {
    return (
      <div className="grid gap-4">
        {legacyHistorySeed.map((item) => (
          <Card className="p-5" key={item.id}>
            <p className="text-sm font-semibold text-gold-warm">{item.year}</p>
            <h3 className="mt-2 text-lg font-semibold text-navy-deep">
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {item.description}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return <EmptyState title="등록된 연혁이 없습니다" />
  }

  return (
    <div className="relative grid gap-4 lg:pl-8">
      <div className="absolute bottom-4 left-2 top-4 hidden w-px bg-line-default lg:block" />
      {history.map((item) => (
        <Reveal key={item.id}>
          <Card className="relative grid gap-4 p-5 md:grid-cols-[150px_1fr]" hoverable>
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-8 hidden size-3 rounded-full border-2 border-bg-warm-white bg-gold-warm lg:block"
            />
            <div className="flex items-baseline gap-3 md:block">
              <p className="text-2xl font-bold text-gold-warm">{item.year}</p>
              {item.month ? (
                <p className="mt-1 text-sm font-semibold text-text-muted">{item.month}</p>
              ) : null}
            </div>
            <div>
              <h3 className="break-keep text-lg font-semibold text-navy-deep">
                {item.title || item.content}
              </h3>
              <p className="mt-2 whitespace-pre-line break-keep text-sm leading-7 text-text-muted">
                {item.content}
              </p>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  )
}

export function AboutPage() {
  const aboutData = useAboutData()
  const [activePart, setActivePart] = useState<MemberRow['part'] | 'all'>('all')
  const {
    aboutSections,
    accompanist,
    conductor,
    history,
    location,
    members,
    siteSettings,
  } = aboutData.data
  const aboutIntroSections = aboutData.error ? legacyAboutSections : aboutSections
  const visibleMembers =
    activePart === 'all'
      ? members
      : members.filter((member) => member.part === activePart)
  const locationAddress =
    location?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()

  return (
    <>
      <PageHero
        description={
          siteSettings?.about_summary ||
          aboutIntroSections[0]?.content ||
          legacyChoirIntro.summary
        }
        eyebrow="ABOUT"
        title="합창단 소개"
      />

      <Container className="space-y-section-mobile py-section-mobile lg:space-y-section-desktop lg:py-section-desktop">
        {aboutData.error ? (
          <ErrorState
            description="Supabase 공개 데이터를 불러오지 못해 기본 소개 정보를 표시합니다."
            title="기본 소개 정보로 표시 중입니다"
          />
        ) : null}

        <section>
          <SectionTitle
            description={legacyChoirIntro.affiliation}
            eyebrow="ABOUT SMYC"
            title="기관 소개"
          />
          <div className="mt-8">
            <AboutSectionList sections={aboutIntroSections} />
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="LEADERS" title="지휘자와 반주자" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {conductor ? (
              <PersonCard fallbackRole="지휘자" person={conductor} />
            ) : null}
            {accompanist ? (
              <PersonCard fallbackRole="반주자" person={accompanist} />
            ) : null}
          </div>
          {!conductor && !accompanist ? (
            <div className="mt-8">
              <EmptyState title="등록된 선생님 소개가 없습니다" />
            </div>
          ) : null}
        </section>

        <section>
          <SectionTitle
            description="청소년 단원의 개인정보 보호를 위해 관리자 설정에 따라 실명, 부분 공개, 비공개 방식으로 표시합니다."
            eyebrow="MEMBERS"
            title="단원 소개"
          />
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
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleMembers.map((member) => (
                <Card className="overflow-hidden" key={member.id}>
                  <ImageTile
                    alt={`${getProtectedMemberName(member)} 사진`}
                    className="aspect-[4/3]"
                    src={member.photo_url ?? ''}
                  />
                  <div className="p-5">
                    <p className="text-xs font-semibold text-gold-warm">
                      {getMemberPartLabel(member.part)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-navy-deep">
                      {getProtectedMemberName(member)}
                    </h3>
                    {member.description ? (
                      <p className="mt-2 text-sm leading-6 text-text-muted">
                        {member.description}
                      </p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section id="history">
          <SectionTitle eyebrow="ARCHIVE" title="연혁" />
          <div className="mt-8">
            <HistoryList
              history={history}
              shouldUseLegacyFallback={Boolean(aboutData.error)}
            />
          </div>
        </section>

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
      </Container>
    </>
  )
}
