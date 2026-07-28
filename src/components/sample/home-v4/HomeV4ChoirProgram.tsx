import type { HomeV4ProgramItemFixture } from '../../../pages/sample/home-v4/homeV4SampleTypes'
import { HomeV4SectionEyebrow } from './HomeV4SectionEyebrow'

export function HomeV4ChoirProgram({
  items,
}: {
  items: HomeV4ProgramItemFixture[]
}) {
  const visibleItems = items
    .filter((item) => item.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <section aria-labelledby="home-v4-program-title" className="home-v4-program">
      <div className="home-v4-section-shell">
        <HomeV4SectionEyebrow>CHOIR PROGRAM</HomeV4SectionEyebrow>
        <h2 id="home-v4-program-title">배우는 과정이 무대의 태도가 됩니다</h2>
        <p className="home-v4-program__intro">
          무엇을, 어떻게 배우는지 네 가지 과정으로 살펴봅니다.
        </p>
        <div
          className="home-v4-program__grid"
          data-visible-count={visibleItems.length}
        >
          {visibleItems.map((item) => (
            <article className="home-v4-program__item" key={item.number}>
              <span className="home-v4-program__number">{item.number}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
