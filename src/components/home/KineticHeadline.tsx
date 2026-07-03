import type { CSSProperties, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type KineticHeadlineProps = {
  eyebrow?: string
  ghost?: string
  lines: string[]
  body?: ReactNode
  className?: string
  headingLevel?: 1 | 2 | 3
}

type KineticLineStyle = CSSProperties & {
  '--kinetic-line-index': number
}

export function KineticHeadline({
  body,
  className,
  eyebrow,
  ghost,
  headingLevel = 2,
  lines,
}: KineticHeadlineProps) {
  const Heading = `h${headingLevel}` as const

  return (
    <div className={classNames('kinetic-headline', className)}>
      {ghost ? (
        <span aria-hidden="true" className="kinetic-headline__ghost">
          {ghost}
        </span>
      ) : null}
      {eyebrow ? <p className="type-eyebrow text-gold-warm">{eyebrow}</p> : null}
      <Heading className="kinetic-headline__title">
        {lines.map((line, index) => {
          const lineStyle: KineticLineStyle = { '--kinetic-line-index': index }

          return (
            <span
              className="kinetic-headline__line"
              key={`${line}-${index}`}
              style={lineStyle}
            >
              <span>{line}</span>
            </span>
          )
        })}
      </Heading>
      {body ? <div className="kinetic-headline__body">{body}</div> : null}
    </div>
  )
}

