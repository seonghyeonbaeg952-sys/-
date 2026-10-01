type BrochurePreview = {
  note: string
  program: string[]
  hasMore: boolean
}

function shortenAtWord(text: string, maxCharacters: number): { text: string; shortened: boolean } {
  const normalized = text.replace(/\s+/gu, ' ').trim()
  const characters = Array.from(normalized)
  if (characters.length <= maxCharacters) {
    return { text: normalized, shortened: false }
  }

  const candidate = characters.slice(0, maxCharacters).join('')
  const lastSpace = candidate.lastIndexOf(' ')
  const safeCut = lastSpace >= maxCharacters * 0.55 ? lastSpace : candidate.length
  return { text: `${candidate.slice(0, safeCut).trimEnd()}…`, shortened: true }
}

export function buildBrochurePreview(
  description: string,
  program: string[],
  english: boolean,
): BrochurePreview {
  const fallback = program.length > 0
    ? english ? 'Selected works from the announced programme.' : '발표된 프로그램의 일부를 소개합니다.'
    : english ? 'Programme details will be announced soon.' : '프로그램은 확정 후 안내합니다.'
  const shortened = shortenAtWord(description || fallback, english ? 76 : 55)
  const works = program.slice(0, 2).map((work) => shortenAtWord(work, english ? 42 : 28))

  return {
    note: shortened.text,
    program: works.map((work) => work.text),
    hasMore: shortened.shortened || program.length > 2 || works.some((work) => work.shortened),
  }
}

export function readBrochureDate(value: string, english: boolean): {
  day: string
  month: string
  year: string
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})/u.exec(value)
  if (!match) {
    return { day: '—', month: '', year: '' }
  }

  const monthNumber = Number(match[2])
  const dayNumber = Number(match[3])
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return { day: '—', month: '', year: '' }
  }

  return {
    day: match[3],
    month: english
      ? new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })
          .format(new Date(Date.UTC(Number(match[1]), monthNumber - 1, 1)))
      : `${monthNumber}월`,
    year: match[1],
  }
}
