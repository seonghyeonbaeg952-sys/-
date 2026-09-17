import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import type { CanvasSelection } from '../../../lib/siteEditorCanvasModel'
import type { CanvasAction, CanvasSelectionSummary } from '../../../lib/siteEditorCanvasProtocol'
import type { EditorTextStyle } from '../../../types/siteEditor'
import { Button } from '../../common/Button'
import { FilterSelect } from '../../common/FilterSelect'
import { editorFontOptions } from './editorUiOptions'
import './editor-canvas-toolbar.css'

export type EditorCanvasToolbarProps = {
  blockLabel: string | null
  selection: CanvasSelection | null
  summary: CanvasSelectionSummary | null
  active: boolean
  busy: boolean
  onBegin: () => void
  onFormat: (patch: EditorTextStyle | null) => void
  onAction: (action: CanvasAction) => void
}

const palette = [
  { name: '먹색', value: '#17171a' }, { name: '버건디', value: '#68233a' },
  { name: '오렌지', value: '#ff601a' }, { name: '네이비', value: '#10233f' },
  { name: '아이보리', value: '#fcfaf5' }, { name: '흰색', value: '#ffffff' },
]
const styleKeys = ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration'] as const
type PanelPosition = { x: number; y: number }

function clampPanel(node: HTMLElement, position: PanelPosition): PanelPosition {
  const bounds = node.getBoundingClientRect()
  return {
    x: Math.max(12, Math.min(position.x, window.innerWidth - bounds.width - 12)),
    y: Math.max(12, Math.min(position.y, window.innerHeight - bounds.height - 12)),
  }
}

function closeDisclosure(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== 'Escape' || event.nativeEvent.isComposing || !event.currentTarget.open) return
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.open = false
  event.currentTarget.querySelector('summary')?.focus()
}

export function EditorCanvasToolbar({ blockLabel, selection, summary, active, busy, onBegin, onFormat, onAction }: EditorCanvasToolbarProps) {
  const id = useId()
  const [sizeDraft, setSizeDraft] = useState({ key: '', value: '' })
  const [colorDraft, setColorDraft] = useState({ key: '', value: '' })
  const [copiedStyle, setCopiedStyle] = useState<EditorTextStyle | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<{ field: 'size' | 'color' | 'copy'; message: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState<PanelPosition | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const collapseRef = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; startY: number; position: PanelPosition } | null>(null)
  const style = summary?.style ?? {}
  const locked = !active || busy || !summary || summary.composing
  const selected = selection !== null && selection.start !== selection.end
  const formatDisabled = locked || !selected
  const selectionKey = JSON.stringify([selection, style])
  const sizeValue = sizeDraft.key === selectionKey ? sizeDraft.value : typeof style.fontSize === 'number' ? String(style.fontSize) : ''
  const colorValue = colorDraft.key === selectionKey ? colorDraft.value : style.color && style.color !== 'mixed' ? style.color : ''
  const help = busy ? '편집 내용을 반영하고 있어요. 잠시 기다려 주세요.'
    : summary?.composing ? '한글 입력을 마친 뒤 서식을 바꿀 수 있어요.'
      : selected ? '선택한 글자에만 적용됩니다.' : '홈페이지에서 바꿀 글자를 선택하세요.'

  useEffect(() => {
    if (!active) return
    const clamp = () => {
      const node = panelRef.current
      if (!node || window.matchMedia('(max-width: 600px)').matches) return
      setPosition(previous => {
        const bounds = node.getBoundingClientRect()
        const current = previous ?? { x: bounds.left, y: bounds.top }
        const next = clampPanel(node, current)
        return next.x === current.x && next.y === current.y ? previous : next
      })
    }
    const observer = new ResizeObserver(clamp)
    if (panelRef.current) observer.observe(panelRef.current)
    window.addEventListener('resize', clamp)
    return () => { observer.disconnect(); window.removeEventListener('resize', clamp); drag.current = null }
  }, [active])

  function placePanel(side: 'left' | 'right' = 'right') {
    const node = panelRef.current
    if (!node) return
    setPosition(clampPanel(node, { x: side === 'left' ? 24 : window.innerWidth - node.getBoundingClientRect().width - 24, y: 96 }))
  }

  function dragStart(event: PointerEvent<HTMLButtonElement>) {
    const node = panelRef.current
    if (!node || event.button !== 0 || window.matchMedia('(max-width: 600px)').matches) return
    event.preventDefault()
    const bounds = node.getBoundingClientRect()
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, position: { x: bounds.left, y: bounds.top } }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current, node = panelRef.current
    if (!current || !node || current.pointerId !== event.pointerId) return
    setPosition(clampPanel(node, { x: current.position.x + event.clientX - current.startX, y: current.position.y + event.clientY - current.startY }))
  }
  function dragEnd(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.nativeEvent.isComposing || window.matchMedia('(max-width: 600px)').matches) return
    if (event.key === 'Home') { event.preventDefault(); placePanel(); return }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || !panelRef.current) return
    event.preventDefault(); event.stopPropagation()
    const bounds = panelRef.current.getBoundingClientRect(), step = event.shiftKey ? 40 : 10
    setPosition(clampPanel(panelRef.current, {
      x: bounds.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
      y: bounds.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0),
    }))
  }

  function format(patch: EditorTextStyle | null) {
    if (formatDisabled) return
    setError(null)
    setFeedback('')
    onFormat(patch)
  }
  function action(value: CanvasAction) {
    if (locked || (value === 'undo' && !summary?.canUndo) || (value === 'redo' && !summary?.canRedo)) return
    setError(null)
    onAction(value)
  }
  function applySize() {
    if (formatDisabled || sizeDraft.key !== selectionKey) return
    const value = Number(sizeValue)
    if (!sizeValue.trim() || !Number.isFinite(value) || value < 10 || value > 120) {
      setError({ field: 'size', message: '글자 크기는 10–120px 사이로 입력해 주세요.' })
      return
    }
    format({ fontSize: value })
    setSizeDraft({ key: '', value: '' })
  }
  function applyColor(value = colorValue) {
    if (formatDisabled) return
    const hex = value.trim()
    if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
      setError({ field: 'color', message: '#68233A처럼 HEX 색상을 입력해 주세요.' })
      return
    }
    format({ color: (hex.length === 4 ? `#${hex.slice(1).split('').map(character => character.repeat(2)).join('')}` : hex).toLowerCase() })
    setColorDraft({ key: '', value: '' })
  }
  function copyStyle() {
    if (formatDisabled) return
    if (styleKeys.some(key => style[key] === 'mixed')) {
      setCopiedStyle(null)
      setFeedback('')
      setError({ field: 'copy', message: '혼합 서식은 한 번에 복사할 수 없어요. 같은 서식의 글자를 선택하세요.' })
      return
    }
    const entries = styleKeys.filter(key => style[key] !== undefined).map(key => [key, style[key]])
    if (!entries.length) {
      setCopiedStyle(null)
      setFeedback('')
      setError({ field: 'copy', message: '직접 지정된 서식이 없어요. 서식을 지정한 글자를 선택하세요.' })
      return
    }
    setCopiedStyle(Object.fromEntries(entries) as EditorTextStyle)
    setError(null)
    setFeedback('서식을 복사했어요. 다른 글자를 선택한 뒤 서식 붙이기를 누르세요.')
  }

  if (!active) return <section className="canvas-toolbar" aria-label="화면 글자 편집" aria-busy={busy}>
    <div className="canvas-toolbar__intro"><strong>{blockLabel ?? '홈페이지에서 문구를 선택하세요'}</strong>
      <p>{blockLabel ? '선택한 문구를 그 자리에서 고칠 수 있어요.' : '제목이나 본문을 클릭하면 글자 편집을 시작할 수 있어요.'}</p></div>
    {blockLabel ? <Button size="sm" disabled={busy} onClick={onBegin}>글자 편집</Button> : null}
  </section>

  return <section ref={panelRef} className="canvas-toolbar canvas-toolbar--floating" role="dialog" aria-modal="false"
    aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`} aria-busy={busy} data-collapsed={collapsed || undefined}
    style={position ? { '--canvas-toolbar-x': `${position.x}px`, '--canvas-toolbar-y': `${position.y}px` } as CSSProperties : undefined}
    onKeyDown={event => {
      if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
      event.preventDefault(); event.stopPropagation(); setCollapsed(true); collapseRef.current?.focus({ preventScroll: true })
    }}>
    <div className="canvas-toolbar__window-heading">
      <button type="button" className="canvas-toolbar__drag" aria-label="글꼴 편집 창 이동" aria-describedby={`${id}-move-help`}
        onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} onLostPointerCapture={() => { drag.current = null }} onKeyDown={moveWithKeyboard}>
        <span aria-hidden="true" className="canvas-toolbar__grip">⠿</span><strong id={`${id}-title`}>글꼴 편집</strong>
      </button>
      <div className="canvas-toolbar__positions" role="group" aria-label="서식 창 위치">
        <button type="button" className="canvas-toolbar__window-button" onClick={() => placePanel('left')} title="창 왼쪽 배치" aria-label="창 왼쪽 배치">왼쪽</button>
        <button type="button" className="canvas-toolbar__window-button" onClick={() => placePanel('right')} title="창 오른쪽 배치" aria-label="창 오른쪽 배치">오른쪽</button>
        <button type="button" className="canvas-toolbar__window-button canvas-toolbar__reset" onClick={() => placePanel()} title="창 위치 초기화" aria-label="창 위치 초기화">↗</button>
      </div>
      <button type="button" ref={collapseRef} className="canvas-toolbar__window-button" aria-expanded={!collapsed} aria-controls={`${id}-body`}
        aria-label={collapsed ? '서식 창 펼치기' : '서식 창 접기'} onClick={() => setCollapsed(value => !value)}>{collapsed ? '펼치기' : '접기'}</button>
    </div>
    <span id={`${id}-move-help`} className="canvas-toolbar__sr-only">왼쪽·오른쪽 버튼을 누르거나 제목을 끌어 창을 이동하세요. 키보드는 방향키로 이동하고 Home 키로 위치를 초기화합니다. 작은 화면에서는 하단에 고정됩니다.</span>
    <div className="canvas-toolbar__body" id={`${id}-body`} hidden={collapsed}>
    <div className="canvas-toolbar__heading"><strong>{blockLabel ?? '선택한 문구'}</strong><p id={`${id}-help`} role="status">{help}</p></div>
    <div className="canvas-toolbar__main">
      <fieldset className="canvas-toolbar__format" disabled={formatDisabled} aria-label="선택한 글자 서식" aria-describedby={`${id}-help`}>
        <div className="canvas-toolbar__font"><span className="canvas-toolbar__label">글꼴</span>
          <FilterSelect label="글꼴" value={style.fontFamily ?? ''}
            options={[{ value: '', label: '기본 서식' }, ...(style.fontFamily === 'mixed' ? [{ value: 'mixed', label: '혼합' }] : []), ...editorFontOptions]}
            onChange={value => {
              if (value === '') { format({ fontFamily: undefined }); return }
              const font = editorFontOptions.find(option => option.value === value)
              if (font) format({ fontFamily: font.value })
            }} />
        </div>
        <label className="canvas-toolbar__size" htmlFor={`${id}-size`}><span className="canvas-toolbar__label">크기 (px)</span>
          <input id={`${id}-size`} type="number" min={10} max={120} step="any" value={sizeValue}
            placeholder={style.fontSize === 'mixed' ? '혼합' : '기본값'} aria-invalid={error?.field === 'size'}
            aria-describedby={error?.field === 'size' ? `${id}-error` : `${id}-help`}
            onChange={event => setSizeDraft({ key: selectionKey, value: event.target.value })} onBlur={applySize}
            onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); applySize() } }} />
        </label>
        <div className="canvas-toolbar__toggles" role="group" aria-label="글자 강조">
          <Button size="sm" variant="ghost" aria-label="굵게" title="굵게" aria-pressed={style.fontWeight === 'mixed' ? 'mixed' : (style.fontWeight ?? 0) >= 700}
            disabled={formatDisabled} onClick={() => format({ fontWeight: typeof style.fontWeight === 'number' && style.fontWeight >= 700 ? 400 : 700 })}><b aria-hidden="true">B</b></Button>
          <Button size="sm" variant="ghost" aria-label="기울임" title="기울임" aria-pressed={style.fontStyle === 'mixed' ? 'mixed' : style.fontStyle === 'italic'}
            disabled={formatDisabled} onClick={() => format({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}><i aria-hidden="true">I</i></Button>
          <Button size="sm" variant="ghost" aria-label="밑줄" title="밑줄" aria-pressed={style.textDecoration === 'mixed' ? 'mixed' : style.textDecoration === 'underline'}
            disabled={formatDisabled} onClick={() => format({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' })}><u aria-hidden="true">U</u></Button>
        </div>
        <details className="canvas-toolbar__color" onKeyDown={closeDisclosure}>
          <summary aria-disabled={formatDisabled} onClick={event => { if (formatDisabled) event.preventDefault() }}>글자색
            <span className="canvas-toolbar__color-value">{style.color === 'mixed' ? '혼합' : style.color ?? '기본'}</span>
          </summary>
          <div className="canvas-toolbar__color-panel">
            <div className="canvas-toolbar__palette" role="group" aria-label="홈페이지 색상">
              {palette.map(color => <button type="button" key={color.value} title={color.name} aria-label={`${color.name} ${color.value}`}
                aria-pressed={style.color?.toLowerCase() === color.value} disabled={formatDisabled} onClick={() => applyColor(color.value)}>
                <span aria-hidden="true" style={{ backgroundColor: color.value }} />{color.name}</button>)}
            </div>
            <label htmlFor={`${id}-color`}>HEX 색상<input id={`${id}-color`} value={colorValue} maxLength={7} spellCheck={false}
              placeholder={style.color === 'mixed' ? '혼합' : '#68233A'} aria-invalid={error?.field === 'color'}
              aria-describedby={error?.field === 'color' ? `${id}-error` : undefined}
              onChange={event => setColorDraft({ key: selectionKey, value: event.target.value })}
              onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); applyColor() } }} /></label>
            <Button size="sm" variant="secondary" disabled={formatDisabled} onClick={() => applyColor()}>색상 적용</Button>
          </div>
        </details>
      </fieldset>
    </div>
    <details className="canvas-toolbar__more" onKeyDown={closeDisclosure}>
      <summary>더 많은 서식</summary>
      <div className="canvas-toolbar__secondary" role="group" aria-label="추가 글자 편집">
        <Button size="sm" variant="ghost" disabled={formatDisabled} aria-pressed={style.textDecoration === 'mixed' ? 'mixed' : style.textDecoration === 'line-through'}
          onClick={() => format({ textDecoration: style.textDecoration === 'line-through' ? 'none' : 'line-through' })}>취소선</Button>
        <Button size="sm" variant="ghost" disabled={formatDisabled} onClick={copyStyle}>서식 복사</Button>
        <Button size="sm" variant="ghost" disabled={formatDisabled || !copiedStyle} onClick={() => copiedStyle && format({ ...copiedStyle })}>서식 붙이기</Button>
        <Button size="sm" variant="ghost" disabled={formatDisabled} onClick={() => format(null)}>서식 지우기</Button>
        <Button size="sm" variant="ghost" disabled={locked} onClick={() => action('selectAll')}>전체 글자 선택</Button>
      </div>
      <p className="canvas-toolbar__note">서식 지우기는 선택한 글자만 기본 디자인으로 되돌립니다. 밑줄과 취소선은 하나씩 적용됩니다.</p>
      <div className="canvas-toolbar__cancel"><span>이번 입력을 버리고 편집 전으로 돌아가려면</span>
        <Button size="sm" variant="ghost" disabled={locked} onClick={() => action('cancel')}>이번 편집 되돌리기</Button>
      </div>
    </details>
    {error ? <p className="canvas-toolbar__error" id={`${id}-error`} role="alert">{error.message}</p> : null}
    {feedback ? <p className="canvas-toolbar__note" role="status">{feedback}</p> : null}
    </div>
    <div className="canvas-toolbar__footer" role="group" aria-label="편집 실행">
      <Button size="sm" variant="ghost" disabled={locked || !summary?.canUndo} onClick={() => action('undo')}>실행 취소</Button>
      <Button size="sm" variant="ghost" disabled={locked || !summary?.canRedo} onClick={() => action('redo')}>다시 실행</Button>
      <Button className="canvas-toolbar__finish" size="sm" disabled={locked} onClick={() => action('finish')}>편집 마침</Button>
    </div>
  </section>
}
