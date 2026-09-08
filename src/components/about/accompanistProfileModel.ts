export type AccompanistProfileModelInput = {
  bio?: string | null
  current_roles?: string | null
  education_items?: string | null
}

export type AccompanistProfileModel = {
  current: string[]
  education: string[]
}

function normalizeItem(value: string) {
  return value
    .trim()
    .replace(/^(?:[-•·]\s*)+/, '')
    .replace(/^현\)\s*/, '')
    .trim()
}

function parseStructuredItems(value?: string | null) {
  const source = value?.trim()
  if (!source) return []

  if (source.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(source)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map(normalizeItem)
          .filter(Boolean)
      }
    } catch {
      // CMS의 이전 형식 문자열은 아래 줄바꿈 파서로 안전하게 처리합니다.
    }
  }

  return source
    .split(/\r?\n/)
    .map(normalizeItem)
    .filter(Boolean)
}

function parseBioSections(bio?: string | null): AccompanistProfileModel {
  const lines = (bio ?? '').split(/\r?\n/)
  const currentStart = lines.findIndex((line) => /^\s*현\)\s*/.test(line))

  if (currentStart < 0) {
    return {
      current: [],
      education: lines.map(normalizeItem).filter(Boolean),
    }
  }

  return {
    current: lines.slice(currentStart).map(normalizeItem).filter(Boolean),
    education: lines.slice(0, currentStart).map(normalizeItem).filter(Boolean),
  }
}

export function buildAccompanistProfileModel(
  profile: AccompanistProfileModelInput,
): AccompanistProfileModel {
  const fromBio = parseBioSections(profile.bio)
  const education = parseStructuredItems(profile.education_items)
  const current = parseStructuredItems(profile.current_roles)

  return {
    current: current.length > 0 ? current : fromBio.current,
    education: education.length > 0 ? education : fromBio.education,
  }
}
