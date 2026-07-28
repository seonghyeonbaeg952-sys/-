import type { HomeV4ScenarioMode } from './homeV4SampleTypes'
import type {
  HomeV4ConcertEmptyFixture,
  HomeV4ConcertFixture,
  HomeV4JoinConcertFixture,
  HomeV4JoinFixture,
} from './homeV4JoinConcertTypes'

const normalJoin: HomeV4JoinFixture = {
  eyebrow: 'JOIN · NEXT VOICE',
  title: '함께 배우고,\n함께 무대에 서는\n다음 목소리를 기다립니다',
  description:
    '발성·악보 읽기·파트 연습부터 실제 무대까지,\n청소년이 자신의 목소리를 발견하고\n다른 목소리와 함께 성장하는 과정입니다.',
  ctas: [
    {
      emphasis: 'primary',
      href: '/join?section=contact#application',
      label: '입단지원서 작성하기',
    },
    {
      emphasis: 'secondary',
      href: '/join?section=process',
      label: '모집 안내 확인',
    },
  ],
  facts: [
    {
      id: 'target',
      isVisible: true,
      label: '모집 대상',
      lines: [
        '유소년반 · 초등학교 2~5학년',
        '청소년반 · 초등학교 6학년, 중·고등학생',
        '대학부 · 대학생, 만 22세까지',
      ],
    },
    {
      id: 'practice',
      isVisible: true,
      label: '연습 안내',
      lines: ['정기 연습 일정과 장소는', '입단 안내에서 확인할 수 있습니다.'],
    },
    {
      id: 'guardian',
      isVisible: true,
      label: '보호자 안내',
      lines: ['지원서 제출 후 보호자 연락처로', '다음 일정을 안내합니다.'],
    },
  ],
  processTitle: '지원부터 첫 연습까지,\n네 단계로 안내합니다',
  steps: [
    {
      description: '기본 정보와 활동 희망을 남깁니다.',
      displayOrder: 1,
      id: 'application',
      isVisible: true,
      mobileDescription: '기본 정보와 활동 희망을 남깁니다.',
      title: '지원서 작성',
    },
    {
      description: '보호자 연락처로 상담과 다음 일정을 안내합니다.',
      displayOrder: 2,
      id: 'guardian-contact',
      isVisible: true,
      mobileDescription: '보호자 연락처로 다음 일정을 안내합니다.',
      title: '보호자 연락·일정 안내',
    },
    {
      description:
        '현재 음역과 리듬을 확인하고 성장 방향을 함께 이야기합니다.',
      displayOrder: 3,
      id: 'music-check',
      isVisible: true,
      mobileDescription: '현재 음역과 성장 방향을 이야기합니다.',
      title: '음악 확인·상담',
    },
    {
      description: '결과와 첫 연습 일정을 안내받고 함께 시작합니다.',
      displayOrder: 4,
      id: 'first-practice',
      isVisible: true,
      mobileDescription: '첫 연습 일정을 안내받고 시작합니다.',
      title: '결과 안내·첫 연습',
    },
  ],
  guardianTitle: 'FOR PARENTS & GUARDIANS',
  guardianItems: [
    {
      id: 'schedule',
      isVisible: true,
      text: '일정은 보호자 연락처로 안내합니다.',
    },
    {
      id: 'privacy',
      isVisible: true,
      text: '사진 촬영·개인정보 활용 동의는 별도로 진행합니다.',
    },
    {
      id: 'consultation',
      isVisible: true,
      text: '지원 전에 궁금한 점을 상담할 수 있습니다.',
    },
  ],
}

const fifthStep = {
  description:
    '첫 연습 전에 합창단의 약속과 연습 흐름, 준비물을 충분히 안내합니다.',
  displayOrder: 5,
  id: 'orientation',
  isVisible: true,
  mobileDescription: '첫 연습 흐름과 준비물을 안내합니다.',
  title: '첫 연습 오리엔테이션',
}

const longJoin: HomeV4JoinFixture = {
  ...normalJoin,
  title: '서로의 소리를 존중하며,\n함께 배우고 성장하는\n다음 목소리를 기다립니다',
  description:
    '발성의 기초와 악보 읽기, 파트별 연습, 함께 듣는 태도부터 실제 공연 무대의 경험까지 차근차근 연결합니다.\n자신의 고유한 목소리를 발견하고 다른 목소리와 조화를 이루는 과정을 충분한 설명과 안전한 안내 속에서 배웁니다.',
  ctas: [
    {
      emphasis: 'primary',
      href: '/join?section=contact#application',
      label: '입단지원서 차분히 작성하기',
    },
    {
      emphasis: 'secondary',
      href: '/join?section=process',
      label: '모집 일정과 전체 절차 확인',
    },
  ],
  facts: normalJoin.facts.map((fact) =>
    fact.id === 'target'
      ? {
          ...fact,
          lines: [
            '유소년반 · 초등학교 2~5학년, 합창을 처음 시작하는 단원',
            '청소년반 · 초등학교 6학년과 중·고등학생, 꾸준한 연습이 가능한 단원',
            '대학부 · 대학생부터 만 22세까지, 공동체 활동에 참여할 수 있는 단원',
          ],
        }
      : fact,
  ),
  processTitle:
    '지원 내용을 확인한 뒤 보호자 안내와 음악 상담을 거쳐,\n다섯 단계로 첫 연습을 준비합니다',
  steps: [
    ...normalJoin.steps.map((step) => ({
      ...step,
      description: `${step.description} 필요한 내용은 보호자와 함께 충분히 확인하며 서두르지 않고 진행합니다.`,
    })),
    fifthStep,
  ],
  guardianItems: normalJoin.guardianItems.map((item) => ({
    ...item,
    text: `${item.text} 세부 내용은 신청 이후 담당자가 다시 설명합니다.`,
  })),
}

const emptyJoin: HomeV4JoinFixture = {
  ...normalJoin,
  ctas: normalJoin.ctas.slice(0, 1),
  facts: normalJoin.facts.map((fact) => {
    if (fact.id === 'target') {
      return {
        ...fact,
        lines: [
          '유소년반 · 초등학교 2~5학년',
          '청소년반·대학부 · 세부 연령은 입단 안내에서 확인',
        ],
      }
    }

    if (fact.id === 'guardian') {
      return { ...fact, isVisible: false }
    }

    return fact
  }),
  processTitle: '지원부터 첫 연습까지,\n세 단계로 안내합니다',
  steps: normalJoin.steps.slice(0, 3),
  guardianItems: normalJoin.guardianItems.slice(0, 2),
}

const normalConcert: HomeV4ConcertFixture = {
  actions: [
    {
      emphasis: 'primary',
      href: '/concerts/sample-concert',
      label: '공연 상세 보기',
    },
    {
      emphasis: 'secondary',
      href: '/concerts',
      label: '전체 공연 일정',
    },
    {
      emphasis: 'text',
      href: '/notices',
      label: '공지사항',
    },
  ],
  date: '2027. 03. 20. (토)',
  eyebrow: 'UPCOMING CONCERT',
  noteBody:
    '고전 양식의 균형과 청소년 합창의 맑고 투명한 음색을 연결합니다. 작품별 배경과 작곡가, 가사의 맥락을 차례로 살피며 서로의 호흡을 듣는 감상 포인트를 함께 안내합니다.',
  noteDetail:
    '공연 당일 입장과 촬영 안내는 상세 페이지와 공지사항에서 확인할 수 있습니다.',
  noteSummary:
    '작품의 배경과 감상 포인트를 공연 전부터 읽을 수 있도록 핵심 프로그램 노트를 먼저 보여드립니다.',
  notice: {
    href: '/notices',
    label: '공연 공지사항 확인',
    lines: [
      '좌석과 입장 시간은 공연 공지에서 안내합니다.',
      '일정 변경 시 같은 페이지에 가장 먼저 반영합니다.',
    ],
  },
  posterAlt: '서울모테트청소년합창단 샘플 정기연주회 포스터',
  posterUrl: '/images/placeholders/poster-placeholder.svg',
  programmeItems: [
    { id: 'mozart', label: 'W. A. Mozart · Missa Brevis K.194' },
    { id: 'korean', label: '한국 합창 작품' },
    { id: 'encore', label: '현대 성가와 앙코르' },
  ],
  programmeTitle: '무대의 흐름을\n작품과 문장으로 읽습니다',
  sectionTitle: '공연과 프로그램',
  status: 'upcoming',
  summary:
    '청소년의 목소리가 서로를 듣고 응답하며 한 편의 음악으로 이어지는 정기연주회입니다.',
  time: '17:00',
  title: '서로의 목소리,\n하나의 무대',
  venue: '세라믹팔레스홀',
}

export const homeV4ConcertNoPosterFixture: HomeV4ConcertFixture = {
  ...normalConcert,
  posterAlt: undefined,
  posterUrl: undefined,
}

export const homeV4ConcertNoNoticeFixture: HomeV4ConcertFixture = {
  ...normalConcert,
  notice: undefined,
}

const longConcert: HomeV4ConcertFixture = {
  ...homeV4ConcertNoPosterFixture,
  noteBody:
    '이번 프로그램은 고전 양식의 균형에서 출발해 한국 합창 작품의 언어적 리듬과 현대 성가의 넓은 음향으로 이어집니다. 각 작품이 만들어진 시대와 작곡가의 선택, 가사가 지닌 문맥을 함께 살피고, 청소년 합창 특유의 투명한 음색이 서로 다른 작품을 하나의 이야기로 잇는 과정을 자세히 설명합니다. 공연을 처음 접하는 관객도 작품 사이의 흐름을 놓치지 않도록 주요 선율과 듣기 포인트, 무대 전환의 의미를 차례로 안내합니다.',
  noteDetail:
    '예매, 입장, 좌석 운영, 공연 중 촬영과 기록물 활용에 관한 안내는 상세 페이지에서 확인할 수 있으며 변경 사항은 공지사항에 즉시 반영합니다.',
  noteSummary:
    '고전과 한국 합창, 현대 성가를 잇는 프로그램의 구성 원리와 지휘자가 제안하는 감상 순서를 먼저 읽을 수 있습니다.',
  notice: {
    ...normalConcert.notice!,
    lines: [
      '공연장 운영 상황에 따라 입장 시간과 좌석 안내가 조정될 수 있습니다.',
      '변경되는 내용은 공연 상세 페이지와 공지사항에 같은 기준으로 안내합니다.',
    ],
  },
  summary:
    '서로 다른 세대와 언어의 작품을 한 무대에서 연결하며, 청소년 단원들이 긴 호흡으로 서로를 듣고 응답하는 과정을 관객과 함께 나누는 정기연주회입니다.',
  title:
    '서로 다른 시대의 목소리를 듣고,\n오늘의 투명한 합창으로 이어가는 무대',
  venue:
    '세라믹팔레스홀 콘서트홀 · 서울특별시 강남구 일원로 90, 공연장 안내 데스크',
}

const emptyConcert: HomeV4ConcertEmptyFixture = {
  actions: [
    {
      emphasis: 'primary',
      href: '/concerts',
      label: '전체 공연 일정',
    },
    {
      emphasis: 'secondary',
      href: '/notices',
      label: '공지사항',
    },
  ],
  description: '새로운 공연 일정이 확정되면 이곳에서 안내합니다.',
  eyebrow: 'CONCERTS & NEWS',
  title: '새로운 무대를 준비하고 있습니다.',
}

const fixtures: Record<HomeV4ScenarioMode, HomeV4JoinConcertFixture> = {
  normal: {
    concert: normalConcert,
    concertEmpty: emptyConcert,
    join: normalJoin,
  },
  'long-copy': {
    concert: longConcert,
    concertEmpty: emptyConcert,
    join: longJoin,
  },
  'empty-data': {
    concert: null,
    concertEmpty: emptyConcert,
    join: emptyJoin,
  },
  'reduced-motion': {
    concert: normalConcert,
    concertEmpty: emptyConcert,
    join: normalJoin,
  },
}

export function getHomeV4JoinConcertFixture(
  scenario: HomeV4ScenarioMode,
): HomeV4JoinConcertFixture {
  return fixtures[scenario]
}
