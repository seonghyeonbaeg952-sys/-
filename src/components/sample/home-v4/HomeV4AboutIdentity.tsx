import type { HomeV4AboutFixture } from '../../../pages/sample/home-v4/homeV4SampleTypes'
import { HomeV4SampleButton } from './HomeV4SampleButton'
import { HomeV4SampleImage } from './HomeV4SampleImage'
import { HomeV4SectionEyebrow } from './HomeV4SectionEyebrow'

export function HomeV4AboutIdentity({
  fixture,
}: {
  fixture: HomeV4AboutFixture
}) {
  const visibleFacts = fixture.facts
    .filter((fact) => fact.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)
  const hasImage = Boolean(fixture.imageUrl && fixture.imageAlt)

  return (
    <section
      aria-labelledby="home-v4-about-title"
      className="home-v4-about"
      data-has-image={hasImage}
    >
      <span aria-hidden="true" className="home-v4-about__ghost">
        ONE VOICE
      </span>
      <div className="home-v4-about__cue" />
      <div className="home-v4-about__layout home-v4-section-shell">
        <div className="home-v4-about__content">
          <HomeV4SectionEyebrow>{fixture.eyebrow}</HomeV4SectionEyebrow>
          <h2 id="home-v4-about-title">{fixture.title}</h2>
          <div className="home-v4-about__paragraphs">
            {fixture.paragraphs.slice(0, 2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {hasImage ? (
          <figure className="home-v4-about__visual">
            <HomeV4SampleImage
              alt={fixture.imageAlt ?? ''}
              fallbackLabel="합창단의 배움과 무대를 상징하는 대표 이미지"
              src={fixture.imageUrl ?? ''}
            />
            <figcaption>VOICE · LEARNING · STAGE</figcaption>
          </figure>
        ) : null}

        <dl className="home-v4-about__facts" data-visible-count={visibleFacts.length}>
          {visibleFacts.map((fact) => (
            <div className="home-v4-about__fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="home-v4-about__cta">
          <HomeV4SampleButton href={fixture.ctaHref} variant="secondary">
            {fixture.ctaLabel}
          </HomeV4SampleButton>
        </div>
      </div>
    </section>
  )
}
