import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffSectionLabel } from '../common/StaffSectionLabel'
import { ArchivePageStack } from './ArchivePageStack'

type GalleryPreviewProps = {
  buttonLabel?: string
  description?: string
  eyebrow?: string
  images: GalleryImage[]
  posters?: Poster[]
  title?: string
  videos?: VideoItem[]
}

export function GalleryPreview({
  buttonLabel = '갤러리 보기',
  description = '무대와 연습, 기록의 장면을 차분하게 모았습니다.',
  eyebrow = 'GALLERY',
  images,
  posters = [],
  title = '무대의 시간',
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
            <Button href="/gallery" variant="secondary">
              {buttonLabel}
            </Button>
          </div>
        </Reveal>
        <ArchivePageStack
          buttonLabel={buttonLabel}
          description={description}
          images={images}
          posters={posters}
          videos={videos}
        />
      </Container>
    </section>
  )
}
