type ModalControl = Pick<HTMLElement, 'getAttribute' | 'getClientRects'> & { disabled?: boolean; readOnly?: boolean }

/** Keep focus in document order so read-only receipts open at their actions, not their final status field. */
export function initialModalFocus<T extends ModalControl>(controls: readonly T[], fallback: T | null): T | null {
  return controls.find(control => !control.disabled && !control.readOnly
    && control.getAttribute('data-admin-modal-close') === null
    && control.getAttribute('aria-hidden') !== 'true'
    && control.getClientRects().length > 0) ?? fallback
}

const layersByBody = new WeakMap<HTMLElement, { originalOverflow: string; layers: HTMLElement[] }>()

/** One scroll lock per document; dialog teardown order must not leave the page locked. */
export function registerAdminModal(root: HTMLElement, body: HTMLElement) {
  let state = layersByBody.get(body)
  if (!state) {
    state = { originalOverflow: body.style.overflow, layers: [] }
    layersByBody.set(body, state)
    body.style.overflow = 'hidden'
  }
  state.layers.push(root)
  let active = true
  const isTop = () => active && state.layers.at(-1) === root
  return {
    isTop,
    leave() {
      if (!active) return false
      const wasTop = isTop()
      active = false
      state.layers = state.layers.filter(layer => layer !== root)
      if (state.layers.length === 0) {
        body.style.overflow = state.originalOverflow
        layersByBody.delete(body)
      }
      return wasTop
    },
  }
}
