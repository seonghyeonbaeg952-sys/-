import { useRef, useState } from 'react'

import { downloadNoticeAttachment } from '../../lib/noticeAttachmentStorage'
import { getNoticeAttachmentName } from '../../lib/noticeResources'
import type { Notice } from '../../types/content'

type NoticeResourcesProps = {
  english: boolean
  notice: Notice
}

export function NoticeResources({ english, notice }: NoticeResourcesProps) {
  const downloadLock = useRef(false)
  const [downloading, setDownloading] = useState('')
  const [downloadError, setDownloadError] = useState('')

  if (!notice.external_url && !notice.attachments?.length) return null

  async function download(path: string) {
    if (downloadLock.current) return
    downloadLock.current = true
    setDownloading(path)
    setDownloadError('')
    try {
      if (!await downloadNoticeAttachment(path)) setDownloadError(path)
    } catch {
      setDownloadError(path)
    } finally {
      downloadLock.current = false
      setDownloading('')
    }
  }

  return (
    <section aria-label={english ? 'Notice links and attachments' : '공지 링크와 첨부 파일'} className="notices-page__resources">
      {notice.external_url ? <a className="notices-page__action" href={notice.external_url} rel="noopener noreferrer" target="_blank">
        {english ? 'Open related link' : '관련 링크 열기'} <span aria-hidden="true">↗</span>
        <span className="sr-only">{english ? ' (opens in a new tab)' : ' (새 탭에서 열림)'}</span>
      </a> : null}
      {notice.attachments?.length ? <div className="notices-page__attachments">
        <h2>{english ? 'Attachments' : '첨부 파일'}</h2>
        <ul>
          {notice.attachments.map(path => <li key={path}>
            <button
              aria-disabled={Boolean(downloading)}
              className="notices-page__attachment"
              onClick={() => { void download(path) }}
              type="button"
            >
              <span>{getNoticeAttachmentName(path)}</span>
              <span>{downloading === path ? (english ? 'Downloading…' : '다운로드 중…') : (english ? 'Download' : '다운로드')} <span aria-hidden="true">↓</span></span>
            </button>
            {downloadError === path ? <p className="notices-page__attachment-error" role="alert">
              {english ? 'The file could not be downloaded. Try again.' : '파일을 다운로드하지 못했습니다. 다시 눌러 주세요.'}
            </p> : null}
          </li>)}
        </ul>
      </div> : null}
    </section>
  )
}
