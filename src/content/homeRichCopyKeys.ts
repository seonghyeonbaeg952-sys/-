import type { EditorDevice } from '../types/siteEditor'

const fields = (prefix: string, properties: readonly string[]) => properties.map(property => `${prefix}.${property}`)
const sharedVisible = [
  ...['join', 'concert', 'support'].map(id => `home.quickActions.${id}.title`),
  ...fields('home.current.about', ['eyebrowEn', 'title', 'ctaLabel']),
  ...fields('home.current.join', ['eyebrowEn', 'ctaLabel']),
  ...fields('home.concertProgram', ['title', 'detailCtaLabel', 'noticePanelTitle', 'noticePanelCtaLabel', 'emptyNoticeCtaLabel']),
  ...fields('home.current.archive', ['eyebrowEn', 'desktopTitle', 'ctaLabel']),
  ...fields('home.supportLetter', ['primaryCtaLabel', 'pledgeEyebrow', 'pledgeTitle']),
]
const responsiveVisible = [
  ...sharedVisible,
  ...fields('home.concertProgram', ['eyebrowEn', 'responsiveDescription', 'responsiveCardEyebrow', 'emptyConcertCtaLabel']),
  ...fields('home.spiritWrapper', ['responsiveEyebrow', 'responsiveTitle', 'responsiveDescription', 'responsiveCtaLabel', 'responsiveLabel1', 'responsiveLabel2', 'responsiveLabel3', 'responsiveLabel4', 'responsiveLabel5']),
  ...fields('home.supportLetter', ['responsiveTitle', 'responsiveUse1', 'responsiveUse2', 'responsiveUse3']),
]

/** Only leaves wired to HomeCopy appear here. Accessibility names, URLs and untracked transforms stay plain. */
export const homeRichCopySourceKeys: Record<EditorDevice, ReadonlySet<string>> = {
  desktop: new Set([
    ...sharedVisible,
    ...fields('home.heroSupplement', ['fallbackDescription', 'mottoChips.1', 'mottoChips.2', 'mottoChips.3']),
    ...['join', 'concert', 'support'].flatMap(id => fields(`home.quickActions.${id}`, ['description', 'ctaLabel'])),
    'home.current.about.globalTagline',
    ...fields('home.current.about.paragraphs', ['1', '2']),
    ...fields('home.current.join', ['title', 'description', 'compactDescription', 'secondaryCtaLabel']),
    ...fields('home.concertProgram', ['description', 'desktopConcertsCtaLabel', 'emptyNoticeTitle', 'emptyNoticeDescription']),
    'home.scoreBook.cover.titleLines',
    ...['leftPage', 'rightPage'].flatMap(side => fields(`home.scoreBook.${side}`, ['titleLines', 'body', 'keywords', 'calloutTitle', 'calloutBody'])),
    'home.scoreBook.rightPage.prefix',
    ...fields('home.scoreBook.final', ['titleLines', 'summary', 'primaryCtaLabel', 'secondaryCtaLabel']),
    ...['voice', 'score', 'part', 'ensemble', 'stage', 'guide'].flatMap(id => fields(`home.scoreBook.valueItems.${id}`, ['label', 'description'])),
    ...fields('home.spiritWrapper', ['orbitEyebrow', 'orbitHeadline', 'orbitSignature', 'ctaLabel']),
    ...fields('home.current.archive', ['leadDescription', 'description']),
    ...fields('home.sponsors', ['eyebrow', 'title', 'description', 'ctaLabel']),
    ...fields('home.supportLetter', ['eyebrowEn', 'title', 'description', 'secondaryCtaLabel', 'pledgeDescription']),
  ]),
  tablet: new Set([
    ...responsiveVisible,
    ...fields('home.responsive.about', ['tabletDescription', 'tabletFacts']),
    ...fields('home.current.join', ['title', 'description', 'compactDescription']),
    'home.responsive.join.tabletGuardianNotes',
    ...fields('home.scoreBook', ['responsiveEyebrow', 'responsiveTitle', 'responsiveLeftTitle', 'responsiveLeftBody', 'responsiveRightTitle', 'responsiveRightBody']),
    ...fields('home.supportLetter', ['responsiveTabletEyebrow', 'responsiveTabletDescription', 'responsiveTabletPledgeDescription']),
  ]),
  mobile: new Set([
    ...responsiveVisible,
    ...fields('home.responsive.about', ['mobileDescription', 'founded', 'context']),
    ...fields('home.responsive.join', ['mobileTitle', 'mobileDescription', 'mobileGuardianNotes']),
    'home.current.join.secondaryCtaLabel',
    ...fields('home.concertProgram', ['concertsCtaLabel', 'responsiveNoticeEyebrow', 'responsiveNoticeImportantLabel']),
    ...fields('home.supportLetter', ['eyebrowEn', 'responsiveMobileDescription', 'responsiveMobilePledgeDescription']),
  ]),
}
