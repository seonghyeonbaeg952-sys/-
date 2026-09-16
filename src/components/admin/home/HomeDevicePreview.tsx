import { useEffect, useRef, useState } from 'react'

import type { HomeEditorDevice } from '../../../lib/homeDeviceContent'
import { Button } from '../../common/Button'
import { homeEditorDevices } from './homeDeviceEditorModel'

type HomeDevicePreviewProps = {
  device: HomeEditorDevice
  refreshVersion: number
}

export function HomeDevicePreview({ device, refreshVersion }: HomeDevicePreviewProps) {
  const viewport = homeEditorDevices.find((item) => item.id === device) ?? homeEditorDevices[0]
  const containerRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [fitToContainer, setFitToContainer] = useState(true)
  const [hasOpened, setHasOpened] = useState(false)
  const [manualRefresh, setManualRefresh] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const frameKey = `${device}-${refreshVersion}-${manualRefresh}`
  const scale = fitToContainer && availableWidth > 0 ? Math.min(1, availableWidth / viewport.width) : 1
  const isLoading = hasOpened && loadedKey !== frameKey && failedKey !== frameKey

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const updateWidth = () => setAvailableWidth(container.clientWidth)
    updateWidth()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <details
      className="rounded-formal border border-line-default bg-bg-warm-white"
      onToggle={(event) => { if (event.currentTarget.open) setHasOpened(true) }}
    >
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-ink">
        <span>저장된 {viewport.label} 홈 미리보기</span>
        <span className="text-xs font-normal text-text-muted">{viewport.width}px</span>
      </summary>
      <div className="space-y-4 border-t border-line-default p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-6 text-text-muted">
            저장된 내용만 표시합니다. 편집 중인 문구는 저장 후 반영됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button aria-pressed={fitToContainer} onClick={() => setFitToContainer(true)} size="sm" variant="secondary">화면에 맞춤</Button>
            <Button aria-pressed={!fitToContainer} onClick={() => setFitToContainer(false)} size="sm" variant="secondary">실제 크기</Button>
            <Button onClick={() => setManualRefresh((value) => value + 1)} size="sm" variant="secondary">미리보기 새로고침</Button>
          </div>
        </div>
        {isLoading ? <p className="text-sm text-text-muted" role="status">저장된 홈을 불러오는 중입니다.</p> : null}
        {failedKey === frameKey ? <p className="text-sm text-state-error" role="alert">미리보기를 불러오지 못했습니다. 새로고침해 주세요.</p> : null}
        <div className="overflow-auto rounded-button border border-line-default bg-[#e8e7e4]" ref={containerRef}>
          <div className="relative" style={{ width: viewport.width * scale, height: viewport.height * scale }}>
            {hasOpened ? (
              <iframe
                className="absolute left-0 top-0 border-0 bg-white"
                key={frameKey}
                onError={() => setFailedKey(frameKey)}
                onLoad={() => { setLoadedKey(frameKey); setFailedKey(null) }}
                src="/?home-cms-preview=1"
                style={{ width: viewport.width, height: viewport.height, maxWidth: 'none', transform: `scale(${scale})`, transformOrigin: 'top left' }}
                title={`${viewport.label} 홈 저장된 내용 미리보기 (${viewport.width}px)`}
              />
            ) : null}
          </div>
        </div>
      </div>
    </details>
  )
}
