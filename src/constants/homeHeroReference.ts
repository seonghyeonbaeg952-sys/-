/**
 * The homepage hero is a fixed brand introduction from the approved V2 HTML.
 * Hero slide records own the rotating images, order and visibility only.
 */
export const HOME_HERO_REFERENCE_COPY = {
  description:
    '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.',
  eyebrow: '서울모테트청소년합창단',
  mottoChips: ['진심을 담은 음악', '정기 연습', '공연 활동'],
  primaryCta: {
    href: '/join',
    label: '입단 안내',
  },
  secondaryCta: {
    href: '/concerts',
    label: '공연 일정',
  },
  titleLines: ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR'],
} as const
