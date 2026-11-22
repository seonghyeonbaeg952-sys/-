import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('./noticeResources.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const {
  createNoticeAttachmentPath, getNoticeAttachmentName, getNoticeAttachmentPaths,
  getNoticeExternalUrl, getNoticeAttachmentError, readNoticeAttachmentType,
  noticeAttachmentMaxBytes,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('notice links accept absolute web addresses only and reject credentials or backslashes', () => {
  assert.equal(getNoticeExternalUrl(' https://example.com/recruitment?month=11#details '), 'https://example.com/recruitment?month=11#details')
  assert.equal(getNoticeExternalUrl('HTTP://example.com'), 'http://example.com/')
  for (const value of [null, '/notice', '//example.com', 'https:example.com', 'javascript:alert(1)', 'data:text/html,payload', ' https://user:password@example.com/', 'https://site.test\\x', 'https://site.test/bad url', 'https://site.test/' + 'x'.repeat(2080)]) {
    assert.equal(getNoticeExternalUrl(value), null, String(value))
  }
})

test('attachment paths retain readable Korean filenames without storing unsafe key characters', () => {
  const path = createNoticeAttachmentPath('입단 신청 안내 (공개).PDF')
  assert.match(path, /^[a-f0-9-]{36}\/[A-Za-z0-9_-]+\.pdf$/)
  assert.equal(getNoticeAttachmentName(path), '입단 신청 안내 (공개).pdf')
  assert.equal(getNoticeAttachmentName(createNoticeAttachmentPath('a/..\\b.png')), 'a-..-b.png')
  assert.deepEqual(getNoticeAttachmentPaths([path, path, '../file.pdf', 'javascript:bogus', null]), [path])
  assert.deepEqual(getNoticeAttachmentPaths(Array.from({ length: 6 }, (_, index) => createNoticeAttachmentPath(`첨부${index}.pdf`))).length, 5)
})

test('attachment validation checks the document signature and upload limit', async () => {
  assert.equal(await readNoticeAttachmentType(new File(['%PDF-1.4'], '공지.pdf')), 'application/pdf')
  assert.equal(await readNoticeAttachmentType(new File(['<html>'], '악성.pdf', { type: 'application/pdf' })), null)
  assert.equal(await readNoticeAttachmentType(new File([new Uint8Array([80, 75, 3, 4])], '안내.hwpx')), 'application/hwp+zip')
  assert.match(getNoticeAttachmentError(new File(['text'], 'sample.html')), /파일만 첨부/)
  assert.match(getNoticeAttachmentError(new File([], 'empty.pdf')), /빈 파일/)
  assert.match(getNoticeAttachmentError(new File([new Uint8Array(noticeAttachmentMaxBytes + 1)], 'large.pdf')), /5MB/)
})
