import { useEffect, useMemo, useState } from 'react'

import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { ImageTile } from '../../components/home/ImageTile'
import { useGalleryData } from '../../hooks/usePublicData'

type GalleryTab = 'photos' | 'posters' | 'videos'

const tabs: Array<{ label: string; value: GalleryTab }> = [
  { label: '사진', value: 'photos' },
  { label: '영상', value: 'videos' },
  { label: '포스터', value: 'posters' },
]

export function GalleryPage() {
  const galleryData = useGalleryData()
  const [activeTab, setActiveTab] = useState<GalleryTab>('photos')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const categories = useMemo(() => {
    return Array.from(new Set(galleryData.data.images.map((image) => image.category)))
  }, [galleryData.data.images])
  const filteredImages = useMemo(() => {
    return galleryData.data.images.filter(
      (image) => categoryFilter === 'all' || image.category === categoryFilter,
    )
  }, [categoryFilter, galleryData.data.images])
  const selectedPhoto =
    selectedPhotoIndex === null ? null : filteredImages[selectedPhotoIndex] ?? null

  useEffect(() => {
    if (!selectedPhoto) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPhotoIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhoto])

  const goToPhoto = (direction: 'next' | 'previous') => {
    if (selectedPhotoIndex === null || filteredImages.length === 0) {
      return
    }

    const nextIndex =
      direction === 'next'
        ? (selectedPhotoIndex + 1) % filteredImages.length
        : (selectedPhotoIndex - 1 + filteredImages.length) % filteredImages.length

    setSelectedPhotoIndex(nextIndex)
  }

  return (
    <>
      <PageHero
        description="공연과 연습, 포스터와 영상 자료를 아카이브처럼 모아 봅니다."
        eyebrow="ARCHIVE"
        title="갤러리"
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {galleryData.error ? (
          <div className="mb-6">
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 갤러리 정보를 표시합니다."
              title="기본 갤러리 정보로 표시 중입니다"
            />
          </div>
        ) : null}

        <Reveal>
          <div aria-label="갤러리 탭" className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.value}
                className={[
                  'min-h-11 rounded-pill border px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                  activeTab === tab.value
                    ? 'border-gold-warm bg-gold-warm text-navy-midnight'
                    : 'border-line-default bg-bg-warm-white text-text-muted hover:border-gold-warm hover:text-navy-deep',
                ].join(' ')}
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {galleryData.isLoading ? (
          <div className="mt-8">
            <LoadingState label="갤러리를 불러오는 중입니다" />
          </div>
        ) : null}

        {!galleryData.isLoading && activeTab === 'photos' ? (
          <section className="mt-8" role="tabpanel">
            <label className="block max-w-xs">
              <span className="text-xs font-semibold text-text-muted">카테고리</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">전체</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            {filteredImages.length === 0 ? (
              <div className="mt-8">
                <EmptyState title="등록된 사진이 없습니다" />
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5">
                {filteredImages.map((image, index) => (
                  <button
                    className="group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                    key={image.id}
                    onClick={() => setSelectedPhotoIndex(index)}
                    type="button"
                  >
                    <ImageTile
                      alt={image.image_alt}
                      className="aspect-[4/3] rounded-card shadow-card transition duration-200 group-hover:-translate-y-[3px] group-hover:shadow-card-hover motion-reduce:group-hover:translate-y-0"
                      imgClassName="transition duration-300 group-hover:scale-[1.015] motion-reduce:group-hover:scale-100"
                      src={image.image_url}
                    >
                      <div className="absolute inset-0 flex items-end bg-navy-midnight/70 p-4 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        <p className="text-sm font-semibold text-bg-warm-white">
                          {image.title}
                        </p>
                      </div>
                    </ImageTile>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {!galleryData.isLoading && activeTab === 'videos' ? (
          <section className="mt-8" role="tabpanel">
            {galleryData.data.videos.length === 0 ? (
              <EmptyState title="등록된 영상이 없습니다" />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {galleryData.data.videos.map((video) => (
                  <Reveal key={video.id}>
                    <Card className="overflow-hidden" hoverable>
                      <a
                        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                        href={video.video_url || '#'}
                      >
                        <ImageTile
                          alt={`${video.title} 영상 썸네일`}
                          className="aspect-video"
                          src={video.thumbnail_url}
                        />
                        <div className="p-5">
                          <h2 className="text-lg font-semibold text-navy-deep">
                            {video.title}
                          </h2>
                          {video.description ? (
                            <p className="mt-3 text-sm leading-6 text-text-muted">
                              {video.description}
                            </p>
                          ) : null}
                        </div>
                      </a>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {!galleryData.isLoading && activeTab === 'posters' ? (
          <section className="mt-8" role="tabpanel">
            {galleryData.data.posters.length === 0 ? (
              <EmptyState title="등록된 포스터가 없습니다" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {galleryData.data.posters.map((poster) => (
                  <Reveal key={poster.id}>
                    <Card className="overflow-hidden" hoverable>
                      <ImageTile
                        alt={`${poster.title} 포스터`}
                        className="aspect-[3/4]"
                        src={poster.image_url}
                      />
                      <div className="p-5">
                        <h2 className="text-lg font-semibold text-navy-deep">
                          {poster.title}
                        </h2>
                        {poster.concert_id ? (
                          <Button
                            className="mt-4 w-full"
                            href={`/concerts/${poster.concert_id}`}
                            variant="secondary"
                          >
                            관련 공연 보기
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </Container>

      {selectedPhoto ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-midnight/88 p-4"
          onMouseDown={() => setSelectedPhotoIndex(null)}
          role="dialog"
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-card bg-bg-warm-white p-4 shadow-card"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-navy-deep">
                  {selectedPhoto.title}
                </h2>
                {selectedPhoto.taken_at ? (
                  <p className="mt-1 text-sm text-text-muted">
                    {selectedPhoto.taken_at}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="갤러리 이미지 닫기"
                className="flex size-11 shrink-0 items-center justify-center rounded-button border border-line-default text-navy-deep transition hover:border-gold-warm hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                onClick={() => setSelectedPhotoIndex(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <ImageTile
              alt={selectedPhoto.image_alt}
              className="max-h-[70vh] min-h-[260px] rounded-button"
              imgClassName="object-contain"
              src={selectedPhoto.image_url}
            />
            {filteredImages.length > 1 ? (
              <div className="mt-4 flex justify-between gap-3">
                <Button onClick={() => goToPhoto('previous')} variant="secondary">
                  이전
                </Button>
                <Button onClick={() => goToPhoto('next')} variant="secondary">
                  다음
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
