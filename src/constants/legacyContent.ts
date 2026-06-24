import type { HistoryItem, LocationInfo } from '../types/content'
import type { AboutSectionRow } from '../types/cms'

export const legacyMenuStructure = [
  '홈',
  '소개',
  '단원 소개',
  '선생님 소개',
  '갤러리',
  '공연 문의',
  '단원 모집',
  '찾아오시는 길',
] as const

export const modernMenuMapping = [
  { legacy: '홈', modern: '홈' },
  { legacy: '소개, 단원 소개, 선생님 소개, 찾아오시는 길', modern: '합창단 소개' },
  { legacy: '공연 문의', modern: '공연·소식' },
  { legacy: '갤러리', modern: '갤러리' },
  { legacy: '단원 모집', modern: '입단 안내' },
  { legacy: '공연 문의, 찾아오시는 길', modern: '후원·문의' },
] as const

export const legacyChoirIntro = {
  affiliation: '서울모테트음악재단 청소년아카데미 부설 합창단',
  foundedYear: 2014,
  summary:
    '서울모테트청소년합창단은 기독교 정신을 바탕으로 교회음악의 가치를 배우고, 창의적인 음악교육을 통해 지성과 인성을 겸비한 청소년 인재를 양성하는 합창단입니다.',
  mission:
    '청소년들이 함께 노래하며 음악의 참된 의미와 가치를 배우고, 음악을 통해 이웃을 향한 나눔과 사랑을 실천하도록 돕습니다.',
} as const

export const legacyAboutSections = [
  {
    id: 'legacy-about-foundation',
    section_key: 'foundation',
    title: '창단 배경',
    content:
      '기독교 정신을 바탕으로 교회음악의 올바른 이상을 제시하고, 한국을 대표할 만한 민간 프로합창단으로 성장한 서울모테트합창단은 2014년 창단 25주년과 서울모테트음악재단 설립을 기념하여 서울모테트청소년합창단을 창단했습니다.',
    display_order: 1,
    is_visible: true,
  },
  {
    id: 'legacy-about-education',
    section_key: 'education',
    title: '교육 목적',
    content:
      '서울모테트음악재단 청소년아카데미 부설 청소년합창단인 서울모테트청소년합창단은 다음 세대를 이끌어 갈 청소년들에게 창의적인 음악교육을 제공하고, 지성과 인성을 겸비한 인재를 양성하는 것을 목적으로 합니다.',
    display_order: 2,
    is_visible: true,
  },
  {
    id: 'legacy-about-activities',
    section_key: 'activities',
    title: '연주 활동',
    content:
      '서울모테트청소년합창단은 서울모테트음악재단 창립행사 연주를 시작으로 정기연주회, 봉사연주, 국내 초청연주, EBS 교육방송 광복절 음악 다큐 촬영, 유럽 초청연주 등 다양한 연주 활동을 이어오며 해마다 성장하고 있습니다.',
    display_order: 3,
    is_visible: true,
  },
  {
    id: 'legacy-about-mission',
    section_key: 'mission',
    title: '음악의 가치와 비전',
    content:
      '입시 위주의 교육 속에서 더불어 함께하는 합창음악을 접할 기회가 부족한 오늘, 서울모테트청소년합창단은 청소년들이 함께 모여 노래하며 음악의 참된 의미와 가치를 배우고, 음악을 통해 이웃을 향한 나눔과 사랑을 실천하며, 우리 민족의 예술적 탁월함을 세계 속에 알리는 역량 있는 청소년합창단으로 성장하고자 합니다.',
    display_order: 4,
    is_visible: true,
  },
] satisfies AboutSectionRow[]

export const legacyActivitySummary = [
  '정기연주회',
  '봉사연주',
  '국내 초청연주',
  '방송 및 드라마 관련 활동',
  '유럽 초청연주 및 비전투어',
] as const

export const legacyHistorySeed = [
  {
    id: 'history-2014-foundation',
    year: 2014,
    date: '2014-06-28',
    title: '서울모테트청소년합창단 창단',
    is_visible: true,
    display_order: 1,
  },
  {
    id: 'history-2015-regular-1',
    year: 2015,
    title: '제1회 정기연주회',
    description: '세라믹 팔레스홀',
    is_visible: true,
    display_order: 2,
  },
  {
    id: 'history-2016-regular-2',
    year: 2016,
    title: '제2회 정기연주회',
    description: '예술의전당 IBK홀',
    is_visible: true,
    display_order: 3,
  },
  {
    id: 'history-2017-ebs',
    year: 2017,
    title: 'EBS 다큐프라임 출연',
    description: '광복절 기념 음악 다큐 촬영',
    is_visible: true,
    display_order: 4,
  },
  {
    id: 'history-2018-europe',
    year: 2018,
    title: '유럽 초청연주 및 비전투어',
    is_visible: true,
    display_order: 5,
  },
  {
    id: 'history-2020-drama',
    year: 2020,
    title: '드라마 관련 촬영 참여',
    description: 'JTBC X 넷플릭스 드라마 관련 활동',
    is_visible: true,
    display_order: 6,
  },
  {
    id: 'history-2022-seoul-motet',
    year: 2022,
    title: '서울모테트합창단 협연',
    description: '제120, 121회 서울모테트합창단 공연 협연',
    is_visible: true,
    display_order: 7,
  },
  {
    id: 'history-2023-tv-recording',
    year: 2023,
    title: 'tvN 드라마 삽입곡 녹음',
    is_visible: true,
    display_order: 8,
  },
] satisfies HistoryItem[]

export const legacyLocationSeed = {
  id: 'legacy-location-main',
  address: '서울특별시 서초구 사임당로 8길 17',
  detail_address: '서주빌딩 B1',
  phone: '02-579-7295',
  fax: '02-579-7293',
  is_visible: true,
  updated_at: '2026-06-24T00:00:00.000Z',
} satisfies LocationInfo
