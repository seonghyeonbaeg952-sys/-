import { defaultSpiritHero, defaultMotetMeaning, defaultSpiritCta, spiritManifestoCopy, spiritValues, homeSpiritBookletPages } from '../constants/spiritContent'
import type { SiteCopyDefinition } from '../types/siteEditor'

/** Explicit source identities; original domain content remains the fallback. */
export const editorialCopyDefinitions: SiteCopyDefinition[] = [
  { key: 'spirit.content.hero.body', page: 'spirit', section: '정신 · 대표 설명', label: '대표 설명 본문', defaultValue: defaultSpiritHero.body, multiline: true },
  { key: 'spirit.content.motet.body', page: 'spirit', section: '정신 · 모테트의 의미', label: '모테트 설명 본문', defaultValue: defaultMotetMeaning.body, multiline: true },
  { key: 'spirit.content.motet.quote', page: 'spirit', section: '정신 · 모테트의 의미', label: '모테트 강조 문구', defaultValue: defaultMotetMeaning.quote ?? '하나가 되기 위해 같아지는 것이 아니라, 다름을 들으며 정확히 맞춰 갑니다.', multiline: true },
  { key: 'spirit.content.cta.body', page: 'spirit', section: '정신 · 참여 안내', label: '입단·후원 설명', defaultValue: defaultSpiritCta.body, multiline: true },
  { key: 'spirit.content.cta.supportLabel', page: 'spirit', section: '정신 · 참여 안내', label: '후원 버튼 이름', defaultValue: defaultSpiritCta.secondaryCtaLabel ?? '후원 참여' },
  ...spiritManifestoCopy.paragraphs.map((body, index): SiteCopyDefinition => ({ key: `spirit.content.manifesto.${index}.body`, page: 'spirit', section: '정신 · 선언문', label: `${index + 1}단계 설명`, defaultValue: body, multiline: true })),
  ...spiritValues.flatMap((value, index) => (['title', 'summary', 'description'] as const).map((property): SiteCopyDefinition => ({
    key: `spirit.content.values.${index}.${property}`, page: 'spirit', section: '정신 · 네 가지 태도',
    label: `${index + 1}번째 태도 ${property === 'title' ? '제목' : property === 'summary' ? '요약' : '설명'}`, defaultValue: value[property] ?? '', multiline: property !== 'title',
  }))),
  ...homeSpiritBookletPages.flatMap(value => (['title', 'body'] as const).map((property): SiteCopyDefinition => ({
    key: `home.content.spirit.${value.id}.${property}`, page: 'home', section: '홈 · 교육철학 상세', label: `${value.eyebrow} ${property === 'title' ? '제목' : '본문'}`, defaultValue: value[property], multiline: true,
  }))),
  ...[['지원서 작성', '기본 정보와 활동 희망'], ['보호자 연락', '일정과 다음 절차 안내'], ['음악 확인·상담', '음역과 리듬을 함께 확인'], ['첫 연습 합류', '결과와 첫 연습 일정']].flatMap((step, index) => (['title', 'body'] as const).map((property, propertyIndex): SiteCopyDefinition => ({
    key: `home.content.join.steps.${index}.${property}`, page: 'home', section: '홈 · 입단 절차', label: `${index + 1}단계 ${property === 'title' ? '제목' : '설명'}`, defaultValue: step[propertyIndex], multiline: property === 'body',
  }))),
  { key: 'home.content.hero.secondaryLabel', page: 'home', section: '홈 · 대표 화면', label: '대표 화면 공연 버튼 이름', defaultValue: '공연 일정' },
]
