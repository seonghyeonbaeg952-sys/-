import type { HomeTitleAccent } from '../../lib/homeTypography'
import { buildHomeTitleFragments } from '../../lib/homeTypography'
import { HomeCopy } from './HomeCopy'
import { useSampleLanguage } from '../../features/sample-language/useSampleLanguage'

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
  const { translate } = useSampleLanguage()
  const fragments = buildHomeTitleFragments(text, accents.map(accent => ({ ...accent, term: translate(accent.term, sourceKey) })))
  return fragments.map((fragment, index) => {
    const fragmentOffset = offset + fragments.slice(0, index).reduce((length, part) => length + part.text.length, 0)
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
