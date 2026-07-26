import {
  HOME_CONTENT_VERSION,
  type HomeContentDeprecatedKeyDefinition,
  type HomeContentSectionDefinition,
  type HomeContentSiteTextDefinition,
  type HomeContentV2,
} from '../types/homeContent'

export const HOME_CONTENT_DEFAULTS_V2: HomeContentV2 = {
  version: HOME_CONTENT_VERSION,
  heroSupplement: {
    fallbackDescription:
      '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.',
    mottoChips: ['진심을 담은 음악', '정기 연습', '공연 활동'],
  },
  quickActions: {
    items: [
      {
        id: 'join',
        code: 'JOIN',
        title: '입단 안내',
        description:
          '모집 대상, 연습 시간, 지원 절차를 확인하고 입단지원서로 이동합니다.',
        ctaLabel: '입단 안내 보기',
        href: '/join',
        displayOrder: 1,
        isVisible: true,
      },
      {
        id: 'concert',
        code: 'STAGE',
        title: '공연 일정',
        description: '정기연주회, 초청연주, 공지사항을 확인합니다.',
        ctaLabel: '공연 일정 보기',
        href: '/concerts',
        displayOrder: 2,
        isVisible: true,
      },
      {
        id: 'support',
        code: 'CONNECT',
        title: '후원·문의',
        description: '후원 상담과 일반 문의를 공식 문의 폼으로 접수합니다.',
        ctaLabel: '후원·문의 보기',
        href: '/contact?section=support#form',
        displayOrder: 3,
        isVisible: true,
      },
    ],
  },
  about: {
    eyebrowKo: '소개',
    eyebrowEn: 'ABOUT',
    title: '서울모테트청소년합창단 소개',
    paragraphs: [
      '서울모테트청소년합창단은 청소년이 합창의 기본기, 악보 읽기, 무대 경험을 체계적으로 배우는 합창교육 공동체입니다.',
      '정기 연습과 공연 활동을 통해 발성, 앙상블, 협업 태도를 함께 익힙니다.',
    ],
    ctaLabel: '합창단 소개 보기',
    globalTagline: 'Voice, learning and the stage',
    globalDescription:
      '서울에서 시작한 청소년 합창교육과 무대의 기록을 세계 관객과 공유합니다.',
  },
  choirProgram: {
    eyebrowKo: '교육',
    eyebrowEn: 'CHOIR PROGRAM',
    title: '교육과 활동',
    items: [
      {
        id: 'foundation',
        title: '창단 목적',
        description:
          '서울모테트합창단의 음악적 전통을 바탕으로 청소년 합창교육을 운영합니다.',
        displayOrder: 1,
        isVisible: true,
      },
      {
        id: 'education',
        title: '교육 목적',
        description:
          '발성, 악보 읽기, 파트 연습, 앙상블 기본기를 체계적으로 배웁니다.',
        displayOrder: 2,
        isVisible: true,
      },
      {
        id: 'performance',
        title: '연주 활동',
        description:
          '정기연주회와 초청연주, 특별 무대를 준비하며 연습의 시간을 실제 무대 경험으로 연결합니다.',
        displayOrder: 3,
        isVisible: true,
      },
      {
        id: 'growth',
        title: '단원 성장',
        description:
          '정기 연습과 공연 활동을 통해 협업 태도와 무대 경험을 쌓습니다.',
        displayOrder: 4,
        isVisible: true,
      },
    ],
  },
  joinLetter: {
    eyebrowKo: '입단',
    eyebrowEn: 'JOIN',
    title: '노래를 향한 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다',
    description:
      '모집 대상, 연습 일정, 오디션 절차를 확인한 뒤 입단지원서를 제출할 수 있습니다. 제출 후 담당자가 보호자 연락처로 안내합니다.',
    ctaLabel: '입단지원서 작성하기',
  },
  concertProgram: {
    eyebrowKo: '공연',
    eyebrowEn: 'CONCERTS & NEWS',
    title: '공연과 소식',
    description:
      '다가오는 공연의 날짜, 장소, 공지사항을 확인합니다. 공연 정보가 확정되면 이 섹션에 반영됩니다.',
    concertsCtaLabel: '공연 일정 보기',
    noticesCtaLabel: '공지사항 보기',
    detailCtaLabel: '자세히 보기',
    inquiryCtaLabel: '문의',
    noticePanelTitle: '프로그램 노트',
    noticePanelCtaLabel: '전체 보기',
    emptyConcertTitle: '등록된 공연이 없습니다',
    emptyConcertDescription:
      '새로운 공연 일정이 확정되면 이 공간에서 안내합니다.',
    emptyConcertCtaLabel: '공연 일정 보기',
    emptyNoticeTitle: '등록된 공지사항이 없습니다',
    emptyNoticeDescription:
      '새로운 공지와 합창단 소식을 준비하고 있습니다.',
    emptyNoticeCtaLabel: '공지사항 보기',
  },
  scoreBook: {
    eyebrowKo: '악보',
    cover: {
      titleLines: ['함께 부르는', '우리의 노래'],
      brandLabel: 'SEOUL MOTET YOUTH CHOIR',
    },
    leftPage: {
      titleLines: ['서로 다른 목소리로,', '같은 음악을 완성합니다'],
      body: '합창단의 교육 방향과 활동 흐름을 한 화면에서 안내합니다.',
      keywords: '발성 · 악보 · 파트',
      calloutTitle: '연습이 남기는 것',
      calloutBody:
        '한 곡을 준비하며 단원들은 음정, 박자, 발음, 호흡을 반복해서 맞춥니다.',
    },
    rightPage: {
      prefix: '공동체 연습',
      titleLines: ['파트별 역할과', '앙상블을 배웁니다'],
      body: '파트별 역할을 익히고, 다른 단원의 소리를 들으며 함께 맞춰 갑니다.',
      keywords: '앙상블 · 공연 · 안내',
      calloutTitle: '무대가 이어 주는 것',
      calloutBody:
        '연습한 곡은 정기연주회, 초청연주, 나눔 공연에서 발표됩니다.',
    },
    valueItems: [
      {
        id: 'voice',
        label: '귀 기울임',
        description: '먼저 듣는 마음',
        displayOrder: 1,
        isVisible: true,
      },
      {
        id: 'score',
        label: '어울림',
        description: '서로의 자리를 살피는 태도',
        displayOrder: 2,
        isVisible: true,
      },
      {
        id: 'part',
        label: '꾸준함',
        description: '약속한 시간을 지키는 힘',
        displayOrder: 3,
        isVisible: true,
      },
      {
        id: 'ensemble',
        label: '약속',
        description: '내 파트를 준비하는 마음',
        displayOrder: 4,
        isVisible: true,
      },
      {
        id: 'stage',
        label: '조화',
        description: '다른 소리와 함께 숨 쉬는 일',
        displayOrder: 5,
        isVisible: true,
      },
      {
        id: 'guide',
        label: '비전',
        description: '노래 너머의 삶을 바라보는 눈',
        displayOrder: 6,
        isVisible: true,
      },
    ],
    final: {
      titleLines: ['서로 다른 목소리로,', '같은 음악을 완성합니다'],
      summary:
        '체계적인 앙상블 교육과 정기 연습·공연을 통해 음악으로 함께 성장합니다.',
      primaryCtaLabel: '우리의 활동 보기',
      secondaryCtaLabel: '공연과 소식',
    },
  },
  spiritWrapper: {
    eyebrowKo: 'FIVE MOVEMENTS · MOTET SPIRIT',
    title: '서울모테트청소년합창단의 다섯 가지 정신',
    ctaLabel: '정신 자세히 보기',
  },
  archive: {
    eyebrowKo: '기록',
    eyebrowEn: 'ARCHIVE',
    title: '사진 · 영상 · 포스터',
    description: '공연 사진, 연습 사진, 영상, 포스터를 모아 확인합니다.',
    expandLabel: '기록 펼치기',
    collapseLabel: '접기',
    ctaLabel: '갤러리 보기',
    emptyTitle: '공개된 갤러리 자료가 없습니다',
    emptyDescription: '현재 공개된 공연·연습 기록이 없습니다.',
  },
  sponsors: {
    eyebrow: 'WITH OUR SUPPORTERS',
    title: '함께 세우는 손길',
    description:
      '청소년들이 안정적으로 배우고 무대에 설 수 있도록 곁에서 힘을 보태는 후원사와 협력기관입니다. 보이지 않는 응원이 연습과 공연, 다음 무대의 준비로 이어집니다.',
    ctaLabel: '후원사 전체 보기',
  },
  supportLetter: {
    eyebrowKo: '후원',
    eyebrowEn: 'SUPPORT',
    title: '후원은 청소년 합창교육과 공연 활동을 지원합니다',
    description:
      '후원은 단순한 재정 지원이 아니라 다음 세대가 음악 안에서 자신을 발견하고 함께 이어가는 법을 배우도록 돕는 동행입니다.',
    primaryCtaLabel: '후원 상담 신청',
    secondaryCtaLabel: '문의',
    pledgeEyebrow: 'PLEDGE LETTER',
    pledgeTitle: '문의 접수 안내',
    pledgeDescription:
      '공연 초청, 후원 상담, 입단 문의를 공식 문의 폼으로 접수합니다. 담당자가 확인한 뒤 이메일 또는 연락처로 안내합니다.',
  },
}

const field = (
  definition: HomeContentSiteTextDefinition,
): HomeContentSiteTextDefinition => definition

const quickFields = HOME_CONTENT_DEFAULTS_V2.quickActions.items.flatMap(
  (item, itemIndex) => {
    const base = 200 + itemIndex * 10
    const prefix = `home.quickActions.${item.id}`
    return [
      field({
        key: `${prefix}.title`,
        label: `${item.code} 카드 제목`,
        description: '홈 상단 안내 카드의 제목입니다.',
        inputType: 'text',
        defaultValue: item.title,
        sectionId: 'quickActions',
        sortOrder: base,
      }),
      field({
        key: `${prefix}.description`,
        label: `${item.code} 카드 설명`,
        description: '홈 상단 안내 카드의 설명입니다.',
        inputType: 'textarea',
        defaultValue: item.description,
        sectionId: 'quickActions',
        sortOrder: base + 1,
      }),
      field({
        key: `${prefix}.ctaLabel`,
        label: `${item.code} 카드 CTA`,
        description: '카드 아래의 이동 안내 문구입니다. 링크는 안전한 고정 경로를 사용합니다.',
        inputType: 'text',
        defaultValue: item.ctaLabel,
        sectionId: 'quickActions',
        sortOrder: base + 2,
      }),
      field({
        key: `${prefix}.displayOrder`,
        label: `${item.code} 카드 순서`,
        description: '1부터 3 사이에서 카드 표시 순서를 정합니다.',
        inputType: 'number',
        defaultValue: String(item.displayOrder),
        sectionId: 'quickActions',
        sortOrder: base + 3,
        min: 1,
        max: 3,
      }),
      field({
        key: `${prefix}.isVisible`,
        label: `${item.code} 카드 공개`,
        description: '끄면 해당 카드가 공개 홈에 표시되지 않습니다.',
        inputType: 'boolean',
        defaultValue: String(item.isVisible),
        sectionId: 'quickActions',
        sortOrder: base + 4,
      }),
    ]
  },
)

const programFields = HOME_CONTENT_DEFAULTS_V2.choirProgram.items.flatMap(
  (item, itemIndex) => {
    const base = 400 + itemIndex * 10
    const prefix = `home.choirProgram.items.${item.id}`
    return [
      field({
        key: `${prefix}.title`,
        label: `${itemIndex + 1}번 프로그램 제목`,
        description: '교육과 활동 카드의 제목입니다.',
        inputType: 'text',
        defaultValue: item.title,
        sectionId: 'choirProgram',
        sortOrder: base,
      }),
      field({
        key: `${prefix}.description`,
        label: `${itemIndex + 1}번 프로그램 설명`,
        description: '교육과 활동 카드의 설명입니다.',
        inputType: 'textarea',
        defaultValue: item.description,
        sectionId: 'choirProgram',
        sortOrder: base + 1,
      }),
      field({
        key: `${prefix}.displayOrder`,
        label: `${itemIndex + 1}번 프로그램 순서`,
        description: '1부터 4 사이에서 카드 표시 순서를 정합니다.',
        inputType: 'number',
        defaultValue: String(item.displayOrder),
        sectionId: 'choirProgram',
        sortOrder: base + 2,
        min: 1,
        max: 4,
      }),
      field({
        key: `${prefix}.isVisible`,
        label: `${itemIndex + 1}번 프로그램 공개`,
        description: '끄면 해당 프로그램 카드가 공개 홈에 표시되지 않습니다.',
        inputType: 'boolean',
        defaultValue: String(item.isVisible),
        sectionId: 'choirProgram',
        sortOrder: base + 3,
      }),
    ]
  },
)

const scoreValueFields = HOME_CONTENT_DEFAULTS_V2.scoreBook.valueItems.flatMap(
  (item, itemIndex) => {
    const base = 800 + itemIndex * 10
    const prefix = `home.scoreBook.valueItems.${item.id}`
    return [
      field({
        key: `${prefix}.label`,
        label: `${itemIndex + 1}번 가치 단어`,
        description: '악보 애니메이션에 표시되는 가치 단어입니다.',
        inputType: 'text',
        defaultValue: item.label,
        sectionId: 'scoreBook',
        sortOrder: base,
      }),
      field({
        key: `${prefix}.description`,
        label: `${itemIndex + 1}번 가치 설명`,
        description: '가치 단어 아래의 짧은 설명입니다.',
        inputType: 'text',
        defaultValue: item.description,
        sectionId: 'scoreBook',
        sortOrder: base + 1,
      }),
      field({
        key: `${prefix}.displayOrder`,
        label: `${itemIndex + 1}번 가치 순서`,
        description: '1부터 6 사이에서 표시 순서를 정합니다.',
        inputType: 'number',
        defaultValue: String(item.displayOrder),
        sectionId: 'scoreBook',
        sortOrder: base + 2,
        min: 1,
        max: 6,
      }),
      field({
        key: `${prefix}.isVisible`,
        label: `${itemIndex + 1}번 가치 공개`,
        description: '끄면 해당 가치가 애니메이션에서 제외됩니다.',
        inputType: 'boolean',
        defaultValue: String(item.isVisible),
        sectionId: 'scoreBook',
        sortOrder: base + 3,
      }),
    ]
  },
)

export const homeContentSiteTextDefinitions: HomeContentSiteTextDefinition[] = [
  field({
    key: 'home.heroSupplement.fallbackDescription',
    label: 'Hero 빈 상태 설명',
    description: '공개 Hero 슬라이드가 없을 때만 표시되는 설명입니다.',
    inputType: 'textarea',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.heroSupplement.fallbackDescription,
    sectionId: 'heroSupplement',
    sortOrder: 100,
  }),
  ...HOME_CONTENT_DEFAULTS_V2.heroSupplement.mottoChips.map((value, index) =>
    field({
      key: `home.heroSupplement.mottoChips.${index + 1}`,
      label: `Hero 공통 가치 ${index + 1}`,
      description: '모든 Hero 슬라이드 아래에 공통으로 표시됩니다.',
      inputType: 'text',
      defaultValue: value,
      sectionId: 'heroSupplement',
      sortOrder: 101 + index,
    }),
  ),
  ...quickFields,
  field({
    key: 'home.about.eyebrowKo',
    label: '소개 한글 라벨',
    description: '소개 섹션의 접근성·운영 라벨입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.eyebrowKo,
    sectionId: 'about',
    sortOrder: 300,
  }),
  field({
    key: 'home.about.eyebrowEn',
    label: '소개 영문 라벨',
    description: '소개 섹션 제목 위에 표시됩니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.eyebrowEn,
    sectionId: 'about',
    sortOrder: 301,
  }),
  field({
    key: 'home.about.title',
    label: '소개 제목',
    description: '홈 소개 섹션의 큰 제목입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.title,
    sectionId: 'about',
    sortOrder: 302,
  }),
  ...HOME_CONTENT_DEFAULTS_V2.about.paragraphs.map((value, index) =>
    field({
      key: `home.about.paragraphs.${index + 1}`,
      label: `소개 본문 ${index + 1}`,
      description: '소개 본문은 문단 단위로 표시됩니다.',
      inputType: 'textarea',
      defaultValue: value,
      sectionId: 'about',
      sortOrder: 303 + index,
    }),
  ),
  field({
    key: 'home.about.ctaLabel',
    label: '소개 CTA',
    description: '합창단 소개 페이지로 이동하는 버튼 문구입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.ctaLabel,
    sectionId: 'about',
    sortOrder: 305,
  }),
  field({
    key: 'home.about.globalTagline',
    label: 'Global Identity tagline',
    description: 'Global Identity Plate의 영문 tagline입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.globalTagline,
    sectionId: 'about',
    sortOrder: 306,
  }),
  field({
    key: 'home.about.globalDescription',
    label: 'Global Identity 설명',
    description: 'Global Identity Plate에 표시되는 설명입니다.',
    inputType: 'textarea',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.about.globalDescription,
    sectionId: 'about',
    sortOrder: 307,
  }),
  field({
    key: 'home.choirProgram.eyebrowKo',
    label: '교육과 활동 한글 라벨',
    description: '교육과 활동 영역의 운영 라벨입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.choirProgram.eyebrowKo,
    sectionId: 'choirProgram',
    sortOrder: 390,
  }),
  field({
    key: 'home.choirProgram.eyebrowEn',
    label: '교육과 활동 영문 라벨',
    description: '교육과 활동 영역 제목 위에 표시됩니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.choirProgram.eyebrowEn,
    sectionId: 'choirProgram',
    sortOrder: 391,
  }),
  field({
    key: 'home.choirProgram.title',
    label: '교육과 활동 제목',
    description: '교육과 활동 카드 목록의 제목입니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.choirProgram.title,
    sectionId: 'choirProgram',
    sortOrder: 392,
  }),
  ...programFields,
  ...(
    [
      ['eyebrowKo', '입단 한글 라벨', 'text'],
      ['eyebrowEn', '입단 영문 라벨', 'text'],
      ['title', '입단 Letter 제목', 'text'],
      ['description', '입단 Letter 설명', 'textarea'],
      ['ctaLabel', '입단 Letter CTA', 'text'],
    ] as const
  ).map(([property, label, inputType], index) =>
    field({
      key: `home.joinLetter.${property}`,
      label,
      description:
        property === 'description'
          ? '실제 모집 대상·연습·절차는 입단 안내 관리에서 가져옵니다.'
          : '홈 입단 Letter에 표시되는 wrapper 문구입니다.',
      inputType,
      defaultValue: String(
        HOME_CONTENT_DEFAULTS_V2.joinLetter[property],
      ),
      sectionId: 'joinLetter',
      sortOrder: 500 + index,
    }),
  ),
  ...(
    [
      ['eyebrowKo', '공연 한글 라벨', 'text'],
      ['eyebrowEn', '공연 영문 라벨', 'text'],
      ['title', '공연과 소식 제목', 'text'],
      ['description', '공연과 소식 설명', 'textarea'],
      ['concertsCtaLabel', '공연 일정 CTA', 'text'],
      ['noticesCtaLabel', '공지사항 CTA', 'text'],
      ['detailCtaLabel', '공연 상세 CTA', 'text'],
      ['inquiryCtaLabel', '공연 문의 CTA', 'text'],
      ['noticePanelTitle', '공지 패널 제목', 'text'],
      ['noticePanelCtaLabel', '공지 패널 CTA', 'text'],
      ['emptyConcertTitle', '공연 빈 상태 제목', 'text'],
      ['emptyConcertDescription', '공연 빈 상태 설명', 'textarea'],
      ['emptyConcertCtaLabel', '공연 빈 상태 CTA', 'text'],
      ['emptyNoticeTitle', '공지 빈 상태 제목', 'text'],
      ['emptyNoticeDescription', '공지 빈 상태 설명', 'textarea'],
      ['emptyNoticeCtaLabel', '공지 빈 상태 CTA', 'text'],
    ] as const
  ).map(([property, label, inputType], index) =>
    field({
      key: `home.concertProgram.${property}`,
      label,
      description: '실제 공연·공지 내용은 각 전용 관리자 메뉴에서 가져옵니다.',
      inputType,
      defaultValue: String(
        HOME_CONTENT_DEFAULTS_V2.concertProgram[property],
      ),
      sectionId: 'concertProgram',
      sortOrder: 600 + index,
    }),
  ),
  field({
    key: 'home.scoreBook.eyebrowKo',
    label: 'MOTET SCORE 한글 라벨',
    description: '악보 애니메이션의 접근성 이름에 사용됩니다.',
    inputType: 'text',
    defaultValue: HOME_CONTENT_DEFAULTS_V2.scoreBook.eyebrowKo,
    sectionId: 'scoreBook',
    sortOrder: 700,
  }),
  field({
    key: 'home.scoreBook.cover.titleLines',
    label: '악보 표지 제목',
    description: '줄바꿈한 각 행을 그대로 표시합니다.',
    inputType: 'textarea',
    defaultValue:
      HOME_CONTENT_DEFAULTS_V2.scoreBook.cover.titleLines.join('\n'),
    sectionId: 'scoreBook',
    sortOrder: 701,
  }),
  ...(
    [
      ['leftPage.titleLines', '왼쪽 페이지 제목', 'textarea'],
      ['leftPage.body', '왼쪽 페이지 본문', 'textarea'],
      ['leftPage.keywords', '왼쪽 페이지 키워드', 'text'],
      ['leftPage.calloutTitle', '왼쪽 callout 제목', 'text'],
      ['leftPage.calloutBody', '왼쪽 callout 본문', 'textarea'],
      ['rightPage.prefix', '오른쪽 페이지 첫 제목', 'text'],
      ['rightPage.titleLines', '오른쪽 페이지 제목 행', 'textarea'],
      ['rightPage.body', '오른쪽 페이지 본문', 'textarea'],
      ['rightPage.keywords', '오른쪽 페이지 키워드', 'text'],
      ['rightPage.calloutTitle', '오른쪽 callout 제목', 'text'],
      ['rightPage.calloutBody', '오른쪽 callout 본문', 'textarea'],
      ['final.titleLines', '최종 악보 제목', 'textarea'],
      ['final.summary', '최종 악보 설명', 'textarea'],
      ['final.primaryCtaLabel', '최종 기본 CTA', 'text'],
      ['final.secondaryCtaLabel', '최종 보조 CTA', 'text'],
    ] as const
  ).map(([path, label, inputType], index) => {
    const [group, property] = path.split('.') as [
      'final' | 'leftPage' | 'rightPage',
      string,
    ]
    const groupValue = HOME_CONTENT_DEFAULTS_V2.scoreBook[group] as Record<
      string,
      string | string[]
    >
    const value = groupValue[property]
    return field({
      key: `home.scoreBook.${path}`,
      label,
      description: 'MOTET SCORE 애니메이션에 표시되는 운영 문구입니다.',
      inputType,
      defaultValue: Array.isArray(value) ? value.join('\n') : String(value),
      sectionId: 'scoreBook',
      sortOrder: 702 + index,
    })
  }),
  ...scoreValueFields,
  ...(
    [
      ['eyebrowKo', '정신 wrapper 라벨'],
      ['title', '정신 wrapper 제목'],
      ['ctaLabel', '정신 기본 CTA'],
    ] as const
  ).map(([property, label], index) =>
    field({
      key: `home.spiritWrapper.${property}`,
      label,
      description: '정신 상세 항목은 합창단 소개 관리에서 가져옵니다.',
      inputType: 'text',
      defaultValue: HOME_CONTENT_DEFAULTS_V2.spiritWrapper[property],
      sectionId: 'spiritWrapper',
      sortOrder: 900 + index,
    }),
  ),
  ...(
    [
      ['eyebrowKo', 'Archive 한글 라벨', 'text'],
      ['eyebrowEn', 'Archive 영문 라벨', 'text'],
      ['title', 'Archive 제목', 'text'],
      ['description', 'Archive 설명', 'textarea'],
      ['expandLabel', 'Archive 펼치기 문구', 'text'],
      ['collapseLabel', 'Archive 접기 문구', 'text'],
      ['ctaLabel', 'Archive CTA', 'text'],
      ['emptyTitle', 'Archive 빈 상태 제목', 'text'],
      ['emptyDescription', 'Archive 빈 상태 설명', 'textarea'],
    ] as const
  ).map(([property, label, inputType], index) =>
    field({
      key: `home.archive.${property}`,
      label,
      description: '실제 사진·영상·포스터는 각 미디어 관리 메뉴에서 가져옵니다.',
      inputType,
      defaultValue: HOME_CONTENT_DEFAULTS_V2.archive[property],
      sectionId: 'archive',
      sortOrder: 1000 + index,
    }),
  ),
  ...(
    [
      ['eyebrow', '후원사 wrapper 라벨', 'text'],
      ['title', '후원사 wrapper 제목', 'text'],
      ['description', '후원사 wrapper 설명', 'textarea'],
      ['ctaLabel', '후원사 wrapper CTA', 'text'],
    ] as const
  ).map(([property, label, inputType], index) =>
    field({
      key: `home.sponsors.${property}`,
      label,
      description: '후원사 로고·기관명·URL은 후원사 관리에서 가져옵니다.',
      inputType,
      defaultValue: HOME_CONTENT_DEFAULTS_V2.sponsors[property],
      sectionId: 'sponsors',
      sortOrder: 1100 + index,
    }),
  ),
  ...(
    [
      ['eyebrowKo', '후원 한글 라벨', 'text'],
      ['eyebrowEn', '후원 영문 라벨', 'text'],
      ['title', 'Support Letter 제목', 'text'],
      ['description', 'Support Letter 설명', 'textarea'],
      ['primaryCtaLabel', '후원 기본 CTA', 'text'],
      ['secondaryCtaLabel', '후원 보조 CTA', 'text'],
      ['pledgeEyebrow', 'Pledge Letter 라벨', 'text'],
      ['pledgeTitle', '문의 접수 안내 제목', 'text'],
      ['pledgeDescription', '문의 접수 안내 설명', 'textarea'],
    ] as const
  ).map(([property, label, inputType], index) =>
    field({
      key: `home.supportLetter.${property}`,
      label,
      description:
        '전화·주소와 후원 약정 정책은 사이트 설정/후원약정 관리에서 가져옵니다.',
      inputType,
      defaultValue: HOME_CONTENT_DEFAULTS_V2.supportLetter[property],
      sectionId: 'supportLetter',
      sortOrder: 1200 + index,
    }),
  ),
]

export const HOME_CONTENT_V2_KEYS = homeContentSiteTextDefinitions.map(
  (definition) => definition.key,
)

export const homeContentSectionDefinitions: HomeContentSectionDefinition[] = [
  {
    id: 'heroSupplement',
    title: 'Hero 보조 문구',
    description: '슬라이드별 제목·설명·CTA는 홈 슬라이드 관리가 소유합니다.',
    publicOrder: 1,
    managedElsewhere: [
      {
        label: '홈 슬라이드 관리',
        description: '이미지, 제목, 부제, 설명, CTA, 공개 순서를 수정합니다.',
        adminHref: '/admin/hero-slides',
        source: 'hero_slides',
      },
    ],
  },
  {
    id: 'quickActions',
    title: '안내 카드',
    description: '홈 상단의 세 개 빠른 이동 카드를 관리합니다.',
    publicOrder: 2,
  },
  {
    id: 'about',
    title: '합창단 소개',
    description: '소개와 Global Identity wrapper 문구를 관리합니다.',
    publicOrder: 3,
    managedElsewhere: [
      {
        label: '사이트 기본 설정',
        description: 'SNS 주소와 사이트 기본 정보를 수정합니다.',
        adminHref: '/admin/settings',
        source: 'site_settings',
      },
      {
        label: '공연 관리',
        description: 'Global Identity의 다음 무대는 공개 예정 공연에서 자동 선택됩니다.',
        adminHref: '/admin/concerts',
        source: 'concerts',
      },
    ],
  },
  {
    id: 'choirProgram',
    title: '교육과 활동',
    description: 'V2 소개 영역의 네 개 프로그램 카드를 관리합니다.',
    publicOrder: 4,
  },
  {
    id: 'joinLetter',
    title: '입단 Letter',
    description: '홈의 입단 wrapper 문구만 관리합니다.',
    publicOrder: 5,
    managedElsewhere: [
      {
        label: '입단 안내 관리',
        description: '모집 대상, 연습 시간·장소, 오디션 절차와 FAQ를 수정합니다.',
        adminHref: '/admin/join',
        source: 'join_info',
      },
    ],
  },
  {
    id: 'concertProgram',
    title: '공연과 소식',
    description: '공연·공지 wrapper와 빈 상태 문구를 관리합니다.',
    publicOrder: 6,
    managedElsewhere: [
      {
        label: '공연 관리',
        description: '공연 제목, 날짜, 장소, 포스터와 상세 내용을 수정합니다.',
        adminHref: '/admin/concerts',
        source: 'concerts',
      },
      {
        label: '공지사항 관리',
        description: '공지 제목, 본문, 중요 여부와 공개 상태를 수정합니다.',
        adminHref: '/admin/notices',
        source: 'notices',
      },
    ],
  },
  {
    id: 'scoreBook',
    title: 'MOTET SCORE',
    description: '악보 애니메이션의 의미 있는 한글 문구와 CTA를 관리합니다.',
    publicOrder: 7,
  },
  {
    id: 'spiritWrapper',
    title: '다섯 가지 정신 연결',
    description: '정신 인터랙션의 wrapper 문구만 관리합니다.',
    publicOrder: 8,
    managedElsewhere: [
      {
        label: '합창단 소개 관리',
        description: '정신 5항목의 제목, 본문, CTA와 공개 순서를 수정합니다.',
        adminHref: '/admin/about',
        source: 'about_sections',
      },
    ],
  },
  {
    id: 'archive',
    title: 'Archive',
    description: '기록 영역의 wrapper와 펼치기/접기 문구를 관리합니다.',
    publicOrder: 9,
    managedElsewhere: [
      {
        label: '갤러리 관리',
        description: '공개 사진과 순서를 수정합니다.',
        adminHref: '/admin/gallery',
        source: 'gallery',
      },
      {
        label: '영상 관리',
        description: 'YouTube 영상과 공개 순서를 수정합니다.',
        adminHref: '/admin/videos',
        source: 'videos',
      },
      {
        label: '포스터 관리',
        description: '공개 포스터와 순서를 수정합니다.',
        adminHref: '/admin/posters',
        source: 'posters',
      },
    ],
  },
  {
    id: 'sponsors',
    title: '후원사 wrapper',
    description: '공개 후원사가 있을 때만 보이는 wrapper 문구입니다.',
    publicOrder: 10,
    managedElsewhere: [
      {
        label: '후원사 관리',
        description: '로고, 기관명, URL, 공개 상태와 순서를 수정합니다.',
        adminHref: '/admin/sponsors',
        source: 'sponsors',
      },
    ],
  },
  {
    id: 'supportLetter',
    title: 'Support Letter',
    description: '홈 하단 후원·문의 wrapper 문구를 관리합니다.',
    publicOrder: 11,
    managedElsewhere: [
      {
        label: '후원약정 관리',
        description: '후원 방식, 금액, 계좌, 약정서 정책을 수정합니다.',
        adminHref: '/admin/support',
        source: 'support_settings',
      },
      {
        label: '사이트 기본 설정',
        description: '카드에 표시되는 전화·주소를 수정합니다.',
        adminHref: '/admin/settings',
        source: 'site_settings',
      },
    ],
  },
]

export const HOME_CONTENT_DEPRECATED_KEYS: Record<
  string,
  HomeContentDeprecatedKeyDefinition
> = {
  'home.hero.title': {
    policy: 'managed_elsewhere',
    reason: '슬라이드 제목은 hero_slides가 소유합니다.',
  },
  'home.hero.description': {
    replacementKey: 'home.heroSupplement.fallbackDescription',
    policy: 'migrate',
    reason: 'Hero 공통 설명은 슬라이드가 없을 때의 fallback으로만 사용합니다.',
  },
  'home.hero.subtitle': {
    replacementKey: 'home.heroSupplement.fallbackDescription',
    policy: 'migrate',
    reason: '슬라이드별 설명은 hero_slides가 소유합니다.',
  },
  'home.hero.eyebrow': {
    policy: 'fixed_design_label',
    reason: 'Hero wordmark와 상단 라벨은 고정된 브랜드 표현입니다.',
  },
  'home.hero.title.line1': {
    policy: 'fixed_design_label',
    reason: 'Hero wordmark는 고정된 브랜드 표현입니다.',
  },
  'home.hero.title.line2': {
    policy: 'fixed_design_label',
    reason: 'Hero wordmark는 고정된 브랜드 표현입니다.',
  },
  'home.hero.title.line3': {
    policy: 'fixed_design_label',
    reason: 'Hero wordmark는 고정된 브랜드 표현입니다.',
  },
  'home.hero.title.line4': {
    policy: 'fixed_design_label',
    reason: 'Hero wordmark는 고정된 브랜드 표현입니다.',
  },
  'home.hero.chip1': {
    replacementKey: 'home.heroSupplement.mottoChips.1',
    policy: 'migrate',
    reason: 'V2 Hero supplement 경로로 통합합니다.',
  },
  'home.hero.chip2': {
    replacementKey: 'home.heroSupplement.mottoChips.2',
    policy: 'migrate',
    reason: 'V2 Hero supplement 경로로 통합합니다.',
  },
  'home.hero.chip3': {
    replacementKey: 'home.heroSupplement.mottoChips.3',
    policy: 'migrate',
    reason: 'V2 Hero supplement 경로로 통합합니다.',
  },
  'home.hero.cta.primary': {
    policy: 'managed_elsewhere',
    reason: 'Hero CTA는 hero_slides가 소유합니다.',
  },
  'home.hero.cta.secondary': {
    policy: 'managed_elsewhere',
    reason: 'Hero CTA는 hero_slides가 소유합니다.',
  },
  'home.quick.1.title': {
    replacementKey: 'home.quickActions.join.title',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.1.description': {
    replacementKey: 'home.quickActions.join.description',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.2.title': {
    replacementKey: 'home.quickActions.concert.title',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.2.description': {
    replacementKey: 'home.quickActions.concert.description',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.3.title': {
    replacementKey: 'home.quickActions.support.title',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.3.description': {
    replacementKey: 'home.quickActions.support.description',
    policy: 'migrate',
    reason: '고정 슬롯 id 기반 V2 key로 이관합니다.',
  },
  'home.quick.gallery.title': {
    policy: 'deactivate',
    reason: '현재 V2는 세 개의 고정 Quick Action만 사용합니다.',
  },
  'home.quick.gallery.description': {
    policy: 'deactivate',
    reason: '현재 V2는 세 개의 고정 Quick Action만 사용합니다.',
  },
  'home.join.target': {
    policy: 'managed_elsewhere',
    reason: '모집 대상은 join_info가 소유합니다.',
  },
  'home.join.schedule': {
    policy: 'managed_elsewhere',
    reason: '연습 시간·장소는 join_info가 소유합니다.',
  },
  'home.join.process': {
    policy: 'managed_elsewhere',
    reason: '오디션 절차는 join_info가 소유합니다.',
  },
  'home.support.short.cta': {
    policy: 'deactivate',
    reason: '현재 공개 홈 consumer가 없습니다.',
  },
}
