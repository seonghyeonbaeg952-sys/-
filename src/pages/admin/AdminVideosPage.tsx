import { useMemo } from 'react'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import { useConcertOptions } from '../../hooks/useConcertOptions'
import type { CmsMutationPayload, VideoRow } from '../../types/cms'
import { extractYouTubeId } from '../../utils/youtube'

const columns = [
  { header: '제목', value: 'title' },
  { header: 'YouTube ID', value: 'youtube_id' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<VideoRow>>

function preparePayload(payload: CmsMutationPayload) {
  const youtubeUrl =
    typeof payload.youtube_url === 'string' ? payload.youtube_url : ''
  const extractedId = extractYouTubeId(youtubeUrl)

  return {
    ...payload,
    youtube_id:
      extractedId ||
      (typeof payload.youtube_id === 'string' ? payload.youtube_id : null),
  }
}

export function AdminVideosPage() {
  const concertOptions = useConcertOptions()
  const fields = useMemo<Array<AdminFieldConfig<VideoRow>>>(() => [
    { name: 'title', label: '제목', type: 'text', required: true },
    { name: 'youtube_url', label: 'YouTube URL', type: 'url' },
    {
      name: 'youtube_id',
      label: 'YouTube ID',
      type: 'text',
      description: 'URL 입력 시 저장 과정에서 자동 추출됩니다.',
    },
    { name: 'description', label: '설명', type: 'textarea', rows: 4 },
    concertOptions.error
      ? {
          name: 'related_concert_id',
          label: '관련 공연 ID',
          type: 'text',
          description: `공연 목록을 불러오지 못해 직접 ID 입력으로 표시합니다. ${concertOptions.error}`,
        }
      : {
          name: 'related_concert_id',
          label: '관련 공연',
          type: 'select',
          options: concertOptions.options,
          readOnly: concertOptions.isLoading,
          description: concertOptions.isLoading
            ? '공연 목록을 불러오는 중입니다.'
            : '공연 관리에 등록된 공연과 연결합니다.',
        },
    { name: 'display_order', label: '표시 순서', type: 'number' },
    { name: 'is_visible', label: '공개 여부', type: 'switch' },
  ], [concertOptions.error, concertOptions.isLoading, concertOptions.options])

  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{ display_order: 0, is_visible: true }}
      description="공연 영상 링크와 공개 여부를 관리합니다."
      emptyMessage="등록된 영상이 없습니다."
      fields={fields}
      order={{ column: 'display_order', ascending: true }}
      preparePayload={preparePayload}
      searchColumn="title"
      searchPlaceholder="영상 제목 검색"
      table="videos"
      title="영상 관리"
    />
  )
}
