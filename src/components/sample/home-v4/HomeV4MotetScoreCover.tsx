import type { HomeV4ScoreFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4MotetScoreCoverProps = {
  cover: HomeV4ScoreFixture['cover']
  eyebrow: string
}

export function HomeV4MotetScoreCover({
  cover,
  eyebrow,
}: HomeV4MotetScoreCoverProps) {
  return (
    <div
      className="home-v4-score__layer home-v4-score__cover"
      data-score-layer="cover"
    >
      <div aria-hidden="true" className="home-v4-score__cover-staff">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="home-v4-score__eyebrow">{eyebrow}</p>
      <h2 id="home-v4-score-title">{cover.title}</h2>
      {cover.subtitle ? <p>{cover.subtitle}</p> : null}
      {cover.editionLabel ? (
        <small>{cover.editionLabel}</small>
      ) : null}
      <span aria-hidden="true" className="home-v4-score__cover-corner" />
    </div>
  )
}
