import { FormattedCopy } from '../../components/site-editor/FormattedCopy'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
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
import { usePageCopy } from '../../components/site-editor/usePageCopy'
import { CopyLines } from '../../components/site-editor/SiteCopy'
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
  const { copy: copyText } = useSiteEditor()
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
          fallbackLabel={copyText("gallery", "gallery.fixed.GalleryPage.7f6db8b4d5", "이미지를 불러올 수 없습니다")}
          fallbackVariant={poster ? 'poster' : 'gallery'}
          objectFit="contain"
          priority={priority}
          sizes={poster ? '(min-width: 1200px) 408px, (min-width: 640px) 44vw, calc(100vw - 48px)' : lead ? '(min-width: 1536px) 864px, (min-width: 1200px) 56vw, calc(100vw - 48px)' : '(min-width: 1536px) 472px, (min-width: 640px) 44vw, calc(100vw - 48px)'}
          src={item.image_url}
          transform={{ quality: 84, resize: 'contain', width: lead ? 1600 : 980, widths: [420, 760, 980, 1600] }}
        />
        <span className="gallery-journal__category">{'category' in item ? <FormattedCopy page="gallery" id={`gallery.category.${item.category.trim() || 'archive'}`} text={copyText('gallery', `gallery.category.${item.category.trim() || 'archive'}`, getGalleryCategoryLabel(item.category))}>{copyText('gallery', `gallery.category.${item.category.trim() || 'archive'}`, getGalleryCategoryLabel(item.category))}</FormattedCopy> : <FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.6386eae70b" text={copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}>{copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}</FormattedCopy>}</span>
        <h2 className="gallery-journal__media-title">{item.title}</h2>
        {date ? <span className="gallery-journal__date">{formatKoreanDate(date)}</span> : null}
        <span className="gallery-journal__media-action">{poster ? <FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.6386eae70b" text={copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}>{copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}</FormattedCopy> : <FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.1f872b5045" text={copyText("gallery", "gallery.fixed.GalleryPage.1f872b5045", "사진")}>{copyText("gallery", "gallery.fixed.GalleryPage.1f872b5045", "사진")}</FormattedCopy>}{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.f62132629c" text={copyText("gallery", "gallery.fixed.GalleryPage.f62132629c", " 크게 보기 ")}>{copyText("gallery", "gallery.fixed.GalleryPage.f62132629c", " 크게 보기 ")}</FormattedCopy>}<span aria-hidden="true">↗</span></span>
      </button>
    </article>
  )
}

function VideoFigure({ video, onOpen }: { video: VideoItem; onOpen: OpenMedia }) {
  const { copy: copyText } = useSiteEditor()
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
          fallbackLabel={copyText("gallery", "gallery.fixed.GalleryPage.9ca78e4ac4", "영상 썸네일을 불러올 수 없습니다")}
          fallbackSrcs={video.thumbnail_fallback_urls}
          objectFit="contain"
          sizes="(min-width: 1536px) 864px, (min-width: 1200px) 56vw, calc(100vw - 48px)"
          src={video.thumbnail_url}
        />
      </button>
      <div className="gallery-journal__video-copy">
        <p className="gallery-journal__category">{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.c3c2ad668c" text={copyText("gallery", "gallery.fixed.GalleryPage.c3c2ad668c", "공연 영상")}>{copyText("gallery", "gallery.fixed.GalleryPage.c3c2ad668c", "공연 영상")}</FormattedCopy>}</p>
        <h2 className="gallery-journal__media-title">{video.title}</h2>
        {video.description ? <p className="gallery-journal__description">{video.description}</p> : null}
        {playable ? (
          <button className="gallery-journal__command" onClick={event => onOpen(video.id, event.currentTarget)} type="button">{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.5a541f5512" text={copyText("gallery", "gallery.fixed.GalleryPage.5a541f5512", "영상 보기 ")}>{copyText("gallery", "gallery.fixed.GalleryPage.5a541f5512", "영상 보기 ")}</FormattedCopy>}<span aria-hidden="true">↗</span></button>
        ) : <p className="gallery-journal__description">{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.5c774429e7" text={copyText("gallery", "gallery.fixed.GalleryPage.5c774429e7", "영상 링크를 확인할 수 없습니다.")}>{copyText("gallery", "gallery.fixed.GalleryPage.5c774429e7", "영상 링크를 확인할 수 없습니다.")}</FormattedCopy>}</p>}
      </div>
    </article>
  )
}

export function GalleryPage() {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('gallery')
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
  const categoryOptions = [{ value: 'all', label: copyText('gallery', 'gallery.options.all', '전체 분류') }, ...view.categories.map(item => ({ ...item, label: copyText('gallery', `gallery.category.${item.value.trim() || 'archive'}`, item.label) }))]
  if (category !== 'all' && !categoryOptions.some(option => option.value === category)) {
    categoryOptions.push({ value: category, label: copyText('gallery', `gallery.category.${category.trim() || 'archive'}`, getGalleryCategoryLabel(category)) + copyText('gallery', 'gallery.options.noResultsSuffix', ' (결과 없음)') })
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
      <SeoHead description={copyText("gallery", "gallery.fixed.GalleryPage.1f4da7fcb1", "서울모테트청소년합창단의 공연, 연습, 포스터와 영상 기록을 확인합니다.")} path="/gallery" title={copyText("gallery", "gallery.fixed.GalleryPage.5cd4cd7669", "갤러리")} />
      <div className="gallery-journal__shell">
        <header className="gallery-journal__intro">
          <p className="gallery-journal__eyebrow">{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.f34c03131f" text={copyText("gallery", "gallery.fixed.GalleryPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}>{copyText("gallery", "gallery.fixed.GalleryPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}</FormattedCopy>}</p>
          <div className="gallery-journal__intro-row">
            <h1>{<FormattedCopy page="gallery" id="gallery.title" text={t('title')}>{t('title')}</FormattedCopy>}</h1>
            <p className="gallery-journal__description"><FormattedCopy page="gallery" id="gallery.description" text={t('description')} lineBreaks><CopyLines text={t('description')} /></FormattedCopy></p>
          </div>
        </header>

        <div className="gallery-journal__controls">
          <AnimatedSectionTabs activeValue={tab} ariaLabel={copyText("gallery", "gallery.fixed.GalleryPage.07cccb114c", "갤러리 자료")} className="gallery-journal__tabs" onChange={changeTab} tabs={tabs.map(item => ({ ...item, label: t(item.value) }))} />
          <div className="gallery-journal__filter-row">
            {tab === 'photos' ? (
              <FilterSelect className="gallery-journal__select" label={t('category')} onChange={changeCategory} options={categoryOptions} value={category} />
            ) : <span className="gallery-journal__collection-label">{<FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.5e1c40e141" text={copyText("gallery", "gallery.fixed.GalleryPage.5e1c40e141", "전체 ")}>{copyText("gallery", "gallery.fixed.GalleryPage.5e1c40e141", "전체 ")}</FormattedCopy>}{tab === 'videos' ? <FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.be562142ef" text={copyText("gallery", "gallery.fixed.GalleryPage.be562142ef", "영상")}>{copyText("gallery", "gallery.fixed.GalleryPage.be562142ef", "영상")}</FormattedCopy> : <FormattedCopy page="gallery" id="gallery.fixed.GalleryPage.6386eae70b" text={copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}>{copyText("gallery", "gallery.fixed.GalleryPage.6386eae70b", "포스터")}</FormattedCopy>}</span>}
            <p className="gallery-journal__hint">{tab === 'videos' ? <FormattedCopy page="gallery" id="gallery.videoHint" text={t('videoHint')}>{t('videoHint')}</FormattedCopy> : tab === 'posters' ? <FormattedCopy page="gallery" id="gallery.posterHint" text={t('posterHint')}>{t('posterHint')}</FormattedCopy> : <FormattedCopy page="gallery" id="gallery.photoHint" text={t('photoHint')}>{t('photoHint')}</FormattedCopy>}</p>
          </div>
        </div>

        {galleryData.error ? (
          <div className="gallery-journal__notice" role="status">
            <p>{<FormattedCopy page="gallery" id="gallery.partialError" text={t('partialError')}>{t('partialError')}</FormattedCopy>}</p>
            <button className="gallery-journal__text-button" disabled={galleryData.isLoading} onClick={galleryData.refetch} type="button">{<FormattedCopy page="gallery" id="gallery.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</button>
          </div>
        ) : null}

        {mediaId && !galleryData.isLoading && !selectedIsPlayable ? (
          <div className="gallery-journal__notice" role="status">
            <p>{selectedItem ? <FormattedCopy page="gallery" id="gallery.videoError" text={t('videoError')}>{t('videoError')}</FormattedCopy> : <FormattedCopy page="gallery" id="gallery.missing" text={t('missing')}>{t('missing')}</FormattedCopy>}</p>
            <button className="gallery-journal__text-button" onClick={closeDetail} type="button">{<FormattedCopy page="gallery" id="gallery.back" text={t('back')}>{t('back')}</FormattedCopy>}</button>
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
          {galleryData.isLoading && items.length === 0 ? <LoadingState label={t('loading')} /> : null}
          {!galleryData.isLoading && items.length === 0 ? (
            <EmptyState
              action={tab === 'photos' && category !== 'all' ? <button className="gallery-journal__command" onClick={() => changeCategory('all')} type="button">{<FormattedCopy page="gallery" id="gallery.allPhotos" text={t('allPhotos')}>{t('allPhotos')}</FormattedCopy>}</button> : undefined}
              description={tab === 'photos' && category !== 'all' ? t('noCategoryHelp') : galleryData.error ? t('retryHelp') : t('emptyHelp')}
              title={tab === 'photos' && category !== 'all' ? t('noCategory') : tab === 'photos' ? t('noPhotos') : tab === 'videos' ? t('noVideos') : t('noPosters')}
            />
          ) : null}

          {tab === 'photos' && featuredPhotos.length > 0 ? (
            <div className="gallery-journal__photo-lead" data-single={featuredPhotos.length === 1 || undefined}>
              <MediaFigure item={featuredPhotos[0]} lead onOpen={openMedia} priority />
              {featuredPhotos[1] ? <div className="gallery-journal__photo-side">
                <p className="gallery-journal__side-title">{<FormattedCopy page="gallery" id="gallery.sideTitle" text={t('sideTitle')}>{t('sideTitle')}</FormattedCopy>}</p>
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
                <h2>{<FormattedCopy page="gallery" id="gallery.posterTitle" text={t('posterTitle')}>{t('posterTitle')}</FormattedCopy>}</h2>
                <p><FormattedCopy page="gallery" id="gallery.posterDescription" text={t('posterDescription')} lineBreaks><CopyLines text={t('posterDescription')} /></FormattedCopy></p>
              </aside>
            </div>
          ) : null}
        </section>
      </div>
      {selectedItem && selectedIsPlayable ? <GalleryViewer count={items.length} index={selectedIndex} item={selectedItem} onClose={closeDetail} onMove={moveMedia} /> : null}
    </div>
  )
}
