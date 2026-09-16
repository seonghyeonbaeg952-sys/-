import { useId } from 'react'
import type { EditorAppearance, EditorFont } from '../../../types/siteEditor'
import { EDITOR_NUMBER_RANGES } from '../../../lib/siteEditorModel'
import { AdminFormField } from '../AdminFormField'
import { AdminSelect } from '../AdminSelect'
import { Button } from '../../common/Button'

const fonts: Array<{ value: EditorFont; label: string }> = [
  { value: 'system', label: '기본 산세리프' }, { value: 'gothic-a1', label: '고딕 A1' },
  { value: 'hahmlet', label: '함렛' }, { value: 'arita-buri', label: '아리따 부리' },
  { value: 'gowun-batang', label: '고운 바탕' }, { value: 'grandiflora', label: '그란디플로라' },
]
const numbers = [
  { key: 'fontSize', label: '본문 크기', step: 1, unit: 'px' },
  { key: 'h1Size', label: '큰 제목 크기', step: 1, unit: 'px' },
  { key: 'h2Size', label: '중간 제목 크기', step: 1, unit: 'px' },
  { key: 'h3Size', label: '작은 제목 크기', step: 1, unit: 'px' },
  { key: 'labelSize', label: '라벨 크기', step: 1, unit: 'px' },
  { key: 'lineHeight', label: '줄간격', step: 0.05, unit: '배' },
  { key: 'letterSpacing', label: '자간', step: 0.01, unit: 'em' },
] as const
const colors = [
  { key: 'textColor', label: '본문 색' }, { key: 'headingColor', label: '제목 색' },
  { key: 'mutedColor', label: '보조문구 색' }, { key: 'accentColor', label: '강조 색' },
  { key: 'backgroundColor', label: '배경 색' },
] as const

type Props = {
  value: EditorAppearance
  onChange: <K extends keyof EditorAppearance>(key: K, value: EditorAppearance[K] | undefined) => void
  onReset: () => void
}

function contrastRatio(first?: string, second?: string) {
  first = first?.length === 4 ? `#${first.slice(1).split('').map((letter) => letter.repeat(2)).join('')}` : first
  second = second?.length === 4 ? `#${second.slice(1).split('').map((letter) => letter.repeat(2)).join('')}` : second
  if (!first || !second || !/^#[\da-f]{6}$/i.test(first) || !/^#[\da-f]{6}$/i.test(second)) return null
  const luminance = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b)
  return (values[1] + 0.05) / (values[0] + 0.05)
}

export function EditorAppearancePanel({ value, onChange, onReset }: Props) {
  const id = useId().replaceAll(':', '')
  const contrast = contrastRatio(value.textColor, value.backgroundColor)
  return (
    <div className="site-editor__appearance">
      <p className="site-editor__help">빈 항목은 기존 디자인과 상위 설정을 그대로 사용합니다. 지정한 항목만 현재 화면 범위에 적용됩니다.</p>
      <div className="site-editor__field-grid">
        {(['fontFamily', 'headingFontFamily'] as const).map((key) => (
          <AdminSelect key={key} id={`${id}-${key}`} label={key === 'fontFamily' ? '본문 글꼴' : '제목 글꼴'} value={value[key] ?? ''} options={[{ value: '', label: '기존 글꼴 유지' }, ...fonts]} onChange={(event) => onChange(key, fonts.find((font) => font.value === event.target.value)?.value)} />
        ))}
        {numbers.map((field) => {
          const [min, max] = EDITOR_NUMBER_RANGES[field.key]
          return <AdminFormField key={field.key} id={`${id}-${field.key}`} label={field.label} description={`${min}–${max}${field.unit} · 비우면 기존값 유지`} type="number" min={min} max={max} step={field.step} value={Number.isNaN(value[field.key]) ? '' : value[field.key] ?? ''} placeholder="기존값" onChange={(event) => onChange(field.key, event.target.value === '' ? undefined : event.target.valueAsNumber)} />
        })}
        <AdminSelect id={`${id}-weight`} label="글자 굵기" description="서체가 지원하지 않는 굵기는 브라우저가 비슷하게 표시할 수 있습니다." value={String(value.fontWeight ?? '')} options={[{ label: '기존 굵기 유지', value: '' }, ...[300, 400, 500, 600, 700, 800, 900].map((weight) => ({ label: `${weight}`, value: `${weight}` }))]} onChange={(event) => onChange('fontWeight', event.target.value ? Number(event.target.value) : undefined)} />
      </div>
      {(value.fontSize !== undefined && value.fontSize < 14) || (value.labelSize !== undefined && value.labelSize < 12) ? <p className="site-editor__notice">작은 글씨는 휴대폰에서 읽기 어려울 수 있습니다. 미리보기의 실제 크기로 확인하세요.</p> : null}
      <div className="site-editor__field-grid">
        {colors.map((field) => {
          const color = value[field.key] ?? ''
          const valid = /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)
          const expanded = color.length === 4 ? `#${color.slice(1).split('').map((letter) => letter.repeat(2)).join('')}` : color
          return <AdminFormField key={field.key} id={`${id}-${field.key}`} label={field.label} value={color} placeholder="기존 색상 유지" maxLength={7} error={color && !valid ? '#10233F처럼 HEX 색상을 입력하세요.' : null} onChange={(event) => onChange(field.key, event.target.value || undefined)} suffix={<input className="site-editor__color" type="color" aria-label={`${field.label} 선택`} value={valid ? expanded : '#10233f'} onChange={(event) => onChange(field.key, event.target.value)} />} />
        })}
      </div>
      {contrast !== null && contrast < 4.5 ? <p className="site-editor__notice">지정한 본문과 배경의 대비가 낮습니다 ({contrast.toFixed(2)}:1). 본문은 4.5:1 이상을 권장합니다.</p> : null}
      <Button variant="secondary" disabled={Object.keys(value).length === 0} onClick={onReset}>이 범위의 디자인을 기본값으로</Button>
    </div>
  )
}
