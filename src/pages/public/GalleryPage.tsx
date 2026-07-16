import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { SeoHead } from '../../components/common/SeoHead'
import { Reveal } from '../../components/common/Reveal'
import { StaffFrame } from '../../components/common/StaffFrame'
import { StaffLines } from '../../components/common/StaffLines'
import { VisualArchivePanel } from '../../components/common/VisualArchivePanel'
import { ImageTile } from '../../components/home/ImageTile'
import { useGalleryData } from '../../hooks/usePublicData'
import { getCollectionLayoutMode } from '../../utils/collectionLayout'
import { formatKoreanDate } from '../../utils/formatDate'
import { getYouTubeEmbedUrl } from '../../utils/youtube'

type GalleryTab = 'photos' | 'posters' | 'videos'

const tabs: Array<{ label: string; value: GalleryTab }> = [
  { label: '사진', value: 'photos' },
  { label: '영상', value: 'videos' },
  { label: '포스터', value: 'posters' },
]

const galleryCategoryLabels: Record<string, string> = {
  archive: '아카이브',
  concert: '공연',
  event: '행사',
  practice: '연습',
}

function getGalleryCategoryLabel(category: string) {
  return galleryCategoryLabels[category] ?? category
}

function GalleryArchiveEmpty({ type }: { type: GalleryTab }) {
  const labels: Record<GalleryTab, { eyebrow: string; title: string; description: string }> = {
    photos: {
      description: '현재 공개된 공연·연습 사진이 없습니다.',
      eyebrow: 'PHOTO ARCHIVE',
      title: '사진 아카이브',
    },
    posters: {
      description: '포스터 이미지는 공연 자료 아카이브처럼 3:4 비율로 표시됩니다.',
      eyebrow: 'POSTER ARCHIVE',
      title: '공연 포스터 아카이브',
    },
    videos: {
      description: '현재 공개된 공연 영상이 없습니다.',
      eyebrow: 'VIDEO ARCHIVE',
      title: '영상 아카이브',
    },
  }
  const content = labels[type]

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <VisualArchivePanel
        description={content.description}
        eyebrow={content.eyebrow}
        title={content.title}
      />
      <div className="grid grid-cols-2 gap-3">
        {['01', '02', '03', '04'].map((label) => (
          <div
            aria-hidden="true"
            className="min-h-36 rounded-balanced border border-line-default bg-linear-to-br from-bg-warm-white via-bg-ivory to-gold-soft/30 p-4 shadow-card"
            key={label}
          >
            <span className="text-sm font-semibold text-gold-warm">{label}</span>
            <StaffLines className="mt-12 opacity-50" density="light" variant="navy" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function GalleryPage() {
  const galleryData = useGalleryData()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedGalleryTab = searchParams.get('tab')
  const activeTab =
    requestedGalleryTab === 'photos' ||
    requestedGalleryTab === 'posters' ||
    requestedGalleryTab === 'videos'
      ? requestedGalleryTab
      : 'photos'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [selectedPosterIndex, setSelectedPosterIndex] = useState<number | null>(null)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
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
  const selectedPoster =
    selectedPosterIndex === null
      ? null
      : galleryData.data.posters[selectedPosterIndex] ?? null
  const selectedVideo =
    selectedVideoIndex === null ? null : galleryData.data.videos[selectedVideoIndex] ?? null
  const selectedVideoEmbedUrl = selectedVideo
    ? getYouTubeEmbedUrl(selectedVideo.video_url)
    : ''
  const photoLayoutMode = getCollectionLayoutMode(filteredImages.length)
  const videoLayoutMode = getCollectionLayoutMode(galleryData.data.videos.length)
  const posterLayoutMode = getCollectionLayoutMode(galleryData.data.posters.length)
  const closeDetail = useCallback(() => {
    setSelectedPhotoIndex(null)
    setSelectedPosterIndex(null)
    setSelectedVideoIndex(null)
  }, [])

  const updateGalleryTab = (tab: GalleryTab) => {
    const nextParams = new URLSearchParams(searchParams)

    setSelectedPhotoIndex(null)
    setSelectedPosterIndex(null)
    setSelectedVideoIndex(null)
    nextParams.set('tab', tab)
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    if (!selectedPhoto && !selectedPoster && !selectedVideo) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetail()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDetail, selectedPhoto, selectedPoster, selectedVideo])

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
      <SeoHead
        description="서울모테트청소년합창단의 공연, 연습, 포스터와 영상 기록을 확인합니다."
        path="/gallery"
        title="갤러리"
      />
      <PageHero
        description="공연과 연습, 포스터와 영상 자료를 아카이브처럼 모아 봅니다."
        eyebrow="ARCHIVE"
        title="갤러리"
      />
      <Container className="page-main">
        {galleryData.error ? (
          <div className="mb-6">
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 갤러리 정보를 표시합니다."
              title="기본 갤러리 정보로 표시 중입니다"
            />
          </div>
        ) : null}

        <Reveal>
          <AnimatedSectionTabs
            activeValue={activeTab}
            ariaLabel="갤러리 탭"
            className="inline-flex rounded-pill border border-line-default bg-bg-warm-white p-2 shadow-card"
            onChange={updateGalleryTab}
            tabs={tabs}
          />
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
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-ivory/65 px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">전체</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getGalleryCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>

            {filteredImages.length === 0 ? (
              <div className="mt-8">
                <GalleryArchiveEmpty type="photos" />
                <div className="mt-5">
                  <EmptyState title="등록된 사진이 없습니다" />
                </div>
              </div>
            ) : (
              <div
                className="gallery-grid photos mt-8"
                data-mode={photoLayoutMode}
              >
                {filteredImages.map((image, index) => (
                  <button
                    className="gallery-card group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                    key={image.id}
                    onClick={() => {
                      setSelectedPosterIndex(null)
                      setSelectedPhotoIndex(index)
                    }}
                    type="button"
                  >
                    <ImageTile
                      alt={image.image_alt}
                      className="gallery-card-media aspect-[3/2] rounded-none bg-bg-ivory shadow-card transition duration-200 group-hover:-translate-y-[3px] group-hover:shadow-card-hover motion-reduce:group-hover:translate-y-0"
                      imgClassName="people-photo-tone transition duration-300 group-hover:scale-[1.01] motion-reduce:group-hover:scale-100"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      objectFit="contain"
                      priority={index < 2}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 33vw, 50vw"
                      src={image.image_url}
                      transform={{
                        quality: 76,
                        resize: 'contain',
                        width: 840,
                        widths: [360, 540, 720, 840],
                      }}
                    >
                      <div className="absolute inset-0 flex items-end bg-navy-midnight/70 p-4 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-soft">
                            자세히 보기
                          </p>
                          <p className="mt-1 text-sm font-semibold text-bg-warm-white">
                            {image.title}
                          </p>
                        </div>
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
              <>
                <GalleryArchiveEmpty type="videos" />
                <div className="mt-5">
                  <EmptyState title="등록된 영상이 없습니다" />
                </div>
              </>
            ) : (
              <div
                className="gallery-grid videos"
                data-mode={videoLayoutMode}
              >
                {galleryData.data.videos.map((video) => (
                  <Reveal key={video.id}>
                    <Card className="gallery-card overflow-hidden" hoverable radius="balanced">
                      <button
                        className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!getYouTubeEmbedUrl(video.video_url)}
                        onClick={() => {
                          setSelectedPhotoIndex(null)
                          setSelectedPosterIndex(null)
                          setSelectedVideoIndex(
                            galleryData.data.videos.findIndex((item) => item.id === video.id),
                          )
                        }}
                        type="button"
                      >
                        <ImageTile
                          alt={`${video.title} 영상 썸네일`}
                          className="gallery-card-media aspect-video"
                          fallbackSrcs={video.thumbnail_fallback_urls}
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, calc(100vw - 40px)"
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
                          {!getYouTubeEmbedUrl(video.video_url) ? (
                            <p className="mt-3 rounded-button bg-bg-ivory px-3 py-2 text-sm leading-6 text-text-muted">
                              영상 링크를 확인할 수 없습니다.
                            </p>
                          ) : null}
                        </div>
                      </button>
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
              <>
                <GalleryArchiveEmpty type="posters" />
                <div className="mt-5">
                  <EmptyState title="등록된 포스터가 없습니다" />
                </div>
              </>
            ) : (
              <div
                className="gallery-grid posters"
                data-mode={posterLayoutMode}
              >
                {galleryData.data.posters.map((poster, index) => (
                  <Reveal key={poster.id}>
                    <Card className="gallery-card poster-card overflow-hidden" hoverable radius="formal">
                      <button
                        className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                        onClick={() => {
                          setSelectedPhotoIndex(null)
                          setSelectedPosterIndex(index)
                        }}
                        type="button"
                      >
                        <ImageTile
                          alt={`${poster.title} 포스터`}
                          className="gallery-card-media aspect-[3/4] bg-bg-ivory"
                          fallbackVariant="poster"
                          imgClassName="p-2"
                          objectFit="contain"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, calc(100vw - 40px)"
                          src={poster.image_url}
                          transform={{
                            quality: 84,
                            resize: 'contain',
                            width: 760,
                            widths: [420, 620, 760, 980],
                          }}
                        >
                          <div className="absolute inset-0 flex items-end bg-navy-midnight/70 p-4 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            <p className="text-sm font-semibold text-bg-warm-white">
                              포스터 자세히 보기
                            </p>
                          </div>
                        </ImageTile>
                        <div className="p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-warm">
                            POSTER
                          </p>
                          <h2 className="mt-2 break-keep text-lg font-semibold text-navy-deep">
                            {poster.title}
                          </h2>
                          {poster.concert_date ? (
                            <p className="mt-3 text-sm text-text-muted">
                              {formatKoreanDate(poster.concert_date)}
                            </p>
                          ) : null}
                        </div>
                      </button>
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
          className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-navy-midnight/90 p-4 backdrop-blur-sm"
          onMouseDown={closeDetail}
          role="dialog"
        >
          <div
            className="modal-panel max-h-[calc(100vh-2rem)] w-full max-w-5xl scale-100 overflow-y-auto rounded-balanced bg-bg-warm-white p-4 shadow-card transition duration-200 motion-safe:animate-[galleryModalIn_180ms_ease-out]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-navy-deep">
                  {selectedPhoto.title}
                </h2>
                {selectedPhoto.taken_at ? (
                  <p className="mt-1 text-sm text-text-muted">
                    {formatKoreanDate(selectedPhoto.taken_at)}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="갤러리 이미지 닫기"
                autoFocus
                className="flex size-11 shrink-0 items-center justify-center rounded-button border border-line-default text-navy-deep transition hover:border-gold-warm hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                onClick={closeDetail}
                type="button"
              >
                ×
              </button>
            </div>
            <StaffFrame linePosition="bottom" variant="gold">
              <ImageTile
                alt={selectedPhoto.image_alt}
                className="max-h-[82vh] min-h-[260px] rounded-formal bg-navy-midnight"
                imgClassName="object-contain"
                objectFit="contain"
                sizes="(min-width: 1024px) 960px, calc(100vw - 64px)"
                src={selectedPhoto.image_url}
                transform={{
                  quality: 86,
                  resize: 'contain',
                  width: 2200,
                  widths: [960, 1440, 2200],
                }}
              />
            </StaffFrame>
            <div className="mt-5 grid gap-3 rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-6 text-text-muted md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-navy-deep">
                  {getGalleryCategoryLabel(selectedPhoto.category)}
                </p>
                {selectedPhoto.description ? (
                  <p className="mt-2 whitespace-pre-line break-keep">
                    {selectedPhoto.description}
                  </p>
                ) : (
                  <p className="mt-2 break-keep">사진 설명이 준비 중입니다.</p>
                )}
              </div>
              {selectedPhoto.concert_id ? (
                <Button href={`/concerts/${selectedPhoto.concert_id}`} variant="secondary">
                  관련 공연 보기
                </Button>
              ) : null}
            </div>
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

      {selectedPoster ? (
        <div
          aria-modal="true"
          className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-navy-midnight/90 p-4 backdrop-blur-sm"
          onMouseDown={closeDetail}
          role="dialog"
        >
          <div
            className="modal-panel max-h-[calc(100vh-2rem)] w-full max-w-4xl scale-100 overflow-y-auto rounded-balanced bg-bg-warm-white p-4 shadow-card transition duration-200 motion-safe:animate-[galleryModalIn_180ms_ease-out]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-warm">
                  POSTER DETAIL
                </p>
                <h2 className="mt-1 break-keep text-lg font-semibold text-navy-deep">
                  {selectedPoster.title}
                </h2>
                {selectedPoster.concert_date ? (
                  <p className="mt-1 text-sm text-text-muted">
                    {formatKoreanDate(selectedPoster.concert_date)}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="포스터 상세 닫기"
                autoFocus
                className="flex size-11 shrink-0 items-center justify-center rounded-button border border-line-default text-navy-deep transition hover:border-gold-warm hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                onClick={closeDetail}
                type="button"
              >
                ×
              </button>
            </div>
            <StaffFrame
              className="mx-auto max-w-[520px]"
              linePosition="bottom"
              variant="gold"
            >
              <ImageTile
                alt={`${selectedPoster.title} 포스터`}
                className="max-h-[82vh] min-h-[280px] rounded-formal bg-bg-ivory"
                imgClassName="object-contain"
                fallbackVariant="poster"
                objectFit="contain"
                sizes="(min-width: 768px) 520px, calc(100vw - 64px)"
                src={selectedPoster.image_url}
                transform={{
                  quality: 86,
                  resize: 'contain',
                  width: 1800,
                  widths: [760, 1200, 1800],
                }}
              />
            </StaffFrame>
            <div className="mt-5 flex flex-col gap-3 rounded-button border border-line-default bg-bg-ivory p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-keep text-sm leading-6 text-text-muted">
                포스터 이미지를 크게 확인할 수 있습니다.
              </p>
              {selectedPoster.concert_id ? (
                <Button href={`/concerts/${selectedPoster.concert_id}`} variant="secondary">
                  관련 공연 보기
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedVideo && selectedVideoEmbedUrl ? (
        <div
          aria-modal="true"
          className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-navy-midnight/90 p-4 backdrop-blur-sm"
          onMouseDown={closeDetail}
          role="dialog"
        >
          <div
            className="modal-panel w-full max-w-5xl scale-100 overflow-hidden rounded-balanced bg-bg-warm-white p-4 shadow-card transition duration-200 motion-safe:animate-[galleryModalIn_180ms_ease-out]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-warm">
                  VIDEO
                </p>
                <h2 className="mt-1 break-keep text-lg font-semibold text-navy-deep">
                  {selectedVideo.title}
                </h2>
              </div>
              <button
                aria-label="영상 닫기"
                autoFocus
                className="flex size-11 shrink-0 items-center justify-center rounded-button border border-line-default text-navy-deep transition hover:border-gold-warm hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                onClick={closeDetail}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-formal bg-navy-midnight">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="size-full border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={selectedVideoEmbedUrl}
                title={`${selectedVideo.title} 영상`}
              />
            </div>
            {selectedVideo.description ? (
              <p className="mt-4 break-keep rounded-button border border-line-default bg-bg-ivory p-4 text-sm leading-7 text-text-muted">
                {selectedVideo.description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
