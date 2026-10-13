import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const path = '/src/components/spirit/LineageMotetOrnament.tsx'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const component = existsSync(`.${path}`) ? (await vite.ssrLoadModule(path)).LineageMotetOrnament : undefined
const { motionValue } = await vite.ssrLoadModule('motion/react')

function render(progress, reducedMotion = false) {
  assert.equal(typeof component, 'function', 'The curve must render a real MOTET ornament')
  return renderToStaticMarkup(createElement(component, { progress: motionValue(progress), reducedMotion }))
}

test('each repeated MOTET letter follows the curve while retaining a constant 90-degree rotation', () => {
  const html = render(0.5)
  assert.match(html, /<svg[^>]*aria-hidden="true"/)
  assert.doesNotMatch(html, /<textPath\b/, 'Whole words rotate 90 degrees; individual letters must not follow the tangent')
  const letters = [...html.matchAll(/<g transform="([^"]+)"><text[^>]*>([MOET])<\/text><\/g>/g)]
  assert.ok(letters.length >= 60, 'The line must carry repeated words, with separately positioned letters')
  assert.equal(letters.length % 2, 0)
  const transforms = letters.map(match => match[1])
  assert.ok(transforms.every(transform => /rotate\(90\)$/.test(transform)))
  assert.deepEqual(transforms.slice(0, letters.length / 2), transforms.slice(letters.length / 2), 'Orange ink must align exactly with the unfilled letters')
  assert.match(letters.slice(0, letters.length / 2).map(match => match[2]).join(''), /^(?:MOTET){6,}$/)
  const positions = transforms.slice(0, letters.length / 2).map(transform => transform.match(/translate\(([^ ]+) ([^\)]+)\)/).slice(1).map(Number))
  assert.ok(new Set(positions.map(([x]) => x)).size > 2, 'Only positions follow the curved spine')
  assert.ok(positions.every(([, y], index) => index === 0 || y > positions[index - 1][1]))
  const geometry = html.match(/<defs>[\s\S]*?<path[^>]*\sd="([^"]+)"/)?.[1]
  assert.equal(geometry, 'M66.4009 0.514496C-23.5991 150.514 -18.5991 250.514 68.4009 345.514C154.401 438.514 146.401 565.514 58.4009 646.514C-18.5991 717.514 -8.59906 858.514 82.4009 1040.51')
  assert.doesNotMatch(html.replace(/<defs>[\s\S]*?<\/defs>/, ''), /<path\b/, 'Only letters are painted; the curve is mask geometry')
})

test('orange letter fill consumes the supplied scroll progress without a second timing model', () => {
  for (const [progress, expected] of [[0, 0], [0.5, 0.5], [1, 1]]) {
    const html = render(progress)
    const mask = html.match(/<mask\b[\s\S]*?<\/mask>/)?.[0]
    const inkLength = mask.match(/stroke-dasharray="([\d.]+)(?:px)? /)?.[1] ?? mask.match(/path-length:([\d.]+)/)?.[1]
    assert.equal(Number(inkLength), expected, `Mask must follow progress ${progress}`)
    assert.match(mask, /stroke="white"/)
    assert.doesNotMatch(mask, /stroke-linecap="round"/, 'Zero progress must not paint a round cap over the first letter')
    const id = mask.match(/id="([^"]+)"/)?.[1]
    assert.ok(html.includes(`mask="url(#${id})"`))
  }
})

test('reduced motion displays the complete word even before any scroll progress', () => {
  assert.match(render(0, true), /path-length:1(?:px)?|stroke-dasharray="1(?:px)? 1(?:px)?"/)
})

test('two mounted ornaments never share path or mask IDs', () => {
  assert.equal(typeof component, 'function')
  const html = renderToStaticMarkup(createElement('div', null,
    createElement(component, { progress: motionValue(0.25), reducedMotion: false }),
    createElement(component, { progress: motionValue(0.75), reducedMotion: false }),
  ))
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1])
  assert.ok(ids.length >= 2)
  assert.equal(new Set(ids).size, ids.length)
  for (const reference of [...html.matchAll(/(?:href="#|mask="url\(#)([^"\)]+)/g)]) assert.ok(ids.includes(reference[1]))
})

test('desktop lettering leaves clearance for the independently placed NOW/NEXT dots', () => {
  const css = readFileSync(new URL('../../styles/spirit-heritage.css', import.meta.url), 'utf8')
  const desktopRail = css.match(/\.spirit-heritage\[data-spirit-device='desktop'\] \.spirit-heritage__timeline-curve\s*\{([^}]+)\}/)?.[1]
  assert.match(desktopRail ?? '', /left:\s*-16px;/)
  assert.match(css, /\.spirit-heritage__timeline-curve\s*\{[^}]*left:\s*0;/, 'The original small-screen line must not inherit the lettering inset')
})
