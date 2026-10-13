import { useId } from 'react'
import { motion, type MotionValue } from 'motion/react'
import { LINEAGE_CURVE_PATH, LINEAGE_MOTET_LETTERS } from './lineageMotetModel'

type LineageMotetOrnamentProps = {
  progress: MotionValue<number>
  reducedMotion: boolean
}

export function LineageMotetOrnament({ progress, reducedMotion }: LineageMotetOrnamentProps) {
  const id = useId()
  const maskId = `lineage-motet-ink-${id}`
  const lettering = LINEAGE_MOTET_LETTERS.map(({ key, letter, x, y }) => (
    <g key={key} transform={`translate(${x} ${y}) rotate(90)`}>
      <text className="spirit-heritage__lineage-motet" dominantBaseline="central" textAnchor="middle">{letter}</text>
    </g>
  ))

  return (
    <svg
      aria-hidden="true"
      className="spirit-heritage__timeline-curve"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 129.825 1040.96"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-60" y="-10" width="250" height="1060">
          <motion.path
            d={LINEAGE_CURVE_PATH}
            data-node-id="2:35"
            pathLength={1}
            stroke="white"
            strokeWidth="80"
            style={reducedMotion ? { pathLength: 1 } : { pathLength: progress }}
          />
        </mask>
      </defs>
      <g fill="currentColor" opacity="0.18">
        {lettering}
      </g>
      <g fill="var(--spirit-orange)" mask={`url(#${maskId})`}>
        {lettering}
      </g>
    </svg>
  )
}
