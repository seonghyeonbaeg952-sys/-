import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', configFile: false, plugins: [react()], logLevel: 'silent', server: { middlewareMode: true } })
const { JoinOpenScoreCTA } = await vite.ssrLoadModule('/src/components/home/JoinOpenScoreCTA.tsx')
after(() => vite.close())

test('CMS recruitment target reaches the responsive home fact', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(JoinOpenScoreCTA, { presentation: 'figma-open-score', joinInfo: { target: '초등 고학년\n중학생' } })))
  assert.match(html, /초등 고학년 · 중학생/)
  // Desktop keeps the current reference group wording.
  assert.match(html, /유소년반 · 청소년반 · 대학부/)
})
