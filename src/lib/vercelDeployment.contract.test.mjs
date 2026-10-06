import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const configPath = fileURLToPath(new URL('../../vercel.json', import.meta.url))

test('explicit Vite build settings target the existing SPA output', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  assert.equal(config.framework, 'vite')
  assert.equal(config.buildCommand, 'pnpm build')
  assert.equal(config.outputDirectory, 'dist')
})

test('pinned runtime and frozen installer use one supported package manager version', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  assert.equal(manifest.engines?.node, '24.x')
  assert.equal(manifest.packageManager, 'pnpm@10.32.1')
  assert.equal(config.installCommand, 'npx --yes pnpm@10.32.1 install --frozen-lockfile')
})

test('only main triggers automatic deployment after production release approval', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  assert.equal(config.git?.deploymentEnabled?.main, true)
  assert.equal(config.git?.deploymentEnabled?.['**'], false)
})

test('Vercel serves the Vite entry point for public, sample, and admin deep links', () => {
  assert.ok(existsSync(configPath), 'Vercel SPA routing configuration is missing')

  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const rewrite = config.rewrites?.find(({ source }) =>
    ['/spirit', '/join', '/sample/spirit', '/admin/login'].every((path) =>
      new RegExp(`^${source}$`).test(path),
    ),
  )

  assert.ok(rewrite, 'Vercel must route public, sample, and admin deep links')
  assert.equal(rewrite.destination, '/index.html')
})

function headersFor(path) {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  return Object.fromEntries((config.headers ?? []).filter(rule => new RegExp(`^${rule.source}$`).test(path))
    .flatMap(rule => rule.headers.map(({ key, value }) => [key.toLowerCase(), value])))
}

test('search exposure remains on hold for pages and site-hosted media', () => {
  for (const path of ['/', '/spirit', '/about', '/about?section=members', '/join', '/contact', '/admin/login', '/images/brand/smyc-symbol-vector.svg']) {
    assert.equal(headersFor(path)['x-robots-tag'], 'noindex', path)
  }
})

test('Vercel aliases redirect to the owned domain without redirecting the domain or local CMS', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const aliases = ['motet-homepage.vercel.app', 'motet-homepage-peach10.vercel.app', 'motet-homepage-git-main-peach10.vercel.app', 'motet-homepage-b3gn7s8rm-peach10.vercel.app']
  const redirect = config.redirects?.find(rule => rule.has?.some(condition =>
    condition.type === 'host' && aliases.every(host => new RegExp(`^${condition.value}$`).test(host))))
  assert.ok(redirect, 'Every Vercel alias must resolve to the owned domain')
  assert.equal(redirect.source, '/:path*')
  assert.equal(redirect.destination, 'https://seoulmotetyouthchoir.com/:path*')
  assert.equal(redirect.permanent, true)
  const hostCondition = redirect.has.find(condition => condition.type === 'host')
  for (const host of ['seoulmotetyouthchoir.com', 'www.seoulmotetyouthchoir.com', '127.0.0.1', 'localhost', 'motet-homepage.vercel.app.example.com']) {
    assert.equal(new RegExp(`^${hostCondition.value}$`).test(host), false, host)
  }
})

test('all entry routes restrict framing to the same origin without disabling CMS previews', () => {
  for (const path of ['/', '/spirit', '/admin/editor', '/admin/editor-english', '/assets/app.js']) {
    const headers = headersFor(path)
    const directives = Object.fromEntries((headers['content-security-policy'] ?? '').split(';')
      .map(part => part.trim().split(/\s+/)).filter(([name]) => name).map(([name, ...values]) => [name, values]))
    assert.deepEqual(directives['frame-ancestors'], ["'self'"], path)
    assert.equal(headers['x-frame-options'], 'SAMEORIGIN', path)
    assert.deepEqual(directives['base-uri'], ["'self'"])
    assert.deepEqual(directives['object-src'], ["'none'"])
    assert.deepEqual(directives['form-action'], ["'self'"])
    assert.equal(directives['script-src'], undefined, 'CMS inline formatting and media code must remain compatible')
    assert.equal(directives['frame-src'], undefined, 'map and video embeds are a separate outbound policy')
  }
})

test('responses disable content sniffing and do not expose URL paths to cross-origin sites', () => {
  const headers = headersFor('/contact')
  assert.equal(headers['x-content-type-options'], 'nosniff')
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin')
})

test('the actual Vite server delivers the security policy and maps keep an origin-only referrer', async () => {
  const vite = await createServer({ logLevel: 'silent', server: { host: '127.0.0.1', port: 0, strictPort: false } })
  try {
    await vite.listen()
    for (const path of ['', 'admin/login', 'spirit', 'about?section=members', 'join', 'contact']) {
      const response = await fetch(new URL(path, vite.resolvedUrls.local[0]))
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN')
      assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'")
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.equal(response.headers.get('x-robots-tag'), 'noindex', path)
    }
    const { MapPreview } = await vite.ssrLoadModule('/src/components/common/MapPreview.tsx')
    const html = renderToStaticMarkup(createElement(MapPreview, { embedUrl: 'https://map.naver.com/p/embed/example', placeName: '검증 장소' }))
    assert.match(html, /<iframe[^>]*referrerPolicy="strict-origin-when-cross-origin"/)
    assert.match(html, /src="https:\/\/map\.naver\.com\/p\/embed\/example"/)
  } finally { await vite.close() }
})
