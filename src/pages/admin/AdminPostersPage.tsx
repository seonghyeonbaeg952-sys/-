import { useMemo } from 'react'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import { useConcertOptions } from '../../hooks/useConcertOptions'
import type { PosterRow } from '../../types/cms'

const columns = [
  {
    header: '포스터',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.title ?? '포스터'} 이미지`}
        src={row.image_url}
      />
    ),
  },
  { header: '제목', value: 'title' },
  { header: '공연 날짜', value: 'concert_date' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<PosterRow>>

export function AdminPostersPage() {
  const concertOptions = useConcertOptions()
  const fields = useMemo<Array<AdminFieldConfig<PosterRow>>>(() => [
    { name: 'title', label: '제목', type: 'text' },
    {
      name: 'image_url',
      label: '포스터 이미지',
      type: 'image',
      folder: 'posters',
      description: '포스터 이미지를 업로드하거나 외부 이미지 URL을 입력할 수 있습니다.',
    },
    { name: 'concert_date', label: '공연 날짜', type: 'date' },
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
      description="포스터 이미지, 관련 공연, 공개 여부를 관리합니다."
      emptyMessage="등록된 포스터가 없습니다."
      fields={fields}
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="포스터 제목 검색"
      table="posters"
      title="포스터 관리"
    />
  )
}
