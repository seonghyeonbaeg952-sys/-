import type { ReactNode } from 'react'

type HomeSectionVariant = 'quiet' | 'stage' | 'finale'

type HomeSectionHandoffProps = {
  children: ReactNode
  outgoing: ReactNode
  variant: HomeSectionVariant
}

type HomeSectionPanelProps = {
  children: ReactNode
  variant: HomeSectionVariant
}

export function HomeSectionHandoff({
  children,
  outgoing,
  variant,
}: HomeSectionHandoffProps) {
  return (
    <div
      className={`home-section-handoff home-section-handoff--${variant}`}
      data-home-section-handoff={variant}
    >
      <div className="home-section-handoff__outgoing">{outgoing}</div>
      {children}
    </div>
  )
}

export function HomeSectionPanel({ children, variant }: HomeSectionPanelProps) {
  return (
    <div
      className={`home-section-panel home-section-panel--${variant}`}
      data-home-section-panel={variant}
    >
      <div
        aria-hidden="true"
        className={`home-section-wave home-section-wave--${variant}`}
        data-home-section-wave={variant}
      />
      {children}
    </div>
  )
}
