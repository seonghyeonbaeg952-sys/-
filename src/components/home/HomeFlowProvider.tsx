import { type CSSProperties, type ReactNode } from 'react'

import { HOME_FLOW_SECTIONS } from '../../constants/homeFlow'
import { useHomeFlowProgress } from '../../hooks/useHomeFlowProgress'

type HomeFlowStyle = CSSProperties & {
  '--home-active-index': number
  '--home-active-position': string
  '--home-flow-progress': string
}

type HomeFlowProviderProps = {
  children: ReactNode
}

export function HomeFlowProvider({ children }: HomeFlowProviderProps) {
  const { activeKey, progress } = useHomeFlowProgress()
  const activeIndex = Math.max(
    0,
    HOME_FLOW_SECTIONS.findIndex((section) => section.key === activeKey),
  )
  const style: HomeFlowStyle = {
    '--home-active-index': activeIndex,
    '--home-active-position': `${(activeIndex / (HOME_FLOW_SECTIONS.length - 1)) * 100}%`,
    '--home-flow-progress': progress.toFixed(4),
  }

  return (
    <div
      className="home-flow-root"
      data-active-flow-section={activeKey}
      data-guided-mode="passive"
      data-guided-state="settled"
      style={style}
    >
      {children}
    </div>
  )
}

