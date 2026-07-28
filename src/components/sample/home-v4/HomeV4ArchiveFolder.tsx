import type { HomeV4ArchiveMediaFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4ArchiveFolderProps = {
  expanded: boolean
  media: HomeV4ArchiveMediaFixture[]
  onToggle: () => void
}

export function HomeV4ArchiveFolder({
  expanded,
  media,
  onToggle,
}: HomeV4ArchiveFolderProps) {
  const previewItems = media.slice(0, 3)

  return (
    <div
      className="home-v4-archive__folder"
      data-expanded={expanded ? 'true' : 'false'}
    >
      {expanded ? (
        <button
          aria-controls="home-v4-archive-files"
          aria-expanded="true"
          className="home-v4-archive__collapse"
          onClick={onToggle}
          type="button"
        >
          <span>파일 접기</span>
          <span aria-hidden="true">−</span>
        </button>
      ) : (
        <button
          aria-controls="home-v4-archive-files"
          aria-expanded="false"
          className="home-v4-archive__folder-trigger"
          onClick={onToggle}
          type="button"
        >
          <span className="home-v4-archive__folder-spine">
            <small>SMYC</small>
            <strong>ARCHIVE</strong>
          </span>
          <span aria-hidden="true" className="home-v4-archive__folder-preview">
            {previewItems.map((item, index) => (
              <span
                className={`home-v4-archive__folder-edge home-v4-archive__folder-edge--${index + 1}`}
                key={item.id}
              >
                <img alt="" src={item.thumbnailUrl} />
              </span>
            ))}
          </span>
          <span className="home-v4-archive__folder-front">
            <small>SEOUL MOTET YOUTH CHOIR</small>
            <strong>무대의 기록을<br />펼쳐 봅니다</strong>
            <span>
              {String(media.length).padStart(2, '0')} FILES
              <i aria-hidden="true">＋</i>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
