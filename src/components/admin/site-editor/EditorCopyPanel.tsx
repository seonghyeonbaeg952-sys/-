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

type Props = {
  definitions: SiteCopyDefinition[]
  document: SiteEditorDocument
  scope: EditorScope
  defaults: Record<string, string>
  emptyMessage?: string
  onChange: (key: string, value: string | undefined) => void
  onFormat: (key: string, text: string, runs: EditorTextRun[]) => void
}

export function EditorCopyPanel({ definitions, document, scope, defaults, emptyMessage, onChange, onFormat }: Props) {
  const id = useId().replaceAll(':', '')
  const [search, setSearch] = useState('')
  const [matchedKeys, setMatchedKeys] = useState<Set<string> | null>(null)
  const [visibleCount, setVisibleCount] = useState(20)
  const [section, setSection] = useState('all')
  const [selectedKey, setSelectedKey] = useState('')
  const sections = useMemo(() => [...new Set(definitions.map((field) => field.section))], [definitions])
  const activeSection = sections.includes(section) ? section : 'all'
  const overrides = scope === 'shared' ? document.copy : document.deviceCopy[scope] ?? {}
  const fallback = (field: SiteCopyDefinition) => (scope !== 'shared' ? document.copy[field.key] : undefined) ?? defaults[field.key] ?? field.defaultValue
  // Snapshot matches only when the user searches. Re-filtering on every edited
  // character would unmount the focused input as soon as its old word changes.
  const searchFor = (value: string) => {
    const query = value.trim().toLocaleLowerCase('ko-KR')
    setSearch(value)
    setMatchedKeys(query ? new Set(definitions.filter((field) => {
      const words = `${field.label} ${field.section} ${overrides[field.key] ?? fallback(field)}`.toLocaleLowerCase('ko-KR')
      return words.includes(query)
    }).map((field) => field.key)) : null)
    setVisibleCount(20)
  }
  const filtered = definitions.filter((field) =>
    (activeSection === 'all' || field.section === activeSection) && (!matchedKeys || matchedKeys.has(field.key)))
  const field = filtered.find(item => item.key === selectedKey) ?? filtered[0]
  const value = field ? overrides[field.key] ?? fallback(field) : ''
  const canFormat = Boolean(supportsTextSegmentation && field && (!field.inputType || ['text', 'textarea'].includes(field.inputType)) &&
    (richCopyKeys.has(field.key) || (field.sourceDevice && field.sourceKey && homeRichCopySourceKeys[field.sourceDevice].has(field.sourceKey))))
  const isOverride = Boolean(field && (Object.hasOwn(overrides, field.key) || Object.hasOwn(document.textStyles?.[scope] ?? {}, field.key)))

  return (
    <div className="site-editor__copy">
      <div className="site-editor__filters">
        <AdminFormField id={`${id}-search`} label="문구 찾기" type="search" value={search} onChange={(event) => searchFor(event.target.value)} placeholder="화면에 보이는 문장이나 항목명" />
        <AdminSelect id={`${id}-section`} label="화면 안 위치" value={activeSection} onChange={(event) => { setSection(event.target.value); setVisibleCount(20) }} options={[{ label: '모든 위치', value: 'all' }, ...sections.map((value) => ({ label: value, value }))]} />
      </div>
      <p className="site-editor__help" role="status">{filtered.length}개 문구 · 아래 목록에서 고른 문구 하나를 편집합니다.</p>
      {filtered.length === 0 ? (
        <div className="site-editor__empty">
          <p>{definitions.length ? '검색에 맞는 문구가 없습니다.' : emptyMessage ?? '이 범위의 직접 편집 문구가 없습니다. 아래 콘텐츠 관리에서 원문을 확인하세요.'}</p>
          {definitions.length ? <Button variant="secondary" onClick={() => { searchFor(''); setSection('all') }}>검색 초기화</Button> : null}
        </div>
      ) : <>
        <div className="site-editor__copy-choices" aria-label="편집할 문구">
          {filtered.slice(0, visibleCount).map(item => <button type="button" key={item.key} className="site-editor__copy-choice" aria-pressed={field?.key === item.key} onClick={() => setSelectedKey(item.key)}>
            <strong>{item.label}</strong><span>{(overrides[item.key] ?? fallback(item)).slice(0, 100) || '(빈 문구)'}</span><small>{item.section}</small>
          </button>)}
        </div>
        {filtered.length > visibleCount ? <Button variant="secondary" size="sm" onClick={() => setVisibleCount(count => count + 20)}>문구 더 보기 · 남은 {filtered.length - visibleCount}개</Button> : null}
        {field ? <div className="site-editor__field" key={field.key}>
            <p className="site-editor__help">{field.section} · {isOverride ? '이 범위에서 수정함' : '현재 원문 또는 공통값 사용 중'}</p>
            {field.inputType === 'boolean' ? (
              <AdminSelect id={`${id}-value`} label={field.label} value={value} options={[{ label: '표시', value: 'true' }, { label: '숨김', value: 'false' }]} onChange={(event) => onChange(field.key, event.target.value)} />
            ) : field.inputType === 'number' || field.inputType === 'url' ? (
              <AdminFormField id={`${id}-value`} label={field.label} value={value} type={field.inputType === 'number' ? 'number' : 'text'} min={field.min} max={field.max} maxLength={field.maxLength ?? 10000} onChange={(event) => onChange(field.key, event.target.value)} />
            ) : (
              <EditorTextSelection label={field.label} value={value} runs={resolveTextRuns(document, scope, field.key, value)} maxLength={field.maxLength} allowFormatting={canFormat} onChange={(text, runs) => canFormat ? onFormat(field.key, text, runs) : onChange(field.key, text)} />
            )}
            <div className="site-editor__field-actions">
              <span className="site-editor__help">{Array.from(value).length.toLocaleString('ko-KR')}자</span>
              <Button variant="ghost" size="sm" disabled={!isOverride} aria-label={`${field.label} ${scope === 'shared' ? '원문으로 되돌리기' : '공통값 또는 기기 원문 사용'}`} onClick={() => onChange(field.key, undefined)}>{scope === 'shared' ? '원문으로 되돌리기' : '공통값 사용'}</Button>
            </div>
          </div> : null}
      </>}
    </div>
  )
}
