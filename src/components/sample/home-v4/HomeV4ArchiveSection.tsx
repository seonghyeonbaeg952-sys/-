import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  HomeV4ArchiveFixture,
  HomeV4ArchiveMediaFixture,
} from '../../../pages/sample/home-v4/homeV4SignatureTypes'
import { HomeV4ArchiveEmptyState } from './HomeV4ArchiveEmptyState'
import { HomeV4ArchiveFile } from './HomeV4ArchiveFile'
import { HomeV4ArchiveFolder } from './HomeV4ArchiveFolder'
import { HomeV4ArchiveMediaModal } from './HomeV4ArchiveMediaModal'

type HomeV4ArchiveSectionProps = {
  fixture: HomeV4ArchiveFixture
  reducedMotion: boolean
}

export function HomeV4ArchiveSection({
  fixture,
  reducedMotion,
}: HomeV4ArchiveSectionProps) {
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const [expanded, setExpanded] = useState(reducedMotion)
  const [selectedMedia, setSelectedMedia] =
    useState<HomeV4ArchiveMediaFixture | null>(null)
  const [returnFocusElement, setReturnFocusElement] =
    useState<HTMLButtonElement | null>(null)
  const mediaViewportRef = useRef<HTMLDivElement>(null)
  const staticMode = reducedMotion || systemReducedMotion
  const isExpanded = staticMode || expanded
  const visibleMedia = fixture.media
    .filter((item) => item.isVisible)
    .sort((left, right) => left.displayOrder - right.displayOrder)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setSystemReducedMotion(query.matches)

    updatePreference()
    query.addEventListener('change', updatePreference)
    return () => query.removeEventListener('change', updatePreference)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedMedia(null)
  }, [])

  const openModal = (
    media: HomeV4ArchiveMediaFixture,
    trigger: HTMLButtonElement,
  ) => {
    setReturnFocusElement(trigger)
    setSelectedMedia(media)
  }

  const moveMediaStack = (direction: -1 | 1) => {
    const viewport = mediaViewportRef.current

    if (!viewport) {
      return
    }

    viewport.scrollBy({
      behavior: staticMode ? 'auto' : 'smooth',
      left: direction * Math.max(viewport.clientWidth * 0.82, 280),
    })
  }

  return (
    <section
      aria-labelledby="home-v4-archive-title"
      className="home-v4-archive"
      data-expanded={isExpanded ? 'true' : 'false'}
      data-reduced-motion={staticMode ? 'true' : 'false'}
      data-visible-count={visibleMedia.length}
    >
      <div className="home-v4-archive__heading">
        <div>
          <p>{fixture.eyebrow}</p>
          <h2 id="home-v4-archive-title">{fixture.title}</h2>
        </div>
        <p>{fixture.description}</p>
      </div>

      {visibleMedia.length === 0 ? (
        <HomeV4ArchiveEmptyState
          galleryHref={fixture.galleryHref}
          galleryLabel={fixture.galleryLabel}
          message={fixture.emptyMessage}
        />
      ) : (
        <>
          {!staticMode ? (
            <HomeV4ArchiveFolder
              expanded={isExpanded}
              media={visibleMedia}
              onToggle={() => setExpanded((current) => !current)}
            />
          ) : null}

          {isExpanded ? (
            <div
              aria-label="합창단 아카이브 파일"
              className="home-v4-archive__files-panel"
              id="home-v4-archive-files"
            >
              <div
                className="home-v4-archive__files"
                ref={mediaViewportRef}
              >
                {visibleMedia.map((media, index) => (
                  <HomeV4ArchiveFile
                    key={media.id}
                    media={media}
                    number={index + 1}
                    onSelect={openModal}
                  />
                ))}
              </div>

              {!staticMode && visibleMedia.length > 1 ? (
                <div
                  aria-label="아카이브 파일 이동"
                  className="home-v4-archive__stack-controls"
                >
                  <button
                    aria-label="이전 아카이브 파일"
                    onClick={() => moveMediaStack(-1)}
                    type="button"
                  >
                    ←
                  </button>
                  <span>
                    {String(visibleMedia.length).padStart(2, '0')} RECORDS
                  </span>
                  <button
                    aria-label="다음 아카이브 파일"
                    onClick={() => moveMediaStack(1)}
                    type="button"
                  >
                    →
                  </button>
                </div>
              ) : null}

              {fixture.galleryHref ? (
                <a
                  className="home-v4-archive__gallery-link"
                  href={fixture.galleryHref}
                >
                  <span>{fixture.galleryLabel}</span>
                  <span aria-hidden="true">→</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {selectedMedia ? (
        <HomeV4ArchiveMediaModal
          media={selectedMedia}
          onClose={closeModal}
          returnFocusElement={returnFocusElement}
        />
      ) : null}
    </section>
  )
}
