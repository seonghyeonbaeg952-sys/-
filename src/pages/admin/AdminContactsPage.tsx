import { useEffect, useState } from 'react'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { getCurrentUser } from '../../lib/auth'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, ContactRow, ContactStatus } from '../../types/cms'

const typeOptions = [
  { label: '입단 문의', value: 'join' },
  { label: '공연 섭외', value: 'concert_request' },
  { label: '후원 문의', value: 'support' },
  { label: '일반 문의', value: 'general' },
  { label: '기타', value: 'other' },
]

const statusOptions = [
  { label: '새 문의', value: 'new' },
  { label: '확인 중', value: 'reviewing' },
  { label: '답변 완료', value: 'answered' },
  { label: '보류', value: 'on_hold' },
  { label: '보관', value: 'archived' },
]

const fields = [
  { name: 'name', label: '이름', type: 'text', readOnly: true },
  { name: 'email', label: '이메일', type: 'email', readOnly: true },
  { name: 'phone', label: '전화번호', type: 'text', readOnly: true },
  { name: 'type', label: '문의 유형', type: 'select', options: typeOptions, readOnly: true },
  { name: 'title', label: '제목', type: 'text', readOnly: true },
  { name: 'message', label: '문의 내용', type: 'textarea', rows: 8, readOnly: true },
  { name: 'privacy_agreed', label: '개인정보 동의', type: 'switch' },
  {
    name: 'admin_note',
    label: '관리자 메모',
    placeholder: '내부 확인 내용이나 처리 메모를 입력하세요.',
    rows: 4,
    type: 'textarea',
  },
  {
    description: '자동 이메일 발송은 연결되어 있지 않습니다. 저장 후 답변 내용을 복사해 직접 이메일로 회신해 주세요.',
    name: 'admin_reply',
    label: '답변 내용',
    placeholder: '문의자에게 보낼 답변 내용을 입력하세요.',
    rows: 7,
    type: 'textarea',
  },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
] satisfies Array<AdminFieldConfig<ContactRow>>

const statusLabels: Record<ContactStatus, string> = {
  answered: '답변 완료',
  archived: '보관',
  done: '답변 완료',
  in_progress: '확인 중',
  new: '새 문의',
  on_hold: '보류',
  reviewing: '확인 중',
}

function getStatusLabel(status: string | null | undefined) {
  return statusLabels[status as ContactStatus] ?? '상태 확인 필요'
}

function getTypeLabel(type: string | null | undefined) {
  return typeOptions.find((option) => option.value === type)?.label ?? '기타'
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getAdminDisplayName(
  adminId: string | null | undefined,
  currentUserId: string | null,
  currentUserEmail: string | null,
) {
  if (!adminId) {
    return null
  }

  if (adminId === currentUserId && currentUserEmail) {
    return currentUserEmail
  }

  return '관리자'
}

function normalizeStatus(status: string | null | undefined): ContactStatus {
  if (status === 'in_progress') {
    return 'reviewing'
  }

  if (status === 'done') {
    return 'answered'
  }

  if (
    status === 'new' ||
    status === 'reviewing' ||
    status === 'answered' ||
    status === 'on_hold' ||
    status === 'archived'
  ) {
    return status
  }

  return 'reviewing'
}

function prepareInitialData(row: ContactRow) {
  return {
    ...row,
    status: normalizeStatus(row.status),
  }
}

function createContactPayload(
  payload: CmsMutationPayload,
  row: ContactRow | null,
  userId: string | null,
) {
  const status = normalizeStatus(
    typeof payload.status === 'string' ? payload.status : row?.status,
  )
  const adminReply =
    typeof payload.admin_reply === 'string' ? payload.admin_reply.trim() : ''
  const previousReply = row?.admin_reply?.trim() ?? ''
  const shouldMarkReplied = status === 'answered' && adminReply.length > 0
  const replyChanged = adminReply !== previousReply

  return {
    admin_note:
      typeof payload.admin_note === 'string' ? payload.admin_note.trim() : null,
    admin_reply: adminReply || null,
    privacy_agreed: payload.privacy_agreed,
    replied_at: shouldMarkReplied
      ? replyChanged || !row?.replied_at
        ? new Date().toISOString()
        : row.replied_at
      : null,
    replied_by: shouldMarkReplied ? userId ?? row?.replied_by ?? null : null,
    status,
  } satisfies CmsMutationPayload
}

function validateContactPayload(payload: CmsMutationPayload) {
  const status = typeof payload.status === 'string' ? payload.status : ''
  const reply = typeof payload.admin_reply === 'string' ? payload.admin_reply : ''

  if (status === 'answered' && !reply.trim()) {
    return '답변 완료로 처리하려면 답변 내용을 입력해 주세요. 자동 이메일은 발송되지 않습니다.'
  }

  return null
}

function ContactReplyMeta({
  currentUserEmail,
  currentUserId,
  row,
}: {
  currentUserEmail: string | null
  currentUserId: string | null
  row: ContactRow
}) {
  const repliedAt = formatDateTime(row.replied_at)
  const repliedBy = getAdminDisplayName(
    row.replied_by,
    currentUserId,
    currentUserEmail,
  )

  return (
    <section className="rounded-formal border border-line-default bg-bg-warm-white p-5">
      <h3 className="text-sm font-semibold text-navy-deep">답변 저장 정보</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-text-muted">답변 저장 시간</dt>
          <dd className="mt-1 text-navy-deep">
            {repliedAt ?? '아직 답변 저장 전'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-text-muted">답변자</dt>
          <dd className="mt-1 text-navy-deep">
            {repliedBy ?? '아직 답변 저장 전'}
          </dd>
        </div>
      </dl>
    </section>
  )
}

const columns = [
  { header: '제목', value: 'title' },
  { header: '이름', value: 'name' },
  { header: '이메일', value: 'email' },
  {
    header: '유형',
    render: (row) => getTypeLabel(row.type),
  },
  {
    header: '상태',
    render: (row) => getStatusLabel(row.status),
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<ContactRow>>

export function AdminContactsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      const result = await getCurrentUser()

      if (isMounted) {
        setCurrentUserId(result.data?.id ?? null)
        setCurrentUserEmail(result.data?.email ?? null)
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="방문자가 남긴 문의를 확인하고 관리자 메모, 답변, 처리 상태를 관리합니다."
      emptyMessage="접수된 문의가 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 유형',
          column: 'type',
          label: '문의 유형',
          options: typeOptions,
        },
        {
          allLabel: '전체 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
      ]}
      info={
        '문의 내용과 관리자 메모, 답변은 관리자 화면에서만 조회합니다. public 화면에는 표시하지 않습니다.\n현재 자동 이메일 발송은 연결되어 있지 않습니다. 저장된 답변 내용을 복사해 문의자의 이메일로 직접 회신해 주세요.'
      }
      order={{ column: 'created_at', ascending: false }}
      prepareInitialData={prepareInitialData}
      preparePayload={(payload, row) =>
        createContactPayload(payload, row, currentUserId)
      }
      renderBeforeForm={(row) => (
        <ContactReplyMeta
          currentUserEmail={currentUserEmail}
          currentUserId={currentUserId}
          row={row}
        />
      )}
      searchColumn="title"
      searchPlaceholder="문의 제목 검색"
      showVisibility={false}
      table="contacts"
      title="문의 관리"
      validatePayload={validateContactPayload}
    />
  )
}
