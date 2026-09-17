import type { HomeTitleAccent } from '../../lib/homeTypography'
import { buildHomeTitleFragments } from '../../lib/homeTypography'
import { HomeCopy } from './HomeCopy'

type HomeDisplayTitleTextProps = {
  accents: readonly HomeTitleAccent[]
  text: string
  sourceKey?: string
  fullText?: string
  offset?: number
}

export function HomeDisplayTitleText({
  accents,
  text,
  sourceKey,
  fullText = text,
  offset = 0,
}: HomeDisplayTitleTextProps) {
  let cursor = offset
  return buildHomeTitleFragments(text, accents).map((fragment, index) => {
    const fragmentOffset = cursor
    cursor += fragment.text.length
    const content = sourceKey ? <HomeCopy key={index} sourceKey={sourceKey} text={fragment.text} fullText={fullText} offset={fragmentOffset} /> : fragment.text
    return fragment.role === 'base' ? (
      content
    ) : (
      <span
        className={`home-type-accent home-type-accent--${fragment.role}`}
        key={`${fragment.role}-${fragment.text}-${index}`}
      >
        {content}
      </span>
    )
  })
}
