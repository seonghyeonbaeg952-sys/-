import { classNames } from '../../utils/classNames'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type StaffFlowRailProps = {
  className?: string
  tone?: 'dark' | 'light'
}

const lineIndexes = Array.from({ length: 5 }, (_, index) => index)
const measureStops = [0.08, 0.22, 0.38, 0.56, 0.74, 0.92] as const
const conductorReleaseStartProgress = 0.96
const conductorHandFrames = Array.from({ length: 20 }, (_, index) => index + 1)
const conductorFrameDelaysMs = [
  0, 69, 138, 207, 276,
  344, 413, 475, 531, 581,
  625, 664, 699, 731, 760,
  788, 813, 836, 857, 875,
] as const

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value))
}

type HandPath = {
  d: string
  opacity?: number
}

const openHandFill =
  'M115 318L130 262C111 242 99 216 101 190C103 169 119 160 134 174L156 200C158 160 158 113 166 78C170 60 184 52 197 61C207 68 209 83 205 101L192 187C207 146 217 102 233 72C241 57 258 55 268 68C276 78 272 93 264 108L230 191C254 158 273 130 295 108C308 96 325 101 329 117C332 128 324 141 314 150L266 199C291 181 316 163 338 158C353 155 365 164 365 178C365 191 353 200 339 204L295 216C288 220 282 225 279 231C249 243 236 268 231 318Z'
const curlHandFill =
  'M116 318L129 264C109 245 99 220 101 196C103 176 118 167 133 178L160 197C164 162 167 123 178 92C183 76 198 70 209 80C218 88 218 102 211 117L190 193C214 162 226 127 246 104C257 91 273 94 280 108C285 119 278 133 266 145L226 198C254 177 279 158 302 153C317 150 330 160 331 174C332 187 321 198 306 202L262 215C279 222 302 235 314 250C325 262 321 277 308 284C294 291 279 283 268 270L238 242C221 265 199 287 168 303C151 313 132 319 116 318Z'
const releaseHandFill =
  'M116 318L130 264C110 247 99 221 100 195C101 175 115 165 131 171L160 184L167 141C171 119 188 107 212 109L232 112C246 115 255 124 258 138C269 132 282 135 292 146L307 162C318 174 318 189 308 201C322 207 331 221 329 236C326 253 309 263 290 259L260 253C248 277 223 298 188 309C163 317 137 323 116 318Z'

const openHandStrokes: HandPath[] = [
  { d: 'M115 318L130 262C111 242 99 216 101 190C103 169 119 160 134 174L156 200' },
  { d: 'M119 182C128 166 146 176 156 200', opacity: 0.86 },
  { d: 'M120 214C129 193 141 184 156 200', opacity: 0.82 },
  { d: 'M166 78C174 57 194 54 202 72', opacity: 0.86 },
  { d: 'M157 199C158 160 158 113 166 78C170 60 184 52 197 61C207 68 209 83 205 101L192 187' },
  { d: 'M233 72C244 52 267 56 274 76', opacity: 0.86 },
  { d: 'M192 187C207 146 217 102 233 72C241 57 258 55 268 68C276 78 272 93 264 108L230 191' },
  { d: 'M295 108C309 93 328 101 331 119', opacity: 0.86 },
  { d: 'M230 191C254 158 273 130 295 108C308 96 325 101 329 117C332 128 324 141 314 150L266 199' },
  { d: 'M338 158C357 153 369 165 365 184', opacity: 0.86 },
  { d: 'M266 199C291 181 316 163 338 158C353 155 365 164 365 178C365 191 353 200 339 204L295 216' },
  { d: 'M295 216C288 220 282 225 279 231' },
  { d: 'M279 231C249 243 236 268 231 318L115 318' },
  { d: 'M146 229C175 247 216 248 256 232', opacity: 0.55 },
  { d: 'M154 201C166 205 179 201 192 187', opacity: 0.7 },
  { d: 'M192 187C205 197 218 198 230 191', opacity: 0.7 },
  { d: 'M230 191C243 204 255 207 266 199', opacity: 0.7 },
  { d: 'M266 199C278 211 288 218 295 216', opacity: 0.7 },
  { d: 'M170 105C183 130 187 156 183 184', opacity: 0.45 },
  { d: 'M235 110C235 137 227 164 214 187', opacity: 0.45 },
  { d: 'M298 144C284 168 267 187 246 201', opacity: 0.45 },
  { d: 'M129 262C115 290 104 318 96 350' },
  { d: 'M231 318C247 333 260 346 272 360' },
  { d: 'M130 266C148 284 172 292 197 292', opacity: 0.35 },
  { d: 'M119 285C139 305 162 317 188 322', opacity: 0.24 },
  { d: 'M106 323C121 337 138 349 158 357', opacity: 0.22 },
]

const curlHandStrokes: HandPath[] = [
  { d: 'M116 318L129 264C109 245 99 220 101 196C103 176 118 167 133 178L160 197' },
  { d: 'M119 185C130 170 149 178 160 197', opacity: 0.86 },
  { d: 'M120 220C131 198 144 188 160 197', opacity: 0.82 },
  { d: 'M178 92C187 72 207 73 214 91', opacity: 0.86 },
  { d: 'M160 197C164 162 167 123 178 92C183 76 198 70 209 80C218 88 218 102 211 117L190 193' },
  { d: 'M246 104C258 89 277 96 281 113', opacity: 0.86 },
  { d: 'M190 193C214 162 226 127 246 104C257 91 273 94 280 108C285 119 278 133 266 145L226 198' },
  { d: 'M302 153C318 149 331 160 331 176', opacity: 0.86 },
  { d: 'M226 198C254 177 279 158 302 153C317 150 330 160 331 174C332 187 321 198 306 202L262 215' },
  { d: 'M314 250C328 263 323 281 307 287', opacity: 0.86 },
  { d: 'M262 215C279 222 302 235 314 250C325 262 321 277 308 284C294 291 279 283 268 270L238 242' },
  { d: 'M238 242C221 265 199 287 168 303C151 313 132 319 116 318' },
  { d: 'M142 240C169 257 211 255 238 242', opacity: 0.58 },
  { d: 'M160 197C171 204 181 202 190 193', opacity: 0.7 },
  { d: 'M190 193C200 204 213 205 226 198', opacity: 0.7 },
  { d: 'M226 198C238 211 251 218 262 215', opacity: 0.7 },
  { d: 'M262 215C272 232 280 246 286 263', opacity: 0.7 },
  { d: 'M176 122C188 145 192 169 187 193', opacity: 0.45 },
  { d: 'M244 139C235 164 218 184 197 196', opacity: 0.45 },
  { d: 'M298 190C279 203 258 212 236 218', opacity: 0.45 },
  { d: 'M129 264C115 292 104 321 96 350' },
  { d: 'M168 303C187 324 205 342 224 360' },
  { d: 'M124 285C145 304 169 315 195 319', opacity: 0.24 },
  { d: 'M110 322C127 337 145 349 166 358', opacity: 0.22 },
]

const releaseHandStrokes: HandPath[] = [
  { d: 'M116 318L130 264C110 247 99 221 100 195C101 175 115 165 131 171L160 184' },
  { d: 'M117 176C130 163 149 168 160 184', opacity: 0.86 },
  { d: 'M122 220C133 197 145 183 160 184', opacity: 0.82 },
  { d: 'M167 141C179 119 203 106 232 112', opacity: 0.86 },
  { d: 'M160 184L167 141C171 119 188 107 212 109L232 112C246 115 255 124 258 138' },
  { d: 'M258 138C270 129 286 135 298 152', opacity: 0.86 },
  { d: 'M258 138C269 132 282 135 292 146L307 162C318 174 318 189 308 201' },
  { d: 'M307 162C321 176 320 194 308 201', opacity: 0.86 },
  { d: 'M308 201C322 207 331 221 329 236C326 253 309 263 290 259L260 253' },
  { d: 'M329 236C326 253 309 263 290 259', opacity: 0.86 },
  { d: 'M260 253C248 277 223 298 188 309C163 317 137 323 116 318' },
  { d: 'M167 141L211 154L258 138' },
  { d: 'M211 154L246 179L292 146' },
  { d: 'M246 179L273 211L308 201' },
  { d: 'M160 184C171 195 184 199 197 195', opacity: 0.7 },
  { d: 'M197 195C209 210 226 216 243 212', opacity: 0.7 },
  { d: 'M243 212C255 229 269 240 286 243', opacity: 0.7 },
  { d: 'M144 212C174 235 219 246 260 253', opacity: 0.62 },
  { d: 'M130 264C116 293 105 321 96 350' },
  { d: 'M188 309C207 326 224 343 240 360' },
  { d: 'M169 144C186 129 205 125 232 132', opacity: 0.36 },
  { d: 'M210 156C228 146 247 147 272 158', opacity: 0.34 },
  { d: 'M131 237C159 254 190 263 224 265', opacity: 0.26 },
  { d: 'M116 284C138 303 162 314 190 319', opacity: 0.22 },
]

function ConductingHandPhase({
  className,
  fillPath,
  strokes,
}: {
  className: string
  fillPath: string
  strokes: HandPath[]
}) {
  return (
    <g className={className}>
      <path className="score-conductor-hand-fill" d={fillPath} />
      <g
        className="score-conductor-hand-lines"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.8"
      >
        {strokes.map((path, index) => (
          <path
            d={path.d}
            key={`${className}-${index}`}
            opacity={path.opacity}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </g>
  )
}

function ConductingHandSequence() {
  return (
    <>
      <ConductingHandPhase
        className="score-conductor-hand-state score-conductor-open-hand"
        fillPath={openHandFill}
        strokes={openHandStrokes}
      />
      <ConductingHandPhase
        className="score-conductor-hand-state score-conductor-curl-hand"
        fillPath={curlHandFill}
        strokes={curlHandStrokes}
      />
      <ConductingHandPhase
        className="score-conductor-hand-state score-conductor-release-hand"
        fillPath={releaseHandFill}
        strokes={releaseHandStrokes}
      />
    </>
  )
}

function ConductorReleaseIcon({
  className,
  loadFrames,
}: {
  className?: string
  loadFrames: boolean
}) {
  const renderHandFrames = () =>
    conductorHandFrames.map((frame) => {
      const frameUrl = `/images/effects/conductor-hand-frame-${frame}.png`

      return (
        <img
          alt=""
          aria-hidden="true"
          className={`score-conductor-frame score-conductor-frame-${frame}`}
          decoding="async"
          draggable={false}
          key={frame}
          loading="eager"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          src={frameUrl}
          style={
            {
              '--conductor-frame-index': frame - 1,
              animationDelay: `${conductorFrameDelaysMs[frame - 1]}ms`,
            } as CSSProperties
          }
        />
      )
    })

  return (
    <span
      aria-hidden="true"
      className={classNames('score-conductor-release-shell', className)}
    >
      <span className="score-conductor-release-motion">
        <svg
          className="score-conductor-release-svg"
          fill="none"
          viewBox="0 0 520 300"
        >
        <g
          className="score-conductor-trails"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="score-conductor-motion-echo score-conductor-motion-echo-left"
            d="M198 56C236 98 246 154 230 202C198 226 188 258 230 270"
          />
          <path
            className="score-conductor-motion-echo score-conductor-motion-echo-right"
            d="M322 56C284 98 274 154 290 202C322 226 332 258 290 270"
          />
          <path
            className="score-conductor-motion-trail score-conductor-motion-trail-left"
            d="M198 56C236 98 246 154 230 202C198 226 188 258 230 270"
          />
          <path
            className="score-conductor-motion-trail score-conductor-motion-trail-right"
            d="M322 56C284 98 274 154 290 202C322 226 332 258 290 270"
          />
          <path
            className="score-conductor-motion-ribbon score-conductor-motion-ribbon-left"
            d="M208 66C238 102 246 150 232 194C204 218 198 246 235 256"
          />
          <path
            className="score-conductor-motion-ribbon score-conductor-motion-ribbon-right"
            d="M312 66C282 102 274 150 288 194C316 218 322 246 285 256"
          />
          <path
            className="score-conductor-motion-cutoff"
            d="M228 248C246 258 274 258 292 248"
          />
        </g>
        <g className="score-conductor-motion-sparks" fill="currentColor">
          <circle className="score-conductor-motion-spark score-conductor-motion-spark-1" cx="184" cy="180" r="2.6" />
          <circle className="score-conductor-motion-spark score-conductor-motion-spark-2" cx="336" cy="180" r="2.6" />
          <circle className="score-conductor-motion-spark score-conductor-motion-spark-3" cx="260" cy="250" r="2.2" />
        </g>
          <g display="none">
            <ConductingHandSequence />
          </g>
          <circle className="score-conductor-ictus-glow" cx="260" cy="250" r="10" fill="currentColor" />
          <circle className="score-conductor-ictus" cx="260" cy="250" r="3.2" fill="currentColor" />
        </svg>
        <span className="score-conductor-signature-symbol" />
        <span className="score-conductor-hand-pair score-conductor-left-hand-motion score-conductor-hand-stack score-conductor-left-hand-stack">
          <span className="score-conductor-hand-stack-inner">
            {loadFrames ? renderHandFrames() : null}
          </span>
        </span>
        <span className="score-conductor-hand-pair score-conductor-right-hand-motion score-conductor-hand-stack score-conductor-right-hand-stack">
          <span className="score-conductor-hand-stack-inner score-conductor-hand-stack-inner-mirrored">
            {loadFrames ? renderHandFrames() : null}
          </span>
        </span>
      </span>
    </span>
  )
}

export function StaffFlowRail({ className, tone = 'light' }: StaffFlowRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoadHandFrames, setShouldLoadHandFrames] = useState(false)
  const [isDesktopRail, setIsDesktopRail] = useState(() => {
    return typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false
  })
  const lineColor = tone === 'dark' ? 'bg-gold-soft/24' : 'bg-gold-warm/38'
  const measureColor =
    tone === 'dark'
      ? 'from-gold-soft/0 via-gold-soft/55 to-gold-soft/0'
      : 'from-gold-warm/0 via-gold-warm/70 to-gold-warm/0'
  const dotColor = tone === 'dark' ? 'bg-gold-soft' : 'bg-gold-warm'
  const conductorColor =
    tone === 'dark'
      ? 'text-gold-soft drop-shadow-[0_0_16px_rgb(231_213_163/0.3)]'
      : 'text-gold-warm drop-shadow-[0_0_16px_rgb(201_164_92/0.28)]'
  const glowColor =
    tone === 'dark'
      ? 'from-gold-soft/0 via-gold-soft/16 to-gold-soft/0'
      : 'from-gold-warm/0 via-gold-warm/22 to-gold-warm/0'
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const updateDesktopRail = () => setIsDesktopRail(desktopQuery.matches)

    updateDesktopRail()
    desktopQuery.addEventListener('change', updateDesktopRail)

    return () => desktopQuery.removeEventListener('change', updateDesktopRail)
  }, [])

  useEffect(() => {
    if (!isDesktopRail) {
      return
    }

    const rail = railRef.current

    if (!rail) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const measures = Array.from(
      rail.querySelectorAll<HTMLElement>('.score-flow-measure'),
    )
    const draw = rail.querySelector<HTMLElement>('.score-flow-draw')
    const glow = rail.querySelector<HTMLElement>('.score-flow-glow')
    const finalBarline = rail.querySelector<HTMLElement>('.score-flow-final-barline')
    const conductor = rail.querySelector<HTMLElement>('.score-conductor-release')

    let frameId = 0
    let lastProgress = -1
    let railTop = 0
    let railHeight = 1

    const measureRail = () => {
      const rect = rail.getBoundingClientRect()
      railTop = rect.top + window.scrollY
      railHeight = Math.max(1, rect.height)
    }

    const applyProgress = (nextProgress: number) => {
      const scale = `scaleY(${nextProgress.toFixed(3)})`

      if (draw && draw.style.transform !== scale) {
        draw.style.transform = scale
      }
      if (glow && glow.style.transform !== scale) {
        glow.style.transform = scale
        glow.style.opacity = (0.18 + nextProgress * 0.34).toFixed(3)
      }

      measures.forEach((measure, index) => {
        const visible = nextProgress + 0.05 >= measureStops[index]
        measure.classList.toggle('score-flow-cue-visible', visible)
        measure.classList.toggle('score-flow-cue-hidden', !visible)
      })

      const finalBarlineVisible = nextProgress >= 0.94
      finalBarline?.classList.toggle('score-flow-cue-visible', finalBarlineVisible)
      finalBarline?.classList.toggle('score-flow-cue-hidden', !finalBarlineVisible)
      conductor?.classList.toggle(
        'score-conductor-release-active',
        nextProgress >= conductorReleaseStartProgress,
      )
    }

    const updateProgress = () => {
      frameId = 0
      const nextProgress = prefersReducedMotion.matches
        ? 1
        : (() => {
            const targetViewportY = window.innerHeight * 0.75

            return clampProgress(
              (window.scrollY + targetViewportY - railTop) / railHeight,
            )
          })()

      if (Math.abs(nextProgress - lastProgress) > 0.003) {
        lastProgress = nextProgress
        applyProgress(nextProgress)
      }
    }

    const requestUpdate = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateProgress)
    }

    const handleResize = () => {
      measureRail()
      requestUpdate()
    }

    measureRail()
    updateProgress()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', handleResize)
    prefersReducedMotion.addEventListener('change', requestUpdate)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', handleResize)
      prefersReducedMotion.removeEventListener('change', requestUpdate)
    }
  }, [isDesktopRail])

  useEffect(() => {
    if (!isDesktopRail) {
      return
    }

    const rail = railRef.current
    const conductor = rail?.querySelector<HTMLElement>('.score-conductor-release')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!conductor || shouldLoadHandFrames || reducedMotionQuery.matches) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadHandFrames(true)
          observer.disconnect()
        }
      },
      { rootMargin: '1200px 0px', threshold: 0 },
    )
    observer.observe(conductor)

    return () => observer.disconnect()
  }, [isDesktopRail, shouldLoadHandFrames])

  return (
    <div
      aria-hidden="true"
      className={classNames(
        'score-flow-rail pointer-events-none absolute w-8 overflow-visible sm:w-10 lg:w-14',
        className,
      )}
      ref={railRef}
    >
      <div className="relative h-full w-full">
        <div className="score-flow-mask absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_5rem,black_calc(100%_-_5rem),transparent)]">
          <div className="absolute inset-y-0 left-0 flex w-full justify-between opacity-[0.18]">
            {lineIndexes.map((line) => (
              <span
                className={classNames('h-full w-px rounded-full', lineColor)}
                key={`base-${line}`}
              />
            ))}
          </div>
          <div
            className={classNames(
              'score-flow-glow absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 rounded-full bg-linear-to-b blur-md sm:w-7 lg:w-8',
              glowColor,
            )}
          />
          <div className="score-flow-draw absolute inset-y-0 left-0 flex w-full justify-between">
            {lineIndexes.map((line) => (
              <span
                className={classNames('score-flow-line h-full w-px rounded-full', lineColor)}
                key={line}
              />
            ))}
          </div>
          {measureStops.map((top, index) => (
            <span
              className={classNames(
                'score-flow-measure absolute -left-0.5 h-px w-9 bg-linear-to-r sm:-left-1 sm:w-11 lg:w-16',
                measureColor,
                'score-flow-cue-hidden',
              )}
              key={top}
              style={{ top: `${top * 100}%` }}
            >
              <span
                className={classNames(
                  'absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_8px_rgb(201_164_92/0.08)]',
                  dotColor,
                  index % 2 === 1 && 'opacity-70',
                )}
              />
            </span>
          ))}
          <span
            className={classNames(
              'score-flow-final-barline absolute -left-0.5 top-[96.2%] w-10 sm:-left-1 sm:w-12 lg:w-16',
              'score-flow-cue-hidden',
            )}
          >
            <span className={classNames('score-flow-final-barline-thin', dotColor)} />
            <span className={classNames('score-flow-final-barline-thick', dotColor)} />
          </span>
        </div>
        <ConductorReleaseIcon
          className={classNames(
            'score-conductor-release absolute bottom-[-0.2%] left-1/2 z-10 h-20 w-40 -translate-x-1/2 lg:h-24 lg:w-44 lg:-translate-x-1/2',
            conductorColor,
          )}
          loadFrames={shouldLoadHandFrames}
        />
      </div>
    </div>
  )
}
