import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { conductorPhilosophyCopy } from '../../constants/spiritContent'
import type { PersonProfileRow } from '../../types/cms'
import { classNames } from '../../utils/classNames'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'
import { ImageTile } from '../home/ImageTile'

type ActivityImage = {
  alt: string
  caption: string
  src: string
}

const defaultTeachingPrinciples = [
  {
    title: '귀 기울임',
    description: '서로의 소리를 먼저 듣고 하나의 울림 안에서 자기 역할을 찾습니다.',
  },
  {
    title: '약속',
    description: '연습과 무대의 시간을 소중히 여기며 공동체 안에서 서로를 살핍니다.',
  },
  {
    title: '꾸준함',
    description: '악보와 텍스트를 정확히 읽고 꾸준히 다듬는 태도를 기릅니다.',
  },
  {
    title: '공동체',
    description: '혼자 돋보이는 소리가 아니라 함께 완성되는 음악을 지향합니다.',
  },
  {
    title: '말씀과 음악의 해석',
    description: '정통 합창과 교회음악의 정신을 청소년의 언어로 이어갑니다.',
  },
  {
    title: '삶으로 이어지는 노래',
    description: '무대의 경험이 삶의 태도와 나눔으로 이어지도록 돕습니다.',
  },
]

function splitLines(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitParagraphs(value: string | null | undefined) {
  return (value ?? '')
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function parsePrinciples(value: string | null | undefined) {
  const lines = splitLines(value)

  if (lines.length === 0) {
    return defaultTeachingPrinciples
  }

  return lines.map((line) => {
    const [title, ...descriptionParts] = line.split(':')

    return {
      title: title.trim(),
      description: descriptionParts.join(':').trim() || '합창 안에서 함께 배우는 교육 원리입니다.',
    }
  })
}

function parseActivityImages(value: string | null | undefined): ActivityImage[] {
  return splitLines(value)
    .map((line) => {
      const [src, alt = '', caption = ''] = line.split('|').map((item) => item.trim())

      if (!src) {
        return null
      }

      return {
        alt: alt || caption || '지휘자 활동 사진',
        caption,
        src,
      }
    })
    .filter((item): item is ActivityImage => Boolean(item))
}

function ProfileListSection({
  items,
  title,
}: {
  items: string[]
  title: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="border-t border-line-default pt-6">
      <h3 className="text-lg font-semibold text-navy-deep">{title}</h3>
      <ul className="mt-4 grid gap-2 text-sm leading-7 text-text-muted">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-warm" aria-hidden="true" />
            <span className="break-keep">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ConductorProfileDocument({ person }: { person: PersonProfileRow }) {
  const [selectedImage, setSelectedImage] = useState<ActivityImage | null>(null)
  const name = person.name || '지휘자'
  const role = person.role || '지휘자'
  const highlight = person.profile_highlight || person.description
  const profileBody = splitParagraphs(person.profile_summary || person.bio)
  const currentRoles = splitLines(person.current_roles)
  const educationItems = splitLines(person.education_items)
  const careerItems = splitLines(person.career_items)
  const awardsItems = [...splitLines(person.awards_items), ...splitLines(person.activities_items)]
  const principles = parsePrinciples(person.teaching_principles)
  const messageBody = splitParagraphs(person.message_body || person.message)
  const activityImages = parseActivityImages(person.activity_images)
  const philosophyBody =
    person.philosophy_body?.trim() ||
    conductorPhilosophyCopy.body
  const philosophyTitle = person.philosophy_title || conductorPhilosophyCopy.title
  const philosophyQuote = person.philosophy_quote || conductorPhilosophyCopy.quote

  useEffect(() => {
    if (!selectedImage) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedImage])

  return (
    <>
      <article className="mx-auto max-w-5xl overflow-hidden rounded-formal border border-line-default bg-bg-warm-white shadow-card">
        <div className="h-1 bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:p-9">
          <aside className="lg:border-r lg:border-line-default lg:pr-8">
            <ImageTile
              alt={person.profile_image_alt || `${name} 사진`}
              className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-formal bg-bg-ivory"
              fallbackVariant="profile"
              objectFit="contain"
              sizes="(min-width: 1024px) 260px, min(280px, 80vw)"
              src={person.photo_url ?? ''}
            />
            <div className="mt-6 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-warm">
                CONDUCTOR
              </p>
              <h3 className="mt-2 break-keep text-2xl font-bold text-navy-deep">{name}</h3>
              <p className="mt-2 text-sm font-semibold text-text-muted">{role}</p>
              {person.hero_quote ? (
                <blockquote className="mt-5 border-l-2 border-gold-warm bg-bg-ivory px-4 py-3 text-left text-sm font-semibold leading-7 text-navy-deep">
                  {person.hero_quote}
                </blockquote>
              ) : null}
              <dl className="mt-5 grid gap-2 text-sm leading-6">
                <div className="rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                  <dt className="text-xs font-semibold text-gold-warm">현재 역할</dt>
                  <dd className="mt-1 text-navy-deep">{role}</dd>
                </div>
                {currentRoles.slice(0, 2).map((item) => (
                  <div className="rounded-button border border-line-default bg-bg-ivory px-4 py-3" key={item}>
                    <dt className="text-xs font-semibold text-gold-warm">주요 직책</dt>
                    <dd className="mt-1 break-keep text-navy-deep">{item}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>

          <div className="space-y-8">
            <section>
              <StaffSectionLabel className="max-w-sm">PROFILE</StaffSectionLabel>
              {highlight ? (
                <div className="mt-5 rounded-formal border border-gold-warm/30 bg-gold-soft/24 px-5 py-4">
                  <p className="break-keep text-base font-semibold leading-8 text-navy-deep">
                    {highlight}
                  </p>
                </div>
              ) : null}
              {profileBody.length > 0 ? (
                <div className="mt-5 space-y-4 text-base leading-[1.85] text-text-muted">
                  {profileBody.map((paragraph) => (
                    <p className="whitespace-pre-line break-keep" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-5 break-keep text-base leading-8 text-text-muted">
                  지휘자 프로필 본문이 등록되면 이 영역에 표시됩니다.
                </p>
              )}
            </section>

            <div className="grid gap-7">
              <ProfileListSection items={currentRoles} title="현재" />
              <ProfileListSection items={educationItems} title="학력" />
              <ProfileListSection items={careerItems} title="주요 경력" />
              <ProfileListSection items={awardsItems} title="수상 및 주요 활동" />
            </div>
          </div>
        </div>

        <div className="border-t border-line-default bg-bg-ivory/62 p-5 sm:p-7 lg:p-9">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-warm">
                PHILOSOPHY
              </p>
              <h3 className="mt-3 break-keep text-2xl font-semibold text-navy-deep">
                {philosophyTitle}
              </h3>
              <StaffLines className="mt-4 max-w-md opacity-65" density="light" variant="gold" />
              {philosophyQuote ? (
                <blockquote className="mt-5 rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm font-semibold leading-7 text-navy-deep">
                  {philosophyQuote}
                </blockquote>
              ) : null}
              <div className="mt-5 space-y-4 text-base leading-[1.85] text-text-muted">
                {splitParagraphs(philosophyBody).map((paragraph) => (
                  <p className="whitespace-pre-line break-keep" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-navy-deep">교육 원리</h3>
              <div className="mt-4 grid gap-3">
                {principles.slice(0, 6).map((principle) => (
                  <div className="rounded-button border border-line-default bg-bg-warm-white px-4 py-3" key={principle.title}>
                    <p className="text-sm font-semibold text-navy-deep">{principle.title}</p>
                    <p className="mt-1 break-keep text-xs leading-5 text-text-muted">
                      {principle.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {messageBody.length > 0 || activityImages.length > 0 ? (
          <div className="border-t border-line-default p-5 sm:p-7 lg:p-9">
            {messageBody.length > 0 ? (
              <section>
                <h3 className="text-2xl font-semibold text-navy-deep">
                  {person.message_title || '지휘자 메시지'}
                </h3>
                <div className="mt-4 space-y-4 text-base leading-[1.85] text-text-muted">
                  {messageBody.map((paragraph) => (
                    <p className="whitespace-pre-line break-keep" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {activityImages.length > 0 ? (
              <section className={classNames(messageBody.length > 0 && 'mt-9')}>
                <h3 className="text-2xl font-semibold text-navy-deep">활동 사진</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {activityImages.slice(0, 3).map((image) => (
                    <button
                      aria-label={`${image.alt} 크게 보기`}
                      className="group overflow-hidden rounded-formal border border-line-default bg-bg-ivory text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                      key={image.src}
                      onClick={() => setSelectedImage(image)}
                      type="button"
                    >
                      <img
                        alt={image.alt}
                        className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        src={image.src}
                      />
                      {image.caption ? (
                        <p className="px-3 py-2 text-xs leading-5 text-text-muted">{image.caption}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-line-default bg-bg-warm-white p-5 sm:p-7 lg:p-9">
          <nav aria-label="지휘자 소개 관련 링크" className="flex flex-wrap gap-2">
            <Link className="rounded-pill border border-line-default px-4 py-3 text-sm font-semibold text-navy-deep transition hover:border-gold-warm hover:text-gold-warm" to="/concerts">
              최근 공연 보기
            </Link>
            <Link className="rounded-pill border border-line-default px-4 py-3 text-sm font-semibold text-navy-deep transition hover:border-gold-warm hover:text-gold-warm" to="/about?section=spirit">
              합창단 정신 보기
            </Link>
            <Link className="rounded-pill border border-line-default px-4 py-3 text-sm font-semibold text-navy-deep transition hover:border-gold-warm hover:text-gold-warm" to="/join">
              입단 안내 보기
            </Link>
          </nav>
        </div>
      </article>

      {selectedImage ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-midnight/82 p-4"
          role="dialog"
        >
          <div className="w-full max-w-5xl rounded-formal bg-bg-warm-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="break-keep text-sm font-semibold text-navy-deep">
                {selectedImage.caption || selectedImage.alt}
              </p>
              <button
                className="min-h-10 rounded-button border border-line-default px-4 text-sm font-semibold text-navy-deep transition hover:border-gold-warm"
                onClick={() => setSelectedImage(null)}
                type="button"
              >
                닫기
              </button>
            </div>
            <img
              alt={selectedImage.alt}
              className="max-h-[78vh] w-full object-contain"
              src={selectedImage.src}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
