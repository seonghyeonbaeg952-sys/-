import type { CSSProperties } from 'react'

import { classNames } from '../../utils/classNames'

type HomeSectionStaffCueProps = {
  className?: string
  label: string
  noteOffset?: number
  symbol?: string
}

type HomeSectionStaffCueStyle = CSSProperties & {
  '--home-section-cue-x': string
}

export function HomeSectionStaffCue({
  className,
  label,
  noteOffset = 0,
  symbol = '♪',
}: HomeSectionStaffCueProps) {
  const style: HomeSectionStaffCueStyle = {
    '--home-section-cue-x': `${noteOffset}px`,
  }

  return (
    <span
      aria-hidden="true"
      className={classNames('home-section-staff-cue', className)}
      style={style}
    >
      <span className="home-section-staff-cue__note">{symbol}</span>
      <span className="home-section-staff-cue__label">{label}</span>
    </span>
  )
}
