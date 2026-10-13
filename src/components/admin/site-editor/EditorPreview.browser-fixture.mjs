/** Real-browser regression. Evaluate through the supported browser tool on the
 * rendered CMS, after choosing a device/fit mode. Never reads application state. */
export async function assertStableEditorPreview({ frames = 120, tolerance = 0.5 } = {}) {
  await document.fonts.ready
  for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame)
  const holder = document.querySelector('.site-editor__preview-scroll')
  const stage = holder?.querySelector('.site-editor__preview-stage')
  const frame = stage?.querySelector('iframe')
  if (!holder || !stage || !frame) throw new Error('Rendered CMS preview is missing')
  const samples = []
  for (let i = 0; i < frames; i++) {
    await new Promise(requestAnimationFrame)
    const bounds = stage.getBoundingClientRect()
    samples.push({ available: holder.clientWidth, width: bounds.width, height: bounds.height,
      scale: frame.style.transform, scrollHeight: holder.scrollHeight, containerHeight: holder.clientHeight })
  }
  const range = key => Math.max(...samples.map(sample => sample[key])) - Math.min(...samples.map(sample => sample[key]))
  const result = { frames: samples.length, availableDelta: range('available'), widthDelta: range('width'),
    heightDelta: range('height'), transitions: samples.slice(1).filter((sample, index) => sample.scale !== samples[index].scale).length,
    first: samples[0], last: samples.at(-1), viewport: { width: innerWidth, height: innerHeight } }
  if (result.availableDelta > tolerance || result.widthDelta > tolerance || result.heightDelta > tolerance) {
    throw new Error(`Preview resize feedback detected: ${JSON.stringify(result)}`)
  }
  return result
}
