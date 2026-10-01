import { useEffect, useId, useRef, useState } from 'react'
import { useSampleLanguage } from './useSampleLanguage'
import { useLocation } from 'react-router'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'

const LANGUAGE_CODES = { ko: 'KOR', en: 'ENG' } as const

export function SampleLanguageSwitch({ onLanguageChange }: { onLanguageChange?: () => void } = {}) {
  const { enabled, language, setLanguage, contentError, contentRetrying, retryContent } = useSampleLanguage()
  const { copy: copyText } = useSiteEditor()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsId = useId()

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const chooseLanguage = (next: 'ko' | 'en') => {
    setLanguage(next)
    setOpen(false)
    onLanguageChange?.()
  }

  if (!enabled || new URLSearchParams(location.search).has('site-editor-preview')) return null
  return <div className="sample-language-switch" ref={rootRef}>
    <button aria-controls={optionsId} aria-expanded={open} aria-label={language === 'en' ? 'Language: English' : '언어 선택: 한국어'} className="sample-language-switch__trigger" onClick={() => setOpen(value => !value)} ref={triggerRef} type="button">
      {LANGUAGE_CODES[language]} <span aria-hidden="true">▾</span>
    </button>
    {open ? <div aria-label={language === 'en' ? 'Choose language' : '언어 선택'} className="sample-language-switch__options" id={optionsId} role="group">
      <button aria-pressed={language === 'ko'} lang="ko" onClick={() => chooseLanguage('ko')} type="button">한국어</button>
      <button aria-pressed={language === 'en'} lang="en" onClick={() => chooseLanguage('en')} type="button">English</button>
    </div> : null}
    {contentError ? <div className="sample-language-switch__issue" lang="en" role="status">
      <p>{copyText('common', 'common.languageContentError', 'Some English content could not be loaded. Available content is still shown.')}</p>
      <button disabled={contentRetrying} onClick={retryContent} type="button">{contentRetrying ? copyText('common', 'common.languageContentRetrying', 'Retrying…') : copyText('common', 'common.languageContentRetry', 'Retry')}</button>
    </div> : null}
  </div>
}
