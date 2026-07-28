import type { HomeV4ScoreFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4MotetScoreFinalProps = {
  final: HomeV4ScoreFixture['final']
  showCtas: boolean
}

export function HomeV4MotetScoreFinal({
  final,
  showCtas,
}: HomeV4MotetScoreFinalProps) {
  return (
    <div
      className="home-v4-score__layer home-v4-score__final"
      data-score-layer="final"
    >
      <div aria-hidden="true" className="home-v4-score__final-staff">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <p>FINALE · ONE CHOIR</p>
      <h3>{final.title}</h3>
      <p className="home-v4-score__final-description">{final.description}</p>
      {showCtas ? (
        <div
          aria-label="모테트 스코어 관련 링크"
          className="home-v4-score__ctas"
        >
          {final.ctas.map((cta) => (
            <a
              className={`home-v4-score__cta home-v4-score__cta--${cta.emphasis}`}
              href={cta.href}
              key={`${cta.href}-${cta.label}`}
            >
              <span>{cta.label}</span>
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
