export type EditorDevice = 'mobile' | 'tablet' | 'desktop'

export type EditorPageId =
  | 'common' | 'home' | 'about' | 'spirit' | 'conductor' | 'accompanist'
  | 'members' | 'history' | 'concerts' | 'concert-detail' | 'notices'
  | 'notice-detail' | 'gallery' | 'join' | 'contact'

export type EditorFont = 'system' | 'gothic-a1' | 'hahmlet' | 'arita-buri' | 'gowun-batang' | 'grandiflora'

export type EditorTextStyle = {
  fontFamily?: EditorFont
  fontSize?: number
  color?: string
  fontWeight?: 400 | 500 | 600 | 700 | 800
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
}
/** UTF-16 offsets, aligned to whole graphemes (the browser selection convention). */
export type EditorTextRun = { start: number; end: number; style: EditorTextStyle }
export type EditorStyledCopy = { text: string; runs: EditorTextRun[] }

/** Explicit block layout: offsets are CSS px, width is a percentage; height is always automatic. */
export type EditorTextLayout = {
  offsetX?: number
  offsetY?: number
  width?: number
  textAlign?: 'start' | 'center' | 'end'
}

export type EditorAppearance = {
  fontFamily?: EditorFont
  headingFontFamily?: EditorFont
  fontSize?: number
  h1Size?: number
  h2Size?: number
  h3Size?: number
  labelSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textColor?: string
  headingColor?: string
  mutedColor?: string
  accentColor?: string
  backgroundColor?: string
}

export type SiteEditorDocument = {
  schemaVersion: 1
  copy: Record<string, string>
  deviceCopy: Partial<Record<EditorDevice, Record<string, string>>>
  appearance: Partial<Record<'shared' | EditorDevice, EditorAppearance>>
  textStyles?: Partial<Record<'shared' | EditorDevice, Record<string, EditorStyledCopy>>>
  textLayouts?: Partial<Record<EditorDevice, Record<string, EditorTextLayout>>>
}

export type SiteEditorDocuments = Partial<Record<EditorPageId, SiteEditorDocument>>

export type SiteEditorPageRecord = {
  page_key: EditorPageId
  draft: SiteEditorDocument
  published: SiteEditorDocument | null
  version: number
  updated_at: string
  published_at: string | null
}

export type SiteEditorRevision = {
  id: string
  page_key: EditorPageId
  document: SiteEditorDocument
  published_at: string
}

export type SiteCopyDefinition = {
  key: string
  page: EditorPageId
  section: string
  label: string
  defaultValue: string
  multiline?: boolean
  inputType?: 'text' | 'textarea' | 'url' | 'boolean' | 'number'
  sourceKey?: string
  sourceDevice?: EditorDevice
  min?: number
  max?: number
  maxLength?: number
}
