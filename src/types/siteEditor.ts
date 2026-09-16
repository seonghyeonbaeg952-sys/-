export type EditorDevice = 'mobile' | 'tablet' | 'desktop'

export type EditorPageId =
  | 'common' | 'home' | 'about' | 'spirit' | 'conductor' | 'accompanist'
  | 'members' | 'history' | 'concerts' | 'concert-detail' | 'notices'
  | 'notice-detail' | 'gallery' | 'join' | 'contact'

export type EditorFont = 'system' | 'gothic-a1' | 'hahmlet' | 'arita-buri' | 'gowun-batang' | 'grandiflora'

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
