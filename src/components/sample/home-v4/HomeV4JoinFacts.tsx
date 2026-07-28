import type { HomeV4JoinFactFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'

type HomeV4JoinFactsProps = {
  facts: HomeV4JoinFactFixture[]
}

export function HomeV4JoinFacts({ facts }: HomeV4JoinFactsProps) {
  const visibleFacts = facts.filter((fact) => fact.isVisible)

  return (
    <dl
      className="home-v4-join__facts"
      data-visible-count={visibleFacts.length}
    >
      {visibleFacts.map((fact) => (
        <div
          className="home-v4-join__fact"
          data-fact-id={fact.id}
          key={fact.id}
        >
          <dt>{fact.label}</dt>
          <dd>
            {fact.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
