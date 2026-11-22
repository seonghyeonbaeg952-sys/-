const attachmentFormats = {
  pdf: 'application/pdf',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
} as const

type AttachmentFormat = keyof typeof attachmentFormats

export const noticeAttachmentLimit = 5
export const noticeAttachmentMaxBytes = 5 * 1024 * 1024
export const noticeAttachmentAccept = Object.keys(attachmentFormats).map(extension => `.${extension}`).join(',')
export const noticeAttachmentTypes = 'PDF, HWP, HWPX, DOCX, XLSX, PPTX, JPG, PNG'

const attachmentPathPattern = /^[a-f0-9-]{36}\/([A-Za-z0-9_-]{1,960})\.(pdf|hwp|hwpx|docx|xlsx|pptx|jpe?g|png)$/
const byteDecoder = new TextDecoder('utf-8', { fatal: true })

export function getNoticeExternalUrl(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!/^https?:\/\//i.test(text) || /[\s\\]/.test(text) || text.length > 2048) return null
  if ([...text].some(character => character.charCodeAt(0) < 32)) return null
  try {
    const url = new URL(text)
    return !url.hostname || url.username || url.password || url.href.length > 2048 ? null : url.href
  } catch {
    return null
  }
}

function getAttachmentFormat(name: string): AttachmentFormat | null {
  const extension = name.split('.').at(-1)?.toLowerCase() ?? ''
  return name.includes('.') && Object.hasOwn(attachmentFormats, extension)
    ? extension as AttachmentFormat
    : null
}

function safeFileStem(name: string) {
  return [...name.normalize('NFC')].filter(character => {
    const code = character.codePointAt(0) ?? 0
    return code >= 32 && code !== 127 && !(code >= 0x202a && code <= 0x202e) && !(code >= 0x2066 && code <= 0x2069)
  }).join('').replace(/[\\/:*?"<>|]/g, '-').trim().replace(/^\.+/, '').slice(0, 160).trim()
}

export function createNoticeAttachmentPath(name: string) {
  const format = getAttachmentFormat(name)
  if (!format) return null
  const stem = safeFileStem(name.slice(0, name.lastIndexOf('.'))) || 'attachment'
  const bytes = new TextEncoder().encode(stem)
  const encoded = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  return `${crypto.randomUUID()}/${encoded}.${format}`
}

export function getNoticeAttachmentName(path: string) {
  const match = attachmentPathPattern.exec(path)
  if (!match) return null
  try {
    const encoded = match[1].replaceAll('-', '+').replaceAll('_', '/')
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
    const stem = safeFileStem(byteDecoder.decode(bytes))
    return stem ? `${stem}.${match[2]}` : null
  } catch {
    return null
  }
}

export function getNoticeAttachmentPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((path): path is string => typeof path === 'string' && Boolean(getNoticeAttachmentName(path))))]
    .slice(0, noticeAttachmentLimit)
}

export function getNoticeAttachmentError(file: File) {
  if (!getAttachmentFormat(file.name)) return `${noticeAttachmentTypes} 파일만 첨부할 수 있습니다.`
  if (file.size === 0) return '빈 파일은 첨부할 수 없습니다.'
  if (file.size > noticeAttachmentMaxBytes) return '파일 한 개의 크기는 5MB 이하여야 합니다.'
  return null
}

const fileSignatures = {
  pdf: [37, 80, 68, 70, 45],
  hwp: [208, 207, 17, 224, 161, 177, 26, 225],
  zip: [80, 75, 3, 4],
  jpeg: [255, 216, 255],
  png: [137, 80, 78, 71, 13, 10, 26, 10],
}

export async function readNoticeAttachmentType(file: File) {
  const format = getAttachmentFormat(file.name)
  if (!format || getNoticeAttachmentError(file)) return null
  const signature = format === 'jpg' ? fileSignatures.jpeg
    : format in fileSignatures ? fileSignatures[format as keyof typeof fileSignatures] : fileSignatures.zip
  const header = new Uint8Array(await file.slice(0, signature.length).arrayBuffer())
  return signature.every((byte, index) => byte === header[index]) ? attachmentFormats[format] : null
}
