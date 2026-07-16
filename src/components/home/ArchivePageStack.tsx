import { useEffect, useRef, useState } from 'react'

import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { StaffSectionLabel } from '../common/StaffSectionLabel'
import { TransitionLink } from '../common/TransitionLink'
import { ImageTile } from './ImageTile'

type ArchivePageStackProps = {
  buttonLabel: string
  description: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow: string
  images: GalleryImage[]
  posters?: Poster[]
  videos?: VideoItem[]
}

type ArchivePreviewItem = {
  alt: string
  fallbackSrcs?: string[]
  href: string
  id: string
  kind: 'PHOTO' | 'POSTER' | 'VIDEO'
  src: string
  title: string
}

const ARCHIVE_CLOSE_DURATION_MS = 920

function buildArchiveItems(
  images: GalleryImage[],
  videos: VideoItem[],
  posters: Poster[],
) {
  const photoItems: ArchivePreviewItem[] = [...images]
    .filter((image) => image.is_visible && image.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)
    .map((image) => ({
      alt: image.image_alt || image.title,
      href: '/gallery?tab=photos',
      id: `photo-${image.id}`,
      kind: 'PHOTO',
      src: image.image_url,
      title: image.title,
    }))

  const videoItems: ArchivePreviewItem[] = [...videos]
    .filter((video) => video.is_visible && video.thumbnail_url.trim())
    .sort((first, second) => first.display_order - second.display_order)
    .map((video) => ({
      alt: `${video.title} 영상 썸네일`,
      href: '/gallery?tab=videos',
      id: `video-${video.id}`,
      fallbackSrcs: video.thumbnail_fallback_urls,
      kind: 'VIDEO',
      src: video.thumbnail_url,
      title: video.title,
    }))

  const posterItems: ArchivePreviewItem[] = [...posters]
    .filter((poster) => poster.is_visible && poster.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)
    .map((poster) => ({
      alt: `${poster.title} 포스터`,
      href: '/gallery?tab=posters',
      id: `poster-${poster.id}`,
      kind: 'POSTER',
      src: poster.image_url,
      title: poster.title,
    }))

  const representativeItems = [photoItems[0], videoItems[0], posterItems[0]].filter(
    (item): item is ArchivePreviewItem => Boolean(item),
  )
  const usedIds = new Set(representativeItems.map((item) => item.id))
  const remainingItems = [...photoItems, ...videoItems, ...posterItems].filter(
    (item) => !usedIds.has(item.id),
  )

  return [...representativeItems, ...remainingItems].slice(0, 3)
}

export function ArchivePageStack({
  buttonLabel,
  description,
  emptyDescription = '현재 공개된 공연·연습 기록이 없습니다.',
  emptyTitle = '공개된 갤러리 자료가 없습니다',
  eyebrow,
  images,
  posters = [],
  videos = [],
}: ArchivePageStackProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const archiveItems = buildArchiveItems(images, videos, posters)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const handleToggle = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (isOpen) {
      setIsClosing(true)
      setIsOpen(false)
      closeTimerRef.current = window.setTimeout(() => {
        setIsClosing(false)
        closeTimerRef.current = null
      }, ARCHIVE_CLOSE_DURATION_MS)
      return
    }

    setIsClosing(false)
    setIsOpen(true)
  }

  return (
    <>
      <Reveal variant="fade-up">
        <div className="archive-section-intro">
          <div>
            <StaffSectionLabel className="mb-3 max-w-md">
              {eyebrow}
            </StaffSectionLabel>
            <p className="type-body max-w-2xl text-text-muted">
              {description}
            </p>
          </div>
          <div className="archive-section-actions">
            {archiveItems.length > 0 ? (
              <button
                aria-expanded={isOpen}
                aria-label={isOpen ? '갤러리 기록 접기' : '갤러리 기록 펼치기'}
                className="archive-inline-toggle"
                onClick={handleToggle}
                type="button"
              >
                {isOpen ? '접기' : '기록 펼치기'}
              </button>
            ) : null}
            <Button href="/gallery" variant="secondary">
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Reveal>

      {archiveItems.length === 0 ? (
        <div className="mt-9">
          <EmptyState
            description={emptyDescription}
            title={emptyTitle}
          />
        </div>
      ) : (
        <div className="archive-preview-layout mt-9">
          <Reveal variant="fade-up">
            <div className="archive-preview-copy">
              <p className="type-eyebrow text-gold-ink">ARCHIVE BOOK</p>
              <h3 className="type-section-title mt-4 text-navy-deep">사진 · 영상 · 포스터</h3>
            </div>
          </Reveal>

          <Reveal delay={80} variant="card-rise">
            <div className="archive-folder-stage">
              <div
                aria-hidden={!isOpen}
                className="archive-l-folder"
                data-motion-state={isClosing ? 'closing' : isOpen ? 'open' : 'closed'}
                data-open={isOpen ? 'true' : 'false'}
                inert={!isOpen}
              >
                <div aria-hidden="true" className="archive-folder-back" />
                <div aria-hidden="true" className="archive-folder-spine" />

                {archiveItems.map((item, index) => (
                  <TransitionLink
                    aria-label={`${item.title} 보기`}
                    className={`archive-folder-item archive-folder-item-${index + 1}`}
                    key={item.id}
                    to={item.href}
                  >
                    <ImageTile
                      alt={item.alt}
                      className="archive-folder-image"
                      fallbackSrcs={item.fallbackSrcs}
                      imgClassName={item.kind === 'PHOTO' ? 'people-photo-tone' : undefined}
                      objectFit="contain"
                      sizes="(min-width: 1100px) 230px, calc(100vw - 40px)"
                      src={item.src}
                      transform={
                        item.kind === 'VIDEO'
                          ? undefined
                          : {
                              quality: item.kind === 'PHOTO' ? 76 : 82,
                              resize: 'contain',
                              width: item.kind === 'PHOTO' ? 640 : 720,
                              widths:
                                item.kind === 'PHOTO'
                                  ? [320, 480, 640]
                                  : [360, 540, 720, 960],
                            }
                      }
                    />
                    <span className="archive-folder-item-kind">{item.kind}</span>
                    <strong title={item.title}>{item.title}</strong>
                  </TransitionLink>
                ))}

                <div aria-hidden="true" className="archive-folder-front">
                  <span>SEOUL MOTET YOUTH CHOIR</span>
                  <strong>ARCHIVE</strong>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </>
  )
}
