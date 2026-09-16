import { homeContentSiteTextDefinitions } from '../constants/homeContentV2'
import type {
  HomeContentFlatRecord,
  HomeContentSiteTextDefinition,
  HomeContentV2,
} from '../types/homeContent'
import { getHomeContentV2Value, normalizeHomeContentV2 } from './homeContent'

export type HomeEditorDevice = 'desktop' | 'tablet' | 'mobile'

export type HomeEditorFieldDefinition = HomeContentSiteTextDefinition & {
  device: HomeEditorDevice
  sourceKey: string
}

const fieldsUnder = (prefix: string, properties: readonly string[]) =>
  properties.map((property) => `${prefix}.${property}`)

const quickKeys = ['join', 'concert', 'support'].flatMap((id) =>
  fieldsUnder(`home.quickActions.${id}`, ['title', 'displayOrder', 'isVisible']),
)

// This is an explicit consumer whitelist, not all fields sharing a section name.
// Hidden tablet CTA copy, desktop animations, fixed routes and shared datasets
// deliberately do not become mobile/tablet editor fields.
const commonResponsiveKeys = [
  ...quickKeys,
  ...fieldsUnder('home.current.about', ['eyebrowEn', 'title', 'ctaLabel']),
  ...fieldsUnder('home.current.join', ['eyebrowEn', 'ctaLabel']),
  ...fieldsUnder('home.concertProgram', [
    'eyebrowEn', 'title', 'responsiveDescription', 'responsiveCardEyebrow',
    'detailCtaLabel', 'noticePanelTitle', 'noticePanelCtaLabel',
    'emptyConcertTitle', 'emptyConcertDescription', 'emptyConcertCtaLabel',
    'emptyNoticeTitle', 'emptyNoticeDescription', 'emptyNoticeCtaLabel',
  ]),
  ...fieldsUnder('home.spiritWrapper', [
    'responsiveEyebrow', 'responsiveTitle', 'responsiveDescription', 'responsiveCtaLabel',
    'responsiveLabel1', 'responsiveLabel2', 'responsiveLabel3', 'responsiveLabel4', 'responsiveLabel5',
  ]),
  ...fieldsUnder('home.current.archive', ['eyebrowEn', 'desktopTitle', 'ctaLabel', 'emptyTitle', 'emptyDescription', 'title']),
  ...fieldsUnder('home.supportLetter', [
    'responsiveTitle', 'primaryCtaLabel', 'pledgeEyebrow', 'pledgeTitle',
    'responsiveUse1', 'responsiveUse2', 'responsiveUse3',
  ]),
]

const responsiveSourceKeys: Record<Exclude<HomeEditorDevice, 'desktop'>, readonly string[]> = {
  mobile: [
    ...commonResponsiveKeys,
    ...fieldsUnder('home.responsive.about', ['mobileDescription', 'founded', 'context']),
    ...fieldsUnder('home.responsive.join', ['mobileTitle', 'mobileDescription', 'mobileGuardianNotes']),
    'home.current.join.secondaryCtaLabel',
    ...fieldsUnder('home.concertProgram', ['concertsCtaLabel', 'responsiveNoticeEyebrow', 'responsiveNoticeImportantLabel']),
    ...fieldsUnder('home.supportLetter', ['eyebrowEn', 'responsiveMobileDescription', 'responsiveMobilePledgeDescription']),
  ],
  tablet: [
    ...commonResponsiveKeys,
    ...fieldsUnder('home.responsive.about', ['tabletDescription', 'tabletFacts']),
    ...fieldsUnder('home.current.join', ['title', 'description', 'compactDescription']),
    'home.responsive.join.tabletGuardianNotes',
    ...fieldsUnder('home.scoreBook', [
      'responsiveEyebrow', 'responsiveTitle', 'responsiveLeftTitle', 'responsiveLeftBody', 'responsiveRightTitle', 'responsiveRightBody',
    ]),
    ...fieldsUnder('home.supportLetter', ['responsiveTabletEyebrow', 'responsiveTabletDescription', 'responsiveTabletPledgeDescription']),
  ],
}

function isLegacyResponsiveKey(key: string) {
  return key.startsWith('home.responsive.') || /^home\.[^.]+\.responsive[A-Z]/.test(key)
}

const sourceDefinitions = new Map(homeContentSiteTextDefinitions.map((field) => [field.key, field]))

function responsiveFields(device: Exclude<HomeEditorDevice, 'desktop'>): HomeEditorFieldDefinition[] {
  const deviceLabel = device === 'mobile' ? '모바일' : '태블릿'
  return responsiveSourceKeys[device].map((sourceKey) => {
    const source = sourceDefinitions.get(sourceKey)
    if (!source) throw new Error(`Unknown home editor source field: ${sourceKey}`)
    return {
      ...source,
      device,
      sourceKey,
      key: `home.${device}.${sourceKey.slice('home.'.length)}`,
      label: sourceKey === 'home.current.archive.desktopTitle'
        ? '기록 제목'
        : source.label.replace(/^(모바일·태블릿|모바일|태블릿)\s+/, ''),
      description: `${deviceLabel} 홈에만 적용됩니다. 다른 기기의 문구는 바뀌지 않으며, 비어 있거나 사용할 수 없는 값은 승인된 시안 기본값으로 표시됩니다.`,
    }
  })
}

const editorFields: Record<HomeEditorDevice, HomeEditorFieldDefinition[]> = {
  desktop: homeContentSiteTextDefinitions
    .filter((field) => !isLegacyResponsiveKey(field.key))
    .map((field) => ({ ...field, device: 'desktop', sourceKey: field.key })),
  mobile: responsiveFields('mobile'),
  tablet: responsiveFields('tablet'),
}

export function getHomeEditorFields(device: HomeEditorDevice): HomeEditorFieldDefinition[] {
  return editorFields[device].map((field) => ({ ...field }))
}

export const homeAllEditorFields: HomeEditorFieldDefinition[] = [
  ...getHomeEditorFields('desktop'),
  ...getHomeEditorFields('tablet'),
  ...getHomeEditorFields('mobile'),
]

const collectionVisibilityKeys = homeContentSiteTextDefinitions
  .filter((field) => field.inputType === 'boolean' && field.key.endsWith('.isVisible'))
  .map((field) => field.key)

/** Read filtered collections without losing the editor's hidden item metadata. */
function readEditorValues(
  record: HomeContentFlatRecord,
  fields: readonly HomeEditorFieldDefinition[],
): HomeContentFlatRecord {
  const publicContent = normalizeHomeContentV2(record)
  const visibleRecord = { ...record }
  for (const key of collectionVisibilityKeys) visibleRecord[key] = 'true'
  const metadataContent = normalizeHomeContentV2(visibleRecord)

  return Object.fromEntries(fields.map((field) => {
    const content = field.inputType === 'boolean' ? publicContent : metadataContent
    const value = getHomeContentV2Value(content, field.sourceKey)
    return [field.key, field.inputType === 'boolean' ? value || 'false' : value]
  }))
}

function resolveDeviceRecord(
  rawFlat: HomeContentFlatRecord,
  device: Exclude<HomeEditorDevice, 'desktop'>,
): HomeContentFlatRecord {
  const fields = editorFields[device]
  const candidates: HomeContentFlatRecord = {}
  for (const field of fields) {
    // An explicit own value, including blank/unsafe input, always wins selection.
    // Its normalization fallback is the design default, never the other view.
    candidates[field.sourceKey] = Object.hasOwn(rawFlat, field.key)
      ? rawFlat[field.key]
      : isLegacyResponsiveKey(field.sourceKey) && Object.hasOwn(rawFlat, field.sourceKey)
        ? rawFlat[field.sourceKey]
        : field.defaultValue
  }

  // Sanitize in isolation so the core legacy migrator cannot reintroduce a
  // desktop alias when a device field is blank or malformed.
  const safeValues = readEditorValues(candidates, fields)
  const resolvedRecord = { ...rawFlat }
  for (const field of fields) resolvedRecord[field.sourceKey] = safeValues[field.key]
  return resolvedRecord
}

export function resolveHomeContentForDevice(
  rawFlat: HomeContentFlatRecord,
  device: HomeEditorDevice,
): HomeContentV2 {
  return normalizeHomeContentV2(device === 'desktop' ? rawFlat : resolveDeviceRecord(rawFlat, device))
}

export function createHomeEditorValues(activeRawFlat: HomeContentFlatRecord): HomeContentFlatRecord {
  return {
    ...readEditorValues(activeRawFlat, editorFields.desktop),
    ...readEditorValues(resolveDeviceRecord(activeRawFlat, 'tablet'), editorFields.tablet),
    ...readEditorValues(resolveDeviceRecord(activeRawFlat, 'mobile'), editorFields.mobile),
  }
}
