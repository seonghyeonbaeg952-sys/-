import type { EditorFont, EditorStyledCopy } from '../../../types/siteEditor'

export const editorFontOptions: Array<{ value: EditorFont; label: string }> = [
  { value: 'system', label: '기본 산세리프' }, { value: 'gothic-a1', label: '고딕 A1' },
  { value: 'hahmlet', label: '함렛' }, { value: 'arita-buri', label: '아리따 부리' },
  { value: 'gowun-batang', label: '고운 바탕' }, { value: 'grandiflora', label: '그란디플로라' },
]

export const editorViewports = [
  { id: 'mobile', label: '모바일', width: 390, height: 844 },
  { id: 'tablet', label: '태블릿', width: 768, height: 1024 },
  { id: 'desktop', label: '데스크톱', width: 1440, height: 900 },
] as const

export function formatEditorTime(value: string | null) {
  if (!value) return '없음'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date) : '시간 확인 필요'
}

export function formatEditorChangeValue(kind: string, value: string | number | undefined): string {
  if (value === undefined) return '기존 원문·디자인 사용'
  if (kind !== 'textStyle') return String(value) || '(빈 문구)'
  try {
    const formatted = JSON.parse(String(value)) as EditorStyledCopy
    if (!formatted.runs.length) return '글자별 서식 해제'
    const labels = formatted.runs.slice(0, 8).map(run => {
      const text = formatted.text.slice(run.start, run.end)
      const font = editorFontOptions.find(option => option.value === run.style.fontFamily)?.label
      const size = run.style.fontSize === undefined ? undefined : `${run.style.fontSize}px`
      const weight = run.style.fontWeight === undefined ? undefined : `굵기 ${run.style.fontWeight}`
      const slant = run.style.fontStyle === undefined ? undefined : run.style.fontStyle === 'italic' ? '기울임' : '기울임 해제'
      const decoration = run.style.textDecoration === undefined ? undefined : ({ none: '줄 장식 해제', underline: '밑줄', 'line-through': '취소선' }[run.style.textDecoration])
      return `“${text.length > 30 ? `${text.slice(0, 30)}…` : text}”: ${[font, size, run.style.color, weight, slant, decoration].filter(Boolean).join(' · ')}`
    })
    return labels.join('\n') + (formatted.runs.length > 8 ? `\n외 ${formatted.runs.length - 8}개 범위` : '')
  } catch { return '글자별 서식 변경' }
}
