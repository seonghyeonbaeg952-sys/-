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
