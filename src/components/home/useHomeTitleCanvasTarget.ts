import { useEffect, useId } from 'react'
import { homeAllEditorFields } from '../../lib/homeDeviceContent'
import { homeRichCopySourceKeys } from '../../content/homeRichCopyKeys'
import { useSiteEditor } from '../site-editor/useSiteEditor'

/** Bind the existing heading node directly; no wrapper can alter its public line layout. */
export function useHomeTitleCanvasTarget(sourceKey: string, text: string, elementId: string) {
  const { device, isPreview, canvas } = useSiteEditor()
  const key = homeAllEditorFields.find(field => field.device === device && field.sourceKey === sourceKey)?.key
  const reactId = useId()
  const instanceId = `title-${reactId.replace(/[^A-Za-z0-9_.:-]/g, '')}`
  useEffect(() => {
    if (!isPreview || !canvas || !key || !homeRichCopySourceKeys[device].has(sourceKey)) return
    const element = document.getElementById(elementId)
    if (!element) return
    element.setAttribute('data-canvas-target', instanceId)
    const unregister = canvas.register({ instanceId, ownerPage: 'home', key, text, fullText: text, offset: 0, element })
    return () => {
      unregister()
      if (element.getAttribute('data-canvas-target') === instanceId) element.removeAttribute('data-canvas-target')
    }
  }, [isPreview, canvas, key, device, sourceKey, text, elementId, instanceId])
}
