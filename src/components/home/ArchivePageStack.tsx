import { useState } from 'react'

import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { ImageTile } from './ImageTile'

type ArchivePageStackProps = {
  buttonLabel: string
  description: string
  images: GalleryImage[]
  posters?: Poster[]
  videos?: VideoItem[]
}

type ArchivePreviewItem = {
  alt: string
  href: string
  id: string
  kind: 'PHOTO' | 'POSTER' | 'VIDEO'
  src: string
  title: string
}

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
  images,
  posters = [],
  videos = [],
}: ArchivePageStackProps) {
  const [isOpen, setIsOpen] = useState(false)
  const archiveItems = buildArchiveItems(images, videos, posters)

  if (archiveItems.length === 0) {
    return (
      <div className="mt-9">
        <EmptyState
          action={
            <Button href="/gallery" variant="secondary">
              {buttonLabel}
            </Button>
          }
          description="새로운 공연과 연습 기록이 등록되면 이 공간에 소개됩니다."
          title="등록된 갤러리 자료가 없습니다"
        />
      </div>
    )
  }

  return (
    <div className="archive-preview-layout mt-9">
      <Reveal variant="fade-up">
        <div className="archive-preview-copy">
          <p className="type-eyebrow text-gold-warm">ARCHIVE BOOK</p>
          <h3 className="type-section-title mt-4 text-navy-deep">기록 펼치기</h3>
          <p className="type-body mt-5 text-text-muted">{description}</p>
          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? '갤러리 기록 접기' : '갤러리 기록 펼치기'}
            className="archive-inline-toggle mt-7"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {isOpen ? '접기' : '기록 펼치기'}
          </button>
        </div>
      </Reveal>

      <Reveal delay={80} variant="card-rise">
        <div className="archive-folder-stage">
          <div
            className="archive-l-folder"
            data-open={isOpen ? 'true' : 'false'}
          >
            <div aria-hidden="true" className="archive-folder-back" />
            <div aria-hidden="true" className="archive-folder-spine" />

            {archiveItems.map((item, index) => (
              <a
                aria-label={`${item.title} 보기`}
                className={`archive-folder-item archive-folder-item-${index + 1}`}
                href={item.href}
                key={item.id}
              >
                <ImageTile
                  alt={item.alt}
                  className="archive-folder-image"
                  objectFit="contain"
                  sizes="(min-width: 1100px) 230px, calc(100vw - 40px)"
                  src={item.src}
                />
                <strong>{item.title}</strong>
              </a>
            ))}

            <div aria-hidden="true" className="archive-folder-front" />
          </div>
        </div>
      </Reveal>
    </div>
  )
}
