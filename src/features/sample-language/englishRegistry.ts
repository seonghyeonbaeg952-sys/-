import { englishHome } from './englishHome'
import { englishPages } from './englishPages'
import { englishWorkflows } from './englishWorkflows'
import { createTranslationLookup } from './sampleLanguageModel'

export const englishEntries = [...englishPages, ...englishHome, ...englishWorkflows]
export const translateEnglish = createTranslationLookup(englishEntries)
