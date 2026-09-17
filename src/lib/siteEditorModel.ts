import type {
  EditorAppearance, EditorDevice, EditorPageId, SiteEditorDocument, SiteEditorDocuments,
} from '../types/siteEditor'
import { EDITOR_FONTS, EDITOR_FONT_FAMILIES as fontFamilies, isEditorRecord as isPlainRecord, isEditorCopyKey as validCopyKey, isEditorCopyText as validCopyText, validateTextStyles } from './siteEditorTextStyles'
export { EDITOR_FONTS } from './siteEditorTextStyles'

export const EDITOR_PAGE_IDS: readonly EditorPageId[] = [
  'common', 'home', 'about', 'spirit', 'conductor', 'accompanist', 'members', 'history',
  'concerts', 'concert-detail', 'notices', 'notice-detail', 'gallery', 'join', 'contact',
]
export const EDITOR_DEVICES: readonly EditorDevice[] = ['mobile', 'tablet', 'desktop']
export const EDITOR_NUMBER_RANGES = {
  fontSize: [12, 32], h1Size: [20, 120], h2Size: [16, 80], h3Size: [14, 64],
  labelSize: [10, 24], lineHeight: [1.1, 2.4], letterSpacing: [-0.04, 0.2],
} as const

const colors = ['textColor', 'headingColor', 'mutedColor', 'accentColor', 'backgroundColor'] as const
const documentKeys = ['schemaVersion', 'copy', 'deviceCopy', 'appearance', 'textStyles']
const appearanceKeys = ['fontFamily', 'headingFontFamily', 'fontWeight', ...Object.keys(EDITOR_NUMBER_RANGES), ...colors]

export function isEditorPageId(value: unknown): value is EditorPageId {
  return typeof value === 'string' && EDITOR_PAGE_IDS.some(page => page === value)
}

function validCopyMap(value: unknown): boolean {
  return isPlainRecord(value) && Object.entries(value).every(([key, text]) => validCopyKey(key) && validCopyText(text))
}

function validAppearance(value: unknown): boolean {
  if (!isPlainRecord(value) || Object.keys(value).some(key => !appearanceKeys.includes(key))) return false
  return Object.entries(value).every(([key, entry]) => {
    if (key === 'fontFamily' || key === 'headingFontFamily') return EDITOR_FONTS.some(font => font === entry)
    if (colors.some(color => color === key)) return typeof entry === 'string' && /^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(entry)
    if (typeof entry !== 'number' || !Number.isFinite(entry)) return false
    if (key === 'fontWeight') return entry >= 300 && entry <= 900 && entry % 100 === 0
    const [min, max] = EDITOR_NUMBER_RANGES[key as keyof typeof EDITOR_NUMBER_RANGES]
    return entry >= min && entry <= max
  })
}

export function emptySiteEditorDocument(): SiteEditorDocument {
  return { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} }
}

export function validateSiteEditorDocument(value: unknown): string | null {
  try {
    if (!isPlainRecord(value)
      || Object.keys(value).some(key => !documentKeys.includes(key)) || value.schemaVersion !== 1) {
      return '편집 문서 형식을 확인해 주세요.'
    }
    if (!validCopyMap(value.copy)) return '문구 키는 120자, 문구는 10,000자 이내의 일반 텍스트로 입력해 주세요. HTML 태그는 사용할 수 없습니다.'
    if (!isPlainRecord(value.deviceCopy) || Object.entries(value.deviceCopy).some(([device, copy]) =>
      !EDITOR_DEVICES.some(item => item === device) || !validCopyMap(copy))) {
      return '기기별 문구 형식을 확인해 주세요.'
    }
    if (!isPlainRecord(value.appearance) || Object.entries(value.appearance).some(([scope, appearance]) =>
      !(scope === 'shared' || EDITOR_DEVICES.some(device => device === scope)) || !validAppearance(appearance))) {
      return '디자인의 글꼴, 크기, 색상과 입력 범위를 확인해 주세요.'
    }
    if (Object.hasOwn(value, 'textStyles')) {
      const error = validateTextStyles(value.textStyles)
      if (error) return error
    }
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 512 * 1024) {
      return '편집 문서는 512KB 이내로 저장해 주세요.'
    }
    return null
  } catch {
    return '편집 문서 형식을 확인해 주세요.'
  }
}

export function getEditorDevice(width: number): EditorDevice {
  return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
}

export function resolveEditorCopy(
  documents: SiteEditorDocuments, page: EditorPageId, key: string, fallback: string, device: EditorDevice,
): string {
  if (!isEditorPageId(page) || !validCopyKey(key) || !EDITOR_DEVICES.includes(device)) return fallback
  const document = documents[page]
  if (!document || document.schemaVersion !== 1) return fallback
  for (const copy of [document.deviceCopy?.[device], document.copy]) {
    if (copy && Object.hasOwn(copy, key) && validCopyText(copy[key])) return copy[key]
  }
  return fallback
}

function appearanceCss(root: string, appearance: EditorAppearance): string {
  const rules: string[] = []
  const textual = 'h1,h2,h3,h4,h5,h6,p,li,dd,dt,blockquote,figcaption,a,button,label,legend,input,textarea,select,option,span,strong,em,small'
  const allText = `${root},${root} :is(${textual})`
  const role = (name: string, tags: string) => `${root} :is(${tags},[data-site-editor-role="${name}"]),${root} :is(${tags},[data-site-editor-role="${name}"]) :is(span,a,strong,em)`
  const body = role('body', 'p,li,dd,dt,blockquote,figcaption,input,textarea,select,button')
  const headings = role('heading', 'h1,h2,h3,h4,h5,h6')
  const add = (selector: string, property: string, value: string | number | undefined) => {
    if (value !== undefined) rules.push(`${selector}{${property}:${value}!important;}`)
  }
  if (appearance.fontFamily) add(allText, 'font-family', fontFamilies[appearance.fontFamily])
  if (appearance.headingFontFamily) add(headings, 'font-family', fontFamilies[appearance.headingFontFamily])
  add(allText, 'font-weight', appearance.fontWeight)
  add(allText, 'line-height', appearance.lineHeight)
  if (appearance.letterSpacing !== undefined) add(allText, 'letter-spacing', `${appearance.letterSpacing}em`)
  if (appearance.fontSize !== undefined) add(body, 'font-size', `${appearance.fontSize}px`)
  for (const heading of ['h1', 'h2', 'h3'] as const) {
    const size = appearance[`${heading}Size`]
    if (size !== undefined) add(role(heading, heading), 'font-size', `${size}px`)
  }
  if (appearance.labelSize !== undefined) add(role('label', 'label,legend'), 'font-size', `${appearance.labelSize}px`)
  add(allText, 'color', appearance.textColor)
  add(headings, 'color', appearance.headingColor)
  add(role('muted', 'small'), 'color', appearance.mutedColor)
  add(`${root} [data-site-editor-role="accent"],${root} [data-site-editor-role="accent"] :is(span,strong,em,a)`, 'color', appearance.accentColor)
  for (const [color, selectors] of [
    [appearance.mutedColor, ['[class*="__description"]', '[class*="__summary"]', '[class*="__lead"]', '.text-text-muted']],
    [appearance.accentColor, ['[class*="__eyebrow"]', '.text-gold-warm', '.text-gold-ink']],
  ] as const) {
    if (color !== undefined) add(selectors.flatMap(selector => [`${root} ${selector}`, `${root} ${selector} :is(span,a,strong,em)`]).join(','), 'color', color)
  }
  add(root, 'background-color', appearance.backgroundColor)
  return rules.join('\n')
}

export function buildEditorCss(documents: SiteEditorDocuments, page: EditorPageId): string {
  if (!isEditorPageId(page)) return ''
  const common = documents.common
  const current = documents[page]
  if ((common && validateSiteEditorDocument(common)) || (current && validateSiteEditorDocument(current))) return ''
  const root = `[data-site-editor-page="${page}"]`
  const conditions: Record<EditorDevice, string> = {
    mobile: '(max-width:767.98px)',
    tablet: '(min-width:768px) and (max-width:1023.98px)',
    desktop: '(min-width:1024px)',
  }
  return EDITOR_DEVICES.map(device => {
    const appearance = {
      ...common?.appearance.shared, ...common?.appearance[device],
      ...current?.appearance.shared, ...current?.appearance[device],
    }
    const css = appearanceCss(root, appearance)
    return css ? `@media ${conditions[device]}{\n${css}\n}` : ''
  }).filter(Boolean).join('\n')
}
