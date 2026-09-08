import { useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { EmptyState } from '../../components/common/EmptyState'
import { FilterSelect } from '../../components/common/FilterSelect'
import { LoadingState } from '../../components/common/LoadingState'
import { OptimizedImage } from '../../components/common/OptimizedImage'
import { SeoHead } from '../../components/common/SeoHead'
import { GalleryViewer } from '../../components/gallery/GalleryViewer'
import {
  getAdjacentMediaId, getGalleryCategoryLabel, getGalleryVideoLinks, getGalleryView,
  readGalleryLocation, updateGallerySearch, type GalleryTab,
} from '../../components/gallery/galleryViewModel'
import { useGalleryData } from '../../hooks/usePublicData'
import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'
import '../../styles/gallery-page.css'

const tabs = [
  { label: '사진', value: 'photos' as const, id: 'gallery-tab-photos', panelId: 'gallery-panel-photos' },
  { label: '영상', value: 'videos' as const, id: 'gallery-tab-videos', panelId: 'gallery-panel-videos' },
  { label: '포스터', value: 'posters' as const, id: 'gallery-tab-posters', panelId: 'gallery-panel-posters' },
]
type OpenMedia = (id: string, trigger: HTMLButtonElement) => void

function MediaFigure({ item, poster = false, lead = false, priority = false, onOpen }: {
  item: GalleryImage | Poster
  poster?: boolean
  lead?: boolean
  priority?: boolean
  onOpen: OpenMedia
}) {
  const date = 'taken_at' in item ? item.taken_at : 'concert_date' in item ? item.concert_date : undefined
  return (
    <article className={['gallery-journal__figure', lead ? 'gallery-journal__figure--lead' : '', poster ? 'gallery-journal__figure--poster' : ''].join(' ')}>
      <button
        aria-label={item.title + (poster ? ' 포스터' : ' 사진') + ' 크게 보기'}
        className="gallery-journal__media-button"
        onClick={event => onOpen(item.id, event.currentTarget)}
        type="button"
      >
        <OptimizedImage
          alt={'image_alt' in item ? item.image_alt : item.title + ' 포스터'}
          className={'gallery-journal__image ' + (poster ? 'gallery-journal__image--poster' : lead ? 'gallery-journal__image--wide' : 'gallery-journal__image--photo')}
          fallbackLabel="이미지를 불러올 수 없습니다"
          fallbackVariant={poster ? 'poster' : 'gallery'}
          objectFit="contain"
          priority={priority}
          sizes={poster ? '(min-width: 1200px) 408px, (min-width: 640px) 44vw, calc(100vw - 48px)' : lead ? '(min-width: 1536px) 864px, (min-width: 1200px) 56vw, calc(100vw - 48px)' : '(min-width: 1536px) 472px, (min-width: 640px) 44vw, calc(100vw - 48px)'}
          src={item.image_url}
          transform={{ quality: 84, resize: 'contain', width: lead ? 1600 : 980, widths: [420, 760, 980, 1600] }}
        />
        <span className="gallery-journal__category">{'category' in item ? getGalleryCategoryLabel(item.category) : '포스터'}</span>
        <h2 className="gallery-journal__media-title">{item.title}</h2>
        {date ? <span className="gallery-journal__date">{formatKoreanDate(date)}</span> : null}
        <span className="gallery-journal__media-action">{poster ? '포스터' : '사진'} 크게 보기 <span aria-hidden="true">↗</span></span>
      </button>
    </article>
  )
}

function VideoFigure({ video, onOpen }: { video: VideoItem; onOpen: OpenMedia }) {
  const playable = Boolean(getGalleryVideoLinks(video.video_url))
  return (
    <article className="gallery-journal__video">
      <button
        aria-label={video.title + ' 영상 보기'}
        className="gallery-journal__video-thumbnail"
        disabled={!playable}
        onClick={event => onOpen(video.id, event.currentTarget)}
        type="button"
      >
        <OptimizedImage
          alt={video.title + ' 영상 썸네일'}
          className="gallery-journal__image gallery-journal__image--wide"
          fallbackLabel="영상 썸네일을 불러올 수 없습니다"
          fallbackSrcs={video.thumbnail_fallback_urls}
          objectFit="contain"
          sizes="(min-width: 1536px) 864px, (min-width: 1200px) 56vw, calc(100vw - 48px)"
          src={video.thumbnail_url}
        />
      </button>
      <div className="gallery-journal__video-copy">
        <p className="gallery-journal__category">공연 영상</p>
        <h2 className="gallery-journal__media-title">{video.title}</h2>
        {video.description ? <p className="gallery-journal__description">{video.description}</p> : null}
        {playable ? (
          <button className="gallery-journal__command" onClick={event => onOpen(video.id, event.currentTarget)} type="button">영상 보기 <span aria-hidden="true">↗</span></button>
        ) : <p className="gallery-journal__description">영상 링크를 확인할 수 없습니다.</p>}
      </div>
    </article>
  )
}

export function GalleryPage() {
  const galleryData = useGalleryData()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tab, category, mediaId } = readGalleryLocation(searchParams)
  const view = useMemo(() => getGalleryView(galleryData.data, category), [galleryData.data, category])
  const openedFromList = useRef<string | null>(null)
  const items = tab === 'photos' ? view.images : tab === 'videos' ? view.videos : view.posters
  const selectedItem = items.find(item => item.id === mediaId)
  const selectedIndex = items.findIndex(item => item.id === mediaId)
  const selectedIsPlayable = selectedItem && ('video_url' in selectedItem ? Boolean(getGalleryVideoLinks(selectedItem.video_url)) : true)
  const categoryOptions = [{ value: 'all', label: '전체 분류' }, ...view.categories]
  if (category !== 'all' && !categoryOptions.some(option => option.value === category)) {
    categoryOptions.push({ value: category, label: getGalleryCategoryLabel(category) + ' (결과 없음)' })
  }

  const closeDetail = useCallback(() => {
    const next = updateGallerySearch(searchParams, { mediaId: null })
    if (openedFromList.current === next.toString()) {
      openedFromList.current = null
      navigate(-1)
    } else {
      setSearchParams(next, { replace: true, preventScrollReset: true })
    }
  }, [navigate, searchParams, setSearchParams])

  function openMedia(id: string, trigger: HTMLButtonElement) {
    trigger.focus({ preventScroll: true })
    openedFromList.current = updateGallerySearch(searchParams, { mediaId: null }).toString()
    setSearchParams(updateGallerySearch(searchParams, { mediaId: id }), { preventScrollReset: true })
  }

  function changeTab(nextTab: GalleryTab) {
    if (nextTab === tab) return
    setSearchParams(updateGallerySearch(searchParams, { tab: nextTab, mediaId: null }), { preventScrollReset: true })
  }

  function changeCategory(value: string) {
    setSearchParams(updateGallerySearch(searchParams, { category: value, mediaId: null }), { preventScrollReset: true })
  }

  function moveMedia(direction: 'next' | 'previous') {
    if (!mediaId) return
    const nextId = getAdjacentMediaId(items, mediaId, direction)
    if (nextId) setSearchParams(updateGallerySearch(searchParams, { mediaId: nextId }), { replace: true, preventScrollReset: true })
  }

  const featuredPhotos = category === 'all' ? view.images.slice(0, 2) : []
  const remainingPhotos = category === 'all' ? view.images.slice(2) : view.images

  return (
    <div className="gallery-journal">
      <SeoHead description="서울모테트청소년합창단의 공연, 연습, 포스터와 영상 기록을 확인합니다." path="/gallery" title="갤러리" />
      <div className="gallery-journal__shell">
        <header className="gallery-journal__intro">
          <p className="gallery-journal__eyebrow">SEOUL MOTET YOUTH CHOIR</p>
          <div className="gallery-journal__intro-row">
            <h1>갤러리</h1>
            <p className="gallery-journal__description">공연과 연습, 함께한 순간들을<br />사진과 영상으로 만나보세요.</p>
          </div>
        </header>

        <div className="gallery-journal__controls">
          <AnimatedSectionTabs activeValue={tab} ariaLabel="갤러리 자료" className="gallery-journal__tabs" onChange={changeTab} tabs={tabs} />
          <div className="gallery-journal__filter-row">
            {tab === 'photos' ? (
              <FilterSelect className="gallery-journal__select" label="사진 분류" onChange={changeCategory} options={categoryOptions} value={category} />
            ) : <span className="gallery-journal__collection-label">전체 {tab === 'videos' ? '영상' : '포스터'}</span>}
            <p className="gallery-journal__hint">{tab === 'videos' ? '영상을 눌러 재생' : tab === 'posters' ? '포스터를 눌러 확대' : '사진을 눌러 확대'}</p>
          </div>
        </div>

        {galleryData.error ? (
          <div className="gallery-journal__notice" role="status">
            <p>일부 자료를 불러오지 못했습니다. 불러온 자료는 계속 볼 수 있습니다.</p>
            <button className="gallery-journal__text-button" disabled={galleryData.isLoading} onClick={galleryData.refetch} type="button">다시 시도</button>
          </div>
        ) : null}

        {mediaId && !galleryData.isLoading && !selectedIsPlayable ? (
          <div className="gallery-journal__notice" role="status">
            <p>{selectedItem ? '영상 링크를 확인할 수 없습니다.' : '선택한 자료가 없거나 현재 공개되지 않았습니다.'}</p>
            <button className="gallery-journal__text-button" onClick={closeDetail} type="button">목록으로 돌아가기</button>
          </div>
        ) : null}

        <section
          aria-busy={galleryData.isLoading}
          aria-labelledby={'gallery-tab-' + tab}
          className="gallery-journal__collection"
          id={'gallery-panel-' + tab}
          role="tabpanel"
          tabIndex={0}
        >
          {galleryData.isLoading && items.length === 0 ? <LoadingState label="갤러리를 불러오는 중입니다" /> : null}
          {!galleryData.isLoading && items.length === 0 ? (
            <EmptyState
              action={tab === 'photos' && category !== 'all' ? <button className="gallery-journal__command" onClick={() => changeCategory('all')} type="button">전체 사진 보기</button> : undefined}
              description={tab === 'photos' && category !== 'all' ? '다른 분류를 선택하거나 전체 사진을 확인해 주세요.' : galleryData.error ? '자료를 다시 불러오려면 위의 다시 시도를 눌러 주세요.' : '새로운 자료가 등록되면 이곳에서 확인할 수 있습니다.'}
              title={tab === 'photos' && category !== 'all' ? '선택한 분류의 사진이 없습니다' : '등록된 ' + (tab === 'photos' ? '사진이' : tab === 'videos' ? '영상이' : '포스터가') + ' 없습니다'}
            />
          ) : null}

          {tab === 'photos' && featuredPhotos.length > 0 ? (
            <div className="gallery-journal__photo-lead" data-single={featuredPhotos.length === 1 || undefined}>
              <MediaFigure item={featuredPhotos[0]} lead onOpen={openMedia} priority />
              {featuredPhotos[1] ? <div className="gallery-journal__photo-side">
                <p className="gallery-journal__side-title">무대와 연습의 기록</p>
                <MediaFigure item={featuredPhotos[1]} onOpen={openMedia} priority />
              </div> : null}
            </div>
          ) : null}
          {tab === 'photos' && remainingPhotos.length > 0 ? (
            <div className="gallery-journal__photo-grid" data-separated={featuredPhotos.length > 0 || undefined}>
              {remainingPhotos.map(item => <MediaFigure item={item} key={item.id} onOpen={openMedia} />)}
            </div>
          ) : null}
          {tab === 'videos' && view.videos.length > 0 ? (
            <div className="gallery-journal__videos">
              {view.videos.map(video => <VideoFigure key={video.id} onOpen={openMedia} video={video} />)}
            </div>
          ) : null}
          {tab === 'posters' && view.posters.length > 0 ? (
            <div className="gallery-journal__posters">
              <div className="gallery-journal__poster-grid">
                {view.posters.map(item => <MediaFigure item={item} key={item.id} onOpen={openMedia} poster />)}
              </div>
              <aside className="gallery-journal__poster-note">
                <h2>포스터에 담긴 소식</h2>
                <p>포스터를 누르면 원본을 크게 볼 수 있습니다.<br />모집 및 공연 안내를 확인해 보세요.</p>
              </aside>
            </div>
          ) : null}
        </section>
      </div>
      {selectedItem && selectedIsPlayable ? <GalleryViewer count={items.length} index={selectedIndex} item={selectedItem} onClose={closeDetail} onMove={moveMedia} /> : null}
    </div>
  )
}
