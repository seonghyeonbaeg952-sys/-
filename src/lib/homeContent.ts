import {
  HOME_CONTENT_DEFAULTS_V2,
  homeContentSiteTextDefinitions,
} from '../constants/homeContentV2'
import {
  HOME_CONTENT_VERSION,
  type HomeContentFlatRecord,
  type HomeContentSource,
  type HomeContentV2,
  type HomeProgramItem,
  type HomeQuickActionItem,
  type HomeScoreValueItem,
} from '../types/homeContent'

const invalidPublicLiterals = [
  /\bTODO\b/i,
  /placeholder/i,
  /undefined/i,
  /\bnull\b/i,
  /미정/,
  /준비중/,
  /테스트/,
  /임시/,
  /등록 예정/,
  /관리자 등록 예정/,
  /<\s*\/?\s*[a-z][^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
]

const legacyToV2KeyMap: Record<string, string[]> = {
  'home.heroSupplement.fallbackDescription': [
    'home.hero.subtitle',
    'home.hero.description',
  ],
  'home.heroSupplement.mottoChips.1': ['home.hero.chip1'],
  'home.heroSupplement.mottoChips.2': ['home.hero.chip2'],
  'home.heroSupplement.mottoChips.3': ['home.hero.chip3'],
  'home.quickActions.join.title': [
    'home.quick.join.title',
    'home.quick.1.title',
  ],
  'home.quickActions.join.description': [
    'home.quick.join.description',
    'home.quick.1.description',
  ],
  'home.quickActions.concert.title': [
    'home.quick.concert.title',
    'home.quick.2.title',
  ],
  'home.quickActions.concert.description': [
    'home.quick.concert.description',
    'home.quick.2.description',
  ],
  'home.quickActions.support.title': [
    'home.quick.support.title',
    'home.quick.3.title',
  ],
  'home.quickActions.support.description': [
    'home.quick.support.description',
    'home.quick.3.description',
  ],
  'home.about.eyebrowEn': ['home.about.kicker'],
  'home.about.title': ['home.about.title'],
  'home.about.paragraphs.1': ['home.about.body'],
  'home.about.ctaLabel': ['home.about.cta'],
  'home.about.globalTagline': ['home.global.tagline'],
  'home.about.globalDescription': ['home.global.description'],
  'home.joinLetter.eyebrowEn': ['home.join.kicker'],
  'home.joinLetter.title': ['home.join.title'],
  'home.joinLetter.description': [
    'home.join.body',
    'home.join.description',
  ],
  'home.joinLetter.ctaLabel': ['home.join.cta', 'home.join.button'],
  'home.concertProgram.eyebrowEn': [
    'home.concert.kicker',
    'home.concert.eyebrow',
  ],
  'home.concertProgram.title': [
    'home.concert.title',
    'home.concert.sectionTitle',
  ],
  'home.concertProgram.description': ['home.concert.description'],
  'home.concertProgram.concertsCtaLabel': [
    'home.concert.cta.schedule',
    'home.concert.concertButton',
  ],
  'home.concertProgram.noticesCtaLabel': [
    'home.concert.cta.notice',
    'home.concert.noticeButton',
  ],
  'home.concertProgram.detailCtaLabel': [
    'home.concert.cta.more',
    'common.cta.more',
  ],
  'home.concertProgram.inquiryCtaLabel': [
    'home.concert.cta.inquiry',
    'common.cta.inquiry',
  ],
  'home.scoreBook.cover.titleLines': [
    'home.score.cover.title',
    'home.scorebook.coverTitle',
  ],
  'home.scoreBook.leftPage.titleLines': [
    'home.score.final.title',
    'home.scorebook.finalTitle',
    'home.score.left.title',
  ],
  'home.scoreBook.leftPage.body': [
    'home.score.final.body',
    'home.scorebook.finalDescription',
    'home.score.left.body',
  ],
  'home.scoreBook.rightPage.prefix': [
    'home.score.right.title',
    'home.scorebook.rightTitle',
  ],
  'home.scoreBook.rightPage.body': ['home.score.right.body'],
  'home.scoreBook.final.titleLines': [
    'home.score.final.title',
    'home.scorebook.finalTitle',
  ],
  'home.scoreBook.final.summary': [
    'home.score.final.body',
    'home.scorebook.finalDescription',
  ],
  'home.archive.eyebrowEn': [
    'home.gallery.kicker',
    'home.gallery.eyebrow',
  ],
  'home.archive.title': [
    'home.gallery.title',
    'home.gallery.sectionTitle',
  ],
  'home.archive.description': [
    'home.gallery.description',
    'home.gallery.sectionDescription',
  ],
  'home.archive.ctaLabel': ['home.gallery.cta'],
  'home.archive.emptyTitle': ['home.gallery.empty.title'],
  'home.archive.emptyDescription': ['home.gallery.empty.description'],
  'home.supportLetter.title': ['home.support.title'],
  'home.supportLetter.description': ['home.support.description'],
  'home.supportLetter.primaryCtaLabel': [
    'home.support.cta.primary',
    'home.support.button',
  ],
  'home.supportLetter.secondaryCtaLabel': [
    'home.support.cta.secondary',
    'home.support.secondaryButton',
  ],
  'home.supportLetter.pledgeTitle': [
    'home.support.card.title',
    'home.support.cardTitle',
  ],
  'home.supportLetter.pledgeDescription': [
    'home.support.card.description',
    'home.support.cardDescription',
  ],
}

function cloneDefaults(): HomeContentV2 {
  return JSON.parse(JSON.stringify(HOME_CONTENT_DEFAULTS_V2)) as HomeContentV2
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeString(value: unknown, fallback: string) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()

  if (!trimmed || invalidPublicLiterals.some((pattern) => pattern.test(trimmed))) {
    return fallback
  }

  return trimmed
}

function splitLines(value: string, fallback: string[]) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.length > 0 ? lines : fallback
}

function splitParagraphs(value: string, fallback: string[]) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  return paragraphs.length > 0 ? paragraphs : fallback
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.trim().toLowerCase() === 'true') {
      return true
    }

    if (value.trim().toLowerCase() === 'false') {
      return false
    }
  }

  return fallback
}

function normalizeOrder(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, Math.round(parsed)))
}

function toFlatRecord(source: HomeContentSource): HomeContentFlatRecord {
  if (!isPlainRecord(source)) {
    return {}
  }

  if (isHomeContentV2(source)) {
    return flattenHomeContentV2(source)
  }

  return Object.fromEntries(
    Object.entries(source)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, value as string]),
  )
}

function migrateFlatRecord(source: HomeContentFlatRecord) {
  const migrated: HomeContentFlatRecord = { ...source }

  for (const [targetKey, legacyKeys] of Object.entries(legacyToV2KeyMap)) {
    if (normalizeString(migrated[targetKey], '')) {
      continue
    }

    const legacyValue = legacyKeys
      .map((key) => normalizeString(source[key], ''))
      .find(Boolean)

    if (legacyValue) {
      migrated[targetKey] = legacyValue
    }
  }

  const legacyAboutBody = normalizeString(source['home.about.body'], '')

  if (
    legacyAboutBody &&
    !normalizeString(source['home.about.paragraphs.2'], '')
  ) {
    const paragraphs = splitParagraphs(
      legacyAboutBody,
      HOME_CONTENT_DEFAULTS_V2.about.paragraphs,
    )
    migrated['home.about.paragraphs.1'] = paragraphs[0]
    if (paragraphs[1]) {
      migrated['home.about.paragraphs.2'] = paragraphs[1]
    }
  }

  const legacyValueLabels = normalizeString(source['home.score.value.list'], '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  legacyValueLabels.slice(0, 6).forEach((label, index) => {
    const item = HOME_CONTENT_DEFAULTS_V2.scoreBook.valueItems[index]
    if (item) {
      const key = `home.scoreBook.valueItems.${item.id}.label`
      if (!normalizeString(migrated[key], '')) {
        migrated[key] = label
      }
    }
  })

  return migrated
}

function getValue(
  record: HomeContentFlatRecord,
  key: string,
  fallback: string,
) {
  return normalizeString(record[key], fallback)
}

function normalizeQuickItems(
  record: HomeContentFlatRecord,
): HomeQuickActionItem[] {
  return HOME_CONTENT_DEFAULTS_V2.quickActions.items
    .map((item) => {
      const prefix = `home.quickActions.${item.id}`
      return {
        ...item,
        title: getValue(record, `${prefix}.title`, item.title),
        description: getValue(
          record,
          `${prefix}.description`,
          item.description,
        ),
        ctaLabel: getValue(record, `${prefix}.ctaLabel`, item.ctaLabel),
        displayOrder: normalizeOrder(
          record[`${prefix}.displayOrder`],
          item.displayOrder,
          1,
          3,
        ),
        isVisible: normalizeBoolean(
          record[`${prefix}.isVisible`],
          item.isVisible,
        ),
      }
    })
    .filter((item) => item.isVisible)
    .sort((first, second) => first.displayOrder - second.displayOrder)
}

function normalizeProgramItems(
  record: HomeContentFlatRecord,
): HomeProgramItem[] {
  return HOME_CONTENT_DEFAULTS_V2.choirProgram.items
    .map((item) => {
      const prefix = `home.choirProgram.items.${item.id}`
      return {
        ...item,
        title: getValue(record, `${prefix}.title`, item.title),
        description: getValue(
          record,
          `${prefix}.description`,
          item.description,
        ),
        displayOrder: normalizeOrder(
          record[`${prefix}.displayOrder`],
          item.displayOrder,
          1,
          4,
        ),
        isVisible: normalizeBoolean(
          record[`${prefix}.isVisible`],
          item.isVisible,
        ),
      }
    })
    .filter((item) => item.isVisible)
    .sort((first, second) => first.displayOrder - second.displayOrder)
}

function normalizeScoreValueItems(
  record: HomeContentFlatRecord,
): HomeScoreValueItem[] {
  return HOME_CONTENT_DEFAULTS_V2.scoreBook.valueItems
    .map((item) => {
      const prefix = `home.scoreBook.valueItems.${item.id}`
      return {
        ...item,
        label: getValue(record, `${prefix}.label`, item.label),
        description: getValue(
          record,
          `${prefix}.description`,
          item.description,
        ),
        displayOrder: normalizeOrder(
          record[`${prefix}.displayOrder`],
          item.displayOrder,
          1,
          6,
        ),
        isVisible: normalizeBoolean(
          record[`${prefix}.isVisible`],
          item.isVisible,
        ),
      }
    })
    .filter((item) => item.isVisible)
    .sort((first, second) => first.displayOrder - second.displayOrder)
}

function normalizeFromFlat(source: HomeContentFlatRecord): HomeContentV2 {
  const record = migrateFlatRecord(source)
  const defaults = cloneDefaults()
  const content = cloneDefaults()
  const read = (key: string, fallback: string) =>
    getValue(record, key, fallback)

  content.heroSupplement = {
    fallbackDescription: read(
      'home.heroSupplement.fallbackDescription',
      defaults.heroSupplement.fallbackDescription,
    ),
    mottoChips: [
      read(
        'home.heroSupplement.mottoChips.1',
        defaults.heroSupplement.mottoChips[0],
      ),
      read(
        'home.heroSupplement.mottoChips.2',
        defaults.heroSupplement.mottoChips[1],
      ),
      read(
        'home.heroSupplement.mottoChips.3',
        defaults.heroSupplement.mottoChips[2],
      ),
    ],
  }
  content.quickActions.items = normalizeQuickItems(record)
  content.about = {
    eyebrowKo: read('home.about.eyebrowKo', defaults.about.eyebrowKo),
    eyebrowEn: read('home.about.eyebrowEn', defaults.about.eyebrowEn),
    title: read('home.about.title', defaults.about.title),
    paragraphs: splitParagraphs(
      [
        read('home.about.paragraphs.1', defaults.about.paragraphs[0]),
        read('home.about.paragraphs.2', defaults.about.paragraphs[1]),
      ].join('\n\n'),
      defaults.about.paragraphs,
    ),
    ctaLabel: read('home.about.ctaLabel', defaults.about.ctaLabel),
    globalTagline: read(
      'home.about.globalTagline',
      defaults.about.globalTagline,
    ),
    globalDescription: read(
      'home.about.globalDescription',
      defaults.about.globalDescription,
    ),
  }
  content.choirProgram = {
    eyebrowKo: read(
      'home.choirProgram.eyebrowKo',
      defaults.choirProgram.eyebrowKo,
    ),
    eyebrowEn: read(
      'home.choirProgram.eyebrowEn',
      defaults.choirProgram.eyebrowEn,
    ),
    title: read('home.choirProgram.title', defaults.choirProgram.title),
    items: normalizeProgramItems(record),
  }
  content.joinLetter = {
    eyebrowKo: read(
      'home.joinLetter.eyebrowKo',
      defaults.joinLetter.eyebrowKo,
    ),
    eyebrowEn: read(
      'home.joinLetter.eyebrowEn',
      defaults.joinLetter.eyebrowEn,
    ),
    title: read('home.joinLetter.title', defaults.joinLetter.title),
    description: read(
      'home.joinLetter.description',
      defaults.joinLetter.description,
    ),
    ctaLabel: read(
      'home.joinLetter.ctaLabel',
      defaults.joinLetter.ctaLabel,
    ),
  }

  for (const key of Object.keys(defaults.concertProgram) as Array<
    keyof HomeContentV2['concertProgram']
  >) {
    content.concertProgram[key] = read(
      `home.concertProgram.${key}`,
      defaults.concertProgram[key],
    )
  }

  content.scoreBook = {
    eyebrowKo: read(
      'home.scoreBook.eyebrowKo',
      defaults.scoreBook.eyebrowKo,
    ),
    cover: {
      brandLabel: defaults.scoreBook.cover.brandLabel,
      titleLines: splitLines(
        read(
          'home.scoreBook.cover.titleLines',
          defaults.scoreBook.cover.titleLines.join('\n'),
        ),
        defaults.scoreBook.cover.titleLines,
      ),
    },
    leftPage: {
      titleLines: splitLines(
        read(
          'home.scoreBook.leftPage.titleLines',
          defaults.scoreBook.leftPage.titleLines.join('\n'),
        ),
        defaults.scoreBook.leftPage.titleLines,
      ),
      body: read(
        'home.scoreBook.leftPage.body',
        defaults.scoreBook.leftPage.body,
      ),
      keywords: read(
        'home.scoreBook.leftPage.keywords',
        defaults.scoreBook.leftPage.keywords,
      ),
      calloutTitle: read(
        'home.scoreBook.leftPage.calloutTitle',
        defaults.scoreBook.leftPage.calloutTitle,
      ),
      calloutBody: read(
        'home.scoreBook.leftPage.calloutBody',
        defaults.scoreBook.leftPage.calloutBody,
      ),
    },
    rightPage: {
      prefix: read(
        'home.scoreBook.rightPage.prefix',
        defaults.scoreBook.rightPage.prefix,
      ),
      titleLines: splitLines(
        read(
          'home.scoreBook.rightPage.titleLines',
          defaults.scoreBook.rightPage.titleLines.join('\n'),
        ),
        defaults.scoreBook.rightPage.titleLines,
      ),
      body: read(
        'home.scoreBook.rightPage.body',
        defaults.scoreBook.rightPage.body,
      ),
      keywords: read(
        'home.scoreBook.rightPage.keywords',
        defaults.scoreBook.rightPage.keywords,
      ),
      calloutTitle: read(
        'home.scoreBook.rightPage.calloutTitle',
        defaults.scoreBook.rightPage.calloutTitle,
      ),
      calloutBody: read(
        'home.scoreBook.rightPage.calloutBody',
        defaults.scoreBook.rightPage.calloutBody,
      ),
    },
    valueItems: normalizeScoreValueItems(record),
    final: {
      titleLines: splitLines(
        read(
          'home.scoreBook.final.titleLines',
          defaults.scoreBook.final.titleLines.join('\n'),
        ),
        defaults.scoreBook.final.titleLines,
      ),
      summary: read(
        'home.scoreBook.final.summary',
        defaults.scoreBook.final.summary,
      ),
      primaryCtaLabel: read(
        'home.scoreBook.final.primaryCtaLabel',
        defaults.scoreBook.final.primaryCtaLabel,
      ),
      secondaryCtaLabel: read(
        'home.scoreBook.final.secondaryCtaLabel',
        defaults.scoreBook.final.secondaryCtaLabel,
      ),
    },
  }

  for (const key of Object.keys(defaults.spiritWrapper) as Array<
    keyof HomeContentV2['spiritWrapper']
  >) {
    content.spiritWrapper[key] = read(
      `home.spiritWrapper.${key}`,
      defaults.spiritWrapper[key],
    )
  }

  for (const key of Object.keys(defaults.archive) as Array<
    keyof HomeContentV2['archive']
  >) {
    content.archive[key] = read(
      `home.archive.${key}`,
      defaults.archive[key],
    )
  }

  for (const key of Object.keys(defaults.sponsors) as Array<
    keyof HomeContentV2['sponsors']
  >) {
    content.sponsors[key] = read(
      `home.sponsors.${key}`,
      defaults.sponsors[key],
    )
  }

  for (const key of Object.keys(defaults.supportLetter) as Array<
    keyof HomeContentV2['supportLetter']
  >) {
    content.supportLetter[key] = read(
      `home.supportLetter.${key}`,
      defaults.supportLetter[key],
    )
  }

  content.version = HOME_CONTENT_VERSION
  return content
}

export function normalizeHomeContentV2(
  source?: HomeContentSource,
): HomeContentV2 {
  return normalizeFromFlat(toFlatRecord(source))
}

export function migrateHomeContentV1ToV2(
  source?: HomeContentSource,
): HomeContentV2 {
  return normalizeHomeContentV2(source)
}

export function isHomeContentV2(value: unknown): value is HomeContentV2 {
  if (!isPlainRecord(value) || value.version !== HOME_CONTENT_VERSION) {
    return false
  }

  return [
    'heroSupplement',
    'quickActions',
    'about',
    'choirProgram',
    'joinLetter',
    'concertProgram',
    'scoreBook',
    'spiritWrapper',
    'archive',
    'sponsors',
    'supportLetter',
  ].every((key) => isPlainRecord(value[key]))
}

function readNestedValue(content: HomeContentV2, key: string): unknown {
  const path = key.replace(/^home\./, '').split('.')
  let value: unknown = content

  for (const segment of path) {
    if (!isPlainRecord(value) && !Array.isArray(value)) {
      return undefined
    }

    value = (value as Record<string, unknown>)[segment]
  }

  return value
}

export function getHomeContentV2Value(
  content: HomeContentV2,
  key: string,
): string {
  const aboutParagraphMatch = key.match(/^home\.about\.paragraphs\.(\d+)$/)
  if (aboutParagraphMatch) {
    return content.about.paragraphs[Number(aboutParagraphMatch[1]) - 1] ?? ''
  }

  const mottoMatch = key.match(/^home\.heroSupplement\.mottoChips\.(\d)$/)
  if (mottoMatch) {
    return content.heroSupplement.mottoChips[Number(mottoMatch[1]) - 1] ?? ''
  }

  const quickMatch = key.match(
    /^home\.quickActions\.(join|concert|support)\.(\w+)$/,
  )
  if (quickMatch) {
    const item = content.quickActions.items.find(
      (candidate) => candidate.id === quickMatch[1],
    )
    return item
      ? String(item[quickMatch[2] as keyof HomeQuickActionItem] ?? '')
      : ''
  }

  const programMatch = key.match(
    /^home\.choirProgram\.items\.(foundation|education|performance|growth)\.(\w+)$/,
  )
  if (programMatch) {
    const item = content.choirProgram.items.find(
      (candidate) => candidate.id === programMatch[1],
    )
    return item
      ? String(item[programMatch[2] as keyof HomeProgramItem] ?? '')
      : ''
  }

  const valueMatch = key.match(
    /^home\.scoreBook\.valueItems\.(voice|score|part|ensemble|stage|guide)\.(\w+)$/,
  )
  if (valueMatch) {
    const item = content.scoreBook.valueItems.find(
      (candidate) => candidate.id === valueMatch[1],
    )
    return item
      ? String(item[valueMatch[2] as keyof HomeScoreValueItem] ?? '')
      : ''
  }

  const value = readNestedValue(content, key)
  return Array.isArray(value) ? value.join('\n') : String(value ?? '')
}

export function flattenHomeContentV2(
  content: HomeContentV2,
): HomeContentFlatRecord {
  return Object.fromEntries(
    homeContentSiteTextDefinitions.map((definition) => [
      definition.key,
      getHomeContentV2Value(content, definition.key),
    ]),
  )
}
