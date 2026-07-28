import type { HomeV4ArchiveMediaFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4ArchiveFileProps = {
  media: HomeV4ArchiveMediaFixture
  number: number
  onSelect: (
    media: HomeV4ArchiveMediaFixture,
    trigger: HTMLButtonElement,
  ) => void
}

const mediaLabels = {
  photo: 'PHOTO',
  video: 'VIDEO',
  poster: 'POSTER',
} as const

export function HomeV4ArchiveFile({
  media,
  number,
  onSelect,
}: HomeV4ArchiveFileProps) {
  return (
    <article
      className={`home-v4-archive__file home-v4-archive__file--${media.kind}`}
    >
      <button
        aria-label={`${media.title} ${mediaLabels[media.kind]} 크게 보기`}
        onClick={(event) => onSelect(media, event.currentTarget)}
        type="button"
      >
        <span className="home-v4-archive__file-tab">
          {mediaLabels[media.kind]}
        </span>
        <span className="home-v4-archive__file-image">
          <img
            alt={media.thumbnailAlt}
            loading="lazy"
            src={media.thumbnailUrl}
          />
          {media.kind === 'video' ? (
            <span aria-hidden="true" className="home-v4-archive__play">
              ▶
            </span>
          ) : null}
        </span>
        <span className="home-v4-archive__file-copy">
          <small>{String(number).padStart(2, '0')}</small>
          <h3>{media.title}</h3>
          <span>{media.description}</span>
        </span>
        <span aria-hidden="true" className="home-v4-archive__file-open">
          ↗
        </span>
      </button>
    </article>
  )
}
