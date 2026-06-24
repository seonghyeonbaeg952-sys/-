import type { ReactNode } from 'react'

import { EmptyState } from '../common/EmptyState'

type AdminEmptyStateProps = {
  action?: ReactNode
  description?: string
  title?: string
}

export function AdminEmptyState({
  action,
  description = '조건에 맞는 데이터가 없습니다.',
  title = '등록된 항목이 없습니다',
}: AdminEmptyStateProps) {
  return <EmptyState action={action} description={description} title={title} />
}
