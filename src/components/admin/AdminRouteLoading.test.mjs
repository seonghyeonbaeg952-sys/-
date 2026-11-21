import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
const app = await vite.ssrLoadModule('/src/App.tsx')
after(async () => { delete globalThis.window; await vite.close() })

test('admin route loading uses the quiet workspace and public loading uses a static mark with a spinner', () => {
  assert.equal(typeof app.RouteFallback, 'function')
  globalThis.window = { location: { pathname: '/admin/editor' } }
  const admin = renderToStaticMarkup(React.createElement(app.RouteFallback))
  assert.ok(admin.includes('관리자 화면을 불러오고 있습니다'))
  assert.doesNotMatch(admin, /route-loading-screen__(?:mark|spinner)/)
  globalThis.window.location.pathname = '/spirit'
  const publicMarkup = renderToStaticMarkup(React.createElement(app.RouteFallback))
  assert.ok(publicMarkup.includes('route-loading-screen route-loading-screen--public'))
  assert.match(publicMarkup, /class="route-loading-screen__mark">SMYC</)
  assert.match(publicMarkup, /aria-hidden="true" class="route-loading-screen__spinner"/)
  assert.ok(publicMarkup.includes('페이지를 준비하고 있습니다'))
})

test('only the compact ring rotates and respects reduced motion on every public route', async () => {
  const [shell, home] = await Promise.all(['shared-shell-fixes.css', 'home-v6-fixes.css'].map(
    file => readFile(new URL(`../../styles/${file}`, import.meta.url), 'utf8'),
  ))
  assert.doesNotMatch(shell + home, /@keyframes route-loading-(?:letter|line)/)
  assert.match(shell, /\.route-loading-screen__spinner\s*\{[^}]*inline-size: 1rem;[^}]*animation: route-loading-spin/)
  assert.match(shell, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.route-loading-screen__spinner\s*\{\s*animation: none;/)
})
