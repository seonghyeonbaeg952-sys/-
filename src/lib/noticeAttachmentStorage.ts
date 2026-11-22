import { getSupabaseClientSafe } from './auth'
import { getNoticeAttachmentName, readNoticeAttachmentType } from './noticeResources'

const bucket = 'notice-attachments'

export async function uploadNoticeAttachment(path: string, file: File) {
  const name = getNoticeAttachmentName(path)
  const contentType = name && await readNoticeAttachmentType(file)
  if (!contentType) {
    throw new Error(`“${file.name}”의 파일 형식을 확인할 수 없습니다. 원본 파일을 다시 선택해 주세요.`)
  }

  const client = getSupabaseClientSafe()
  if (!client.data) throw new Error('첨부 파일 저장소에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
  const { error } = await client.data.storage.from(bucket).upload(path, file, { contentType, upsert: false })
  if (error) {
    // The path is generated for this held File. A retry can receive a
    // duplicate response if the previous network request already completed.
    if (error.statusCode === '409') return
    throw new Error(`“${name}” 업로드에 실패했습니다. 네트워크 연결과 관리자 로그인 상태를 확인한 뒤 다시 시도해 주세요.`)
  }
}

export async function downloadNoticeAttachment(path: string) {
  const name = getNoticeAttachmentName(path)
  const client = getSupabaseClientSafe()
  if (!name || !client.data) return false

  const { data, error } = await client.data.storage.from(bucket).download(path)
  if (error || !data) return false

  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
