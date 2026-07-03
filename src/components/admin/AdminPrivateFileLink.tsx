import { useState } from 'react'

import { Button } from '../common/Button'

type AdminPrivateFileLinkProps = {
  label: string
  path?: string | null
}

export function AdminPrivateFileLink({ label, path }: AdminPrivateFileLinkProps) {
  const [copied, setCopied] = useState(false)

  if (!path) {
    return <span className="text-sm text-text-muted">첨부 없음</span>
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(path)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button onClick={handleCopy} size="sm" variant="secondary">
      {copied ? '경로 복사됨' : label}
    </Button>
  )
}
