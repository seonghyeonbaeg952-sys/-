import type { GalleryImage } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { SectionTitle } from '../common/SectionTitle'
import { ImageTile } from './ImageTile'

type GalleryPreviewProps = {
  images: GalleryImage[]
}

export function GalleryPreview({ images }: GalleryPreviewProps) {
  const visibleImages = [...images]
    .filter((image) => image.is_visible)
    .sort((first, second) => first.display_order - second.display_order)
    .slice(0, 6)

  return (
    <section className="bg-bg-warm-white py-section-mobile lg:py-section-desktop">
      <Container>
        <SectionTitle
          action={
            <Button href="/gallery" variant="secondary">
              갤러리 보기
            </Button>
          }
          description="연습과 공연, 초청 무대의 순간을 사진과 영상으로 아카이브합니다."
          eyebrow="GALLERY"
          title="무대의 순간"
        />

        {visibleImages.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              description="공개 상태의 갤러리 이미지가 등록되면 이 영역에 표시됩니다."
              title="등록된 갤러리 이미지가 없습니다"
            />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5">
            {visibleImages.map((image, index) => (
              <a
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                href="/gallery"
                key={image.id}
              >
                <ImageTile
                  alt={image.image_alt}
                  className={[
                    'aspect-[4/3] rounded-card shadow-card',
                    index === 0 ? 'md:col-span-2 md:row-span-2' : '',
                  ].join(' ')}
                  src={image.image_url}
                >
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-navy-midnight/74 via-transparent to-transparent p-5 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="text-sm font-semibold text-bg-warm-white">
                      {image.title}
                    </p>
                  </div>
                </ImageTile>
              </a>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
