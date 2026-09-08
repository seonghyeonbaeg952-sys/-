import { useId } from 'react'
import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { OptimizedImage } from '../common/OptimizedImage'
import { TransitionLink } from '../common/TransitionLink'
import { useHomeResponsiveViewport } from './useHomeResponsiveViewport'
import '../../styles/home-responsive-archive.css'

type ResponsiveArchiveProps = {
  buttonLabel: string
  categoryLabel: string
  emptyDescription?: string
  emptyTitle?: string
  eyebrow: string
  images: GalleryImage[]
  posters: Poster[]
  title: string
  videos: VideoItem[]
}

export function ResponsiveArchive({ buttonLabel, categoryLabel, emptyDescription = '현재 공개된 공연·연습 기록이 없습니다.', emptyTitle = '공개된 갤러리 자료가 없습니다', eyebrow, images, posters, title, videos }: ResponsiveArchiveProps) {
  const headingId = useId()
  const tablet = useHomeResponsiveViewport() === 'tablet'
  const photo = [...images].filter(item => item.is_visible && item.image_url.trim()).sort((a, b) => a.display_order - b.display_order)[0]
  const poster = [...posters].filter(item => item.is_visible && item.image_url.trim()).sort((a, b) => a.display_order - b.display_order)[0]
  const video = [...videos].filter(item => item.is_visible && item.thumbnail_url.trim()).sort((a, b) => a.display_order - b.display_order)[0]
  const media = photo
    ? { src: photo.image_url, fallbackSrcs: undefined, title: photo.title, alt: photo.image_alt || photo.title, tab: 'photos' }
    : poster
      ? { src: poster.image_url, fallbackSrcs: undefined, title: poster.title, alt: poster.title, tab: 'posters' }
      : video ? { src: video.thumbnail_url, fallbackSrcs: video.thumbnail_fallback_urls, title: video.title, alt: video.title, tab: 'videos' } : null

  const action = <Button className="home-responsive-archive__action" href="/gallery" variant="secondary">{buttonLabel}</Button>
  const mediaContent = media ? (
          <figure>
            <TransitionLink aria-label={`${media.title} 보기`} to={`/gallery?tab=${media.tab}`}>
              <OptimizedImage
                alt={media.alt}
                className="home-responsive-archive__image"
                fallbackLabel="미리보기를 불러오지 못했습니다"
                fallbackSrcs={media.fallbackSrcs}
                fallbackVariant="gallery"
                imageClassName="home-responsive-archive__photo"
                objectFit="contain"
                src={media.src}
                width={960}
                height={640}
                sizes="(min-width: 768px) calc(100vw - 448px), calc(100vw - 48px)"
              />
            </TransitionLink>
            {!tablet ? <figcaption>{media.title}</figcaption> : null}
          </figure>
        ) : <EmptyState title={emptyTitle} description={emptyDescription} />
  const tabs = <nav aria-label={categoryLabel} className="home-responsive-archive__tabs">
    <TransitionLink to="/gallery?tab=photos"><span aria-hidden="true">01</span> 사진 {tablet ? <span aria-hidden="true">↗</span> : null}</TransitionLink>
    <TransitionLink to="/gallery?tab=posters"><span aria-hidden="true">02</span> 포스터 {tablet ? <span aria-hidden="true">↗</span> : null}</TransitionLink>
    <TransitionLink to="/gallery?tab=videos"><span aria-hidden="true">03</span> {tablet ? '동영상' : '영상'} {tablet ? <span aria-hidden="true">↗</span> : null}</TransitionLink>
  </nav>
  return (
    <section id="home-responsive-archive" aria-labelledby={headingId} className="flow-section home-section home-responsive-archive" data-flow-section="archive-stack">
      <p className="home-responsive-archive__eyebrow"><span aria-hidden="true">{tablet ? '06' : '05 /'}</span> {eyebrow}</p>
      {tablet ? <>
        <div className="home-responsive-archive__pair">
          <div className="home-responsive-archive__intro"><h2 id={headingId}>{title}</h2>{action}</div>
          {mediaContent}
        </div>
        {tabs}
      </> : <>
        <h2 id={headingId}>{title}</h2>
        {mediaContent}
        {tabs}
        {action}
      </>}
    </section>
  )
}
