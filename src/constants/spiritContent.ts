import type { AboutSectionRow } from '../types/cms'

export type SpiritCopy = {
  body: string
  ctaLabel?: string
  ctaUrl?: string
  eyebrow: string
  quote?: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  subtitle?: string
  title: string
}

export type SpiritValue = {
  description: string
  number?: string
  summary?: string
  title: string
}

export type SpiritManifestoCopy = {
  eyebrow: string
  paragraphs: string[]
  title: string
}

export type ScriptureCard = {
  label: string
  note: string
  text: string
}

export type SongOfMemoryCopy = {
  eyebrow: string
  lead: string
  paragraphs: string[]
  scriptureCards: ScriptureCard[]
  title: string
}

export type LegacyFlowStep = {
  body: string
  title: string
  year: string
}

export type VoiceConstellationCopy = {
  centerLabel: string
  closing: string
  eyebrow: string
  lead: string
  title: string
  voices: Array<{
    meaning: string
    part: string
  }>
}

export type EducationJourneyStep = {
  body: string
  step: string
  title: string
}

export type JoinSpiritCopy = {
  body: string
  ctaLabel: string
  eyebrow: string
  points: string[]
  title: string
}

export type SupportSpiritCopy = {
  body: string
  eyebrow: string
  impactCards: Array<{
    body: string
    title: string
  }>
  notice: string
  title: string
}

export const defaultSpiritHero: SpiritCopy = {
  eyebrow: 'Motet Spirit',
  title: '정직한 음악으로\n다음 세대를 세웁니다',
  body:
    '서울모테트청소년합창단은 서울모테트합창단의 예술적·신앙적 전통을 바탕으로, 합창을 통해 지성·인성·영성·공동체성을 함께 배워가는 다음세대 음악교육 공동체입니다.',
  ctaLabel: '합창단 정신 보기',
  ctaUrl: '/spirit',
  secondaryCtaLabel: '입단 안내',
  secondaryCtaUrl: '/join',
}

export const defaultMotetMeaning: SpiritCopy = {
  eyebrow: 'The Name Motet',
  title: '모테트라는 이름에는\n정통 합창음악의 뿌리가 담겨 있습니다.',
  body:
    '모테트는 중세와 르네상스 이후 발전해 온 다성음악 전통을 상징하는 말이며, 교회음악과 합창음악의 뿌리를 떠올리게 하는 이름입니다. 서울모테트의 이름은 단순한 명칭이 아니라, 순수 합창음악과 교회음악의 전통을 연구하고 계승하며 다음 세대에 전하고자 하는 사명을 담고 있습니다.',
  quote:
    '우리는 오래된 전통을 보존하는 데 머무르지 않습니다. 그 전통을 오늘의 청소년이 배우고, 부르고, 삶으로 이어 가도록 돕습니다.',
}

export const defaultEducationCopy: SpiritCopy = {
  eyebrow: 'Our Spirit',
  title: '합창은 소리를 맞추는 일을 넘어,\n사람을 세우는 교육입니다.',
  body:
    '서울모테트청소년합창단의 정신은 더 크게 부르는 데 있지 않습니다. 더 정직하게 듣고, 더 깊이 해석하며, 함께 하나의 울림을 만들어 가는 데 있습니다.\n\n우리는 합창을 통해 자신의 소리를 조율하고, 타인의 소리를 존중하며, 하나의 음악을 위해 함께 책임지는 법을 배웁니다.',
}

export const defaultPeaceCopy: SpiritCopy = {
  eyebrow: 'MISSION',
  title: '노래는 다음 세대의 기억이 됩니다.',
  body:
    '서울모테트청소년합창단은 합창을 통해 음악적 재능만이 아니라, 신앙의 기억과 공동체적 책임, 삶의 방향을 다음 세대 안에 심는 일을 사명으로 삼습니다.',
}

export const defaultSpiritCta: SpiritCopy = {
  eyebrow: 'JOIN THE HARMONY',
  title: '함께 부르는 다음 세대의 울림에 동참하세요.',
  body:
    '입단은 청소년에게 성장의 자리가 되고, 후원은 그 성장을 가능하게 하는 동행이 됩니다.',
  ctaLabel: '입단 안내',
  ctaUrl: '/join',
  secondaryCtaLabel: '후원 참여',
  secondaryCtaUrl: '/contact?section=support',
}

export const spiritMottoBadges = [
  '정직한 음악',
  '교회음악의 바른 이상',
  '함께 듣는 마음',
  '다음세대의 울림',
  '지성 · 인성 · 영성',
]

export const spiritManifestoCopy: SpiritManifestoCopy = {
  eyebrow: 'Our Spirit',
  title: '합창은 소리를 맞추는 일을 넘어,\n사람을 세우는 교육입니다.',
  paragraphs: [
    '서울모테트청소년합창단의 정신은 더 크게 부르는 데 있지 않습니다. 더 정직하게 듣고, 더 깊이 해석하며, 함께 하나의 울림을 만들어 가는 데 있습니다.',
    '우리는 합창을 통해 자신의 소리를 조율하고, 타인의 소리를 존중하며, 하나의 음악을 위해 함께 책임지는 법을 배웁니다.',
    '음악은 단순한 기술이나 공연의 결과가 아니라, 말씀과 진리, 아름다움과 공동체를 삶 속에서 배우게 하는 교육의 통로입니다.',
    '서울모테트청소년합창단은 서울모테트합창단이 오랜 시간 지켜 온 정직한 음악, 교회음악의 바른 이상, 작품 앞에서의 성실함, 공동체적 책임의 정신을 다음 세대의 언어로 이어갑니다.',
  ],
}

export const spiritValues: SpiritValue[] = [
  {
    number: '01',
    title: '정직한 음악',
    summary: '작품 앞에서 성실하게, 한 음 앞에서 진실하게',
    description:
      '서울모테트의 음악 정신은 악보와 작품, 가사와 메시지 앞에서 정직한 태도를 갖는 데서 시작됩니다. 상업적 흥행이나 과시보다 작품의 본질과 진정성을 우선하며, 청소년들은 이 과정을 통해 성실함과 책임감을 배웁니다.',
  },
  {
    number: '02',
    title: '교회음악의 바른 이상',
    summary: '찬송과 교회음악을 삶의 고백으로 배우다',
    description:
      '교회음악은 예배 분위기를 만드는 장식이 아니라, 말씀과 신앙의 내용을 음악이라는 언어로 해석하고 선포하는 통로입니다. 서울모테트청소년합창단은 찬송과 교회음악을 통해 신앙을 지식이 아닌 살아 있는 고백으로 배우도록 돕습니다.',
  },
  {
    number: '03',
    title: '함께 부르는 공동체',
    summary: '나의 소리보다 우리의 울림을 먼저 듣는 훈련',
    description:
      '합창은 혼자 완성할 수 없는 예술입니다. 단원들은 서로의 호흡과 음색을 경청하고, 자신의 역할을 책임 있게 감당하며, 하나의 하모니를 위해 배려와 절제를 배웁니다. 이 경험은 공동체 안에서 자신이 필요한 존재임을 깨닫게 합니다.',
  },
  {
    number: '04',
    title: '다음 세대 교육',
    summary: '음악으로 인성을, 찬송으로 신앙을 세우다',
    description:
      '서울모테트청소년합창단은 음악적 재능만을 계발하는 곳이 아닙니다. 합창을 통해 신앙과 인성을 겸비한 다음 세대를 세우고, 예술성·영성·공동체성·미래 비전을 함께 길러 가는 전인적 음악교육의 장입니다.',
  },
]

export const spiritTimeline = [
  '호흡을 맞추는 연습',
  '서로를 듣는 앙상블',
  '무대에서 전하는 울림',
  '삶으로 이어지는 나눔',
]

export const songOfMemoryCopy: SongOfMemoryCopy = {
  eyebrow: 'Song of Memory',
  title: '노래는 다음 세대의 기억이 됩니다.',
  lead:
    '서울모테트청소년합창단은 “후대에 노래를 가르치라”는 부르심 앞에서 시작된 다음세대 합창교육 공동체입니다.',
  paragraphs: [
    '노래는 단순한 예술 활동이 아닙니다. 공동체가 믿고 고백해 온 신앙과 역사, 정체성을 다음 세대의 마음에 새기는 교육의 언어입니다.',
    '청소년기의 민감하고 형성적인 시간에 말씀의 노래를 배우고 함께 부른다는 것은, 신앙을 지식이 아닌 체험으로, 교리를 살아 있는 고백으로 내면화하는 과정입니다.',
    '서울모테트청소년합창단은 합창을 통해 음악적 재능만이 아니라, 신앙의 기억과 공동체적 책임, 삶의 방향을 다음 세대 안에 심는 일을 사명으로 삼습니다.',
  ],
  scriptureCards: [
    {
      label: '신명기 31:19',
      text: '이 노래를 써서 이스라엘 자손들에게 가르쳐 그들의 입으로 부르게 하라',
      note: '노래를 통해 신앙과 기억을 다음 세대에 새기라는 명령',
    },
    {
      label: '사사기 2:10',
      text: '그 후에 일어난 다른 세대는 여호와를 알지 못하였다',
      note: '신앙과 기억의 계승이 멈출 때 다음 세대가 잃어버릴 수 있는 것에 대한 경고',
    },
  ],
}

export const legacyFlowSteps: LegacyFlowStep[] = [
  {
    year: '1989',
    title: '서울모테트합창단의 시작',
    body:
      '순수 합창음악과 교회음악의 바른 방향을 세우고자 한 전문 음악가들의 자발적 헌신에서 서울모테트합창단의 여정이 시작되었습니다.',
  },
  {
    year: '2014',
    title: '서울모테트음악재단과 청소년합창단',
    body:
      '서울모테트합창단 창단 25주년을 계기로 음악과 신앙, 인성을 통합한 다음세대 합창교육의 사명이 제도적으로 확장되었습니다.',
  },
  {
    year: '현재',
    title: '청소년 합창교육 공동체',
    body:
      '청소년들은 정통 레퍼토리와 교회음악, 봉사 연주와 국제교류를 통해 예술성·영성·인성·공동체성을 함께 배웁니다.',
  },
  {
    year: '미래',
    title: '다음 세대의 울림',
    body:
      '합창은 청소년이 자신의 목소리를 발견하고, 이웃의 소리를 들으며, 세계를 향한 책임과 평화의 비전을 품게 하는 교육의 길이 됩니다.',
  },
]

export const voiceConstellationCopy: VoiceConstellationCopy = {
  eyebrow: 'Voice Constellation',
  title: '서로 다른 목소리가\n하나의 공동체가 됩니다.',
  lead:
    '합창은 나의 소리를 크게 내는 훈련이 아니라, 타인의 소리를 듣고 나의 자리를 조율하는 공동체의 예술입니다.',
  centerLabel: '하나의 울림',
  voices: [
    { part: '소프라노', meaning: '밝은 선율, 시작하는 용기' },
    { part: '알토', meaning: '깊은 균형, 보이지 않는 지지' },
    { part: '테너', meaning: '연결과 확장' },
    { part: '베이스', meaning: '기초와 책임' },
    { part: '스태프', meaning: '섬김과 질서' },
  ],
  closing:
    '혼자 부르면 소리입니다. 함께 들으면 화음이 됩니다. 서로를 들을 때, 공동체가 됩니다.',
}

export const educationJourneySteps: EducationJourneyStep[] = [
  {
    step: '듣기',
    title: '먼저 듣는 사람으로 자랍니다',
    body:
      '합창은 자신의 소리를 내기 전에 다른 사람의 호흡과 음색을 듣는 법을 가르칩니다.',
  },
  {
    step: '해석하기',
    title: '음악 안의 뜻을 배웁니다',
    body:
      '단원들은 가사와 작품의 역사, 신학적 의미와 음악적 구조를 함께 배우며 노래의 깊이를 이해합니다.',
  },
  {
    step: '조율하기',
    title: '나의 소리를 공동체 안에 맞춥니다',
    body:
      '내 목소리의 크기와 색깔을 조절하며, 전체 하모니를 위해 자신을 절제하는 법을 배웁니다.',
  },
  {
    step: '책임지기',
    title: '한 음과 한 약속을 책임집니다',
    body:
      '악보에 대한 성실한 준비, 연습 시간의 약속, 파트 안에서의 역할을 통해 책임 있는 태도를 기릅니다.',
  },
  {
    step: '섬기기',
    title: '무대 밖에서도 음악을 나눕니다',
    body:
      '봉사 연주와 나눔의 자리에서 음악이 이웃을 위로하고 공동체를 세우는 통로가 될 수 있음을 경험합니다.',
  },
  {
    step: '비전 갖기',
    title: '세계를 향한 평화의 노래를 배웁니다',
    body:
      '국제교류와 비전트립을 통해 청소년들은 합창이 평화와 화해의 메시지를 전하는 예술의 언어가 될 수 있음을 배웁니다.',
  },
]

export const conductorPhilosophyCopy: SpiritCopy = {
  eyebrow: 'Educational Philosophy',
  title: '지휘자는 소리를 맞추는 사람이 아니라,\n공동체가 하나의 방향을 바라보게 하는 교육자입니다.',
  body:
    '서울모테트청소년합창단의 지휘는 정확한 음악적 기량만을 요구하지 않습니다. 서로를 경청하는 태도, 책임 의식, 약속의 준수, 작품과 신앙 앞에서의 성실함을 함께 가르치는 교육의 과정입니다.',
  quote:
    '높은 기준은 압박이 아니라, 성실한 습관과 경건한 태도를 길러 가는 성장의 길입니다.',
}

export const accompanistRoleCopy = {
  body:
    '반주는 단순히 선율을 따라가는 역할이 아닙니다. 단원들의 호흡을 세우고, 음악적 균형을 붙들며, 연습과 무대의 안정감을 함께 만들어 가는 교육적 동행입니다.',
  eyebrow: 'With the Choir',
  roles: ['호흡', '음악적 균형', '연습의 안정감', '무대의 동행'],
  title: '반주자는 노래의 뒤에 머무는 사람이 아니라,\n청소년의 호흡과 성장을 함께 지지하는 동행자입니다.',
}

export const joinSpiritCopy: JoinSpiritCopy = {
  eyebrow: 'Join the Choir',
  title: '노래를 잘하는 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다.',
  body:
    '서울모테트청소년합창단은 합창을 통해 청소년이 자신의 소리를 발견하고, 타인의 소리를 존중하며, 공동체 안에서 책임 있게 성장하도록 돕습니다.',
  points: [
    '정통 합창 레퍼토리와 교회음악을 깊이 있게 배웁니다.',
    '연습과 무대를 통해 성실함, 책임감, 공동체성을 기릅니다.',
    '봉사 연주와 국제교류를 통해 음악의 나눔과 평화의 가치를 경험합니다.',
  ],
  ctaLabel: '입단 안내 확인하기',
}

export const supportSpiritCopy: SupportSpiritCopy = {
  eyebrow: 'Support the Next Voice',
  title: '한 사람의 목소리가 자라기 위해서는\n보이지 않는 많은 손길이 필요합니다.',
  body:
    '후원은 단순한 재정 지원이 아닙니다. 다음 세대가 음악 안에서 자신을 발견하고, 함께 살아가는 법을 배우며, 신앙과 인성을 겸비한 사람으로 성장하도록 돕는 동행입니다.',
  notice:
    '현재 후원 기능은 온라인 결제가 아니라 후원약정 접수입니다. 제출된 약정서는 관리자 확인 후 안내 절차에 따라 관리됩니다.',
  impactCards: [
    {
      title: '교육을 위한 후원',
      body:
        '악보, 연습, 교육 자료와 프로그램을 준비하여 청소년들이 깊이 있는 음악교육을 받을 수 있도록 돕습니다.',
    },
    {
      title: '무대를 위한 후원',
      body:
        '정기연주회와 봉사 연주, 다양한 무대 경험을 통해 청소년들이 책임감과 자신감을 배우도록 돕습니다.',
    },
    {
      title: '공동체를 위한 후원',
      body:
        '합창단의 지속 가능한 운영과 다음세대 음악교육의 토대를 함께 세웁니다.',
    },
    {
      title: '나눔을 위한 후원',
      body:
        '음악이 이웃을 위로하고 평화와 화해의 메시지를 전하는 통로가 되도록 함께합니다.',
    },
  ],
}

export const homeMemoryPreviewCopy = {
  body:
    '서울모테트청소년합창단은 합창을 통해 신앙과 역사, 공동체의 정체성을 다음 세대의 마음에 새기는 교육 공동체입니다.',
  ctaHref: '/spirit',
  ctaLabel: '합창단 정신 자세히 보기',
  title: '노래는 다음 세대의 기억이 됩니다',
}

export const homeSpiritPreviewCopy = {
  body:
    '우리는 음정을 맞추는 법만 배우지 않습니다. 서로를 듣는 법, 함께 기다리는 법, 하나의 울림을 위해 자신을 조율하는 법을 배웁니다.',
  ctaHref: '/spirit',
  ctaLabel: '합창단 정신 자세히 보기',
  expandedBody:
    '그 과정에서 음악은 기술을 넘어 인성과 신앙, 공동체성과 미래 비전을 세우는 교육의 자리가 됩니다.',
  eyebrow: 'What We Learn in Choir',
  title: '합창으로 배우는 것',
}

export const footerSpiritMotto =
  '정직한 음악으로 다음 세대를 세우는 서울모테트청소년합창단'

export const supportImpactItems: SpiritValue[] = [
  {
    title: '교육의 지속성',
    description: '청소년들이 안정적으로 연습하고 무대 경험을 이어갈 수 있도록 돕습니다.',
  },
  {
    title: '공연의 확장',
    description: '정기연주, 초청연주, 봉사연주가 더 많은 이들에게 닿도록 지원합니다.',
  },
  {
    title: '다음 세대의 성장',
    description: '음악의 재능과 인성이 함께 자라는 교육 환경을 만드는 동역입니다.',
  },
]

export const supportMethodItems: SpiritValue[] = [
  {
    title: '정기후원',
    description: '매월 일정 금액으로 합창단의 연습과 공연 활동을 꾸준히 후원합니다.',
  },
  {
    title: '일시후원',
    description: '공연, 캠프, 프로젝트 등 필요한 시점에 자유롭게 후원할 수 있습니다.',
  },
  {
    title: '공연 초청',
    description: '교회, 학교, 기관의 무대와 합창단을 연결해 음악의 나눔을 확장합니다.',
  },
]

export const donorCareItems: SpiritValue[] = [
  {
    title: '안전한 접수',
    description: '후원약정 정보는 관리자 CMS에서 권한 있는 관리자만 확인합니다.',
  },
  {
    title: '투명한 안내',
    description: '후원 계좌, 문의처, 개인정보 안내 문구를 관리자 화면에서 최신 상태로 유지합니다.',
  },
  {
    title: '인쇄 가능한 약정서',
    description: '작성한 약정서는 한 페이지 인쇄 흐름을 기준으로 정리되어 보관과 제출이 쉽습니다.',
  },
]

export const SPIRIT_CONTENT = {
  accompanistRole: accompanistRoleCopy,
  conductorPhilosophy: conductorPhilosophyCopy,
  cta: defaultSpiritCta,
  educationJourney: educationJourneySteps,
  footerMotto: footerSpiritMotto,
  hero: defaultSpiritHero,
  homeMemoryPreview: homeMemoryPreviewCopy,
  homePreview: homeSpiritPreviewCopy,
  join: joinSpiritCopy,
  legacy: legacyFlowSteps,
  manifesto: spiritManifestoCopy,
  motetMeaning: defaultMotetMeaning,
  mottoBadges: spiritMottoBadges,
  songOfMemory: songOfMemoryCopy,
  support: supportSpiritCopy,
  values: spiritValues,
  voiceConstellation: voiceConstellationCopy,
}

const copyKeyMap: Record<keyof SpiritCopy, string[]> = {
  body: ['body', 'content', 'description'],
  ctaLabel: ['cta_label', 'button'],
  ctaUrl: ['cta_url', 'url'],
  eyebrow: ['eyebrow', 'label'],
  quote: ['quote'],
  secondaryCtaLabel: ['secondary_cta_label', 'secondary_button'],
  secondaryCtaUrl: ['secondary_cta_url', 'secondary_url'],
  subtitle: ['subtitle', 'summary'],
  title: ['title'],
}

const extractStructuredCopy = (content: string): Partial<SpiritCopy> => {
  const result: Partial<SpiritCopy> = {}

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z_]+)\s*:\s*(.+)$/)

    if (!match) {
      continue
    }

    const [, rawKey, value] = match
    const normalizedKey = rawKey.toLowerCase()
    const targetKey = (Object.keys(copyKeyMap) as Array<keyof SpiritCopy>).find((key) =>
      copyKeyMap[key].includes(normalizedKey),
    )

    if (targetKey) {
      result[targetKey] = value.trim()
    }
  }

  return result
}

const stripStructuredLines = (content: string) =>
  content
    .split(/\r?\n/)
    .filter((line) => !/^[a-zA-Z_]+\s*:/.test(line.trim()))
    .join('\n')
    .trim()

export const getAboutSectionCopy = (
  sections: AboutSectionRow[],
  sectionKey: string,
  fallback: SpiritCopy,
): SpiritCopy => {
  const section = sections.find((item) => item.section_key === sectionKey && item.is_visible)

  if (!section) {
    return fallback
  }

  const structured = extractStructuredCopy(section.content)
  const body = stripStructuredLines(section.content) || structured.body || fallback.body

  return {
    ...fallback,
    ...structured,
    body,
    title: section.title || structured.title || fallback.title,
  }
}

export const getAboutSectionText = (
  sections: AboutSectionRow[],
  sectionKey: string,
  fallback: string,
) => {
  const section = sections.find((item) => item.section_key === sectionKey && item.is_visible)

  return section?.content?.trim() || fallback
}
