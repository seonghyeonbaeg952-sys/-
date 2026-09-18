import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { EditorTextLayout } from '../../../types/siteEditor'
import { Button } from '../../common/Button'
import { AdminFormField } from '../AdminFormField'
import { AdminSelect } from '../AdminSelect'
import './editor-placement-toolbar.css'

export type EditorPlacementBlock = {
  id: string
  label: string
  group: string
  rect: { left: number; top: number; width: number; height: number }
}

export type EditorPlacementToolbarProps = {
  selected: EditorPlacementBlock | null
  blocks: EditorPlacementBlock[]
  value?: EditorTextLayout
  disabled?: boolean
  onSelect: (id: string) => void
  onChange: (next: EditorTextLayout | undefined) => void
  onAlign: (referenceId: string, axis: 'x' | 'y') => void
  onCancel?: () => void
  onFinish?: () => void
  onDirtyChange?: (dirty: boolean) => void
  error?: string
  status?: string
}

type PlacementDraft = {
  x: string; y: string; width: string; automaticWidth: boolean
  align: EditorTextLayout['textAlign'] | ''
}
type PlacementError = { field?: 'x' | 'y' | 'width'; message: string }

function draftFromLayout(value?: EditorTextLayout): PlacementDraft {
  return {
    x: String(value?.offsetX ?? 0), y: String(value?.offsetY ?? 0),
    width: String(value?.width ?? 100), automaticWidth: value?.width === undefined,
    align: value?.textAlign ?? '',
  }
}

function layoutFromDraft(draft: PlacementDraft): { value: EditorTextLayout | undefined; error?: never } | { error: PlacementError; value?: never } {
  const values: Record<'x' | 'y' | 'width', number> = { x: 0, y: 0, width: 100 }
  for (const field of ['x', 'y', 'width'] as const) {
    if (field === 'width' && draft.automaticWidth) continue
    const number = Number(draft[field])
    const min = field === 'width' ? 10 : -2000, max = field === 'width' ? 100 : 2000
    if (!draft[field].trim() || !Number.isFinite(number) || number < min || number > max) {
      return { error: { field, message: field === 'width' ? '박스 너비는 10–100% 사이로 입력하세요.' : `${field === 'x' ? '가로' : '세로'} 이동은 −2000–2000px 사이로 입력하세요.` } }
    }
    values[field] = number
  }
  const value: EditorTextLayout = {}
  if (values.x !== 0) value.offsetX = values.x
  if (values.y !== 0) value.offsetY = values.y
  if (!draft.automaticWidth) value.width = values.width
  if (draft.align) value.textAlign = draft.align
  return { value: Object.keys(value).length ? value : undefined }
}

export function EditorPlacementToolbar({ selected, blocks, value, disabled = false, onSelect, onChange, onAlign, onCancel, onFinish, onDirtyChange, error, status }: EditorPlacementToolbarProps) {
  const id = useId()
  const baseline = draftFromLayout(value)
  const key = JSON.stringify([selected?.id, baseline])
  const [local, setLocal] = useState<{ key: string; draft: PlacementDraft } | null>(null)
  const [problem, setProblem] = useState<{ key: string; error: PlacementError } | null>(null)
  const [feedback, setFeedback] = useState<{ key: string; message: string } | null>(null)
  const [reference, setReference] = useState({ selectedId: '', id: '' })
  const [observedKey, setObservedKey] = useState(key)
  // Reset on acknowledged value/selection changes, not only when looking up the
  // draft: otherwise Undo or returning to a block can resurrect an old input.
  if (observedKey !== key) {
    setObservedKey(key); setLocal(null); setProblem(null); setFeedback(null)
  }
  const draft = observedKey === key && local?.key === key ? local.draft : baseline
  const localError = observedKey === key && problem?.key === key ? problem.error : null
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const dirtyCallback = useRef(onDirtyChange)
  useEffect(() => { dirtyCallback.current = onDirtyChange }, [onDirtyChange])
  // Acknowledged layout/selection changes release the parent's navigation lock.
  // Input handlers also notify synchronously so a second click cannot leave
  // the page before this effect runs. The callback must not lock this form.
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, key, onDirtyChange])
  useEffect(() => () => { dirtyCallback.current?.(false) }, [])
  const locked = disabled || !selected
  const references = selected?.group ? blocks.filter(block => block.id !== selected.id && block.group === selected.group) : []
  const referenceId = reference.selectedId === selected?.id && references.some(block => block.id === reference.id) ? reference.id : ''

  function report(next: PlacementError) { setProblem({ key, error: next }); setFeedback(null) }
  function edit(patch: Partial<PlacementDraft>) {
    if (locked) return
    const next = { ...draft, ...patch }
    onDirtyChange?.(JSON.stringify(next) !== JSON.stringify(baseline))
    setLocal({ key, draft: next }); setProblem(null); setFeedback(null)
  }
  function commit(next = draft) {
    if (locked) return
    const result = layoutFromDraft(next)
    if (result.error) { report(result.error); return }
    setProblem(null)
    const current = layoutFromDraft(baseline)
    if (JSON.stringify(result.value) === JSON.stringify(current.value)) {
      onDirtyChange?.(false); setLocal(null); setFeedback({ key, message: '이미 같은 배치입니다.' }); return
    }
    // Keep entered values until the parent acknowledges them. A rejected or
    // pending bridge action must not erase the operator's numeric input.
    setLocal({ key, draft: next })
    onDirtyChange?.(true)
    onChange(result.value)
  }
  function nudge(x: number, y: number, large = false) {
    if (locked) return
    const parsed = layoutFromDraft(draft)
    if (parsed.error) { report(parsed.error); return }
    const step = large ? 10 : 1
    commit({ ...draft, x: String(Number(draft.x) + x * step), y: String(Number(draft.y) + y * step) })
  }
  function nudgeWithKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
    const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault(); event.stopPropagation()
    if (!event.repeat) nudge(direction[0], direction[1], event.shiftKey)
  }
  function requireApplied() {
    if (!dirty) return true
    report({ message: '입력 중인 위치·너비를 먼저 적용하거나 입력 취소하세요.' })
    return false
  }
  function align(axis: 'x' | 'y') {
    if (locked || !referenceId || !requireApplied()) return
    setProblem(null); onAlign(referenceId, axis)
  }
  function cancel() {
    if (locked) return
    onDirtyChange?.(false); setLocal(null); setProblem(null); setFeedback(null); onCancel?.()
  }

  return <section className="placement-toolbar" aria-labelledby={`${id}-title`} aria-busy={disabled}>
    <div className="placement-toolbar__heading">
      <h3 id={`${id}-title`}>문구 배치</h3>
      <p id={`${id}-scope`}>현재 선택한 기기에만 적용됩니다. 공개하려면 별도로 게시하세요.</p>
    </div>
    <AdminSelect id={`${id}-block`} label="배치할 문구" value={selected?.id ?? ''} disabled={disabled || !blocks.length}
      options={[{ value: '', label: '화면에서 문구를 선택하세요' }, ...blocks.map(block => ({ value: block.id, label: block.label }))]}
      onChange={event => {
        if (disabled || !blocks.some(block => block.id === event.target.value) || !requireApplied()) return
        onSelect(event.target.value)
      }} />
    {!selected ? <p className="placement-toolbar__note" role="status">홈페이지에서 배치할 문구를 선택하세요. 글자 편집과 문구 이동은 별도 작업입니다.</p> : <>
      <p className="placement-toolbar__note">문구의 이동 손잡이를 끌거나 아래 버튼으로 이동하세요. 본문을 드래그하면 글자를 선택합니다.</p>
      <form noValidate aria-label="문구 위치와 너비" onSubmit={event => { event.preventDefault(); commit() }}
        onKeyDown={event => { if (event.key === 'Enter' && event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation() } }}>
        <div className="placement-toolbar__coordinates">
          <AdminFormField id={`${id}-x`} label="가로 이동 X (px)" type="number" inputMode="decimal" min={-2000} max={2000} step="any"
            value={draft.x} disabled={locked} error={localError?.field === 'x' ? localError.message : undefined}
            onChange={event => edit({ x: event.target.value })} />
          <AdminFormField id={`${id}-y`} label="세로 이동 Y (px)" type="number" inputMode="decimal" min={-2000} max={2000} step="any"
            value={draft.y} disabled={locked} error={localError?.field === 'y' ? localError.message : undefined}
            onChange={event => edit({ y: event.target.value })} />
        </div>
        <p className="placement-toolbar__note" id={`${id}-move-help`}>원래 위치에서 이동한 거리입니다. 방향 버튼·방향키는 1px, Shift와 함께 누르면 10px 이동합니다.</p>
        <div className="placement-toolbar__directions" role="group" aria-label="문구 미세 이동" aria-describedby={`${id}-move-help`} onKeyDown={nudgeWithKeys}>
          <Button size="sm" variant="ghost" disabled={locked} aria-label="문구 왼쪽 이동" title="왼쪽 1px · Shift 10px" onClick={event => nudge(-1, 0, event.shiftKey)}>← 왼쪽</Button>
          <Button size="sm" variant="ghost" disabled={locked} aria-label="문구 위로 이동" title="위로 1px · Shift 10px" onClick={event => nudge(0, -1, event.shiftKey)}>↑ 위</Button>
          <Button size="sm" variant="ghost" disabled={locked} aria-label="문구 아래로 이동" title="아래로 1px · Shift 10px" onClick={event => nudge(0, 1, event.shiftKey)}>↓ 아래</Button>
          <Button size="sm" variant="ghost" disabled={locked} aria-label="문구 오른쪽 이동" title="오른쪽 1px · Shift 10px" onClick={event => nudge(1, 0, event.shiftKey)}>→ 오른쪽</Button>
        </div>
        <div className="placement-toolbar__width-mode" role="group" aria-label="박스 너비 방식">
          <Button size="sm" variant="ghost" disabled={locked} aria-pressed={draft.automaticWidth} onClick={() => {
            if (draft.x !== baseline.x || draft.y !== baseline.y) { if (!locked) requireApplied(); return }
            commit({ ...draft, automaticWidth: true })
          }}>너비 자동</Button>
          <Button size="sm" variant="ghost" disabled={locked} aria-pressed={!draft.automaticWidth} onClick={() => edit({ automaticWidth: false })}>너비 직접 설정</Button>
        </div>
        <AdminFormField id={`${id}-width`} label="박스 너비 (%)" type="number" inputMode="decimal" min={10} max={100} step="any"
          value={draft.width} disabled={locked || draft.automaticWidth} description={draft.automaticWidth ? '원래 반응형 너비를 사용합니다.' : '문구가 속한 영역 너비의 10–100%로 설정합니다.'}
          error={localError?.field === 'width' ? localError.message : undefined} onChange={event => edit({ width: event.target.value })} />
        <p className="placement-toolbar__note">높이는 글자에 맞춰 늘어납니다. 글꼴 크기는 바꾸지 않습니다.</p>
        <Button type="submit" size="sm" disabled={locked || !dirty}>위치·너비 적용</Button>
      </form>
      <div className="placement-toolbar__section">
        <h4>글자 정렬 <small>박스 안에서</small></h4>
        <div className="placement-toolbar__text-align" role="group" aria-label="박스 안 글자 정렬">
          {([
            ['', '기본', '글자 정렬 기본값'], ['start', '왼쪽', '글자 왼쪽 정렬'],
            ['center', '가운데', '글자 가운데 정렬'], ['end', '오른쪽', '글자 오른쪽 정렬'],
          ] as const).map(([alignment, label, accessible]) => <Button key={label} size="sm" variant="ghost" disabled={locked} aria-label={accessible}
            aria-pressed={draft.align === alignment} onClick={() => { if (!locked && requireApplied()) commit({ ...baseline, align: alignment }) }}>{label}</Button>)}
        </div>
      </div>
      <div className="placement-toolbar__section">
        <h4>다른 문구에 맞추기 <small>같은 섹션</small></h4>
        <AdminSelect id={`${id}-reference`} label="기준 문구" value={referenceId} disabled={locked || !references.length}
          options={[{ value: '', label: references.length ? '기준 문구 선택' : '같은 섹션의 다른 문구가 없습니다' }, ...references.map(block => ({ value: block.id, label: block.label }))]}
          onChange={event => { if (!locked) setReference({ selectedId: selected.id, id: event.target.value }) }} />
        <div className="placement-toolbar__align-actions">
          <Button size="sm" variant="ghost" disabled={locked || !referenceId} onClick={() => align('x')}>좌우 가운데 맞춤</Button>
          <Button size="sm" variant="ghost" disabled={locked || !referenceId} onClick={() => align('y')}>상하 가운데 맞춤</Button>
        </div>
        <p className="placement-toolbar__note">기준 문구는 그대로 두고 선택한 문구만 맞춥니다. 겹치거나 섹션을 벗어나는 위치는 미리보기에서 확인하세요.</p>
      </div>
      {localError && !localError.field ? <p className="placement-toolbar__error" role="alert">{localError.message}</p> : null}
      {error ? <p className="placement-toolbar__error" role="alert">{error}</p> : null}
      <p className="placement-toolbar__feedback" role="status">{disabled ? '배치를 반영하고 있어요. 잠시 기다려 주세요.' : dirty ? '숫자 입력은 아직 적용하지 않았습니다.' : status || (feedback?.key === key ? feedback.message : '') || '배치 변경은 초안에만 반영됩니다.'}</p>
      <div className="placement-toolbar__footer">
        <Button size="sm" variant="ghost" disabled={locked || (!value && !dirty)} onClick={() => {
          if (locked) return
          onDirtyChange?.(false); setLocal(null); setProblem(null); setFeedback(null); onChange(undefined)
        }}>배치만 원래대로</Button>
        <Button size="sm" variant="ghost" disabled={locked} onClick={cancel}>입력 취소</Button>
        {onFinish ? <Button size="sm" disabled={locked} onClick={() => { if (!locked && requireApplied()) onFinish() }}>배치 마침</Button> : null}
      </div>
    </>}
  </section>
}
