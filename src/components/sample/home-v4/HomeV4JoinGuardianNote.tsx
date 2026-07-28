import type { HomeV4JoinGuardianItemFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'

type HomeV4JoinGuardianNoteProps = {
  items: HomeV4JoinGuardianItemFixture[]
  title: string
}

export function HomeV4JoinGuardianNote({
  items,
  title,
}: HomeV4JoinGuardianNoteProps) {
  const visibleItems = items.filter((item) => item.isVisible)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <aside
      aria-label="보호자 안내"
      className="home-v4-join__guardian"
      data-visible-count={visibleItems.length}
    >
      <p>{title}</p>
      <ul>
        {visibleItems.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </aside>
  )
}
