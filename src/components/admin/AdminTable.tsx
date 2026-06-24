import type { ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import type { CmsRecord } from '../../types/cms'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminErrorState } from './AdminErrorState'
import { AdminLoadingState } from './AdminLoadingState'

export type AdminTableColumn<TRow extends CmsRecord> = {
  header: string
  render?: (row: TRow) => ReactNode
  value?: Extract<keyof TRow, string>
}

type AdminTableProps<TRow extends CmsRecord> = {
  columns: Array<AdminTableColumn<TRow>>
  emptyMessage?: string
  error?: string | null
  isDeleting?: boolean
  loading?: boolean
  onDelete?: (row: TRow) => void
  onEdit?: (row: TRow) => void
  rows: TRow[]
}

function renderCell<TRow extends CmsRecord>(
  column: AdminTableColumn<TRow>,
  row: TRow,
) {
  if (column.render) {
    return column.render(row)
  }

  const value = column.value ? row[column.value] : null

  if (typeof value === 'boolean') {
    return value ? '예' : '아니오'
  }

  return value ?? '-'
}

function VisibilityBadge({ value }: { value?: boolean }) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center rounded-pill px-3 text-xs font-semibold',
        value
          ? 'bg-state-success/10 text-state-success'
          : 'bg-line-default text-text-muted',
      )}
    >
      {value ? '공개' : '비공개'}
    </span>
  )
}

export function AdminTable<TRow extends CmsRecord>({
  columns,
  emptyMessage,
  error,
  isDeleting = false,
  loading = false,
  onDelete,
  onEdit,
  rows,
}: AdminTableProps<TRow>) {
  if (loading) {
    return <AdminLoadingState />
  }

  if (error) {
    return <AdminErrorState description={error} />
  }

  if (rows.length === 0) {
    return <AdminEmptyState description={emptyMessage} />
  }

  return (
    <div>
      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-bg-ivory text-xs font-semibold text-text-muted">
              <tr>
                {columns.map((column) => (
                  <th className="px-4 py-3" key={column.header}>
                    {column.header}
                  </th>
                ))}
                <th className="px-4 py-3">공개</th>
                {(onEdit || onDelete) ? <th className="px-4 py-3">관리</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-default">
              {rows.map((row) => (
                <tr className="bg-bg-warm-white transition hover:bg-bg-ivory/70" key={row.id}>
                  {columns.map((column) => (
                    <td className="px-4 py-4 align-top" key={column.header}>
                      {renderCell(column, row)}
                    </td>
                  ))}
                  <td className="px-4 py-4 align-top">
                    <VisibilityBadge value={row.is_visible} />
                  </td>
                  {(onEdit || onDelete) ? (
                    <td className="px-4 py-4 align-top">
                      <div className="flex gap-2">
                        {onEdit ? (
                          <Button onClick={() => onEdit(row)} size="sm" variant="secondary">
                            수정
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            disabled={isDeleting}
                            onClick={() => onDelete(row)}
                            size="sm"
                            variant="ghost"
                          >
                            삭제
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <Card className="p-5" hoverable key={row.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <VisibilityBadge value={row.is_visible} />
              <div className="flex gap-2">
                {onEdit ? (
                  <Button onClick={() => onEdit(row)} size="sm" variant="secondary">
                    수정
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    disabled={isDeleting}
                    onClick={() => onDelete(row)}
                    size="sm"
                    variant="ghost"
                  >
                    삭제
                  </Button>
                ) : null}
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              {columns.map((column) => (
                <div key={column.header}>
                  <dt className="text-xs font-semibold text-text-muted">
                    {column.header}
                  </dt>
                  <dd className="mt-1 break-keep text-navy-deep">
                    {renderCell(column, row)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </div>
  )
}
