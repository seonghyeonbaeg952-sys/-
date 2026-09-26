export function getEditorSectionLabel(heading: Pick<HTMLElement, 'innerText' | 'textContent'> | null, ariaLabel: string | null) {
  const visible = heading?.innerText?.replace(/\s+/g, ' ').trim()
  const fallback = heading?.textContent?.replace(/\s+/g, ' ').trim()
  return (visible || fallback || ariaLabel?.trim() || '구역').replace(/,(?=[가-힣])/g, ', ').slice(0, 80)
}
