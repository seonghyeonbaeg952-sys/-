import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'

import {
  getAboutSectionCopy,
  homeSpiritBookletPages,
} from '../../constants/spiritContent'
import type { AboutSectionRow } from '../../types/cms'
import type { GalleryImage } from '../../types/content'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { ImageTile } from './ImageTile'
import { KineticHeadline } from './KineticHeadline'

type HomeSpiritScoreBookProps = {
  image?: GalleryImage
  sections: AboutSectionRow[]
}

function createPages(sections: AboutSectionRow[]) {
  return homeSpiritBookletPages.map((page) =>
    getAboutSectionCopy(sections, `home_spirit_${page.id}`, {
      body: page.body,
      ctaLabel: page.ctaLabel,
      ctaUrl: page.ctaHref,
      eyebrow: page.eyebrow,
      subtitle: page.summary,
      title: page.title,
    }),
  )
}

export function HomeSpiritScoreBook({ image, sections }: HomeSpiritScoreBookProps) {
  const pages = useMemo(() => createPages(sections), [sections])
  const [activeIndex, setActiveIndex] = useState(0)
  const activePage = pages[activeIndex]

  const moveTo = (nextIndex: number) => {
    const normalized = (nextIndex + pages.length) % pages.length
    setActiveIndex(normalized)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveTo(activeIndex + 1)
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveTo(activeIndex - 1)
    }

    if (event.key === 'Home') {
      event.preventDefault()
      moveTo(0)
    }

    if (event.key === 'End') {
      event.preventDefault()
      moveTo(pages.length - 1)
    }
  }

  return (
    <section
      aria-labelledby="home-spirit-scorebook-title"
      className="flow-section home-section spirit-scorebook-section relative bg-bg-ivory"
      data-flow-section="spirit"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--spirit"
        label="정신"
        noteOffset={21}
        symbol="♫"
      />
      <Container>
        <div className="home-spirit-editorial-layout">
          <div className="home-spirit-editorial-intro">
            <Reveal>
              <KineticHeadline
                body={
                  <p>
                    모테트의 이름과 서울모테트청소년합창단이 지향하는 교육
                    가치를 소개합니다.
                  </p>
                }
                className="max-w-4xl"
                eyebrow="SPIRIT SCOREBOOK"
                ghost="MOTET"
                lines={['합창단 정신']}
              />
            </Reveal>

            {image ? (
              <Reveal delay={70} variant="soft-scale">
                <a
                  className="home-spirit-media group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                  href="/gallery?tab=photos"
                >
                  <ImageTile
                    alt={image.image_alt || image.title}
                    className="home-spirit-media-image"
                    imgClassName="transition duration-500 group-hover:scale-[1.01] motion-reduce:group-hover:scale-100"
                    objectFit="contain"
                    sizes="(min-width: 1100px) 38vw, calc(100vw - 40px)"
                    src={image.image_url}
                    transform={{
                      quality: 84,
                      resize: 'contain',
                      width: 1200,
                      widths: [640, 960, 1200],
                    }}
                  >
                    <div aria-hidden="true" className="home-spirit-media-shade" />
                    <div className="home-spirit-media-caption">
                      <span>FROM THE ARCHIVE</span>
                      <strong title={image.title}>{image.title}</strong>
                    </div>
                  </ImageTile>
                </a>
              </Reveal>
            ) : null}
          </div>

          <Reveal delay={80} variant="card-rise">
            <article
              aria-roledescription="scorebook"
              className="spirit-scorebook"
              onKeyDown={handleKeyDown}
              role="region"
              tabIndex={0}
            >
            <div aria-hidden="true" className="spirit-scorebook-ghost">
              MOTET
            </div>
            <div className="spirit-scorebook-shell">
              <div className="spirit-scorebook-page spirit-scorebook-page-left">
                <StaffLines
                  className="spirit-scorebook-lines"
                  density="light"
                  variant="gold"
                />
                <p className="type-eyebrow text-gold-warm">
                  {activePage.eyebrow}
                </p>
                <span className="spirit-scorebook-number">
                  {String(activeIndex + 1).padStart(2, '0')}
                </span>
                <h3
                  className="spirit-scorebook-title"
                  id="home-spirit-scorebook-title"
                >
                  {activePage.title}
                </h3>
                {activePage.subtitle ? (
                  <p className="spirit-scorebook-summary">
                    {activePage.subtitle}
                  </p>
                ) : null}
              </div>

              <div className="spirit-scorebook-page spirit-scorebook-page-right">
                <div
                  aria-label={`${activeIndex + 1} / ${pages.length}, ${activePage.eyebrow}`}
                  aria-roledescription="page"
                  className="spirit-scorebook-active-page"
                  key={`${activePage.eyebrow}-${activeIndex}`}
                  role="group"
                >
                  <p className="spirit-scorebook-body">{activePage.body}</p>
                  <Button
                    className="mt-7"
                    href={activePage.ctaUrl || '/spirit'}
                    variant="secondary"
                  >
                    {activePage.ctaLabel || '자세히 보기'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="spirit-scorebook-controls">
              <button
                aria-label="이전 합창단 정신 페이지"
                className="spirit-scorebook-arrow"
                onClick={() => moveTo(activeIndex - 1)}
                type="button"
              >
                ←
              </button>
              <div className="spirit-scorebook-dots" role="list">
                {pages.map((page, index) => (
                  <button
                    aria-current={activeIndex === index ? 'true' : undefined}
                    aria-label={`${page.eyebrow} 페이지 보기`}
                    className={classNames(
                      'spirit-scorebook-dot',
                      activeIndex === index && 'is-active',
                    )}
                    key={page.eyebrow}
                    onClick={() => moveTo(index)}
                    type="button"
                  />
                ))}
              </div>
              <button
                aria-label="다음 합창단 정신 페이지"
                className="spirit-scorebook-arrow"
                onClick={() => moveTo(activeIndex + 1)}
                type="button"
              >
                →
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              현재 {activeIndex + 1} / {pages.length}: {activePage.eyebrow}
            </p>
            </article>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

