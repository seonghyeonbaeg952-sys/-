const CURVE_START = { x: 66.4009, y: 0.514496 }
const CURVE_SEGMENTS = [
  [{ x: -23.5991, y: 150.514 }, { x: -18.5991, y: 250.514 }, { x: 68.4009, y: 345.514 }],
  [{ x: 154.401, y: 438.514 }, { x: 146.401, y: 565.514 }, { x: 58.4009, y: 646.514 }],
  [{ x: -18.5991, y: 717.514 }, { x: -8.59906, y: 858.514 }, { x: 82.4009, y: 1040.51 }],
] as const

const coordinates = ({ x, y }: { x: number; y: number }) => `${x} ${y}`
export const LINEAGE_CURVE_PATH = `M${coordinates(CURVE_START)}${CURVE_SEGMENTS.map(segment => `C${segment.map(coordinates).join(' ')}`).join('')}`

/** Sample positions on the authored curve, without rotating text to its tangent. */
export function getLineageCurvePoint(progress: number) {
  const position = (Number.isNaN(progress) ? 0 : Math.min(1, Math.max(0, progress))) * CURVE_SEGMENTS.length
  const index = Math.min(CURVE_SEGMENTS.length - 1, Math.floor(position))
  const t = position - index
  const remaining = 1 - t
  const start = index === 0 ? CURVE_START : CURVE_SEGMENTS[index - 1][2]
  const [control1, control2, end] = CURVE_SEGMENTS[index]
  const weights = [remaining ** 3, 3 * remaining ** 2 * t, 3 * remaining * t ** 2, t ** 3]
  return {
    x: weights[0] * start.x + weights[1] * control1.x + weights[2] * control2.x + weights[3] * end.x,
    y: weights[0] * start.y + weights[1] * control1.y + weights[2] * control2.y + weights[3] * end.y,
  }
}

/** The curve is monotonic vertically; sample equal heights to keep glyphs apart. */
export function getLineageCurvePointAtHeight(progress: number) {
  const unit = Number.isNaN(progress) ? 0 : Math.min(1, Math.max(0, progress))
  if (unit === 0 || unit === 1) return getLineageCurvePoint(unit)
  const targetY = CURVE_START.y + (CURVE_SEGMENTS[2][2].y - CURVE_START.y) * unit
  let lower = 0
  let upper = 1
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const middle = (lower + upper) / 2
    if (getLineageCurvePoint(middle).y < targetY) lower = middle
    else upper = middle
  }
  return getLineageCurvePoint((lower + upper) / 2)
}

const lettering = 'MOTET'.repeat(14)
export const LINEAGE_MOTET_LETTERS = Array.from(lettering).map((letter, index) => ({
  key: `motet-${index}`,
  letter,
  ...getLineageCurvePointAtHeight(0.04 + index / (lettering.length - 1) * 0.92),
}))
