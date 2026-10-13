import type { EditorPageId } from '../../types/siteEditor'
import { useSiteEditor } from './useSiteEditor'
import { Fragment } from 'react'
import { FormattedCopy } from './FormattedCopy'

export function SiteCopy({ page, id, fallback, lineBreaks }: { page: EditorPageId; id: string; fallback: string; lineBreaks?: boolean }) {
  const { copy } = useSiteEditor()
  const value = copy(page, id, fallback)
  const explicitLines = lineBreaks !== false && value !== fallback
  return <FormattedCopy page={page} id={id} text={value} lineBreaks={explicitLines}>{explicitLines ? <CopyLines text={value} /> : value}</FormattedCopy>
}

export function CopyLines({ text }: { text: string }) {
  return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 ? <br /> : null}{line}</Fragment>)}</>
}
