import assert from 'node:assert/strict'
import test from 'node:test'
import { observeInitialPageReadiness } from './publicPageReadiness.ts'

const visible = { width: 70, height: 70, top: 30, bottom: 100, left: 10, right: 80 }

function fakePage(t) {
  const frames = new Map()
  const timers = new Map()
  const oldGlobals = Object.fromEntries(['window', 'document', 'MutationObserver'].map(key => [key, globalThis[key]]))
  const fonts = { status: 'loaded', ready: Promise.resolve() }
  const images = []
  const loadingBlocks = []
  let pendingData = false
  let mutation
  let sequence = 0

  globalThis.window = {
    innerWidth: 390,
    innerHeight: 844,
    requestAnimationFrame(fn) { frames.set(++sequence, fn); return sequence },
    cancelAnimationFrame(id) { frames.delete(id) },
    setTimeout(fn) { timers.set(++sequence, fn); return sequence },
    clearTimeout(id) { timers.delete(id) },
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = { fonts }
  globalThis.MutationObserver = class {
    constructor(fn) { mutation = fn }
    observe() {}
    disconnect() { mutation = undefined }
  }
  t.after(() => {
    for (const [key, value] of Object.entries(oldGlobals)) {
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
    }
  })
  return {
    fonts, images, loadingBlocks,
    content: {
      querySelector: () => pendingData ? {} : null,
      querySelectorAll: selector => selector === 'img' ? images : loadingBlocks,
      getBoundingClientRect: () => visible,
      addEventListener() {},
      removeEventListener() {},
    },
    setPending(value) { pendingData = value; mutation?.() },
    change() { mutation?.() },
    frame() { const actions = [...frames.values()]; frames.clear(); actions.forEach(fn => fn()) },
    deadline() { [...timers.values()].forEach(fn => fn()) },
  }
}

test('waits for the visible data, the active image and actual fonts before showing the page', async t => {
  const page = fakePage(t)
  let releases = 0
  let decodes = 0
  const image = Promise.withResolvers()
  const font = Promise.withResolvers()
  page.fonts.status = 'loading'
  page.fonts.ready = font.promise
  page.images.push({
    currentSrc: '/active.webp',
    getBoundingClientRect: () => visible,
    decode() { decodes++; return image.promise },
  }, {
    currentSrc: '/below-fold.webp',
    getBoundingClientRect: () => ({ ...visible, top: 900, bottom: 970 }),
    decode() { assert.fail('below-fold images must stay deferred') },
  })
  page.setPending(true)
  observeInitialPageReadiness(page.content, () => releases++)
  page.frame()
  assert.equal(decodes, 0)
  page.setPending(false)
  page.frame()
  assert.equal(decodes, 1)
  image.resolve()
  await Promise.resolve()
  page.frame()
  assert.equal(releases, 0)
  assert.equal(decodes, 1)
  page.fonts.status = 'loaded'
  font.resolve()
  await Promise.resolve()
  page.frame()
  page.deadline()
  assert.equal(releases, 1)
})

test('a failed image or stalled request can release the page; unmount cancels observation', async t => {
  const page = fakePage(t)
  let releases = 0
  page.images.push({
    currentSrc: '/failed.webp',
    getBoundingClientRect: () => visible,
    decode: () => Promise.reject(new Error('image failed')),
  })
  observeInitialPageReadiness(page.content, () => releases++)
  page.frame()
  await Promise.resolve()
  page.frame()
  assert.equal(releases, 1)

  page.setPending(true)
  const stop = observeInitialPageReadiness(page.content, () => releases++)
  page.frame()
  stop()
  page.deadline()
  page.frame()
  assert.equal(releases, 1)

  observeInitialPageReadiness(page.content, () => releases++)
  page.frame()
  page.deadline()
  page.frame()
  assert.equal(releases, 2)
})
