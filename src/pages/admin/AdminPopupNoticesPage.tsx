import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import { validatePopupNoticeFields } from '../../lib/popupNoticeDates'
import type { PopupNoticeRow } from '../../types/cms'

const fields = [
  { name: 'title', label: '팝업 제목', type: 'text', required: true, fullWidth: true, section: '팝업 내용' },
  { name: 'content', label: '팝업 내용', type: 'textarea', rows: 5, section: '팝업 내용' },
  {
    name: 'image_url',
    label: '팝업 이미지',
    type: 'image',
    folder: 'popups',
    section: '팝업 내용',
    description: '팝업 상단에 표시할 이미지를 업로드합니다. 없으면 텍스트 팝업으로 표시됩니다.',
  },
  { name: 'image_alt', label: '이미지 대체 텍스트', type: 'text', fullWidth: true, section: '팝업 내용' },
  { name: 'button_label', label: '버튼 문구', type: 'text', section: '연결 버튼' },
  {
    name: 'button_href',
    label: '버튼 링크',
    type: 'text',
    section: '연결 버튼',
    placeholder: '/notices 또는 https://...',
  },
  {
    name: 'starts_on',
    label: '노출 시작일',
    type: 'date',
    section: '노출 기간',
    description: '선택한 날짜부터 노출됩니다. 비워 두면 시작일 제한이 없습니다.',
  },
  {
    name: 'ends_on',
    label: '노출 종료일',
    type: 'date',
    section: '노출 기간',
    description: '시작일과 같거나 이후 날짜를 선택하세요. 해당 날짜까지 노출되며, 비워 두면 종료일 없이 공개됩니다.',
  },
  { name: 'display_order', label: '표시 순서', type: 'number', section: '표시 설정' },
  { name: 'is_visible', label: '공개 여부', type: 'switch', section: '표시 설정' },
] satisfies Array<AdminFieldConfig<PopupNoticeRow>>

const columns = [
  {
    header: '이미지',
    render: (row) => (
      <AdminImagePreview
        alt={row.image_alt || `${row.title} 팝업 이미지`}
        src={row.image_url}
      />
    ),
  },
  { header: '제목', value: 'title' },
  { header: '시작일', value: 'starts_on' },
  { header: '종료일', value: 'ends_on' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<PopupNoticeRow>>

export function AdminPopupNoticesPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        button_href: '',
        button_label: '',
        display_order: 0,
        ends_on: null,
        is_visible: true,
        starts_on: null,
      }}
      description="홈 접속 시 표시할 팝업 공지의 이미지, 문구, 버튼, 노출 기간을 관리합니다."
      emptyMessage="등록된 홈 팝업이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 공개 상태',
          column: 'is_visible',
          label: '공개 상태',
          options: [
            { label: '공개', value: 'true' },
            { label: '비공개', value: 'false' },
          ],
        },
      ]}
      info="홈 화면에는 공개 상태이고 노출 기간에 해당하는 팝업만 표시됩니다. 기간은 날짜 단위이며 시작일과 종료일을 모두 포함합니다. 방문자는 팝업을 닫거나 오늘 하루 보지 않기를 선택할 수 있습니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="팝업 제목 검색"
      table="popup_notices"
      title="홈 팝업 관리"
      validateFields={validatePopupNoticeFields}
      validatePayload={(payload) => Object.values(validatePopupNoticeFields(payload))[0] ?? null}
    />
  )
}
