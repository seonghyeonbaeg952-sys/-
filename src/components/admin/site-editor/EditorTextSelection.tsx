import { useId, useRef, useState } from 'react'
import { applyTextStyle, rebaseTextRuns, snapTextSelection } from '../../../lib/siteEditorTextStyles'
import type { EditorTextRun, EditorTextStyle } from '../../../types/siteEditor'
import { TextRunContent } from '../../site-editor/FormattedCopy'
import { Button } from '../../common/Button'
import { editorFontOptions } from './editorUiOptions'

type Snapshot = { text: string; runs: EditorTextRun[] }
type Props = {
  label: string
  value: string
  runs: EditorTextRun[]
  maxLength?: number
  allowFormatting: boolean
  onChange: (text: string, runs: EditorTextRun[]) => void
}

export function EditorTextSelection({ label, value, runs, maxLength = 10000, allowFormatting, onChange }: Props) {
  const id = useId()
  const input = useRef<HTMLTextAreaElement>(null)
  const composition = useRef<Snapshot | null>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [error, setError] = useState('')
  const current = JSON.stringify({ text: value, runs })
  const [history, setHistory] = useState<{ current: string; past: Snapshot[]; future: Snapshot[] }>({ current, past: [], future: [] })
  const [sizeDraft, setSizeDraft] = useState({ key: '', value: '' })
  const selected = selection.end > selection.start && selection.end <= value.length
  const activeRuns = selected && allowFormatting ? applyTextStyle(value, runs, selection.start, selection.end, {}) : []
  const edges = [...new Set([selection.start, selection.end, ...activeRuns.flatMap(run => [run.start, run.end])])]
    .filter(edge => edge >= selection.start && edge <= selection.end).sort((a, b) => a - b)
  const styles = edges.slice(0, -1).map(start => activeRuns.find(run => run.start <= start && run.end > start)?.style ?? {})
  const fontValues = new Set(styles.map(style => style.fontFamily ?? ''))
  const sizeValues = new Set(styles.map(style => style.fontSize === undefined ? '' : String(style.fontSize)))
  const fontValue = fontValues.size > 1 ? 'mixed' : [...fontValues][0] ?? ''
  const sizeValue = sizeValues.size > 1 ? '' : [...sizeValues][0] ?? ''
  const sizeKey = `${selection.start}:${selection.end}:${current}`
  const size = sizeDraft.key === sizeKey ? sizeDraft.value : sizeValue
  const selectedText = selected ? value.slice(selection.start, selection.end) : ''

  const commit = (next: Snapshot) => {
    if (JSON.stringify(next) === current) return
    if (!composition.current) {
      const previous = history.current === current ? history.past : []
      setHistory({ current: JSON.stringify(next), past: [...previous, { text: value, runs }].slice(-50), future: [] })
    }
    onChange(next.text, next.runs)
  }
  const restoreSelection = () => {
    input.current?.focus({ preventScroll: true })
    input.current?.setSelectionRange(selection.start, selection.end)
  }
  const format = (patch: EditorTextStyle | null) => {
    if (!selected || !allowFormatting) return
    try {
      commit({ text: value, runs: applyTextStyle(value, runs, selection.start, selection.end, patch) })
      setError('')
      restoreSelection()
    } catch (cause) { setError(cause instanceof Error ? cause.message : '선택한 글자 범위를 확인해 주세요.') }
  }
  const moveHistory = (direction: 'undo' | 'redo') => {
    if (history.current !== current) return
    const source = direction === 'undo' ? history.past : history.future
    const next = source.at(-1)
    if (!next) return
    const now = { text: value, runs }
    setHistory({ current: JSON.stringify(next), past: direction === 'undo' ? source.slice(0, -1) : [...history.past, now], future: direction === 'redo' ? source.slice(0, -1) : [...history.future, now] })
    onChange(next.text, next.runs)
    setSelection({ start: 0, end: 0 })
    setError('')
    input.current?.focus({ preventScroll: true })
  }

  return <div className="site-editor__text-editor">
    <label className="site-editor__text-label" htmlFor={`${id}-text`}>{label}</label>
    <p className="site-editor__help" id={`${id}-help`}>{allowFormatting ? '글자를 드래그하거나 Shift + 방향키로 선택한 뒤 글꼴·크기를 바꾸세요.' : '이 항목은 일반 텍스트로 편집합니다. 주소·대체 문구 등은 글자 서식이 적용되지 않습니다.'}</p>
    {allowFormatting ? <div className="site-editor__text-toolbar" aria-label="선택한 글자 서식">
      <label htmlFor={`${id}-font`}>글꼴
        <select id={`${id}-font`} disabled={!selected} value={fontValue} onChange={event => {
          const font = editorFontOptions.find(item => item.value === event.target.value)?.value
          format({ fontFamily: font })
        }}>
          <option value="">기존 글꼴</option>
          {fontValue === 'mixed' ? <option value="mixed" disabled>여러 글꼴</option> : null}
          {editorFontOptions.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
        </select>
      </label>
      <label htmlFor={`${id}-size`}>크기 (px)
        <input id={`${id}-size`} type="number" min={10} max={120} step="any" disabled={!selected} value={size} placeholder={sizeValues.size > 1 ? '혼합' : '기존값'} onChange={event => setSizeDraft({ key: sizeKey, value: event.target.value })} />
      </label>
      <Button variant="secondary" size="sm" disabled={!selected} onClick={() => {
        const number = Number(size)
        if (size !== '' && (!Number.isFinite(number) || number < 10 || number > 120)) { setError('글자 크기는 10–120px 사이로 입력해 주세요.'); return }
        format({ fontSize: size === '' ? undefined : number })
      }}>크기 적용</Button>
      <Button variant="ghost" size="sm" disabled={!selected} onClick={() => format(null)}>선택 서식 지우기</Button>
    </div> : null}
    {allowFormatting ? <p className="site-editor__selection-status" role="status">{selected ? <>선택: <strong>“{selectedText.length > 35 ? `${selectedText.slice(0, 35)}…` : selectedText}”</strong> · 이 글자에만 적용</> : '먼저 아래에서 바꿀 글자를 선택하세요.'}</p> : null}
    <textarea ref={input} id={`${id}-text`} className="site-editor__text-input" rows={Math.min(10, Math.max(4, value.split('\n').length + 1))} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={Boolean(error)} maxLength={maxLength} value={value}
      onCompositionStart={() => { composition.current = { text: value, runs } }}
      onCompositionEnd={event => {
        const before = composition.current
        composition.current = null
        if (!before) return
        try {
          const text = event.currentTarget.value
          const next = { text, runs: rebaseTextRuns(value, text, runs) }
          if (JSON.stringify(before) !== JSON.stringify(next)) {
            const previous = history.current === JSON.stringify(before) ? history.past : []
            setHistory({ current: JSON.stringify(next), past: [...previous, before].slice(-50), future: [] })
            if (text !== value) onChange(next.text, next.runs)
          }
        } catch (cause) { setError(cause instanceof Error ? cause.message : '입력 내용을 확인해 주세요.') }
      }}
      onSelect={event => setSelection(snapTextSelection(event.currentTarget.value, event.currentTarget.selectionStart, event.currentTarget.selectionEnd))}
      onChange={event => {
        const text = event.currentTarget.value
        try { commit({ text, runs: rebaseTextRuns(value, text, runs) }); setError('') }
        catch (cause) { setError(cause instanceof Error ? cause.message : '입력 내용을 확인해 주세요.') }
      }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing || !(event.ctrlKey || event.metaKey)) return
        if (event.key.toLowerCase() === 'z') { event.preventDefault(); moveHistory(event.shiftKey ? 'redo' : 'undo') }
        else if (event.key.toLowerCase() === 'y') { event.preventDefault(); moveHistory('redo') }
      }} />
    {error ? <p id={`${id}-error`} role="alert" className="site-editor__error">{error}</p> : null}
    <div className="site-editor__text-actions">
      <Button variant="ghost" size="sm" disabled={history.current !== current || !history.past.length} onClick={() => moveHistory('undo')}>실행 취소</Button>
      <Button variant="ghost" size="sm" disabled={history.current !== current || !history.future.length} onClick={() => moveHistory('redo')}>다시 실행</Button>
      {allowFormatting ? <Button variant="secondary" size="sm" disabled={!value} onClick={() => { setSelection({ start: 0, end: value.length }); input.current?.focus({ preventScroll: true }); input.current?.setSelectionRange(0, value.length) }}>전체 글자 선택</Button> : null}
    </div>
    {allowFormatting ? <div className="site-editor__text-sample">
      <p className="site-editor__help">서식 미리보기 · 실제 배치는 홈페이지 미리보기에서 확인하세요.</p>
      <div className="site-editor__formatted-sample"><TextRunContent text={value} runs={runs} /></div>
    </div> : null}
  </div>
}
