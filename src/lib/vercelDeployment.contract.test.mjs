import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const configPath = fileURLToPath(new URL('../../vercel.json', import.meta.url))

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
