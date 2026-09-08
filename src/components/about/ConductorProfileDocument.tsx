import type { PersonProfileRow } from '../../types/cms'
import '../../styles/conductor-profile.css'

const defaultBiography = [
  '2014년 서울모테트음악재단 설립과 함께 창단된 서울모테트청소년합창단을 지도하고 있는 지휘자 김형수는 지난 35년 동안 서울모테트합창단(프로단체) 단원 겸 수석 부지휘자로 활동해 왔으며  특별히 미래 사회와 음악계를 이끌어 갈 다음 세대를 위한 창조적인 대한으로 모테트 음악재단 산하에 설립된 청소년 아카데미와 청소년합창단을 교육하고 있다.',
  '학부에서는 성악을, 대학원에서 지휘(합창)를 공부하였고 Midwest University 교회음악 박사과정을 취득했다. 또한 교회음악의 성경적 이해와 연구를 위해 신대원에서 신학(M.Div)을 졸업하고 해오름교회, 길교회 음악목사를 역임하였으며, 침신대학교, 남부대학교대학원, 동양대학교, 백석문화대학, 남부대학교 대학원에서 강사를 역임하였다.',
] as const

const defaultCurrentRoles = [
  '서울모테트청소년합창단 지휘자',
  '(재)서울모테트음악재단 상임이사',
  '서울모테트합창단 수석부지휘자',
  '주님의교회 샬롬찬양대 지휘자',
  '백석예술대학원 음악학(지휘) 출강',
] as const

const defaultProfileImage = '/images/about/conductor/kim-hyung-su-profile.jpg'
const defaultPerformanceImage = '/images/about/conductor/smyc-performance-2026.jpg'

type ActivityImage = {
  alt: string
  caption: string | null
  src: string
}

function splitParagraphs(
  value?: string | null,
  options: { splitSingleLines?: boolean } = {},
) {
  const source = value?.trim()
  if (!source) return []

  const separator = options.splitSingleLines ? /\r?\n+/ : /\r?\n\s*\r?\n/

  return source
    .split(separator)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function normalizeListItem(value: string) {
  return value
    .trim()
    .replace(/^(?:[-•·]\s*)+/, '')
    .replace(/^현\)\s*/, '')
    .trim()
}

function mergeConjoinedItems(items: string[]) {
  const merged: string[] = []

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const nextItem = items[index + 1]

    if (/겸$/.test(item) && nextItem) {
      merged.push(`${item} ${nextItem}`)
      index += 1
    } else {
      merged.push(item)
    }
  }

  return merged
}

function parseStructuredItems(value?: string | null) {
  const source = value?.trim()
  if (!source) return []

  if (source.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(source)
      if (Array.isArray(parsed)) {
        return mergeConjoinedItems(parsed
          .filter((item): item is string => typeof item === 'string')
          .map(normalizeListItem)
          .filter(Boolean))
      }
    } catch {
      // 이전 CMS 줄바꿈 형식으로 계속 해석합니다.
    }
  }

  return mergeConjoinedItems(source
    .split(/\r?\n/)
    .map(normalizeListItem)
    .filter(Boolean))
}

function looksLikeRoleList(value?: string | null) {
  const lines = (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    lines.some((line) => /^현\)\s*/.test(line)) ||
    (lines.length >= 2 && lines.every((line) => line.length <= 80))
  )
}

function normalizeImageSource(value: string) {
  const source = value.trim()
  if (source.startsWith('/') || /^https?:\/\//i.test(source)) return source
  return null
}

function parseFirstActivityImage(value?: string | null): ActivityImage | null {
  const firstLine = value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return null

  const [rawSource, rawAlt, rawCaption] = firstLine
    .split('|')
    .map((part) => part.trim())
  const src = normalizeImageSource(rawSource ?? '')
  if (!src) return null

  return {
    alt: rawAlt || '서울모테트청소년합창단 공연 사진',
    caption: rawCaption || null,
    src,
  }
}

export function ConductorProfileDocument({ person }: { person?: PersonProfileRow | null }) {
  const name = person?.name?.trim() || '김형수'
  const role = person?.role?.trim() || '지휘자'
  const profileSummary = splitParagraphs(person?.profile_summary)
  const legacyDescription = splitParagraphs(person?.description, {
    splitSingleLines: true,
  })
  const legacyBio = looksLikeRoleList(person?.bio)
    ? []
    : splitParagraphs(person?.bio)
  const cmsBiography =
    profileSummary.length > 0
      ? profileSummary
      : legacyDescription.length > 0
        ? legacyDescription
        : legacyBio
  const biography = cmsBiography.length > 0 ? cmsBiography : [...defaultBiography]
  const cmsCurrentRoles = parseStructuredItems(person?.current_roles)
  const legacyCurrentRoles = looksLikeRoleList(person?.bio)
    ? parseStructuredItems(person?.bio)
    : []
  const currentRoles =
    cmsCurrentRoles.length > 0
      ? cmsCurrentRoles
      : legacyCurrentRoles.length > 0
        ? legacyCurrentRoles
        : [...defaultCurrentRoles]
  const profileImage = normalizeImageSource(person?.photo_url ?? '') || defaultProfileImage
  const performanceImage = parseFirstActivityImage(person?.activity_images) ?? {
    alt: '서울모테트청소년합창단과 오케스트라가 함께하는 공연 사진',
    caption: null,
    src: defaultPerformanceImage,
  }
  const profileImageAlt =
    person?.profile_image_alt?.trim() || `${name} ${role} 공식 프로필`

  return (
    <div className="conductor-profile">
      <div className="conductor-profile__shell">
        <header className="conductor-profile__heading">
          <div>
            <p className="conductor-profile__eyebrow">CONDUCTOR</p>
            <span aria-hidden="true" className="conductor-profile__heading-rule" />
            <h1 id="conductor-profile-title">지휘자 소개</h1>
          </div>
          <p className="conductor-profile__organization">SEOUL MOTET YOUTH CHOIR</p>
        </header>

        <section
          aria-labelledby="conductor-profile-title"
          className="conductor-profile__document"
        >
          <div className="conductor-profile__media">
            <figure className="conductor-profile__portrait-matte">
              <span aria-hidden="true" className="conductor-profile__media-rule" />
              <div className="conductor-profile__portrait-frame">
                <img
                  alt={profileImageAlt}
                  decoding="async"
                  fetchPriority="high"
                  src={profileImage}
                />
              </div>
            </figure>

            <figure className="conductor-profile__performance">
              <span aria-hidden="true" className="conductor-profile__media-rule" />
              <img
                alt={performanceImage.alt}
                decoding="async"
                fetchPriority="high"
                src={performanceImage.src}
              />
              {performanceImage.caption ? (
                <figcaption className="conductor-profile__visually-hidden">
                  {performanceImage.caption}
                </figcaption>
              ) : null}
            </figure>
          </div>

          <div className="conductor-profile__details">
            <div className="conductor-profile__identity">
              <p>SEOUL MOTET YOUTH CHOIR</p>
              <small>CONDUCTOR · 2014 — PRESENT</small>
              <span aria-hidden="true" className="conductor-profile__identity-rule" />
              <h2>{name}</h2>
              <strong>KIM HYUNG-SU</strong>
            </div>

            <div className="conductor-profile__copy">
              <div className="conductor-profile__biography">
                {biography.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                ))}
              </div>

              <div className="conductor-profile__current">
                <p>CURRENT</p>
                <ul aria-label="현재 주요 역할">
                  {currentRoles.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <footer className="conductor-profile__footer-note">
            SMYC CONDUCTOR PROFILE · KIM HYUNG-SU
          </footer>
        </section>
      </div>
    </div>
  )
}
