/** Buttons keep native mouse/keyboard behavior; Alt explicitly selects a label. */
export function isPreviewControlActivation(event: Pick<MouseEvent, 'target' | 'altKey'>): boolean {
  return !event.altKey && event.target instanceof Element
    && Boolean(event.target.closest('button,a[href],input,select,textarea,summary,[role="tab"],[role="button"]'))
}
