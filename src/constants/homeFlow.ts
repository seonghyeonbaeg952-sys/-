export const HOME_FLOW_SECTIONS = [
  { key: 'hero', label: '시작', symbol: '♪', x: 3 },
  { key: 'quick', label: '길잡이', symbol: '♩', x: 16 },
  { key: 'about', label: '소개', symbol: '♫', x: 8 },
  { key: 'join-letter', label: '입단', symbol: '♬', x: 21 },
  { key: 'concert-program', label: '공연', symbol: '♪', x: 5 },
  { key: 'score-book', label: '악보', symbol: '♩', x: 18 },
  { key: 'spirit', label: '정신', symbol: '♫', x: 11 },
  { key: 'archive-stack', label: '기록', symbol: '♬', x: 24 },
  { key: 'support-letter', label: '후원', symbol: '♩', x: 7 },
] as const

export type HomeFlowSectionKey = (typeof HOME_FLOW_SECTIONS)[number]['key']
