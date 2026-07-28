import type { HomeV4ConcertEmptyFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'

type HomeV4ConcertEmptyStateProps = {
  fixture: HomeV4ConcertEmptyFixture
}

export function HomeV4ConcertEmptyState({
  fixture,
}: HomeV4ConcertEmptyStateProps) {
  return (
    <section
      aria-labelledby="home-v4-concert-empty-title"
      className="home-v4-concert home-v4-concert--empty"
      data-concert-state="empty"
    >
      <div className="home-v4-concert-empty">
        <p>{fixture.eyebrow}</p>
        <h2 id="home-v4-concert-empty-title">{fixture.title}</h2>
        <span aria-hidden="true" />
        <strong>{fixture.description}</strong>
        <div className="home-v4-concert-empty__actions">
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
    </section>
  )
}
