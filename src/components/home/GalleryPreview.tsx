import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { ArchivePageStack } from './ArchivePageStack'

type GalleryPreviewProps = {
  buttonLabel?: string
  description?: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow?: string
  images: GalleryImage[]
  posters?: Poster[]
  title?: string
  videos?: VideoItem[]
}

export function GalleryPreview({
  buttonLabel = '갤러리 보기',
  description = '공연 사진, 연습 사진, 영상, 포스터를 확인합니다.',
  emptyDescription,
  emptyTitle,
  eyebrow = 'GALLERY',
  images,
  posters = [],
  title = '활동 기록',
  videos = [],
}: GalleryPreviewProps) {
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
      <Container>
        <ArchivePageStack
          buttonLabel={buttonLabel}
          description={description}
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          eyebrow={eyebrow}
          images={images}
          posters={posters}
          videos={videos}
        />
      </Container>
    </section>
  )
}
