import { useSampleLanguage } from './useSampleLanguage'
import { useLocation } from 'react-router'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'

export function SampleLanguageSwitch() {
  const { enabled, language, setLanguage, contentError, contentRetrying, retryContent } = useSampleLanguage()
  const { copy: copyText } = useSiteEditor()
  const location = useLocation()
  if (!enabled || new URLSearchParams(location.search).has('site-editor-preview')) return null
  return <div className="sample-language-switch" role="group" aria-label={language === 'en' ? 'Language' : '언어 선택'}>
    <button type="button" lang="ko" aria-label="한국어" aria-pressed={language === 'ko'} onClick={() => setLanguage('ko')}>KR</button>
    <span aria-hidden="true">/</span>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    {contentError ? <div className="sample-language-switch__issue" lang="en" role="status">
      <p>{copyText('common', 'common.languageContentError', 'Some English content could not be loaded. Available content is still shown.')}</p>
      <button disabled={contentRetrying} onClick={retryContent} type="button">{contentRetrying ? copyText('common', 'common.languageContentRetrying', 'Retrying…') : copyText('common', 'common.languageContentRetry', 'Retry')}</button>
    </div> : null}
  </div>
}
