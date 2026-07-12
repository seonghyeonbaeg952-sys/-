import { type ReactNode, useCallback, useRef } from 'react'

import { HOME_FLOW_SECTIONS } from '../../constants/homeFlow'
import {
  useHomeFlowProgress,
  type HomeFlowProgress,
} from '../../hooks/useHomeFlowProgress'
import { useHomeMotionDirector } from '../../hooks/useHomeMotionDirector'

type HomeFlowProviderProps = {
  children: ReactNode
}

export function HomeFlowProvider({ children }: HomeFlowProviderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const handleFlowProgress = useCallback(
    ({ activeKey }: HomeFlowProgress) => {
      const root = rootRef.current

      if (!root) {
        return
      }

      root.dataset.activeFlowSection = activeKey
    },
    [],
  )

  useHomeFlowProgress(handleFlowProgress)
  useHomeMotionDirector(rootRef)

  return (
    <div
      className="home-flow-root"
      data-active-flow-section={HOME_FLOW_SECTIONS[0].key}
      data-guided-mode="passive"
      data-guided-state="settled"
      ref={rootRef}
    >
      {children}
    </div>
  )
}

