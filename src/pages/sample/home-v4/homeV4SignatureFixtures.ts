import type { HomeV4ScenarioMode } from './homeV4SampleTypes'
import type {
  HomeV4ArchiveMediaFixture,
  HomeV4ScoreValueFixture,
  HomeV4SignatureFixture,
  HomeV4SpiritItemFixture,
} from './homeV4SignatureTypes'

const scoreValues: HomeV4ScoreValueFixture[] = [
  {
    id: 'voice',
    label: '발성',
    description: '먼저 듣는 마음',
    isVisible: true,
    displayOrder: 1,
  },
  {
    id: 'score',
    label: '악보',
    description: '서로의 자리를 살피는 태도',
    isVisible: true,
    displayOrder: 2,
  },
  {
    id: 'part',
    label: '파트',
    description: '약속한 시간을 지키는 힘',
    isVisible: true,
    displayOrder: 3,
  },
  {
    id: 'ensemble',
    label: '앙상블',
    description: '내 파트를 준비하는 마음',
    isVisible: true,
    displayOrder: 4,
  },
  {
    id: 'stage',
    label: '공연',
    description: '다른 소리와 함께 숨 쉬는 일',
    isVisible: true,
    displayOrder: 5,
  },
  {
    id: 'guidance',
    label: '안내',
    description: '노래 너머의 삶을 바라보는 눈',
    isVisible: true,
    displayOrder: 6,
  },
]

const spiritItems: HomeV4SpiritItemFixture[] = [
  {
    id: 'motet',
    label: '모테트',
    englishLabel: 'MOTET',
    homeSummary:
      '정통 합창음악과 교회음악의 뿌리를 다음 세대의 언어로 이어갑니다.',
    isVisible: true,
    displayOrder: 1,
  },
  {
    id: 'honest',
    label: '정직한 음악',
    englishLabel: 'HONEST',
    homeSummary: '기교보다 진실한 소리와 바른 음악적 태도를 배웁니다.',
    isVisible: true,
    displayOrder: 2,
  },
  {
    id: 'sacred',
    label: '교회음악',
    englishLabel: 'SACRED',
    homeSummary: '찬송과 교회음악 안에 담긴 의미와 전통을 이해합니다.',
    isVisible: true,
    displayOrder: 3,
  },
  {
    id: 'together',
    label: '공동체',
    englishLabel: 'TOGETHER',
    homeSummary: '서로의 소리를 들으며 책임과 배려를 함께 익힙니다.',
    isVisible: true,
    displayOrder: 4,
  },
  {
    id: 'future',
    label: '다음 세대',
    englishLabel: 'FUTURE',
    homeSummary: '음악과 무대 경험을 통해 다음 세대의 가능성을 키웁니다.',
    isVisible: true,
    displayOrder: 5,
  },
]

const archiveMedia: HomeV4ArchiveMediaFixture[] = [
  {
    id: 'winter-camp',
    kind: 'photo',
    title: '겨울 수련회에서 함께 맞춘 첫 화음',
    description: '연습과 교제의 시간을 기록한 사진입니다.',
    thumbnailUrl: '/images/hero/hero-01.svg',
    thumbnailAlt: '서울모테트청소년합창단 활동 사진 샘플',
    mediaUrl: '/images/hero/hero-01.svg',
    displayOrder: 1,
    isVisible: true,
  },
  {
    id: 'concert-film',
    kind: 'video',
    title: '정기연주회 무대 기록 영상',
    description: '합창단의 공연 분위기를 확인하는 영상 샘플입니다.',
    thumbnailUrl: '/images/hero/hero-02.svg',
    thumbnailAlt: '서울모테트청소년합창단 공연 영상 미리보기 샘플',
    mediaUrl: 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
    displayOrder: 2,
    isVisible: true,
  },
  {
    id: 'concert-poster',
    kind: 'poster',
    title: '정기연주회 포스터 아카이브',
    description: '무대의 주제와 시간을 간직한 포스터 기록입니다.',
    thumbnailUrl: '/images/placeholders/poster-placeholder.svg',
    thumbnailAlt: '서울모테트청소년합창단 공연 포스터 샘플',
    mediaUrl: '/images/placeholders/poster-placeholder.svg',
    displayOrder: 3,
    isVisible: true,
  },
]

const normalFixture: HomeV4SignatureFixture = {
  score: {
    eyebrow: 'MOTET SCORE',
    cover: {
      title: '서로 다른 목소리로,\n같은 음악을 완성합니다',
      subtitle: '한 사람의 소리에서 함께 부르는 음악으로',
      editionLabel: 'SEOUL MOTET YOUTH CHOIR',
    },
    spread: {
      leftTitle: '발성 · 악보 · 파트',
      leftBody:
        '한 곡을 준비하며 단원들은\n음정, 박자, 발음과 호흡을 반복해서 맞춥니다.',
      leftCallout: '파트별 역할과 앙상블을 배웁니다',
      rightTitle: '앙상블 · 공연 · 안내',
      rightBody:
        '다른 단원의 소리를 들으며 함께 맞춘 음악은\n정기연주회와 초청·나눔 공연으로 이어집니다.',
      rightCallout: '연습한 음악이 무대의 경험으로 이어집니다',
    },
    values: scoreValues,
    final: {
      title: '함께 부르는 우리의 노래',
      description:
        '체계적인 앙상블 교육과 정기 연습·공연을 통해\n음악으로 함께 성장합니다.',
      ctas: [
        {
          label: '우리의 활동 보기',
          href: '/about?section=program',
          emphasis: 'primary',
        },
        {
          label: '공연과 소식',
          href: '/concerts',
          emphasis: 'secondary',
        },
      ],
    },
  },
  spirit: {
    eyebrow: 'MOTET SPIRIT · 05 MOVEMENTS',
    title: '다섯 개의 정신이\n하나의 음악을 이룹니다',
    description:
      '정직한 음악과 교회음악의 바른 이상을 배우며, 서로의 소리를 듣고 다음 세대의 무대를 함께 만듭니다.',
    items: spiritItems,
    cta: {
      label: '합창단 정신 자세히 보기',
      href: '/spirit',
    },
  },
  archive: {
    eyebrow: 'ARCHIVE · STAGE RECORDS',
    title: '기록으로 이어지는 우리의 무대',
    description: '공연 사진, 연습 기록, 영상과 포스터를 한곳에서 확인합니다.',
    media: archiveMedia,
    galleryHref: '/gallery',
    galleryLabel: '갤러리 보기',
    emptyMessage: '새로운 기록을 준비하고 있습니다.',
  },
}

const longCopyFixture: HomeV4SignatureFixture = {
  score: {
    ...normalFixture.score,
    cover: {
      ...normalFixture.score.cover,
      title:
        '서로 다른 목소리가 서로를 충분히 듣고 기다리며,\n한 편의 깊고 정직한 음악을 함께 완성합니다',
      subtitle:
        '악보를 읽는 시간부터 공연의 마지막 호흡까지 이어지는 서울모테트청소년합창단의 배움',
    },
    spread: {
      leftTitle: '발성 · 악보 읽기 · 파트별 연습과 음악적 약속',
      leftBody:
        '한 곡을 준비하는 동안 단원들은 바른 자세와 호흡, 정확한 음정과 박자, 언어의 발음과 프레이즈를 차근차근 반복합니다. 각자의 파트를 충분히 준비하는 책임이 함께 부르는 음악의 출발점임을 배웁니다.',
      leftCallout:
        '파트별 역할을 이해하고 서로 다른 음역이 하나의 앙상블을 이루는 과정을 익힙니다',
      rightTitle: '앙상블 · 정기연주회 · 초청과 나눔의 무대',
      rightBody:
        '다른 단원의 소리를 세심하게 들으며 맞춘 음악은 정기연주회와 초청 공연, 교회와 지역사회를 향한 나눔의 무대로 이어집니다. 무대의 경험을 통해 음악 안에서 협력하고 책임지는 태도를 함께 키웁니다.',
      rightCallout:
        '연습실에서 함께 만든 음악이 관객과 만나는 실제 무대의 경험으로 이어집니다',
    },
    final: {
      ...normalFixture.score.final,
      title: '함께 부르는 시간은 각자의 가능성을 발견하고 서로를 존중하는 우리의 노래가 됩니다',
      description:
        '체계적인 발성·악보·앙상블 교육과 꾸준한 정기 연습, 다양한 공연 경험을 통해 청소년이 음악 안에서 자신을 발견하고 공동체와 함께 성장합니다.',
    },
  },
  spirit: {
    ...normalFixture.spirit,
    description:
      '서울모테트청소년합창단이 음악을 배우고 무대를 준비하며 공동체로 성장하는 과정에는 다섯 가지 정신이 함께 흐릅니다. 각각의 가치는 독립된 문장이 아니라 연습과 공연, 일상의 태도를 연결하는 하나의 약속입니다.',
    items: spiritItems.map((item) => ({
      ...item,
      homeSummary: `${item.homeSummary} 연습실에서 각자의 파트를 책임 있게 준비하고, 무대에서는 다른 목소리와 호흡을 세심하게 맞추며 이 가치를 실제 경험으로 이어갑니다.`,
    })),
  },
  archive: {
    ...normalFixture.archive,
    title: '연습실에서 시작해 무대와 관객의 기억으로 오래 이어지는 우리의 기록',
    description:
      '정기연주회와 초청 공연, 파트 연습과 합숙, 포스터와 영상처럼 합창단의 시간을 보여 주는 다양한 기록을 한곳에서 차분히 살펴볼 수 있습니다.',
    media: archiveMedia.map((media) => ({
      ...media,
      title: `${media.title} — 서로의 소리를 듣고 한 무대를 준비한 시간의 긴 기록`,
      description: `${media.description} 당시의 연습 과정과 공연 맥락을 함께 이해할 수 있도록 설명을 충분히 담았습니다.`,
    })),
    galleryLabel: '전체 합창단 활동 기록 살펴보기',
  },
}

const emptyDataFixture: HomeV4SignatureFixture = {
  score: {
    ...normalFixture.score,
    cover: {
      title: normalFixture.score.cover.title,
      editionLabel: normalFixture.score.cover.editionLabel,
    },
    spread: {
      ...normalFixture.score.spread,
      leftCallout: undefined,
    },
    values: scoreValues
      .filter((item) => !['part', 'guidance'].includes(item.id))
      .map((item, index) => ({ ...item, displayOrder: index + 1 })),
    final: {
      ...normalFixture.score.final,
      ctas: normalFixture.score.final.ctas.filter(
        (cta) => cta.emphasis === 'primary',
      ),
    },
  },
  spirit: {
    ...normalFixture.spirit,
    items: [
      ...spiritItems.filter((item) => item.id !== 'sacred'),
      {
        id: 'missing-copy',
        label: '표시하지 않을 항목',
        englishLabel: 'OMITTED',
        isVisible: true,
        displayOrder: 99,
      },
    ],
  },
  archive: {
    ...normalFixture.archive,
    media: archiveMedia
      .filter((media) => media.kind === 'video')
      .map((media) => ({ ...media, displayOrder: 1 })),
  },
}

export const homeV4SignatureFixtures = {
  normal: normalFixture,
  'long-copy': longCopyFixture,
  'empty-data': emptyDataFixture,
  'reduced-motion': normalFixture,
} satisfies Record<HomeV4ScenarioMode, HomeV4SignatureFixture>

export function getHomeV4SignatureFixture(
  scenario: HomeV4ScenarioMode,
): HomeV4SignatureFixture {
  return homeV4SignatureFixtures[scenario]
}
