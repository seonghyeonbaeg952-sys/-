import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [previewSource, legacySource] = await Promise.all([
  read('./GalleryPreview.tsx'),
  read('./ArchivePageStackLegacy.tsx'),
])

test('기록 모션은 데스크톱에서만 렌더링한다', () => {
  assert.match(previewSource, /const desktopArchiveQuery = '\(min-width: 1024px\)'/)
  assert.match(previewSource, /isDesktop \? \(/)
  assert.match(previewSource, /<ArchivePageStack \{\.\.\.archiveProps\} \/>/)
  assert.match(previewSource, /<ArchivePageStackLegacy \{\.\.\.archiveProps\} \/>/)
})

test('모바일·태블릿 원본 기록 섹션에는 현상 시작 버튼을 표시하지 않는다', () => {
  assert.match(legacySource, /className="archive-preview-layout mt-9"/)
  assert.match(legacySource, /className="archive-l-folder"/)
  assert.match(legacySource, /<Button href="\/gallery" variant="secondary">/)
  assert.doesNotMatch(legacySource, /archive-inline-toggle/)
  assert.doesNotMatch(legacySource, /기록 현상하기/)
})
