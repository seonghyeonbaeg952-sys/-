import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-home-preview-mode-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const mode = await vite.ssrLoadModule('/src/lib/homePreviewMode.ts').catch(() => ({}))
after(() => vite.close())

function options(context) {
  assert.equal(typeof mode.getHomePreviewAuthOptions, 'function', 'preview auth isolation must be implemented')
  return mode.getHomePreviewAuthOptions(context)
}

test('embedded marked public home cannot persist or refresh an administrator session', () => {
  assert.deepEqual(options({ pathname: '/', search: '?home-cms-preview=1', isEmbedded: true }), {
    autoRefreshToken: false, detectSessionInUrl: false, persistSession: false,
  })
})

test('a top-level preview flag does not alter normal authentication', () => {
  assert.deepEqual(options({ pathname: '/', search: '?home-cms-preview=1', isEmbedded: false }), {
    autoRefreshToken: true, detectSessionInUrl: true, persistSession: true,
  })
})

test('admin paths never receive preview auth options, including marked iframes', () => {
  for (const pathname of ['/admin', '/admin/site-texts', '/admin/login']) {
    assert.deepEqual(options({ pathname, search: '?home-cms-preview=1', isEmbedded: true }), {
      autoRefreshToken: true, detectSessionInUrl: true, persistSession: true,
    })
  }
})

test('unmarked or incorrectly marked child frames keep existing authentication options', () => {
  for (const search of ['', '?home-cms-preview=0', '?home-cms-preview=true', '?other=1']) {
    assert.deepEqual(options({ pathname: '/', search, isEmbedded: true }), {
      autoRefreshToken: true, detectSessionInUrl: true, persistSession: true,
    })
  }
})

test('non-home routes and server evaluation preserve default auth behavior', () => {
  assert.deepEqual(options({ pathname: '/join', search: '?home-cms-preview=1', isEmbedded: true }), {
    autoRefreshToken: true, detectSessionInUrl: true, persistSession: true,
  })
  assert.deepEqual(options(undefined), {
    autoRefreshToken: true, detectSessionInUrl: true, persistSession: true,
  })
})

test('all allowed editor preview routes disable session persistence without changing admin auth', () => {
  const search = '?site-editor-preview=ec50cd93-7e23-4428-a4d6-9688109cd605'
  for (const pathname of ['/', '/join', '/contact', '/about', '/gallery', '/concerts/id']) {
    assert.deepEqual(options({ pathname, search, isEmbedded: true }), { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false })
  }
  assert.deepEqual(options({ pathname: '/admin', search, isEmbedded: true }), { autoRefreshToken: true, detectSessionInUrl: true, persistSession: true })
})
