import type { HomeV4QuickActionFixture } from '../../../pages/sample/home-v4/homeV4SampleTypes'
import { HomeV4SectionEyebrow } from './HomeV4SectionEyebrow'

export function HomeV4QuickActions({
  actions,
}: {
  actions: HomeV4QuickActionFixture[]
}) {
  const visibleActions = actions
    .filter((action) => action.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <section
      aria-labelledby="home-v4-quick-title"
      className="home-v4-quick"
      data-visible-count={visibleActions.length}
    >
      <div className="home-v4-section-shell">
        <HomeV4SectionEyebrow>QUICK ACTION · NEXT STEP</HomeV4SectionEyebrow>
        <h2 className="home-v4-visually-hidden" id="home-v4-quick-title">
          주요 안내 바로가기
        </h2>
        <div className="home-v4-quick__list">
          {visibleActions.map((action, index) => (
            <a
              aria-label={`${action.title}: ${action.description}`}
              className="home-v4-quick__item"
              href={action.href}
              key={action.code}
            >
              <span className="home-v4-quick__number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="home-v4-quick__copy">
                <span className="home-v4-quick__code">{action.code}</span>
                <span className="home-v4-quick__item-title">{action.title}</span>
                <span className="home-v4-quick__description">{action.description}</span>
              </span>
              <span aria-hidden="true" className="home-v4-quick__arrow">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
