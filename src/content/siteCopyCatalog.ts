import { createHomeEditorValues, homeAllEditorFields } from '../lib/homeDeviceContent'
import { homeContentSectionDefinitions } from '../constants/homeContentV2'
import { commonCopyDefinitions } from './siteCopyCommonCatalog'
import { pageCopyDefinitions } from './siteCopyPagesCatalog'
import { pledgeCopyDefinitions } from './siteCopyPledgeCatalog'
import { aboutCopyDefinitions } from './siteCopyAboutCatalog'
import { fixedCopyDefinitions } from './siteCopyFixedCatalog'
import type { HomeContentFlatRecord } from '../types/homeContent'
import type { SiteCopyDefinition } from '../types/siteEditor'

export const siteCopyDefinitions: SiteCopyDefinition[] = [...commonCopyDefinitions, ...pageCopyDefinitions, ...pledgeCopyDefinitions, ...aboutCopyDefinitions, ...fixedCopyDefinitions, ...homeAllEditorFields.map(field => ({
  key: field.key, page: 'home', section: homeContentSectionDefinitions.find(section => section.id === field.sectionId)?.title ?? field.sectionId, label: field.label,
  defaultValue: field.defaultValue, multiline: field.inputType === 'textarea', inputType: field.inputType,
  sourceKey: field.sourceKey, sourceDevice: field.device, min: field.min, max: field.max, maxLength: field.maxLength,
})) as SiteCopyDefinition[]]

export function getSiteCopyDefaults(siteTexts: HomeContentFlatRecord = {}): Record<string, string> {
  return { ...Object.fromEntries(siteCopyDefinitions.map(field => [field.key, field.defaultValue])), ...createHomeEditorValues(siteTexts) }
}

export { applyHomeEditorOverrides, resolveHomeEditorContent } from '../lib/homeEditorOverrides'
