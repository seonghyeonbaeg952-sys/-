import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
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
  description = '연습과 공연, 초청 무대의 순간을 사진과 영상으로 아카이브합니다.',
  eyebrow = 'GALLERY',
  images,
  posters = [],
  title = '무대의 순간',
  videos = [],
}: GalleryPreviewProps) {
  return (
    <section
      className="flow-section home-section relative overflow-hidden bg-bg-warm-white"
      data-flow-section="archive-stack"
    >
      <Container>
        <Reveal variant="fade-up">
          <SectionTitle
            description={description}
            eyebrow={eyebrow}
            title={title}
          />
        </Reveal>
        <ArchivePageStack
          buttonLabel={buttonLabel}
          description={description}
          images={images}
          posters={posters}
          title={title}
          videos={videos}
        />
      </Container>
    </section>
  )
}
