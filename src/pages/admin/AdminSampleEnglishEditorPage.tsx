import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { Button } from '../../components/common/Button'
import { loadSampleEnglishResources, sampleEnglishPreviewPath } from '../../features/sample-language/sampleEnglishEditor'
import { AdminSiteEditorPage } from './AdminSiteEditorPage'

export function AdminSampleEnglishEditorPage() {
  const [params] = useSearchParams()
  const [resources, setResources] = useState<Awaited<ReturnType<typeof loadSampleEnglishResources>> | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      loadSampleEnglishResources().then(result => {
        if (active) setResources(result)
      }).catch(() => { if (active) setFailed(true) })
    })
    return () => { active = false }
  }, [attempt])

  const loadDefaults = useCallback(async () => {
    if (!resources) throw new Error('영어 버전의 기본 문구를 먼저 불러와 주세요.')
    return resources.defaults
  }, [resources])

  if (!resources) return <div className="site-editor">
    <AdminPageTitle title="영어 버전 변경" description="현재 공개 콘텐츠와 영문 기본 문구를 확인하고 있습니다." />
    {failed ? <div className="site-editor__error" role="alert">
      <p>영어 버전 변경에 사용할 문구를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.</p>
      <Button variant="secondary" onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>영문 편집 문구 다시 불러오기</Button>
    </div> : <p className="site-editor__empty" role="status">영문 기본 문구와 공개 콘텐츠를 불러오는 중입니다.</p>}
    <Button href={`/admin/editor${params.size ? `?${params}` : ''}`} variant="ghost">한글 원본 편집으로 이동</Button>
  </div>

  return <AdminSiteEditorPage storageScope="sample-english" copyDefinitions={resources.definitions}
    loadDefaults={loadDefaults} defaultsByDevice={resources.deviceDefaults} previewPathFor={sampleEnglishPreviewPath} />
}
