import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loadPublicEditorPages } from '../../lib/siteEditorApi'
import { loadPublishedEditorDocuments } from '../../lib/siteEditorPublication'
import { buildEditorCss, getEditorDevice, resolveEditorCopy } from '../../lib/siteEditorModel'
import {
  acceptSiteEditorMessage, getActiveSiteEditorPreviewNonce, getPreviewNavigationTarget, getSiteEditorPage,
  PREVIEW_SUBMISSION_MESSAGE, SITE_EDITOR_PROTOCOL_VERSION,
} from '../../lib/siteEditorPreview'
import type { SiteEditorDocuments } from '../../types/siteEditor'
import { SiteEditorContext } from './useSiteEditor'
import previewCss from './site-editor-public.css?inline'
import editorFontFaces from './site-editor-fonts.css?inline'
import textStyleCss from './site-editor-text-styles.css?inline'
import type { createCanvasRuntime } from './canvasRuntime'

export function SiteEditorProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const page = getSiteEditorPage(location.pathname, location.search)
  const nonce = getActiveSiteEditorPreviewNonce(location.search)
  const isPreview = Boolean(page && nonce && typeof window !== 'undefined' && window.parent !== window)
  const [published, setPublished] = useState<SiteEditorDocuments>({})
  const [preview, setPreview] = useState<{ nonce: string; page: string; sequence: number; documents: SiteEditorDocuments } | null>(null)
  const [device, setDevice] = useState(() => getEditorDevice(typeof window === 'undefined' ? 1440 : window.innerWidth))
  const [notice, setNotice] = useState('')
  const sequence = useRef(0)
  const appliedSequence = useRef(0)
  const frozen = useRef(false)
  const queuedPreview = useRef<typeof preview>(null)
  const queuedPublished = useRef<SiteEditorDocuments | null>(null)
  const [canvas, setCanvas] = useState<ReturnType<typeof createCanvasRuntime> | null>(null)
  const documents = useMemo(() => isPreview && preview?.nonce === nonce && preview.page === page
    ? { ...published, ...preview.documents } : published, [isPreview, nonce, page, preview, published])
  const copy = useCallback((target: Parameters<typeof resolveEditorCopy>[1], key: string, fallback: string) =>
    resolveEditorCopy(documents, target, key, fallback, device), [documents, device])
  const hasTextStyles = page ? [documents.common, documents[page]].some(document => Object.values(document?.textStyles ?? {}).some(values => Object.values(values ?? {}).some(copy => copy.runs.length > 0))) : false
  const css = useMemo(() => page ? buildEditorCss(documents, page) + (hasTextStyles ? textStyleCss : '') : '', [documents, page, hasTextStyles])
  const context = useMemo(() => ({ copy, documents, device, isPreview, canvas: isPreview ? canvas?.registry : undefined }), [copy, documents, device, isPreview, canvas])

  useEffect(() => {
    if (!isPreview || !nonce || !page) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void Promise.all([import('./canvasRuntime'), import('./canvas-runtime.css')]).then(([{ createCanvasRuntime }]) => {
      if (disposed) return
      const runtime = createCanvasRuntime({ nonce, page, getDraftSequence: () => appliedSequence.current,
        freeze(active) {
          frozen.current = active
          if (!active) {
            if (queuedPublished.current) { setPublished(queuedPublished.current); queuedPublished.current = null }
            if (queuedPreview.current) { setPreview(queuedPreview.current); queuedPreview.current = null }
          }
        },
      })
      setCanvas(runtime); cleanup = runtime.mount()
    }).catch(() => { if (!disposed) setNotice('화면 편집을 불러오지 못했습니다. 관리자 문구 목록을 이용하거나 미리보기를 새로고침해 주세요.') })
    return () => { disposed = true; cleanup?.(); frozen.current = false; queuedPreview.current = null; queuedPublished.current = null }
  }, [isPreview, nonce, page])

  useEffect(() => {
    if (!isPreview || !nonce || new URLSearchParams(location.search).get('site-editor-preview') === nonce) return
    const search = new URLSearchParams(location.search)
    search.set('site-editor-preview', nonce)
    navigate(`${location.pathname}?${search}${location.hash}`, { replace: true, preventScrollReset: true })
  }, [isPreview, location.hash, location.pathname, location.search, navigate, nonce])

  useEffect(() => {
    if (!page) return
    let disposed = false
    const load = async () => {
      const result = await loadPublishedEditorDocuments(loadPublicEditorPages)
      if (disposed) return
      if (result) { if (frozen.current) queuedPublished.current = result; else setPublished(result) }
    }
    void load()
    const refresh = () => { if (!document.hidden) void load() }
    const resize = () => setDevice(getEditorDevice(window.innerWidth))
    window.addEventListener('focus', refresh)
    window.addEventListener('site-editor-published', refresh)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(refresh, 30_000)
    return () => {
      disposed = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('site-editor-published', refresh)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [page])

  useEffect(() => {
    if (!isPreview || !nonce || !page) return
    sequence.current = 0
    const receive = (event: MessageEvent) => {
      const message = acceptSiteEditorMessage(event, { origin: window.location.origin, source: window.parent, nonce, page, lastSequence: sequence.current, type: 'smyc-editor:draft' })
      if (!message || message.type !== 'smyc-editor:draft') return
      sequence.current = message.sequence
      const next = { nonce, page, sequence: message.sequence, documents: message.documents }
      if (frozen.current) { queuedPreview.current = next; canvas?.deferred(message.sequence) }
      else setPreview(next)
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: 'smyc-editor:ready', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page }, window.location.origin)
    return () => window.removeEventListener('message', receive)
  }, [isPreview, nonce, page, canvas])

  useEffect(() => {
    if (!isPreview || !preview || preview.nonce !== nonce || preview.page !== page) return
    appliedSequence.current = preview.sequence
    window.parent.postMessage({ type: 'smyc-editor:applied', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page, sequence: preview.sequence }, window.location.origin)
    canvas?.refreshed()
  }, [isPreview, nonce, page, preview, canvas])

  useEffect(() => {
    if (!page || !css) return
    const previous = document.body.getAttribute('data-site-editor-page')
    document.body.setAttribute('data-site-editor-page', page)
    return () => {
      if (previous === null) document.body.removeAttribute('data-site-editor-page')
      else document.body.setAttribute('data-site-editor-page', previous)
    }
  }, [css, page])

  useEffect(() => {
    if (!isPreview || !nonce || !page) return
    const submit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement) || event.target.getAttribute('role') === 'search') return
      event.preventDefault()
      event.stopPropagation()
      setNotice(PREVIEW_SUBMISSION_MESSAGE)
    }
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null
      if (document.body.dataset.canvasEditMode === 'true' && element?.closest('[data-canvas-target]')) {
        event.preventDefault(); event.stopPropagation(); return
      }
      if (element?.closest('input[type="file"]')) {
        event.preventDefault(); event.stopPropagation(); setNotice('미리보기에서는 파일을 첨부할 수 없습니다.'); return
      }
      const anchor = element?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) return
      event.preventDefault()
      const target = anchor.hasAttribute('download') ? null : getPreviewNavigationTarget(anchor.href, window.location.href, nonce, page)
      if (target) { navigate(target); setNotice('') }
      else { event.stopPropagation(); setNotice('미리보기에서는 선택한 화면 안에서만 이동할 수 있습니다. 다른 화면은 편집기의 화면 선택을 이용해 주세요.') }
    }
    document.addEventListener('submit', submit, true)
    document.addEventListener('click', click, true)
    return () => {
      document.removeEventListener('submit', submit, true)
      document.removeEventListener('click', click, true)
    }
  }, [isPreview, navigate, nonce, page])

  if (!page) return children

  return (
    <SiteEditorContext value={context}>
      {css || isPreview ? <style>{css.includes('"Gothic A1"') || hasTextStyles || isPreview ? editorFontFaces : ''}{isPreview ? previewCss : ''}{css}</style> : null}
      {isPreview ? <div className="site-editor-preview-banner" role="status">초안 미리보기 · 실제 접수는 차단됩니다.{notice ? <span>{notice}</span> : null}</div> : null}
      {children}
    </SiteEditorContext>
  )
}
