import type { SiteEditorRevision } from '../../../types/siteEditor'
import { Button } from '../../common/Button'
import { formatEditorTime } from './editorUiOptions'

type Props = {
  revisions: SiteEditorRevision[]
  loading: boolean
  error: string | null
  disabled: boolean
  onReload: () => void
  onRestore: (revision: SiteEditorRevision) => void
}

export function EditorPublishHistory({ revisions, loading, error, disabled, onReload, onRestore }: Props) {
  return <section className="site-editor__history" aria-label="게시 이력">
    <div className="site-editor__section-heading"><h2>이전 게시본 불러오기</h2><Button size="sm" variant="secondary" disabled={loading} onClick={onReload}>이력 새로고침</Button></div>
    <p className="site-editor__help">이 편집기의 문구와 디자인만 초안으로 복원합니다. 공연·인물·입단·후원 원문은 바뀌지 않으며, 다시 게시하기 전에는 공개 화면도 바뀌지 않습니다.</p>
    {loading ? <p role="status">게시 이력을 불러오는 중입니다.</p> : error ? <p role="alert" className="site-editor__error">{error}</p> : revisions.length === 0 ? <p className="site-editor__empty">아직 이 편집기에서 게시한 이력이 없습니다.</p> : <ol className="site-editor__revision-list">{revisions.map((revision) => <li key={revision.id}><span><strong>{formatEditorTime(revision.published_at)}</strong><span className="site-editor__help">게시된 문구·디자인 설정</span></span><Button variant="secondary" size="sm" disabled={disabled} onClick={() => onRestore(revision)}>초안으로 불러오기</Button></li>)}</ol>}
  </section>
}
