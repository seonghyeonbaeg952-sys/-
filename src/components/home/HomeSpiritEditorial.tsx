import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'

import {
  getAboutSectionCopy,
  homeSpiritBookletPages,
} from '../../constants/spiritContent'
import type { AboutSectionRow } from '../../types/cms'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'

type HomeSpiritEditorialProps = {
  sections: AboutSectionRow[]
}

type SpiritDirection = 'next' | 'previous'

type SpiritEditorialStyle = CSSProperties & {
  '--spirit-progress': string
}

const movementLabels = [
  '이름',
  '정직한 음악',
  '교회음악',
  '공동체',
  '다음 세대',
] as const

const movementGhostWords = [
  'MOTET',
  'HONEST',
  'SACRED',
  'TOGETHER',
  'FUTURE',
] as const

function createPages(sections: AboutSectionRow[]) {
  return homeSpiritBookletPages.map((page, index) => ({
    ...getAboutSectionCopy(sections, `home_spirit_${page.id}`, {
      body: page.body,
      ctaLabel: page.ctaLabel,
      ctaUrl: page.ctaHref,
      eyebrow: page.eyebrow,
      subtitle: page.summary,
      title: page.title,
    }),
    ghostWord: movementGhostWords[index],
    id: page.id,
    movementLabel: movementLabels[index],
  }))
}

function normalizeIndex(index: number, length: number) {
  return (index + length) % length
}

export function HomeSpiritEditorial({
  sections,
}: HomeSpiritEditorialProps) {
  const pages = useMemo(() => createPages(sections), [sections])
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState<SpiritDirection>('next')
  const activePage = pages[activeIndex]
  const previousIndex = normalizeIndex(activeIndex - 1, pages.length)
  const nextIndex = normalizeIndex(activeIndex + 1, pages.length)
  const previousPage = pages[previousIndex]
  const nextPage = pages[nextIndex]
  const sectionStyle: SpiritEditorialStyle = {
    '--spirit-progress': `${((activeIndex + 1) / pages.length) * 100}%`,
  }

  const moveTo = (nextActiveIndex: number, nextDirection?: SpiritDirection) => {
    const normalizedIndex = normalizeIndex(nextActiveIndex, pages.length)

    if (normalizedIndex === activeIndex) {
      return
    }

    const resolvedDirection =
      nextDirection ??
      (normalizedIndex > activeIndex ? 'next' : 'previous')

    setDirection(resolvedDirection)
    setActiveIndex(normalizedIndex)
  }

  const moveFocusTo = (nextActiveIndex: number, nextDirection: SpiritDirection) => {
    const normalizedIndex = normalizeIndex(nextActiveIndex, pages.length)
    moveTo(normalizedIndex, nextDirection)
    window.requestAnimationFrame(() => tabRefs.current[normalizedIndex]?.focus())
  }

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocusTo(index + 1, 'next')
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveFocusTo(index - 1, 'previous')
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      moveFocusTo(0, 'previous')
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      moveFocusTo(pages.length - 1, 'next')
    }
  }

  return (
    <section
      aria-labelledby="home-spirit-editorial-heading"
      className="flow-section home-section home-spirit-editorial"
      data-direction={direction}
      data-flow-section="spirit"
      id="home-spirit-editorial"
      style={sectionStyle}
    >
      <h2 className="sr-only" id="home-spirit-editorial-heading">
        서울모테트청소년합창단의 다섯 가지 정신
      </h2>
      <HomeSectionStaffCue
        className="home-section-staff-cue--spirit"
        label="정신"
        noteOffset={21}
        symbol="♫"
      />

      <div aria-hidden="true" className="home-spirit-editorial__background">
        {pages.map((page, index) => (
          <span
            className={classNames(
              'home-spirit-editorial__ghost-word',
              activeIndex === index && 'is-active',
            )}
            key={page.id}
          >
            {page.ghostWord}
          </span>
        ))}
      </div>

      <Container className="home-spirit-editorial__container">
        <div
          aria-label="합창단 정신 다섯 가지"
          aria-roledescription="carousel"
          className="home-spirit-editorial__experience"
          role="region"
        >
          <div className="home-spirit-editorial__stage">
            <div className="home-spirit-editorial__headline-stack">
              {pages.map((page, index) => {
                const panelId = `home-spirit-panel-${page.id}`
                const tabId = `home-spirit-tab-${page.id}`
                const isActive = activeIndex === index

                return (
                  <article
                    aria-hidden={!isActive}
                    aria-labelledby={tabId}
                    className={classNames(
                      'home-spirit-editorial__headline-panel',
                      isActive && 'is-active',
                    )}
                    id={panelId}
                    key={page.id}
                    role="tabpanel"
                  >
                    <span
                      aria-hidden="true"
                      className="home-spirit-editorial__number"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div
                      aria-hidden="true"
                      className="home-spirit-editorial__eyebrow-lines"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="home-spirit-editorial__eyebrow">
                      {page.eyebrow}
                    </p>
                    <h3 className="home-spirit-editorial__title">
                      {page.title}
                    </h3>
                    {page.subtitle ? (
                      <p className="home-spirit-editorial__summary">
                        {page.subtitle}
                      </p>
                    ) : null}
                  </article>
                )
              })}
            </div>

            <div className="home-spirit-editorial__copy-stack">
              {pages.map((page, index) => {
                const isActive = activeIndex === index

                return (
                  <div
                    aria-hidden={!isActive}
                    className={classNames(
                      'home-spirit-editorial__copy-panel',
                      isActive && 'is-active',
                    )}
                    key={page.id}
                  >
                    <p className="home-spirit-editorial__body">{page.body}</p>
                    <Button
                      className="home-spirit-editorial__cta"
                      href={page.ctaUrl || '/spirit'}
                      tabIndex={isActive ? 0 : -1}
                      variant="secondary"
                    >
                      {page.ctaLabel || '정신 자세히 보기'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div aria-hidden="true" className="home-spirit-editorial__divider">
            <svg
              preserveAspectRatio="none"
              viewBox="0 0 1420 72"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="home-spirit-editorial__divider-depth"
                d="M0 12H602L710 60L818 12H1420"
              />
              <path
                className="home-spirit-editorial__divider-track"
                d="M0 4H602L710 52L818 4H1420"
              />
              <path
                className="home-spirit-editorial__divider-progress"
                d="M0 4H602L710 52L818 4H1420"
              />
            </svg>
          </div>

          <div className="home-spirit-editorial__index">
            <div className="home-spirit-editorial__index-heading">
              <p>FIVE MOVEMENTS · MOTET SPIRIT</p>
              <span>
                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                {String(pages.length).padStart(2, '0')}
              </span>
            </div>

            <div className="home-spirit-editorial__index-row">
              <div
                aria-label="합창단 정신 선택"
                className="home-spirit-editorial__tabs"
                role="tablist"
              >
                {pages.map((page, index) => {
                  const isActive = activeIndex === index

                  return (
                    <button
                      aria-controls={`home-spirit-panel-${page.id}`}
                      aria-selected={isActive}
                      className={classNames(
                        'home-spirit-editorial__tab',
                        isActive && 'is-active',
                      )}
                      id={`home-spirit-tab-${page.id}`}
                      key={page.id}
                      onClick={() =>
                        moveTo(
                          index,
                          index >= activeIndex ? 'next' : 'previous',
                        )
                      }
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      ref={(element) => {
                        tabRefs.current[index] = element
                      }}
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                      type="button"
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{page.movementLabel}</strong>
                    </button>
                  )
                })}
              </div>

              <div className="home-spirit-editorial__arrows">
                <button
                  aria-label={`이전 정신: ${previousPage.movementLabel}`}
                  className="home-spirit-editorial__arrow"
                  onClick={() => moveTo(previousIndex, 'previous')}
                  type="button"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  aria-label={`다음 정신: ${nextPage.movementLabel}`}
                  className="home-spirit-editorial__arrow home-spirit-editorial__arrow--next"
                  onClick={() => moveTo(nextIndex, 'next')}
                  type="button"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>

          <p aria-live="polite" className="sr-only">
            현재 {activeIndex + 1} / {pages.length}: {activePage.movementLabel}
          </p>
        </div>
      </Container>
    </section>
  )
}
