import { forwardRef } from 'react'

export const HomeV4JoinWaveTransition = forwardRef<
  HTMLDivElement,
  { reducedMotion: boolean }
>(function HomeV4JoinWaveTransition({ reducedMotion }, ref) {
  return (
    <div
      aria-hidden="true"
      className="home-v4-join-wave"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      ref={ref}
    >
      <div className="home-v4-join-wave__boundary">
        <span />
        <svg
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 240 52"
        >
          <path d="M0 2H48L120 50L192 2H240" />
        </svg>
        <span />
      </div>
      <div className="home-v4-join-wave__surface" />
    </div>
  )
})
