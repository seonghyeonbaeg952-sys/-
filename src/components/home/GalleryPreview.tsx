import type { GalleryImage } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
import { ImageTile } from './ImageTile'

type GalleryPreviewProps = {
  buttonLabel?: string
  description?: string
  images: GalleryImage[]
  title?: string
}

export function GalleryPreview({
  buttonLabel = '갤러리 보기',
  description = '연습과 공연, 초청 무대의 순간을 사진과 영상으로 아카이브합니다.',
  images,
  title = '무대의 순간',
}: GalleryPreviewProps) {
  const visibleImages = [...images]
    .filter((image) => image.is_visible)
    .sort((first, second) => first.display_order - second.display_order)
    .slice(0, 6)
  const firstImage = visibleImages[0]

  return (
    <section className="home-section relative overflow-hidden bg-bg-warm-white">
      <Container>
        <Reveal variant="fade-up">
          <SectionTitle
          action={
            <Button href="/gallery" variant="secondary">
              {buttonLabel}
            </Button>
          }
          description={description}
          eyebrow="GALLERY"
          title={title}
          />
        </Reveal>

        {visibleImages.length === 0 ? (
          <div className="mt-9">
            <EmptyState
              action={
                <Button href="/gallery" variant="secondary">
                  {buttonLabel}
                </Button>
              }
              description="새로운 공연과 연습 사진을 준비하고 있습니다."
              title="등록된 갤러리 이미지가 없습니다"
            />
          </div>
        ) : visibleImages.length === 1 && firstImage ? (
          <div className="home-gallery-feature mt-9">
            <Reveal variant="soft-scale">
              <a
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                href="/gallery"
              >
                <ImageTile
                  alt={firstImage.image_alt}
                  className="home-gallery-feature-image bg-bg-ivory shadow-card"
                  objectFit="contain"
                  sizes="(min-width: 1024px) 520px, calc(100vw - 40px)"
                  src={firstImage.image_url}
                />
              </a>
            </Reveal>
            <Reveal delay={80} variant="fade-up">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-warm">
                  GALLERY ARCHIVE
                </p>
                <h3 className="mt-4 break-keep text-3xl font-semibold leading-tight text-navy-deep">
                  {firstImage.title}
                </h3>
                {firstImage.description ? (
                  <p className="mt-4 break-keep text-base leading-8 text-text-muted">
                    {firstImage.description}
                  </p>
                ) : (
                  <p className="mt-4 break-keep text-base leading-8 text-text-muted">
                    공연과 연습의 순간을 더 자세히 보려면 갤러리에서 확인하세요.
                  </p>
                )}
                <Button className="mt-7" href="/gallery" variant="secondary">
                  {buttonLabel}
                </Button>
              </div>
            </Reveal>
          </div>
        ) : (
          <div className="home-gallery-grid mt-9">
            {visibleImages.map((image, index) => (
              <Reveal
                key={image.id}
                staggerIndex={index}
                variant="card-rise"
              >
                <a
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                  href="/gallery"
                >
                <ImageTile
                  alt={image.image_alt}
                  className="aspect-[3/2] rounded-none bg-bg-ivory shadow-card"
                  objectFit="contain"
                  sizes="(min-width: 1200px) 380px, (min-width: 768px) 33vw, 50vw"
                  src={image.image_url}
                >
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-navy-midnight/74 via-transparent to-transparent p-5 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="text-sm font-semibold text-bg-warm-white">
                      {image.title}
                    </p>
                  </div>
                </ImageTile>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
