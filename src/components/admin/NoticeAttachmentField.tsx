import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import {
  createNoticeAttachmentPath, getNoticeAttachmentError, getNoticeAttachmentName,
  noticeAttachmentAccept, noticeAttachmentLimit, noticeAttachmentTypes,
} from '../../lib/noticeResources'
import { Button } from '../common/Button'

type NoticeAttachmentFieldProps = {
  disabled: boolean
  id: string
  paths: string[]
  onChange: (paths: string[]) => void
  onStage: (path: string, file: File) => void
  onUnstage: (path: string) => void
  onDiscardStaged: () => void
}

export function NoticeAttachmentField({ disabled, id, paths, onChange, onStage, onUnstage, onDiscardStaged }: NoticeAttachmentFieldProps) {
  const [error, setError] = useState('')
  useEffect(() => onDiscardStaged, [onDiscardStaged])

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (files.length === 0) return
    if (paths.length + files.length > noticeAttachmentLimit) {
      setError(`첨부 파일은 최대 ${noticeAttachmentLimit}개까지 추가할 수 있습니다.`)
      return
    }

    const invalid = files.map(getNoticeAttachmentError).find(Boolean)
    if (invalid) {
      setError(invalid)
      return
    }

    const next = [...paths]
    for (const file of files) {
      const path = createNoticeAttachmentPath(file.name)
      if (!path) continue
      onStage(path, file)
      next.push(path)
    }
    setError('')
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-navy-deep" htmlFor={id}>첨부 파일</label>
      <p className="text-xs leading-5 text-text-muted" id={`${id}-help`}>
        {noticeAttachmentTypes} · 최대 {noticeAttachmentLimit}개 · 파일당 5MB 이하. 공지사항을 저장하면 첨부됩니다.
      </p>
      <input
        accept={noticeAttachmentAccept}
        aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
        aria-invalid={Boolean(error) || undefined}
        className="block min-h-11 w-full rounded-button border border-line-default p-2 text-sm text-navy-deep file:mr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-ink"
        disabled={disabled || paths.length >= noticeAttachmentLimit}
        id={id}
        multiple
        onChange={chooseFiles}
        type="file"
      />
      {error ? <p className="text-sm text-state-error" id={`${id}-error`} role="alert">{error}</p> : null}
      {paths.length ? <ul className="space-y-1">
        {paths.map(path => {
          const name = getNoticeAttachmentName(path)
          return <li className="flex items-center gap-3 rounded-button border border-line-default px-3" key={path}>
            <span className="min-w-0 flex-1 break-all text-sm">{name}</span>
            <Button
              aria-label={`${name} 첨부 제거`}
              disabled={disabled}
              onClick={() => {
                onUnstage(path)
                onChange(paths.filter(item => item !== path))
                setError('')
              }}
              showArrow={false}
              size="sm"
              variant="secondary"
            >제거</Button>
          </li>
        })}
      </ul> : null}
    </div>
  )
}
