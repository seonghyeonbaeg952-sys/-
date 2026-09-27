import { isEditorBoxAnchor, isEditorPageId, validateSiteEditorDocument } from './siteEditorModel'
import type { EditorPageId, SiteEditorDocuments } from '../types/siteEditor'

export const SITE_EDITOR_PROTOCOL_VERSION = 1 as const
export const PREVIEW_SUBMISSION_MESSAGE = '미리보기에서는 접수할 수 없습니다. 실제 홈페이지에서 작성해 주세요.'
type PreviewContext = { pathname: string; search: string; isEmbedded: boolean }
type MessageBase = { version: 1; nonce: string; page: EditorPageId }
export type PreviewPageIntent = { page: EditorPageId; path: string }
export type SiteEditorPreviewMessage = MessageBase & (
  | { type: 'smyc-editor:ready' }
  | { type: 'smyc-editor:draft'; sequence: number; documents: SiteEditorDocuments }
  | { type: 'smyc-editor:applied'; sequence: number }
  | { type: 'smyc-editor:anchors'; sequence: number; anchors: { id: string; label: string }[] }
  | { type: 'smyc-editor:navigate'; sequence: number; requestId: string; target: PreviewPageIntent }
)
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getSiteEditorPage(pathname: string, search = ''): EditorPageId | null {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/' || path === '/home-classic') return 'home'
  if (path === '/about') {
    const section = new URLSearchParams(search).get('section')
    // The existing about router treats the legacy "spirit" section as overview.
    return section && ['conductor', 'accompanist', 'members', 'history'].includes(section)
      ? section as EditorPageId : 'about'
  }
  if (/^\/concerts\/[^/]+$/.test(path)) return 'concert-detail'
  if (/^\/notices\/[^/]+$/.test(path)) return 'notice-detail'
  const page = path.slice(1)
  return ['spirit', 'concerts', 'notices', 'gallery', 'join', 'contact'].includes(page) ? page as EditorPageId : null
}

export function getSiteEditorPreviewNonce(search: string): string | null {
  const values = new URLSearchParams(search).getAll('site-editor-preview')
  return values.length === 1 && uuid.test(values[0]) ? values[0] : null
}

// Memory-only marker survives router redirects which rebuild their query string.
// It contains no draft or personal data and is never written to browser storage.
const initialPreviewNonce = typeof window !== 'undefined' && window.parent !== window
  && getSiteEditorPage(window.location.pathname, window.location.search)
  ? getSiteEditorPreviewNonce(window.location.search) : null

export function getActiveSiteEditorPreviewNonce(search: string): string | null {
  return getSiteEditorPreviewNonce(search) ?? initialPreviewNonce
}

export function isSiteEditorPreview(context?: PreviewContext): boolean {
  const current = context ?? (typeof window === 'undefined' ? undefined : {
    pathname: window.location.pathname, search: window.location.search, isEmbedded: window.parent !== window,
  })
  return Boolean(current?.isEmbedded && getSiteEditorPage(current.pathname, current.search)
    && (context ? getSiteEditorPreviewNonce(current.search) : getActiveSiteEditorPreviewNonce(current.search)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

export function parseSiteEditorMessage(value: unknown): SiteEditorPreviewMessage | null {
  if (!isRecord(value) || value.version !== SITE_EDITOR_PROTOCOL_VERSION
    || typeof value.nonce !== 'string' || !uuid.test(value.nonce) || !isEditorPageId(value.page)) return null
  const common = ['type', 'version', 'nonce', 'page']
  if (value.type === 'smyc-editor:ready') {
    return Object.keys(value).every(key => common.includes(key)) ? value as SiteEditorPreviewMessage : null
  }
  if (value.type !== 'smyc-editor:draft' && value.type !== 'smyc-editor:applied' && value.type !== 'smyc-editor:anchors' && value.type !== 'smyc-editor:navigate') return null
  if (!Number.isSafeInteger(value.sequence) || Number(value.sequence) < 1) return null
  if (value.type === 'smyc-editor:navigate') {
    if (Object.keys(value).some(key => ![...common, 'sequence', 'requestId', 'target'].includes(key))
      || typeof value.requestId !== 'string' || !uuid.test(value.requestId) || !isRecord(value.target)
      || Object.keys(value.target).some(key => !['page', 'path'].includes(key)) || typeof value.target.path !== 'string'
      || !value.target.path.startsWith('/') || value.target.path.startsWith('//') || value.target.path.length > 2048) return null
    const target = getPreviewPageIntent(value.target.path, 'https://preview.invalid')
    return target && target.page === value.target.page && target.path === value.target.path ? value as SiteEditorPreviewMessage : null
  }
  if (value.type === 'smyc-editor:applied') {
    return Object.keys(value).every(key => [...common, 'sequence'].includes(key)) ? value as SiteEditorPreviewMessage : null
  }
  if (value.type === 'smyc-editor:anchors') {
    if (Object.keys(value).some(key => ![...common, 'sequence', 'anchors'].includes(key))
      || !Array.isArray(value.anchors) || value.anchors.length > 32) return null
    const seen = new Set<string>()
    for (const entry of value.anchors) {
      if (!isRecord(entry) || Object.keys(entry).some(key => !['id', 'label'].includes(key))
        || typeof entry.id !== 'string' || !isEditorBoxAnchor(entry.id) || seen.has(entry.id)
        || typeof entry.label !== 'string' || !entry.label.trim() || entry.label.length > 80
        || entry.label.includes('<') || entry.label.includes('>')
        || [...entry.label].some(character => character.charCodeAt(0) < 32)) return null
      seen.add(entry.id)
    }
    return value as SiteEditorPreviewMessage
  }
  if (Object.keys(value).some(key => ![...common, 'sequence', 'documents'].includes(key)) || !isRecord(value.documents)) return null
  if (Object.entries(value.documents).some(([page, document]) => !isEditorPageId(page) || validateSiteEditorDocument(document))) return null
  return value as SiteEditorPreviewMessage
}

export function acceptSiteEditorMessage(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string; source: unknown; nonce: string; page: EditorPageId; lastSequence?: number; type?: SiteEditorPreviewMessage['type'] },
): SiteEditorPreviewMessage | null {
  if (event.origin !== expected.origin || event.source !== expected.source || !expected.source) return null
  const message = parseSiteEditorMessage(event.data)
  if (!message || message.nonce !== expected.nonce || message.page !== expected.page
    || (expected.type && message.type !== expected.type)) return null
  if ('sequence' in message && message.sequence <= (expected.lastSequence ?? 0)) return null
  return message
}

export function getPreviewNavigationTarget(href: string, base: string, nonce: string, page: EditorPageId): string | null {
  try {
    const current = new URL(base)
    const next = new URL(href, current)
    if (!uuid.test(nonce) || next.origin !== current.origin || !['http:', 'https:'].includes(next.protocol)
      || getSiteEditorPage(next.pathname, next.search) !== page) return null
    next.searchParams.set('site-editor-preview', nonce)
    return `${next.pathname}${next.search}${next.hash}`
  } catch {
    return null
  }
}

/** Resolve a public destination for the parent CMS, never navigation out of the iframe. */
export function getPreviewPageIntent(href: string, base: string): PreviewPageIntent | null {
  try {
    const current = new URL(base), next = new URL(href, current)
    if (next.origin !== current.origin || !['http:', 'https:'].includes(next.protocol) || next.username || next.password) return null
    // The existing home performance carousel still contains these legacy links.
    // Resolve only its known public destinations; never allow arbitrary sample pages.
    if (/^\/sample\/concerts(?:\/[^/]+)?\/?$/.test(next.pathname)) next.pathname = next.pathname.replace(/^\/sample/, '')
    const page = getSiteEditorPage(next.pathname, next.search)
    if (!page) return null
    next.searchParams.delete('site-editor-preview')
    return { page, path: `${next.pathname}${next.search}${next.hash}` }
  } catch { return null }
}
