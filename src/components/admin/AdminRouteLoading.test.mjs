import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
const app = await vite.ssrLoadModule('/src/App.tsx')
after(async () => { delete globalThis.window; await vite.close() })

test('admin route loading uses the quiet workspace without changing public loading markup', () => {
  assert.equal(typeof app.RouteFallback, 'function')
  globalThis.window = { location: { pathname: '/admin/editor' } }
  const admin = renderToStaticMarkup(React.createElement(app.RouteFallback))
  assert.ok(admin.includes('관리자 화면을 불러오고 있습니다'))
  assert.ok(!admin.includes('route-loading-screen__mark'), 'The public animated intro must not flash in CMS')
  globalThis.window.location.pathname = '/spirit'
  const publicMarkup = renderToStaticMarkup(React.createElement(app.RouteFallback))
  assert.ok(publicMarkup.includes('route-loading-screen route-loading-screen--public'))
  assert.ok(publicMarkup.includes('<span>S</span><span>M</span><span>Y</span><span>C</span>'))
  assert.ok(publicMarkup.includes('페이지를 준비하고 있습니다'))
})
