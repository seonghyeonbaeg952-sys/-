import { useState } from 'react'

type HomeV4ConcertNotesProps = {
  body: string
  detail: string
  reducedMotion: boolean
  summary: string
}

const NOTE_CONTENT_ID = 'home-v4-concert-note-content'

export function HomeV4ConcertNotes({
  body,
  detail,
  reducedMotion,
  summary,
}: HomeV4ConcertNotesProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="home-v4-concert-notes"
      data-note-open={isOpen ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className="home-v4-concert-notes__summary">
        <h4>PROGRAMME NOTES</h4>
        <p>{summary}</p>
      </div>

      <button
        aria-controls={NOTE_CONTENT_ID}
        aria-expanded={isOpen}
        className="home-v4-concert-notes__trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>
          {isOpen ? '프로그램 노트 접기' : '프로그램 노트 전체 보기'}
        </span>
        <span aria-hidden="true">{isOpen ? '↑' : '↓'}</span>
      </button>

      <div
        aria-hidden={!isOpen}
        className="home-v4-concert-notes__disclosure"
        id={NOTE_CONTENT_ID}
      >
        <div>
          <p>{body}</p>
          <strong>{detail}</strong>
        </div>
      </div>
    </div>
  )
}
