import { useId, useMemo, useState } from 'react'
import type { EditorTextRun, SiteCopyDefinition, SiteEditorDocument } from '../../../types/siteEditor'
import { AdminFormField } from '../AdminFormField'
import { AdminSelect } from '../AdminSelect'
import { Button } from '../../common/Button'
import type { EditorScope } from './editorSessionModel'
import { EditorTextSelection } from './EditorTextSelection'
import { resolveTextRuns, supportsTextSegmentation } from '../../../lib/siteEditorTextStyles'
import { richCopyKeys } from '../../../content/richCopyKeys'
import { homeRichCopySourceKeys } from '../../../content/homeRichCopyKeys'
import { copyIsOverridden, copyValue, findCopyMatches, inspectCopyText, type CopyReplacementPlan, type CopySearchOptions } from './editorCopyTools'
import { EditorCopyActions } from './EditorCopyActions'

type Props = {
  definitions: SiteCopyDefinition[]
  document: SiteEditorDocument
  baseline: SiteEditorDocument
  scope: EditorScope
  defaults: Record<string, string>
  emptyMessage?: string
  onChange: (key: string, value: string | undefined) => void
  onFormat: (key: string, text: string, runs: EditorTextRun[]) => void
  onReplace?: (plan: CopyReplacementPlan, keys: string[]) => string | null
  initialKey?: string
  onCompositionChange?: (active: boolean) => void
}

function readKeys(storage: 'localStorage' | 'sessionStorage', name: string): string[] {
  try {
    const value: unknown = JSON.parse(window[storage].getItem(name) ?? '[]')
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string' && /^[a-zA-Z0-9_.-]{1,120}$/.test(key)).slice(0, 200) : []
  } catch { return [] }
}

export function EditorCopyPanel({ definitions, document, baseline, scope, defaults, emptyMessage, onChange, onFormat, onReplace, initialKey = '', onCompositionChange }: Props) {
  const id = useId().replaceAll(':', '')
  const [search, setSearch] = useState('')
  const [matchedKeys, setMatchedKeys] = useState<Set<string> | null>(null)
  const [visibleCount, setVisibleCount] = useState(() => Math.max(20, definitions.findIndex(item => item.key === initialKey) + 1))
  const [section, setSection] = useState('all')
  const [selectedKey, setSelectedKey] = useState(initialKey)
  const [filter, setFilter] = useState('all')
  const [filterKeys, setFilterKeys] = useState<Set<string> | null>(null)
  const [options, setOptions] = useState<CopySearchOptions>({ matchCase: false, wholeWord: false })
  const [favorites, setFavorites] = useState(() => readKeys('localStorage', 'smyc-copy-favorites-v1'))
  const [recent, setRecent] = useState(() => readKeys('sessionStorage', 'smyc-copy-recent-v1'))
  const [preferenceNotice, setPreferenceNotice] = useState('')
  const [composing, setComposing] = useState(false)
  const sections = useMemo(() => [...new Set(definitions.map((field) => field.section))], [definitions])
  const activeSection = sections.includes(section) ? section : 'all'
  const overrides = scope === 'shared' ? document.copy : document.deviceCopy[scope] ?? {}
  const fallback = (field: SiteCopyDefinition) => (scope !== 'shared' ? document.copy[field.key] : undefined) ?? defaults[field.key] ?? field.defaultValue
  // Snapshot matches only when the user searches. Re-filtering on every edited
  // character would unmount the focused input as soon as its old word changes.
  const searchFor = (value: string, nextOptions = options) => {
    const query = value
    setSearch(value)
    setMatchedKeys(query ? new Set(definitions.filter((field) => {
      return findCopyMatches(`${field.label} ${field.section} ${overrides[field.key] ?? fallback(field)}`, query, nextOptions).length > 0
    }).map((field) => field.key)) : null)
    setVisibleCount(20)
  }
  const filtered = definitions.filter((field) =>
    (activeSection === 'all' || field.section === activeSection) && (!matchedKeys || matchedKeys.has(field.key)) && (!filterKeys || filterKeys.has(field.key)))
  const field = filtered.find(item => item.key === selectedKey) ?? filtered[0]
  const value = field ? overrides[field.key] ?? fallback(field) : ''
  const canFormat = Boolean(supportsTextSegmentation && field && (!field.inputType || ['text', 'textarea'].includes(field.inputType)) &&
    (richCopyKeys.has(field.key) || (field.sourceDevice && field.sourceKey && homeRichCopySourceKeys[field.sourceDevice].has(field.sourceKey))))
  const isOverride = Boolean(field && (Object.hasOwn(overrides, field.key) || Object.hasOwn(document.textStyles?.[scope] ?? {}, field.key)))
  const fieldIndex = field ? filtered.indexOf(field) : -1
  const setViewFilter = (next: string, pins = favorites) => {
    setFilter(next); setVisibleCount(20)
    setFilterKeys(next === 'all' ? null : new Set(definitions.filter(item => {
      if (next === 'favorites') return pins.includes(item.key)
      if (next === 'recent') return recent.includes(item.key)
      if (next === 'issues') return (!item.inputType || ['text', 'textarea'].includes(item.inputType)) && inspectCopyText(copyValue(item, document, scope, defaults), item.maxLength).length > 0
      if (next === 'changed') return JSON.stringify([overrides[item.key], document.textStyles?.[scope]?.[item.key]]) !== JSON.stringify([(scope === 'shared' ? baseline.copy : baseline.deviceCopy[scope] ?? {})[item.key], baseline.textStyles?.[scope]?.[item.key]])
      return copyIsOverridden(document, scope, item.key) === (next === 'overridden')
    }).map(item => item.key)))
  }
  const rememberMany = (keys: string[]) => {
    const next = [...new Set([...keys, ...recent])].slice(0, 50)
    setRecent(next)
    try { window.sessionStorage.setItem('smyc-copy-recent-v1', JSON.stringify(next)) } catch { setPreferenceNotice('최근 편집 목록은 이 화면을 닫기 전까지만 유지됩니다.') }
  }
  const remember = (key: string) => rememberMany([key])
  const toggleFavorite = () => {
    if (!field) return
    const next = favorites.includes(field.key) ? favorites.filter(key => key !== field.key) : [...favorites, field.key].slice(-200)
    setFavorites(next)
    try { window.localStorage.setItem('smyc-copy-favorites-v1', JSON.stringify(next)) } catch { setPreferenceNotice('브라우저 저장소를 사용할 수 없어 즐겨찾기는 현재 화면에서만 유지됩니다.') }
    if (filter === 'favorites') setViewFilter(filter, next)
  }
  const moveResult = (direction: number) => {
    const index = (fieldIndex + direction + filtered.length) % filtered.length
    if (filtered[index]) { setSelectedKey(filtered[index].key); setVisibleCount(count => Math.max(count, index + 1)) }
  }
  const highlight = (text: string) => {
    const matches = findCopyMatches(text, search, options)
    let cursor = 0
    return [...matches.flatMap(match => {
      const prefix = text.slice(cursor, match.start); cursor = match.end
      return [prefix, <mark key={match.start}>{text.slice(match.start, match.end)}</mark>]
    }), text.slice(cursor)]
  }

  return (
    <div className="site-editor__copy">
      <div className="site-editor__filters">
        <AdminFormField disabled={composing} id={`${id}-search`} label="문구 찾기" type="search" value={search} onChange={(event) => searchFor(event.target.value)} placeholder="화면에 보이는 문장이나 항목명" />
        <AdminSelect disabled={composing} id={`${id}-section`} label="화면 안 위치" value={activeSection} onChange={(event) => { setSection(event.target.value); setVisibleCount(20) }} options={[{ label: '모든 위치', value: 'all' }, ...sections.map((value) => ({ label: value, value }))]} />
        <AdminSelect disabled={composing} id={`${id}-filter`} label="문구 보기" value={filter} onChange={event => setViewFilter(event.target.value)} options={[{ value: 'all', label: '모든 문구' }, { value: 'changed', label: '임시저장 전 변경만' }, { value: 'favorites', label: '즐겨찾기' }, { value: 'recent', label: '최근 편집 · 이 탭' }, { value: 'overridden', label: '현재 범위에서 수정한 문구' }, { value: 'inherited', label: '원문·공통값을 쓰는 문구' }, { value: 'issues', label: '빈 문구·공백·길이 점검' }]} />
      </div>
      <details className="copy-tools__options"><summary>검색 옵션과 사용 안내</summary><fieldset disabled={composing} className="copy-tools__checks">
        <label><input type="checkbox" checked={options.matchCase} onChange={event => { const next = { ...options, matchCase: event.target.checked }; setOptions(next); searchFor(search, next) }} />대소문자 구분</label>
        <label><input type="checkbox" checked={options.wholeWord} onChange={event => { const next = { ...options, wholeWord: event.target.checked }; setOptions(next); searchFor(search, next) }} />완전한 단어만</label>
      </fieldset><p className="site-editor__help">정규식이 아닌 입력한 글자를 찾습니다. 수정 중에는 목록이 사라지지 않도록 결과를 유지합니다. 검색·필터 새로고침으로 다시 점검할 수 있습니다. Ctrl/⌘ + Shift + F는 전체 페이지 찾기입니다.</p></details>
      <div className="site-editor__field-actions"><p className="site-editor__help" role="status">{filtered.length}개 문구{field ? ` · ${fieldIndex + 1}번째 선택` : ''}{search ? ` · 본문 ${filtered.reduce((sum, item) => sum + findCopyMatches(copyValue(item, document, scope, defaults), search, options).length, 0)}곳 일치` : ''}</p><div className="site-editor__inline-actions">
        <Button size="sm" variant="ghost" aria-label="이전 검색 결과" disabled={composing || filtered.length < 2} onClick={() => moveResult(-1)}>이전</Button>
        <Button size="sm" variant="ghost" aria-label="다음 검색 결과" disabled={composing || filtered.length < 2} onClick={() => moveResult(1)}>다음</Button>
        <Button size="sm" variant="ghost" disabled={composing} onClick={() => { searchFor(search); setViewFilter(filter) }}>검색·필터 새로고침</Button>
      </div></div>
      {preferenceNotice ? <p role="status" className="site-editor__help">{preferenceNotice}</p> : null}
      {filtered.length === 0 ? (
        <div className="site-editor__empty">
          <p>{definitions.length ? '검색에 맞는 문구가 없습니다.' : emptyMessage ?? '이 범위의 직접 편집 문구가 없습니다. 아래 콘텐츠 관리에서 원문을 확인하세요.'}</p>
          {definitions.length ? <Button variant="secondary" onClick={() => { searchFor(''); setSection('all'); setViewFilter('all') }}>검색 초기화</Button> : null}
        </div>
      ) : <>
        <div className="site-editor__copy-choices" aria-label="편집할 문구">
          {filtered.slice(0, visibleCount).map(item => <button type="button" key={item.key} disabled={composing} className="site-editor__copy-choice" aria-pressed={field?.key === item.key} onClick={() => setSelectedKey(item.key)}>
            <strong>{favorites.includes(item.key) ? '★ ' : ''}{item.label}</strong><span>{(overrides[item.key] ?? fallback(item)) ? highlight((overrides[item.key] ?? fallback(item)).slice(0, 160)) : '(빈 문구)'}</span><small>{item.section} · {copyIsOverridden(document, scope, item.key) ? '이 범위에서 수정함' : '원문·공통값'}</small>
          </button>)}
        </div>
        {filtered.length > visibleCount ? <Button variant="secondary" size="sm" onClick={() => setVisibleCount(count => count + 20)}>문구 더 보기 · 남은 {filtered.length - visibleCount}개</Button> : null}
        {field ? <div className="site-editor__field" key={field.key}>
            <Button size="sm" variant="ghost" disabled={composing} aria-label="선택 문구 즐겨찾기" aria-pressed={favorites.includes(field.key)} onClick={toggleFavorite}>{favorites.includes(field.key) ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}</Button>
            <p className="site-editor__help">{field.section} · {isOverride ? '이 범위에서 수정함' : '현재 원문 또는 공통값 사용 중'}</p>
            {field.inputType === 'boolean' ? (
              <AdminSelect id={`${id}-value`} label={field.label} value={value} options={[{ label: '표시', value: 'true' }, { label: '숨김', value: 'false' }]} onChange={(event) => { remember(field.key); onChange(field.key, event.target.value) }} />
            ) : field.inputType === 'number' || field.inputType === 'url' ? (
              <AdminFormField id={`${id}-value`} label={field.label} value={value} type={field.inputType === 'number' ? 'number' : 'text'} min={field.min} max={field.max} maxLength={field.maxLength ?? 10000} onChange={(event) => { remember(field.key); onChange(field.key, event.target.value) }} />
            ) : (
              <EditorTextSelection label={field.label} value={value} runs={resolveTextRuns(document, scope, field.key, value)} maxLength={field.maxLength} allowFormatting={canFormat} onCompositionChange={active => { setComposing(active); onCompositionChange?.(active) }} onChange={(text, runs) => { remember(field.key); if (canFormat) onFormat(field.key, text, runs); else onChange(field.key, text) }} />
            )}
            <div className="site-editor__field-actions">
              <span className="site-editor__help">{Array.from(value).length.toLocaleString('ko-KR')}자</span>
              <Button variant="ghost" size="sm" disabled={composing || !isOverride} aria-label={`${field.label} ${scope === 'shared' ? '원문으로 되돌리기' : '공통값 또는 기기 원문 사용'}`} onClick={() => onChange(field.key, undefined)}>{scope === 'shared' ? '원문으로 되돌리기' : '공통값 사용'}</Button>
            </div>
            <fieldset disabled={composing}><EditorCopyActions field={field} definitions={filtered} document={document} baseline={baseline} scope={scope} defaults={defaults} query={search} options={options} onReplace={onReplace ? (plan, keys) => { const error = onReplace(plan, keys); if (!error) { rememberMany(keys); searchFor(search) } return error } : undefined} /></fieldset>
          </div> : null}
      </>}
    </div>
  )
}
