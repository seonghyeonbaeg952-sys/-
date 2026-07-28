import type {
  HomeV4ConcertEmptyFixture,
  HomeV4ConcertFixture,
} from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'
import { HomeV4ConcertEmptyState } from './HomeV4ConcertEmptyState'
import { HomeV4ConcertNotes } from './HomeV4ConcertNotes'
import { HomeV4ConcertProgramme } from './HomeV4ConcertProgramme'

type HomeV4ConcertSectionProps = {
  emptyFixture: HomeV4ConcertEmptyFixture
  fixture: HomeV4ConcertFixture | null
  reducedMotion: boolean
}

function renderLines(value: string) {
  return value.split('\n').map((line) => <span key={line}>{line}</span>)
}

export function HomeV4ConcertSection({
  emptyFixture,
  fixture,
  reducedMotion,
}: HomeV4ConcertSectionProps) {
  if (!fixture) {
    return <HomeV4ConcertEmptyState fixture={emptyFixture} />
  }

  return (
    <section
      aria-labelledby="home-v4-concert-section-title"
      className="home-v4-concert"
      data-concert-candidate="b"
      data-concert-state={fixture.status}
    >
      <header className="home-v4-concert__header">
        <p>CANDIDATE B · ALWAYS-OPEN EDITORIAL PROGRAMME</p>
        <h2 id="home-v4-concert-section-title">{fixture.sectionTitle}</h2>
      </header>

      <div className="home-v4-concert__spread">
        <article
          aria-labelledby="home-v4-concert-title"
          className="home-v4-concert__page home-v4-concert__page--event"
        >
          <p className="home-v4-concert__eyebrow">{fixture.eyebrow}</p>
          <div className="home-v4-concert__event-grid">
            <HomeV4ConcertProgramme fixture={fixture} />

            <div className="home-v4-concert__event-copy">
              <h3 id="home-v4-concert-title">
                {renderLines(fixture.title)}
              </h3>
              <p className="home-v4-concert__venue">
                <span>{fixture.venue}</span>
                <span aria-hidden="true">·</span>
                <span>{fixture.time}</span>
              </p>
              <p className="home-v4-concert__summary">{fixture.summary}</p>

              <div
                aria-label="공연 바로가기"
                className="home-v4-concert__actions"
              >
                {fixture.actions.map((action) => (
                  <a
                    className={`home-v4-concert__action home-v4-concert__action--${action.emphasis}`}
                    href={action.href}
                    key={action.label}
                  >
                    <span>{action.label}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="home-v4-concert__page home-v4-concert__page--notes">
          <p className="home-v4-concert__programme-label">
            PROGRAMME &amp; NOTES
          </p>
          <h3 className="home-v4-concert__programme-title">
            {renderLines(fixture.programmeTitle)}
          </h3>
          <ol className="home-v4-concert__programme-list">
            {fixture.programmeItems.map((item, index) => (
              <li key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{item.label}</p>
              </li>
            ))}
          </ol>

          <HomeV4ConcertNotes
            body={fixture.noteBody}
            detail={fixture.noteDetail}
            key={`${fixture.status}-${fixture.title}-${reducedMotion ? 'reduced' : 'motion'}`}
            reducedMotion={reducedMotion}
            summary={fixture.noteSummary}
          />

          {fixture.notice ? (
            <aside
              aria-label="중요 공연 안내"
              className="home-v4-concert__notice"
            >
              <div>
                <p>IMPORTANT NOTICE</p>
                {fixture.notice.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <a href={fixture.notice.href}>
                <span>{fixture.notice.label}</span>
                <span aria-hidden="true">→</span>
              </a>
            </aside>
          ) : null}
        </article>
      </div>
    </section>
  )
}
