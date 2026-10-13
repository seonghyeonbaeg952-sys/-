/** Explicit Spirit renderers with bounded computed keys.
 * Keep metadata, alt text, counters and unrendered catalog keys out of this list.
 * The static source scanner cannot infer the index/conditional keys below.
 */
export const spiritRichCopyKeys: ReadonlySet<string> = new Set([
  'spirit.lineage.now', 'spirit.lineage.next',
  ...Array.from({ length: 4 }, (_, index) => [
    `spirit.lineage.${index}.title`, `spirit.lineage.${index}.body`, `spirit.manifesto.label${index}`,
  ]).flat(),
  'spirit.faith.lead',
  ...Array.from({ length: 3 }, (_, index) => `spirit.faith.paragraph${index}`),
  ...Array.from({ length: 2 }, (_, index) => ['label', 'text', 'note'].map(part => `spirit.scripture.${index}.${part}`)).flat(),
  'spirit.community.lead', 'spirit.community.centerLabel', 'spirit.community.closing',
  ...Array.from({ length: 5 }, (_, index) => [
    `spirit.voices.${index}.part`, `spirit.voices.${index}.meaning`,
    `spirit.learning.${index}.step`, `spirit.learning.${index}.title`, `spirit.learning.${index}.body`,
  ]).flat(),
])
