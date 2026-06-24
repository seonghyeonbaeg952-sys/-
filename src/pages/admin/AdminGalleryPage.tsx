import { useMemo } from 'react'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import { useConcertOptions } from '../../hooks/useConcertOptions'
import type { GalleryRow } from '../../types/cms'

const columns = [
  {
    header: '이미지',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.title ?? '갤러리'} 이미지`}
        src={row.image_url}
      />
    ),
  },
  { header: '제목', value: 'title' },
  { header: '카테고리', value: 'category' },
  { header: '촬영일', value: 'taken_at' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<GalleryRow>>

export function AdminGalleryPage() {
  const concertOptions = useConcertOptions()
  const fields = useMemo<Array<AdminFieldConfig<GalleryRow>>>(
    () => [
      { name: 'title', label: '제목', type: 'text' },
      { name: 'category', label: '카테고리', type: 'text' },
      {
        name: 'image_url',
        label: '갤러리 이미지',
        type: 'image',
        folder: 'gallery',
        description:
          '갤러리 사진을 업로드하거나 외부 이미지 URL을 입력할 수 있습니다.',
      },
      { name: 'description', label: '설명', type: 'textarea', rows: 4 },
      { name: 'taken_at', label: '촬영일', type: 'date' },
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
    ],
    [concertOptions.error, concertOptions.isLoading, concertOptions.options],
  )

  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{ display_order: 0, is_visible: true }}
      description="갤러리 사진, 관련 공연, 공개 여부를 관리합니다."
      emptyMessage="등록된 갤러리 사진이 없습니다."
      fields={fields}
      info="관련 공연은 공연 관리에 등록된 목록에서 선택합니다. Supabase 연결 실패 시 직접 ID 입력으로 대체됩니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="갤러리 제목 검색"
      table="gallery"
      title="갤러리 관리"
    />
  )
}
