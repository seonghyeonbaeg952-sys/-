import { ENGLISH_CONTENT_FIELDS } from '../sample-language/sampleContentModel'
import type { ContentPhotoItem } from './sitePhotoContent'

export function canEditEnglishPhoto(item: ContentPhotoItem) {
  return ENGLISH_CONTENT_FIELDS[item.target.table]?.some(field => field.type === 'image' && field.name === item.target.field) ?? false
}
