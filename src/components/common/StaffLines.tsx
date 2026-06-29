import { classNames } from '../../utils/classNames'

export type StaffLineVariant = 'gold' | 'inverted' | 'navy' | 'subtle'
export type StaffLineDensity = 'light' | 'normal'
export type StaffLineDirection = 'diagonal' | 'horizontal' | 'vertical'

type StaffLinesProps = {
  className?: string
  density?: StaffLineDensity
  direction?: StaffLineDirection
  variant?: StaffLineVariant
}

const lineIndexes = Array.from({ length: 5 }, (_, index) => index)

const variantClasses: Record<StaffLineVariant, string> = {
  gold: 'bg-gold-warm/35',
  inverted: 'bg-gold-soft/22',
  navy: 'bg-navy-deep/14',
  subtle: 'bg-navy-deep/8',
}

const densityClasses: Record<StaffLineDensity, string> = {
  light: 'gap-1.5 sm:gap-2',
  normal: 'gap-2 sm:gap-2.5',
}

export function StaffLines({
  className,
  density = 'normal',
  direction = 'horizontal',
  variant = 'subtle',
}: StaffLinesProps) {
  const isVertical = direction === 'vertical'

  return (
    <div
      aria-hidden="true"
      className={classNames(
        'pointer-events-none w-full',
        isVertical && 'h-full w-auto',
        direction === 'diagonal' && '-rotate-3',
        className,
      )}
    >
      <div
        className={classNames(
          'staff-reveal',
          isVertical
            ? 'flex h-full w-auto'
            : 'grid w-full',
          densityClasses[density],
        )}
      >
        {lineIndexes.map((line) => (
          <span
            className={classNames(
              isVertical ? 'h-full min-h-24 w-px origin-bottom' : 'h-px w-full origin-left',
              variantClasses[variant],
            )}
            key={line}
          />
        ))}
      </div>
    </div>
  )
}
