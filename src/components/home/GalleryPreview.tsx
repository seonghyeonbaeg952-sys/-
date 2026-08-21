import { useEffect, useState } from 'react'

import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { ArchivePageStack } from './ArchivePageStack'
import { ArchivePageStackLegacy } from './ArchivePageStackLegacy'

const desktopArchiveQuery = '(min-width: 1024px)'

function useDesktopArchiveLayout() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(desktopArchiveQuery).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(desktopArchiveQuery)
    const update = () => setIsDesktop(query.matches)

    update()
    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [])

  return isDesktop
}

type GalleryPreviewProps = {
  buttonLabel?: string
  collapseLabel?: string
  description?: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow?: string
  expandLabel?: string
  images: GalleryImage[]
  posters?: Poster[]
  title?: string
  videos?: VideoItem[]
}

export function GalleryPreview({
  buttonLabel = '갤러리 보기',
  collapseLabel = '접기',
  description = '공연 사진, 연습 사진, 영상, 포스터를 확인합니다.',
  emptyDescription,
  emptyTitle,
  eyebrow = 'GALLERY',
  expandLabel = '기록 펼치기',
  images,
  posters = [],
  title = '활동 기록',
  videos = [],
}: GalleryPreviewProps) {
  const isDesktop = useDesktopArchiveLayout()

  const archiveProps = {
    buttonLabel,
    collapseLabel,
    description,
    emptyDescription,
    emptyTitle,
    eyebrow,
    expandLabel,
    images,
    posters,
    title,
    videos,
  }

  return (
    <section
      aria-label={title}
      className="flow-section home-section relative overflow-hidden bg-bg-warm-white"
      data-flow-section="archive-stack"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--archive"
        label="기록"
        noteOffset={39}
        symbol="♬"
      />
      {isDesktop ? (
        <ArchivePageStack {...archiveProps} />
      ) : (
        <Container>
          <ArchivePageStackLegacy {...archiveProps} />
        </Container>
      )}
    </section>
  )
}
