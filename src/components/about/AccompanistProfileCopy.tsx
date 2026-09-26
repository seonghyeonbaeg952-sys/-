import { accompanistCopyRuns, accompanistProfileCopyKey, getAccompanistCopyDefinition, type AccompanistCopyKind } from '../../lib/accompanistProfileCopy'
import { FormattedCopy } from '../site-editor/FormattedCopy'
import { CopyLines, SiteCopy } from '../site-editor/SiteCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'

export function AccompanistProfileCopy({ profileId, kind }: { profileId: string; kind: AccompanistCopyKind }) {
  const { copy, documents, device } = useSiteEditor()
  const key = accompanistProfileCopyKey(profileId, kind), spec = getAccompanistCopyDefinition(key)
  if (!spec) return <SiteCopy page="accompanist" id={key} fallback={kind === 'role' ? 'ACCOMPANIST' : kind === 'roleEn' ? 'Piano Accompanist' : 'CURRENT'} />
  const fallback = copy('accompanist', spec.legacyKey, spec.defaultValue)
  const text = copy('accompanist', key, fallback)
  return <FormattedCopy page="accompanist" id={key} text={text} lineBreaks inheritedRuns={accompanistCopyRuns(documents.accompanist, device, key, text)}><CopyLines text={text} /></FormattedCopy>
}
