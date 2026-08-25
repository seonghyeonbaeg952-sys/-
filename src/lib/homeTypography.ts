export type HomeTitleAccentRole = 'emphasis' | 'ornament' | 'quiet'

export type HomeTitleAccent = Readonly<{
  role: HomeTitleAccentRole
  term: string
}>

export type HomeTitleFragment = {
  role: 'base' | HomeTitleAccentRole
  text: string
}

type AccentMatch = {
  accent: HomeTitleAccent
  index: number
}

export function buildHomeTitleFragments(
  text: string,
  accents: readonly HomeTitleAccent[],
): HomeTitleFragment[] {
  if (!text) {
    return []
  }

  const usableAccents = accents.filter(({ term }) => term.length > 0)

  if (usableAccents.length === 0) {
    return [{ role: 'base', text }]
  }

  const fragments: HomeTitleFragment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const nextMatch = usableAccents.reduce<AccentMatch | null>(
      (nearest, accent) => {
        const index = text.indexOf(accent.term, cursor)

        if (index === -1) {
          return nearest
        }

        if (
          !nearest ||
          index < nearest.index ||
          (index === nearest.index && accent.term.length > nearest.accent.term.length)
        ) {
          return { accent, index }
        }

        return nearest
      },
      null,
    )

    if (!nextMatch) {
      fragments.push({ role: 'base', text: text.slice(cursor) })
      break
    }

    if (nextMatch.index > cursor) {
      fragments.push({
        role: 'base',
        text: text.slice(cursor, nextMatch.index),
      })
    }

    fragments.push({
      role: nextMatch.accent.role,
      text: nextMatch.accent.term,
    })
    cursor = nextMatch.index + nextMatch.accent.term.length
  }

  return fragments
}
