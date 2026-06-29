import { classNames } from '../../utils/classNames'
import { StaffLines, type StaffLineVariant } from './StaffLines'

type StaffDividerProps = {
  className?: string
  compact?: boolean
  variant?: StaffLineVariant
}

export function StaffDivider({
  className,
  compact = false,
  variant = 'gold',
}: StaffDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={classNames(
        'pointer-events-none relative mx-auto w-full',
        compact ? 'max-w-sm py-3' : 'max-w-5xl py-5 sm:py-6',
        className,
      )}
    >
      <StaffLines density={compact ? 'light' : 'normal'} variant={variant} />
      <span className="absolute left-6 top-1/2 size-2 -translate-y-1/2 rounded-full bg-gold-warm shadow-[0_0_0_7px_rgb(201_164_92/0.1)] sm:left-10" />
    </div>
  )
}
