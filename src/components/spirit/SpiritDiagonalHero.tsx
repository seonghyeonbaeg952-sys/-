import type { SpiritCopy } from '../../constants/spiritContent'

type SpiritDiagonalHeroProps = {
  backgroundImageUrl: string | null
  copy: SpiritCopy
  eyebrow?: string
  titleLines?: string[]
}

const defaultTitleLines = ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR']

function renderSmycTitleLine(line: string) {
  const normalizedLine = line.trim().toUpperCase()
  const shouldHighlightInitial = ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR'].includes(
    normalizedLine,
  )

  if (!shouldHighlightInitial) {
    return line
  }

  return (
    <>
      <span className="smyc-wordmark-initial">{line.slice(0, 1)}</span>
      {line.slice(1)}
    </>
  )
}

export function SpiritDiagonalHero({
  backgroundImageUrl,
  copy,
  eyebrow = '서울모테트청소년합창단',
  titleLines = defaultTitleLines,
}: SpiritDiagonalHeroProps) {
  return (
    <section
      aria-labelledby="spirit-hero-sample-title"
      className="spirit-hero-sample"
    >
      {backgroundImageUrl ? (
        <img
          alt="서울모테트청소년합창단 합창 장면"
          className="spirit-hero-sample__image"
          loading="eager"
          src={backgroundImageUrl}
        />
      ) : (
        <div aria-hidden="true" className="spirit-hero-sample__fallback" />
      )}

      <div aria-hidden="true" className="spirit-hero-sample__veil" />

      <div className="spirit-hero-sample__panel">
        <div aria-hidden="true" className="spirit-hero-sample__score-accent">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="spirit-hero-sample__content">
        <p className="spirit-hero-sample__eyebrow">{eyebrow}</p>
        <h1 className="spirit-hero-sample__title-en" id="spirit-hero-sample-title">
          {titleLines.map((line, index) => (
            <span key={`${line}-${index}`}>{renderSmycTitleLine(line)}</span>
          ))}
        </h1>
        <p className="spirit-hero-sample__body">{copy.body}</p>
      </div>

      <div aria-hidden="true" className="spirit-hero-sample__panel-ribbons">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div aria-hidden="true" className="spirit-hero-sample__light-sweep" />
      <div aria-hidden="true" className="spirit-hero-sample__diagonal" />
      <div aria-hidden="true" className="spirit-hero-sample__photo-hover-zone" />
    </section>
  )
}
