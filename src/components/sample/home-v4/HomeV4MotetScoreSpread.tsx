import type {
  HomeV4ScoreFixture,
  HomeV4ScoreValueFixture,
} from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4MotetScoreSpreadProps = {
  spread: HomeV4ScoreFixture['spread']
  values: HomeV4ScoreValueFixture[]
}

export function HomeV4MotetScoreSpread({
  spread,
  values,
}: HomeV4MotetScoreSpreadProps) {
  const visibleValues = values
    .filter((value) => value.isVisible)
    .sort((left, right) => left.displayOrder - right.displayOrder)

  return (
    <div
      className="home-v4-score__layer home-v4-score__spread"
      data-score-layer="spread"
    >
      <article className="home-v4-score__page home-v4-score__page--left">
        <span aria-hidden="true" className="home-v4-score__folio">
          01
        </span>
        <p>VOICE · READING · PART</p>
        <h3>{spread.leftTitle}</h3>
        <p className="home-v4-score__body">{spread.leftBody}</p>
        {spread.leftCallout ? (
          <strong>{spread.leftCallout}</strong>
        ) : null}
      </article>

      <article className="home-v4-score__page home-v4-score__page--right">
        <span aria-hidden="true" className="home-v4-score__folio">
          02
        </span>
        <p>ENSEMBLE · STAGE · GUIDANCE</p>
        <h3>{spread.rightTitle}</h3>
        <p className="home-v4-score__body">{spread.rightBody}</p>
        {spread.rightCallout ? (
          <strong>{spread.rightCallout}</strong>
        ) : null}
      </article>

      <div
        aria-label="모테트 스코어의 여섯 가치"
        className="home-v4-score__values"
        data-visible-count={visibleValues.length}
      >
        {visibleValues.map((value, index) => (
          <div className="home-v4-score__value" key={value.id}>
            <span aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <strong>{value.label}</strong>
              <p>{value.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
