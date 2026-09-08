import { useEffect, useState } from 'react'

import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { ArchivePageStack } from './ArchivePageStack'
import { ArchivePageStackLegacy } from './ArchivePageStackLegacy'
import { ResponsiveArchive } from './ResponsiveArchive'

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
  approvedResponsive?: boolean
  buttonLabel?: string
  collapseLabel?: string
  desktopTitle?: string
  description?: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow?: string
  expandLabel?: string
  images: GalleryImage[]
  leadDescription?: string
  posters?: Poster[]
  title?: string
  videos?: VideoItem[]
}

export function GalleryPreview({
  approvedResponsive = false,
  buttonLabel = '갤러리 보기',
  collapseLabel = '접기',
  desktopTitle = '한 번의 무대는\n세 가지 기록으로\n오래 남습니다',
  description = '공연 사진, 연습 사진, 영상, 포스터를 확인합니다.',
  emptyDescription,
  emptyTitle,
  eyebrow = 'GALLERY',
  expandLabel = '기록 펼치기',
  images,
  leadDescription = '사진은 순간을 붙잡고, 포스터는 사람을 부르며, 영상은 마지막 음 이후의 시간을 이어갑니다.',
  posters = [],
  title = '활동 기록',
  videos = [],
}: GalleryPreviewProps) {
  const isDesktop = useDesktopArchiveLayout()

  if (approvedResponsive && !isDesktop) {
    return <ResponsiveArchive buttonLabel={buttonLabel} categoryLabel={title} emptyDescription={emptyDescription} emptyTitle={emptyTitle} eyebrow={eyebrow} images={images} posters={posters} title={desktopTitle} videos={videos} />
  }

  const archiveProps = {
    buttonLabel,
    collapseLabel,
    desktopTitle,
    description,
    emptyDescription,
    emptyTitle,
    eyebrow,
    expandLabel,
    images,
    leadDescription,
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
