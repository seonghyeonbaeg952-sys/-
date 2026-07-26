import { homeContentSiteTextDefinitions } from './homeContentV2'

export type SiteTextInputType = 'label' | 'text' | 'textarea' | 'url'

export type SiteTextDefinition = {
  defaultValue: string
  description: string
  groupName: string
  inputType: SiteTextInputType
  key: string
  label: string
  sortOrder: number
}

const sharedSiteTextDefinitions: SiteTextDefinition[] = [
  {
    defaultValue: '합창 교육과 공연 활동',
    description: '푸터 태그라인 첫 번째 줄입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.tagline.line1',
    label: '푸터 태그라인 1행',
    sortOrder: 2000,
  },
  {
    defaultValue: '다음 세대를 세웁니다',
    description: '푸터 태그라인 두 번째 줄입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.tagline.line2',
    label: '푸터 태그라인 2행',
    sortOrder: 2001,
  },
  {
    defaultValue: '입단 안내',
    description: '푸터 빠른 메뉴 입단 문구입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.quick.join',
    label: '푸터 입단 메뉴',
    sortOrder: 2002,
  },
  {
    defaultValue: '공연 일정',
    description: '푸터 빠른 메뉴 공연 문구입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.quick.concert',
    label: '푸터 공연 메뉴',
    sortOrder: 2003,
  },
  {
    defaultValue: '후원·문의',
    description: '푸터 빠른 메뉴 후원 문구입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.quick.support',
    label: '푸터 후원 메뉴',
    sortOrder: 2004,
  },
  {
    defaultValue: '갤러리',
    description: '푸터 빠른 메뉴 갤러리 문구입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.quick.gallery',
    label: '푸터 갤러리 메뉴',
    sortOrder: 2005,
  },
  {
    defaultValue: '합창단 소개',
    description: '푸터 빠른 메뉴 소개 문구입니다.',
    groupName: 'home.footer',
    inputType: 'text',
    key: 'footer.quick.about',
    label: '푸터 소개 메뉴',
    sortOrder: 2006,
  },
  {
    defaultValue: '문의',
    description: '공통 문의 CTA 문구입니다.',
    groupName: 'common.button',
    inputType: 'text',
    key: 'common.cta.inquiry',
    label: '공통 문의 CTA',
    sortOrder: 2100,
  },
  {
    defaultValue: '자세히 보기',
    description: '공통 상세 CTA 문구입니다.',
    groupName: 'common.button',
    inputType: 'text',
    key: 'common.cta.more',
    label: '공통 상세 CTA',
    sortOrder: 2101,
  },
]

export const siteTextDefinitions: SiteTextDefinition[] = [
  ...homeContentSiteTextDefinitions.map((definition) => ({
    defaultValue: definition.defaultValue,
    description: definition.description,
    groupName: `home.${definition.sectionId}`,
    inputType:
      definition.inputType === 'textarea' ? 'textarea' : 'text',
    key: definition.key,
    label: definition.label,
    sortOrder: definition.sortOrder,
  } satisfies SiteTextDefinition)),
  ...sharedSiteTextDefinitions,
]

export const siteTextDefaults = Object.fromEntries(
  siteTextDefinitions.map((definition) => [
    definition.key,
    definition.defaultValue,
  ]),
)
