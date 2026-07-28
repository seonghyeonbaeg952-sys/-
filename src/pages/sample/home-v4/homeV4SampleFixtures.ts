import type { HomeV4SampleFixture } from './homeV4SampleTypes'

const normalFixture: HomeV4SampleFixture = {
  quickActions: [
    {
      code: 'JOIN',
      title: '입단 안내',
      description: '모집 대상과 입단 절차를 확인합니다.',
      href: '/join',
      isVisible: true,
      displayOrder: 1,
    },
    {
      code: 'SCHEDULE',
      title: '공연 일정',
      description: '예정된 공연과 새로운 소식을 확인합니다.',
      href: '/concerts',
      isVisible: true,
      displayOrder: 2,
    },
    {
      code: 'CONTACT',
      title: '후원·문의',
      description: '공식 문의와 후원 참여 방법을 안내합니다.',
      href: '/contact?section=support',
      isVisible: true,
      displayOrder: 3,
    },
  ],
  about: {
    eyebrow: 'ABOUT · IDENTITY',
    title: '서울모테트청소년합창단 소개',
    paragraphs: [
      '서울모테트청소년합창단은 청소년이 합창의 기본기와 악보 읽기, 무대 경험을 체계적으로 배우는 합창교육 공동체입니다.',
      '정기 연습과 공연을 통해 발성, 앙상블, 경청과 협업의 태도를 함께 익히며 음악 안에서 다음 세대의 목소리를 키웁니다.',
    ],
    ctaLabel: '합창단 소개 보기',
    ctaHref: '/about',
    imageUrl: '/images/hero/hero-01.svg',
    imageAlt: '무대 조명과 함께 부르는 목소리를 상징한 서울모테트청소년합창단 이미지',
    facts: [
      {
        label: 'FOUNDED',
        value: '2014',
        isVisible: true,
        displayOrder: 1,
      },
      {
        label: 'BASE',
        value: 'SEOUL, KOREA',
        isVisible: true,
        displayOrder: 2,
      },
      {
        label: 'FOCUS',
        value: 'CHORAL EDUCATION',
        isVisible: true,
        displayOrder: 3,
      },
      {
        label: 'STAGE',
        value: 'CONCERT & EXCHANGE',
        isVisible: true,
        displayOrder: 4,
      },
    ],
  },
  programItems: [
    {
      number: '01',
      title: '창단 목적',
      description: '정통 합창교육의 가치와 바른 음악의 태도를 다음 세대에 전합니다.',
      isVisible: true,
      displayOrder: 1,
    },
    {
      number: '02',
      title: '교육 과정',
      description: '발성부터 악보 읽기, 파트 연습과 앙상블까지 단계적으로 익힙니다.',
      isVisible: true,
      displayOrder: 2,
    },
    {
      number: '03',
      title: '무대 경험',
      description: '정기 연습의 시간을 정기연주회와 초청 무대의 실제 경험으로 연결합니다.',
      isVisible: true,
      displayOrder: 3,
    },
    {
      number: '04',
      title: '단원 성장',
      description: '서로의 목소리를 경청하고 자신의 역할을 책임지는 공동체의 태도를 배웁니다.',
      isVisible: true,
      displayOrder: 4,
    },
  ],
}

const longCopyFixture: HomeV4SampleFixture = {
  quickActions: [
    {
      code: 'JOIN · NEXT VOICE',
      title: '입단 준비와 보호자 안내 확인',
      description:
        '합창단의 모집 대상, 정기 연습 일정, 보호자 안내와 상담 절차를 처음 방문한 보호자도 순서대로 이해할 수 있도록 자세히 안내합니다.',
      href: '/join',
      isVisible: true,
      displayOrder: 1,
    },
    {
      code: 'CONCERT · NEWS',
      title: '공연 일정과 새로운 활동 소식',
      description:
        '정기연주회와 초청 공연, 합창단의 교육 활동 소식을 날짜와 장소 중심으로 확인하고 필요한 상세 안내까지 이어서 살펴볼 수 있습니다.',
      href: '/concerts',
      isVisible: true,
      displayOrder: 2,
    },
    {
      code: 'SUPPORT · CONTACT',
      title: '후원 참여와 공식 문의 방법',
      description:
        '청소년 합창교육을 응원하는 후원 참여 방법과 공연 초청, 입단 상담, 일반 문의를 공식 창구에서 안전하게 접수하는 방법을 안내합니다.',
      href: '/contact?section=support',
      isVisible: true,
      displayOrder: 3,
    },
  ],
  about: {
    eyebrow: 'ABOUT · IDENTITY',
    title: '정직한 음악과 함께 부르는 공동체를 다음 세대의 무대로 이어가는 합창단',
    paragraphs: [
      '서울모테트청소년합창단은 청소년이 발성과 악보 읽기, 파트 연습, 앙상블의 기본기를 체계적으로 배우면서 서로 다른 목소리를 듣고 조율하는 공동체적 태도를 함께 익히도록 돕습니다.',
      '정기 연습과 공연 준비, 무대 경험을 통해 음악적 성취뿐 아니라 경청과 책임, 협업의 태도를 실제 활동 안에서 반복해서 경험하고 다음 세대의 음악가로 성장합니다.',
    ],
    ctaLabel: '합창단의 교육과 활동 확인',
    ctaHref: '/about',
    imageUrl: '/images/hero/hero-01.svg',
    imageAlt: '서울모테트청소년합창단의 배움과 무대를 상징한 추상 이미지',
    facts: [
      {
        label: 'FOUNDED',
        value: '2014 · 청소년 합창교육을 위한 첫걸음',
        isVisible: true,
        displayOrder: 1,
      },
      {
        label: 'BASE',
        value: 'SEOUL, KOREA',
        isVisible: true,
        displayOrder: 2,
      },
      {
        label: 'FOCUS',
        value: 'CHORAL EDUCATION',
        isVisible: true,
        displayOrder: 3,
      },
      {
        label: 'STAGE',
        value: 'CONCERT & EXCHANGE',
        isVisible: true,
        displayOrder: 4,
      },
    ],
  },
  programItems: [
    {
      number: '01',
      title: '정통 합창교육을 다음 세대로 잇는 창단 목적',
      description:
        '교회음악과 정통 합창의 가치를 바탕으로 청소년이 음악의 원리를 정직하게 배우고, 함께 소리 내는 기쁨을 다음 세대에 이어가도록 돕습니다.',
      isVisible: true,
      displayOrder: 1,
    },
    {
      number: '02',
      title: '발성부터 앙상블까지 이어지는 교육 과정',
      description:
        '기본 발성과 악보 읽기를 시작으로 파트 연습, 리듬과 음정 훈련, 앙상블까지 단계적으로 익히며 자신의 소리를 건강하게 다듬습니다.',
      isVisible: true,
      displayOrder: 2,
    },
    {
      number: '03',
      title: '연습의 시간을 실제 무대로 잇는 연주 활동',
      description:
        '정기연주회와 초청 공연을 준비하며 반복한 연습을 실제 무대 경험으로 연결하고, 관객과 음악을 나누는 책임 있는 태도를 배웁니다.',
      isVisible: true,
      displayOrder: 3,
    },
    {
      number: '04',
      title: '경청과 책임으로 함께 자라는 단원 성장',
      description:
        '서로 다른 목소리를 존중하고 자신의 파트를 책임지며, 협업과 배려를 음악 안에서 실천하는 건강한 공동체 구성원으로 성장합니다.',
      isVisible: true,
      displayOrder: 4,
    },
  ],
}

const emptyDataFixture: HomeV4SampleFixture = {
  quickActions: normalFixture.quickActions.map((action) => ({
    ...action,
    isVisible: action.code !== 'SCHEDULE',
  })),
  about: {
    ...normalFixture.about,
    imageUrl: undefined,
    imageAlt: undefined,
    facts: normalFixture.about.facts.map((fact) => ({
      ...fact,
      isVisible: fact.label !== 'STAGE',
    })),
  },
  programItems: normalFixture.programItems.map((item) => ({
    ...item,
    isVisible: item.number !== '03',
  })),
}

export const homeV4SampleFixtures = {
  normal: normalFixture,
  longCopy: longCopyFixture,
  emptyData: emptyDataFixture,
} as const
