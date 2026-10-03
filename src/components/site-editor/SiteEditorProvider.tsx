import { Activity, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { invalidateEditorCache, invalidateSampleEnglishEditorCache, loadPublicEditorPages, loadPublicSampleEnglishEditorPages } from '../../lib/siteEditorApi'
import { loadPublishedEditorDocuments, retainPublishedEditorDocuments } from '../../lib/siteEditorPublication'
import { buildEditorCss, getEditorDevice } from '../../lib/siteEditorModel'
import {
  acceptSiteEditorMessage, getActiveSiteEditorPreviewNonce, getPreviewNavigationTarget, getSiteEditorPage,
  getPreviewPageIntent,
  PREVIEW_SUBMISSION_MESSAGE, SITE_EDITOR_PROTOCOL_VERSION,
} from '../../lib/siteEditorPreview'
import type { SiteEditorDocuments } from '../../types/siteEditor'
import { SiteEditorContext } from './useSiteEditor'
import previewCss from './site-editor-public.css?inline'
import editorFontFaces from './site-editor-fonts.css?inline'
import textStyleCss from './site-editor-text-styles.css?inline'
import type { createCanvasRuntime } from './canvasRuntime'
import type { createCanvasPlacementRuntime } from './canvasPlacementRuntime'
import { AddedTextBoxes } from './AddedTextBoxes'
import { chooseEditorSectionAnchors } from '../../lib/siteEditorAddedBoxes'
import { getEditorSectionLabel } from '../../lib/editorSectionLabel'
import { isPreviewControlActivation } from './previewInteraction'
import { SampleLanguageContext, useSampleLanguage } from '../../features/sample-language/useSampleLanguage'
import { sampleEnglishDocuments } from '../../features/sample-language/sampleEnglishDocuments'
import { createEditorLanguagePresentation } from './siteEditorLanguagePresentation'
import { useHomeResponsiveViewport } from '../home/useHomeResponsiveViewport'

export function SiteEditorProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const sample = useSampleLanguage()
  const isEnglish = sample.enabled && sample.language === 'en'
  const page = getSiteEditorPage(location.pathname, location.search)
  const nonce = getActiveSiteEditorPreviewNonce(location.search)
  const isPreview = Boolean(page && nonce && typeof window !== 'undefined' && window.parent !== window)
  const [published, setPublished] = useState<SiteEditorDocuments>({})
  const [englishPublished, setEnglishPublished] = useState<SiteEditorDocuments>({})
  const [sourceRead, setSourceRead] = useState({ attempt: -1, error: false })
  const [englishRead, setEnglishRead] = useState({ attempt: -1, error: false })
  const [publicationAttempt, setPublicationAttempt] = useState(0)
  const retryRecordContent = sample.retryContent
  const retryPublication = useCallback(() => {
    // A timed-out pending request must not be reused by an explicit retry.
    invalidateEditorCache()
    if (isEnglish) {
      invalidateSampleEnglishEditorCache()
      retryRecordContent?.()
    }
    setPublicationAttempt(attempt => attempt + 1)
  }, [isEnglish, retryRecordContent])
  const publicationRetrying = publicationAttempt > 0 && (sourceRead.attempt < publicationAttempt || (isEnglish && englishRead.attempt < publicationAttempt))
  const [preview, setPreview] = useState<{ nonce: string; page: string; sequence: number; documents: SiteEditorDocuments } | null>(null)
  const responsiveDevice = useHomeResponsiveViewport()
  const [previewDevice, setPreviewDevice] = useState(() => getEditorDevice(typeof window === 'undefined' ? 1440 : window.innerWidth))
  // Public composition follows the same orientation/pointer rules as the page.
  // A CMS iframe remains tied to its explicitly chosen editing viewport.
  const device = isPreview ? previewDevice : responsiveDevice
  const [notice, setNotice] = useState('')
  const sequence = useRef(0)
  const appliedSequence = useRef(0)
  const frozen = useRef(false)
  const queuedPreview = useRef<typeof preview>(null)
  const queuedPublished = useRef<SiteEditorDocuments | null>(null)
  const queuedEnglishPublished = useRef<SiteEditorDocuments | null>(null)
  const [canvas, setCanvas] = useState<ReturnType<typeof createCanvasRuntime> | null>(null)
  const [placement, setPlacement] = useState<ReturnType<typeof createCanvasPlacementRuntime> | null>(null)
  const hasPreview = isPreview && preview?.nonce === nonce && preview.page === page
  const sourceDocuments = useMemo(() => !isEnglish && hasPreview
    ? { ...published, ...preview.documents } : published, [isEnglish, hasPreview, preview, published])
  const englishDocuments = useMemo(() => isEnglish && hasPreview
    ? { ...englishPublished, ...preview.documents } : englishPublished, [isEnglish, hasPreview, preview, englishPublished])
  const documents = useMemo(() => isEnglish ? sampleEnglishDocuments(sourceDocuments, englishDocuments) : sourceDocuments,
    [isEnglish, sourceDocuments, englishDocuments])
  const presentation = useMemo(() => createEditorLanguagePresentation(sourceDocuments, documents, sample, device),
    [sourceDocuments, documents, sample, device])
  const copy = presentation.copy
  const languageContext = useMemo(() => ({
    ...presentation.languageContext,
    contentError: Boolean(sourceRead.error || (isEnglish && (sample.contentError || englishRead.error))),
    contentRetrying: Boolean(publicationRetrying || (isEnglish && sample.contentRetrying)),
    retryContent: retryPublication,
  }), [sample.contentError, sample.contentRetrying, isEnglish, presentation.languageContext, sourceRead.error, englishRead.error, publicationRetrying, retryPublication])
  const hasTextStyles = page ? [documents.common, documents[page]].some(document => Object.values(document?.textStyles ?? {}).some(values => Object.values(values ?? {}).some(copy => copy.runs.length > 0))) : false
  const css = useMemo(() => page ? buildEditorCss(documents, page) + (hasTextStyles ? textStyleCss : '') : '', [documents, page, hasTextStyles])
  const context = useMemo(() => ({ copy, documents, sourceDocuments, device, isPreview, canvas: isPreview ? canvas?.registry : undefined }), [copy, documents, sourceDocuments, device, isPreview, canvas])

  useEffect(() => {
    if (!isEnglish || !page) return
    let disposed = false
    let readSequence = 0
    const load = async () => {
      const request = ++readSequence
      const result = await loadPublishedEditorDocuments(loadPublicSampleEnglishEditorPages)
      if (!disposed && request === readSequence) {
        if (result) {
          if (frozen.current) queuedEnglishPublished.current = result
          else setEnglishPublished(current => retainPublishedEditorDocuments(current, result))
        }
        setEnglishRead(current => current.attempt === publicationAttempt && current.error === (result === null)
          ? current : { attempt: publicationAttempt, error: result === null })
      }
    }
    void load()
    const refresh = () => { if (!document.hidden && !frozen.current) void load() }
    window.addEventListener('focus', refresh)
    window.addEventListener('sample-english-published', refresh)
    const timer = window.setInterval(refresh, 30000)
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('sample-english-published', refresh) }
  }, [isEnglish, page, publicationAttempt])

  useEffect(() => {
    if (!isPreview || !nonce || !page) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void Promise.all([import('./canvasRuntime'), import('./canvasPlacementRuntime'), import('./canvas-runtime.css')]).then(([{ createCanvasRuntime }, { createCanvasPlacementRuntime }]) => {
      if (disposed) return
      const freeze = (active: boolean) => {
          frozen.current = active
          if (!active) {
            if (queuedPublished.current) { const next = queuedPublished.current; setPublished(current => retainPublishedEditorDocuments(current, next)); queuedPublished.current = null }
            if (queuedEnglishPublished.current) { const next = queuedEnglishPublished.current; setEnglishPublished(current => retainPublishedEditorDocuments(current, next)); queuedEnglishPublished.current = null }
            if (queuedPreview.current) { setPreview(queuedPreview.current); queuedPreview.current = null }
          }
      }
      const runtime = createCanvasRuntime({ nonce, page, getDraftSequence: () => appliedSequence.current, freeze })
      const placementRuntime = createCanvasPlacementRuntime({ nonce, page, getAppliedSequence: () => appliedSequence.current, freeze,
        finishTextEdit: () => runtime.finishForPlacement() })
      setCanvas(runtime)
      setPlacement(placementRuntime)
      const unmountCanvas = runtime.mount()
      const unmountPlacement = placementRuntime.mount()
      cleanup = () => { unmountPlacement(); unmountCanvas() }
    }).catch(() => { if (!disposed) setNotice('화면 편집을 불러오지 못했습니다. 관리자 문구 목록을 이용하거나 미리보기를 새로고침해 주세요.') })
    return () => { disposed = true; cleanup?.(); frozen.current = false; queuedPreview.current = null; queuedPublished.current = null; queuedEnglishPublished.current = null }
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
    let readSequence = 0
    const load = async () => {
      const request = ++readSequence
      const result = await loadPublishedEditorDocuments(loadPublicEditorPages)
      if (disposed || request !== readSequence) return
      if (result) { if (frozen.current) queuedPublished.current = result; else setPublished(current => retainPublishedEditorDocuments(current, result)) }
      setSourceRead(current => current.attempt === publicationAttempt && current.error === (result === null)
        ? current : { attempt: publicationAttempt, error: result === null })
    }
    void load()
    const refresh = () => { if (!document.hidden) void load() }
    const resize = () => setPreviewDevice(getEditorDevice(window.innerWidth))
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
  }, [page, publicationAttempt])

  useEffect(() => {
    if (!isPreview || !nonce || !page) return
    sequence.current = 0
    const receive = (event: MessageEvent) => {
      const message = acceptSiteEditorMessage(event, { origin: window.location.origin, source: window.parent, nonce, page, lastSequence: sequence.current, type: 'smyc-editor:draft' })
      if (!message || message.type !== 'smyc-editor:draft') return
      sequence.current = message.sequence
      const next = { nonce, page, sequence: message.sequence, documents: message.documents }
      if (frozen.current) { queuedPreview.current = next; canvas?.deferred(message.sequence); placement?.deferred(message.sequence) }
      else setPreview(next)
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: 'smyc-editor:ready', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page }, window.location.origin)
    return () => window.removeEventListener('message', receive)
  }, [isPreview, nonce, page, canvas, placement])

  useEffect(() => {
    if (!isPreview || !preview || preview.nonce !== nonce || preview.page !== page) return
    appliedSequence.current = preview.sequence
    window.parent.postMessage({ type: 'smyc-editor:applied', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page, sequence: preview.sequence }, window.location.origin)
    let observer: MutationObserver | null = null
    let lastAnchorSignature = ''
    const announceAnchors = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('main[id], main section'))
        .filter(node => (node.tagName === 'MAIN' || node.id || node.classList.contains('flow-section') || node.parentElement?.tagName === 'MAIN')
          && node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0)
      const ids = chooseEditorSectionAnchors(nodes.map(node => ({ id: node.id, classes: [...node.classList] })))
    const anchors = nodes.flatMap((node, index) => ids[index] ? [{ id: ids[index], label: node.tagName === 'MAIN' ? '본문 아래'
        : getEditorSectionLabel(node.querySelector<HTMLElement>('h1,h2,h3'), node.getAttribute('aria-label')) }] : []).slice(0, 32)
      const signature = JSON.stringify(anchors)
      if (signature !== lastAnchorSignature) {
        lastAnchorSignature = signature
        window.parent.postMessage({ type: 'smyc-editor:anchors', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page, sequence: preview.sequence, anchors }, window.location.origin)
      }
    }
    observer = new MutationObserver(announceAnchors)
    observer.observe(document.body, { childList: true, subtree: true })
    announceAnchors()
    const timeout = window.setTimeout(() => { announceAnchors(); observer?.disconnect() }, 3000)
    canvas?.refreshed()
    placement?.refreshed()
    return () => { observer?.disconnect(); window.clearTimeout(timeout) }
  }, [isPreview, nonce, page, preview, canvas, placement])

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
      const nativeControl = isPreviewControlActivation(event)
      if (nativeControl && (document.body.dataset.canvasEditPending === 'true' || document.querySelector('.canvas-editor-overlay'))) {
        event.preventDefault(); event.stopImmediatePropagation(); setNotice('현재 문구의 편집을 마친 뒤 버튼을 사용하세요. 입력은 유지됩니다.'); return
      }
      if (document.body.dataset.canvasEditMode === 'true' && !nativeControl && element?.closest('[data-canvas-target]')) {
        event.preventDefault(); event.stopPropagation(); return
      }
      if (element?.closest('input[type="file"]')) {
        event.preventDefault(); event.stopPropagation(); setNotice('미리보기에서는 파일을 첨부할 수 없습니다.'); return
      }
      const anchor = element?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) return
      event.preventDefault()
      const target = anchor.hasAttribute('download') ? null : getPreviewNavigationTarget(anchor.href, window.location.href, nonce, page)
      if (target) { navigate(sample.isSample ? target.replace(/^\/sample(?=\/|\?|#|$)/, '') || '/' : target); setNotice('') }
      else {
        event.stopPropagation()
        const intent = !anchor.hasAttribute('download') ? getPreviewPageIntent(anchor.href, window.location.href) : null
        if (intent && appliedSequence.current > 0) {
          window.parent.postMessage({ type: 'smyc-editor:navigate', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page,
            sequence: appliedSequence.current, requestId: crypto.randomUUID(), target: intent }, window.location.origin)
          setNotice('선택한 화면을 편집기에서 여는 중입니다.')
        } else setNotice('미리보기에서는 외부 링크와 다운로드를 실행하지 않습니다. 공개 홈페이지에서 확인하세요.')
      }
    }
    document.addEventListener('submit', submit, true)
    document.addEventListener('click', click, true)
    return () => {
      document.removeEventListener('submit', submit, true)
      document.removeEventListener('click', click, true)
    }
  }, [isPreview, navigate, nonce, page, sample.isSample])

  if (!page) return children

  const publicationLoading = !isPreview && (sourceRead.attempt < 0 || (isEnglish && (englishRead.attempt < 0 || sample.contentLoading)))

  return (
    <SampleLanguageContext value={languageContext}><SiteEditorContext value={context}>
      {publicationLoading ? <main aria-busy="true" aria-live="polite" className="route-loading-screen route-loading-screen--public" lang={isEnglish ? 'en' : 'ko'} role="status">
      <div aria-hidden="true" className="route-loading-screen__mark"><span>S</span><span>M</span><span>Y</span><span>C</span></div>
      <div className="route-loading-screen__copy">
        <p>{isEnglish ? 'Seoul Motet Youth Choir' : '서울모테트청소년합창단'}</p>
        <strong>{isEnglish ? 'Loading the English page…' : '홈페이지의 게시 문구를 불러오고 있습니다.'}</strong>
        {isEnglish ? <button className="sample-language-switch__trigger" lang="ko" onClick={() => sample.setLanguage('ko')} type="button">한국어로 보기</button> : null}
      </div>
      </main> : null}
      {/* Preserve unsent forms and submission refs while publication is loading.
          Hidden Activity also pauses page effects without exposing stale copy. */}
      <Activity mode={publicationLoading ? 'hidden' : 'visible'}>
        {css || isPreview ? <style>{css.includes('"Gothic A1"') || hasTextStyles || isPreview ? editorFontFaces : ''}{isPreview ? previewCss : ''}{css}</style> : null}
        {isPreview ? <div className="site-editor-preview-banner" role="status">초안 미리보기 · 실제 접수는 차단됩니다.{notice ? <span>{notice}</span> : null}</div> : null}
        {children}
        <AddedTextBoxes page={page} document={documents[page]} />
      </Activity>
    </SiteEditorContext></SampleLanguageContext>
  )
}
