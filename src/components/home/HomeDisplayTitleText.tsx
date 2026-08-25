import type { HomeTitleAccent } from '../../lib/homeTypography'
import { buildHomeTitleFragments } from '../../lib/homeTypography'

type HomeDisplayTitleTextProps = {
  accents: readonly HomeTitleAccent[]
  text: string
}

export function HomeDisplayTitleText({
  accents,
  text,
}: HomeDisplayTitleTextProps) {
  return buildHomeTitleFragments(text, accents).map((fragment, index) =>
    fragment.role === 'base' ? (
      fragment.text
    ) : (
      <span
        className={`home-type-accent home-type-accent--${fragment.role}`}
        key={`${fragment.role}-${fragment.text}-${index}`}
      >
        {fragment.text}
      </span>
    ),
  )
}
