export const HOME_FLOW_SECTIONS = [
  { key: 'hero', label: '시작', symbol: '♪', x: 2 },
  { key: 'quick', label: '길잡이', symbol: '♩', x: 12 },
  { key: 'about', label: '소개', symbol: '♫', x: 6 },
  { key: 'join-letter', label: '입단', symbol: '♬', x: 17 },
  { key: 'concert-program', label: '공연', symbol: '♪', x: 4 },
  { key: 'score-book', label: '악보', symbol: '♩', x: 14 },
  { key: 'spirit', label: '정신', symbol: '♫', x: 8 },
  { key: 'archive-stack', label: '기록', symbol: '♬', x: 18 },
  { key: 'support-letter', label: '후원', symbol: '♩', x: 5 },
] as const

export type HomeFlowSectionKey = (typeof HOME_FLOW_SECTIONS)[number]['key']
