import type {
  HomeV4SpiritFixture,
  HomeV4SpiritItemFixture,
} from '../../../pages/sample/home-v4/homeV4SignatureTypes'
import { HomeV4SpiritItem } from './HomeV4SpiritItem'

type HomeV4SpiritSectionProps = {
  fixture: HomeV4SpiritFixture
}

function firstSentence(value: string | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  const match = normalized.match(/^.*?[.!?。]|^.+$/u)
  return match?.[0]?.trim() ?? null
}

function resolveHomeV4SpiritSummary(
  item: HomeV4SpiritItemFixture,
) {
  const homeSummary = item.homeSummary?.trim()

  if (homeSummary) {
    return homeSummary
  }

  const bodySummary = firstSentence(item.body)

  if (bodySummary) {
    return bodySummary
  }

  return item.fallbackSummary?.trim() || null
}

export function HomeV4SpiritSection({
  fixture,
}: HomeV4SpiritSectionProps) {
  const visibleItems = fixture.items
    .filter((item) => item.isVisible)
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((item) => ({
      item,
      summary: resolveHomeV4SpiritSummary(item),
    }))
    .filter(
      (
        resolved,
      ): resolved is {
        item: HomeV4SpiritItemFixture
        summary: string
      } => Boolean(resolved.summary),
    )

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="home-v4-spirit-title"
      className="home-v4-spirit"
      data-visible-count={visibleItems.length}
    >
      <div className="home-v4-spirit__heading">
        <div>
          <p>{fixture.eyebrow}</p>
          <h2 id="home-v4-spirit-title">{fixture.title}</h2>
        </div>
        <p>{fixture.description}</p>
      </div>

      <div className="home-v4-spirit__index">
        {visibleItems.map(({ item, summary }, index) => (
          <HomeV4SpiritItem
            item={item}
            key={item.id}
            number={index + 1}
            summary={summary}
          />
        ))}
      </div>

      <div className="home-v4-spirit__footer">
        <span aria-hidden="true">MOTET SPIRIT</span>
        <a href={fixture.cta.href}>
          <span>{fixture.cta.label}</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}
