import { useId, useState } from 'react'
import type { SiteCopyDefinition, SiteEditorDocument } from '../../../types/siteEditor'
import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import { AdminModal } from '../AdminModal'
import { Button } from '../../common/Button'
import type { EditorScope } from './editorSessionModel'
import { copyTextStats, copyValue, findCopyMatches, inspectCopyText, planCopyReplacement, type CopyReplacementPlan, type CopySearchOptions } from './editorCopyTools'

type Props = {
  field: SiteCopyDefinition; definitions: SiteCopyDefinition[]; document: SiteEditorDocument; baseline: SiteEditorDocument
  scope: EditorScope; defaults: Record<string, string>; query: string; options: CopySearchOptions
  onReplace?: (plan: CopyReplacementPlan, keys: string[]) => string | null
}
const scopeLabels = { shared: '공통 · 모든 기기의 기본값', desktop: '데스크톱', tablet: '태블릿', mobile: '모바일' }

export function EditorCopyActions({ field, definitions, document, baseline, scope, defaults, query, options, onReplace }: Props) {
  const id = useId()
  const [replacement, setReplacement] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const [plan, setPlan] = useState<CopyReplacementPlan | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const text = copyValue(field, document, scope, defaults)
  const matches = findCopyMatches(text, query, options)
  const index = matches.length ? matchIndex % matches.length : 0
  const current = matches[index]
  const stats = copyTextStats(text)
  const issues = inspectCopyText(text, field.maxLength)
  const isText = !field.inputType || ['text', 'textarea'].includes(field.inputType)
  const preview = (single: boolean) => {
    const next = planCopyReplacement(definitions, document, scope, defaults, query, replacement, options, single && current ? { key: field.key, start: current.start } : undefined)
    setError(next.error ?? (next.items.length ? '' : '변경되는 문구가 없습니다. 찾을 단어와 바꿀 내용을 확인해 주세요.'))
    if (!next.error && next.items.length) { setPlan(next); setChecked(next.items.map(item => item.key)) }
  }
  const copyPlainText = async () => {
    try { await navigator.clipboard.writeText(text); setNotice('서식 없이 문구를 복사했습니다.'); setError('') }
    catch { setError('클립보드에 접근할 수 없습니다. 입력창에서 글자를 선택한 뒤 Ctrl/⌘ + C로 복사해 주세요.') }
  }
  return <div className="copy-tools">
    <div className="site-editor__field-actions"><p className="site-editor__help">{stats.characters}글자 · {stats.words}단어 · {stats.lines}줄</p><Button variant="secondary" size="sm" onClick={() => void copyPlainText()}>문구만 복사</Button></div>
    {isText && issues.length ? <p className="site-editor__help">확인 권장: {issues.join(' · ')}. 의도한 표현이면 그대로 두셔도 됩니다.</p> : null}
    {notice ? <p role="status" className="site-editor__success">{notice}</p> : null}
    {error ? <p role="alert" className="site-editor__error">{error}</p> : null}
    <details><summary>원문·임시저장본·기기별 문구 비교</summary>
      <dl className="copy-tools__comparison">
        <dt>CMS 원문</dt><dd>{(defaults[field.key] ?? field.defaultValue) || '（빈 문구）'}</dd>
        <dt>마지막 임시저장</dt><dd>{copyValue(field, baseline, scope, defaults) || '（빈 문구）'}</dd>
        <dt>현재 입력</dt><dd>{text || '（빈 문구）'}</dd>
        {(['mobile', 'tablet', 'desktop'] as const).map(device => {
          const native = field.sourceKey ? siteCopyDefinitions.find(item => item.sourceKey === field.sourceKey && item.sourceDevice === device) : field
          return <div key={device}><dt>{scopeLabels[device]}</dt><dd>{native ? copyValue(native, document, device, defaults) || '（빈 문구）' : '이 기기에 연결된 항목 없음'}</dd></div>
        })}
      </dl>
      <p className="site-editor__help">원문은 기존 콘텐츠 설정값입니다. 현재 범위의 값이 없으면 공통값을 사용합니다. 비교만으로 다른 기기 문구가 바뀌지 않습니다.</p>
    </details>
    {onReplace ? <details><summary>단어 바꾸기 · 적용 전 확인</summary>
      <p className="site-editor__help">위 ‘문구 찾기’에 입력한 단어를 바꿉니다. 대상은 현재 목록의 텍스트 문구와 <strong>{scopeLabels[scope]}</strong>입니다. 주소·숫자·표시 설정은 제외합니다.</p>
      <label className="copy-tools__label" htmlFor={`${id}-replace`}>바꿀 내용 <span>(빈칸이면 찾은 단어 삭제)</span><input id={`${id}-replace`} value={replacement} maxLength={10000} onChange={event => setReplacement(event.target.value)} /></label>
      <div className="site-editor__field-actions"><p role="status" className="site-editor__help">선택 문구: {matches.length ? `${index + 1} / ${matches.length}곳 일치` : '본문에 일치하는 단어 없음'}</p><div className="site-editor__inline-actions"><Button size="sm" variant="ghost" disabled={matches.length < 2} onClick={() => setMatchIndex((index - 1 + matches.length) % matches.length)}>이전 위치</Button><Button size="sm" variant="ghost" disabled={matches.length < 2} onClick={() => setMatchIndex((index + 1) % matches.length)}>다음 위치</Button></div></div>
      {current ? <p className="copy-tools__match">…{text.slice(Math.max(0, current.start - 45), current.start)}<mark>{text.slice(current.start, current.end)}</mark>{text.slice(current.end, current.end + 70)}…</p> : null}
      <div className="site-editor__inline-actions"><Button size="sm" variant="secondary" disabled={!isText || !current} onClick={() => preview(true)}>이 위치 바꾸기 미리보기</Button><Button size="sm" variant="secondary" disabled={!query} onClick={() => preview(false)}>목록 전체 바꾸기 미리보기</Button></div>
    </details> : null}
    <AdminModal isOpen={Boolean(plan)} title="문구 바꾸기 확인" onClose={() => { setPlan(null); setError('') }} footer={<div className="site-editor copy-tools__modal-footer"><p>{scopeLabels[scope]} · {checked.length}개 문구 선택</p><div className="site-editor__inline-actions"><Button variant="secondary" onClick={() => { setPlan(null); setError('') }}>취소</Button><Button disabled={!checked.length} onClick={() => {
      if (!plan || !onReplace) return
      const message = onReplace(plan, checked)
      if (message) { setError(message); return }
      setNotice(`${checked.length}개 문구를 초안에서 바꿨습니다. 위의 ‘최근 편집 실행 취소’로 한 번에 되돌릴 수 있습니다. 게시 전까지 공개 홈페이지는 그대로입니다.`)
      setPlan(null); setError(''); setMatchIndex(0)
    }}>선택한 문구에 적용</Button></div></div>}>
      <div className="site-editor copy-tools__review"><p>변경 전후를 확인하고 바꿀 문구만 선택하세요. 임시저장이나 게시는 자동으로 실행되지 않습니다.</p>
        {error ? <p role="alert" className="site-editor__error">{error}</p> : null}
        <div className="site-editor__inline-actions"><Button size="sm" variant="ghost" onClick={() => setChecked(plan?.items.map(item => item.key) ?? [])}>모두 선택</Button><Button size="sm" variant="ghost" onClick={() => setChecked([])}>선택 해제</Button></div>
        {plan?.items.map(item => <article key={item.key}><label><input type="checkbox" checked={checked.includes(item.key)} onChange={event => setChecked(keys => event.target.checked ? [...keys, item.key] : keys.filter(key => key !== item.key))} /><strong>{item.label}</strong><span>{item.occurrences}곳</span></label><dl><dt>변경 전</dt><dd>{item.before || '（빈 문구）'}</dd><dt>변경 후</dt><dd>{item.after || '（빈 문구）'}</dd></dl></article>)}
      </div>
    </AdminModal>
  </div>
}
