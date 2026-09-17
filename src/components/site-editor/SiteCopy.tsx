import type { EditorPageId } from '../../types/siteEditor'
import { useSiteEditor } from './useSiteEditor'
import { Fragment } from 'react'
import { FormattedCopy } from './FormattedCopy'

export function SiteCopy({ page, id, fallback }: { page: EditorPageId; id: string; fallback: string }) {
  const { copy } = useSiteEditor()
  const value = copy(page, id, fallback)
  return <FormattedCopy page={page} id={id} text={value} lineBreaks={value !== fallback}>{value === fallback ? fallback : <CopyLines text={value} />}</FormattedCopy>
}

export function CopyLines({ text }: { text: string }) {
  return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 ? <br /> : null}{line}</Fragment>)}</>
}
