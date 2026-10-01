export type SitePhotoAsset = {
  key: string
  title: string
  category: 'photo' | 'brand' | 'background' | 'decoration'
  sources: readonly string[]
  usages: readonly { label: string; href: string }[]
  description: string
  cssVariable?: string
}
const home = [{ label: '홈', href: '/' }]
const spirit = [{ label: '합창단 정신', href: '/spirit' }]
const about = [{ label: '합창단 소개', href: '/about?section=overview' }]
const conductor = [{ label: '지휘자 소개', href: '/about?section=conductor' }]
const photo = (key: string, title: string, src: string, usages: SitePhotoAsset['usages'], description = '사진의 비율은 기존 화면 디자인을 유지합니다.'): SitePhotoAsset => ({ key, title, category: 'photo', sources: [src], usages, description })
const background = (key: string, title: string, src: string): SitePhotoAsset => ({ key, title, category: 'background', sources: [src], usages: home, description: '종이 질감·배경 이미지입니다. 글자 가독성을 위해 밝고 대비가 낮은 이미지를 권장합니다.', cssVariable: `--site-photo-${key}` })

export const SITE_PHOTO_ASSETS: readonly SitePhotoAsset[] = [
  photo('about-europe', '2018 유럽 연주 단체사진', '/images/about/smyc-europe-2018.webp', about),
  photo('about-first-concert', '첫 연주회 기록', '/images/about/smyc-first-concert.webp', about),
  photo('about-rehearsal', '소개 · 교육 연습사진', '/images/about/smyc-rehearsal.webp', about),
  photo('home-collective', '홈 · 함께하는 합창단 단체사진', '/images/sample/about-collective-portrait.png', home),
  photo('spirit-performance', '정신 히어로 기본사진 · 브로슈어 표지', '/images/home-v6/hero-performance.jpg', [...spirit, ...home], '정신 히어로의 기본사진과 홈 브로슈어의 기록사진에 함께 사용됩니다. CMS 히어로 사진이 있는 경우 정신 히어로는 그 사진을 우선 사용합니다.'),
  photo('spirit-practice', '정신 · 음악 전통 연습사진', '/images/home-v6/practice-rehearsal.jpg', spirit),
  photo('spirit-community', '정신 · 공동체 연습사진', '/images/home-v6/community-rehearsal.jpg', spirit),
  photo('history-default', '연혁 · 기본 공연사진', '/images/about/smyc-11th-concert-2025.jpg', [{ label: '연혁', href: '/about?section=history' }], '등록된 연혁 사진이 없을 때 사용하는 기본사진입니다.'),
  photo('conductor-default', '지휘자 · 기본 프로필사진', '/images/about/conductor/kim-hyung-su-profile.jpg', conductor, '지휘자 관리에 사진이 등록돼 있으면 그 사진이 우선됩니다.'),
  photo('performance-archive', '지휘자 · 공연 목록 기록사진', '/images/about/conductor/smyc-performance-2026.jpg', [...conductor, { label: '공연·소식', href: '/concerts' }]),
  { key: 'smyc-logo', title: '합창단 전체 로고', category: 'brand', sources: ['/images/brand/smyc-logo-transparent.png', '/images/brand/smyc-logo.png'], usages: [...home, ...spirit, ...about], description: '헤더·홈 히어로 로고. 투명 배경 PNG/WebP를 권장합니다.' },
  { key: 'smyc-symbol', title: '합창단 심벌', category: 'brand', sources: ['/images/brand/smyc-symbol-vector.svg', '/images/brand/smyc-symbol.png', '/images/brand/smyc-symbol-transparent-hd.png', '/images/sample/performance/smyc-symbol.png'], usages: [...home, ...spirit], description: '모바일 헤더·정신·브로슈어·공유 이미지에 함께 사용됩니다. 업로드는 안전한 PNG/WebP만 허용합니다.' },
  { key: 'smf-logo', title: '음악재단 로고', category: 'brand', sources: ['/images/brand/smf-logo.png', '/images/brand/smf-logo-transparent.png'], usages: [{ label: '푸터', href: '/' }], description: '재단 브랜드 로고. 기존 로고 비율이 유지됩니다.' },
  { key: 'smf-symbol', title: '음악재단 심벌', category: 'brand', sources: ['/images/brand/smf-symbol-transparent.png', '/images/brand/smf-symbol.png'], usages: [{ label: '푸터', href: '/' }], description: '재단 심벌. 투명 배경을 권장합니다.' },
  background('hero-notebook', '홈 히어로 · 종이 콜라주', '/images/sample/home-v4-notebook-collage-v1.jpg'),
  background('hero-paper-staff', '홈 히어로 · 오선지', '/images/sample/hero-paper-pieces/paper-collage-staff.webp'),
  background('hero-paper-vellum', '홈 히어로 · 반투명 종이', '/images/sample/hero-paper-pieces/paper-collage-vellum.webp'),
  background('hero-paper-ledger', '홈 히어로 · 기록지', '/images/sample/hero-paper-pieces/paper-collage-ledger.webp'),
  background('hero-paper-cotton', '홈 히어로 · 면지', '/images/sample/hero-paper-pieces/paper-collage-cotton.webp'),
  background('hero-paper-a', '홈 히어로 · 조각 A', '/images/sample/hero-paper-pieces/paper-aperture-torn-a.webp'),
  background('hero-paper-b', '홈 히어로 · 조각 B', '/images/sample/hero-paper-pieces/paper-aperture-torn-b.webp'),
  background('hero-paper-c', '홈 히어로 · 조각 C', '/images/sample/hero-paper-pieces/paper-aperture-torn-c.webp'),
  background('hero-logo-paper', '홈 히어로 · 로고 바탕', '/images/sample/hero-paper-pieces/paper-center-logo-patch-v2.webp'),
  background('watercolor-paper', '홈 · 수채화 종이 바탕', '/images/sample/home-v4-watercolor-paper.webp'),
  background('archive-paper', '홈 아카이브 · 종이 질감', '/images/textures/smyc-paper-grain.png'),
  background('score-paper', '홈 정신 · 악보책 종이', '/images/textures/home-score-paper-background.png'),
  background('responsive-paper', '모바일·태블릿 · 악보 종이', '/images/home/responsive-score-paper.png'),
  background('responsive-concert-paper', '모바일·태블릿 · 공연 종이', '/images/home/responsive-concert-paper.png'),
  background('brochure-stage', '브로슈어 · 건축 프레임 배경', '/images/sample/performance/architecture-rear-base.png'),
  background('brochure-paper', '브로슈어 · 내지 종이 질감', '/images/sample/performance/template-paper-micrograin.png'),
  background('concert-section-paper', '홈 공연 · 종이 바탕', '/images/sample/performance/performance-section-paper.webp'),
  { key: 'score-staff', title: '악보책 · 오선 장식', category: 'decoration', sources: ['/images/effects/home-score-m-staff.png'], usages: home, description: '사진이 아닌 장식 이미지입니다. 투명 배경을 유지해 주세요.' },
  { key: 'learning-journey', title: '소개 · 배움의 여정 도형', category: 'decoration', sources: ['/images/about/learning-journey-curve.svg'], usages: about, description: '배움의 여정에 사용하는 장식 이미지입니다. 투명 배경의 가로형 이미지로 교체해 주세요.' },
  { key: 'about-join-boundary', title: '홈 · 소개와 입단 사이 도형', category: 'decoration', sources: ['/images/sample/about-join-boundary.svg'], usages: home, description: '섹션 연결 장식입니다. 기존 가로 비율과 투명 배경을 유지해 주세요.' },
  { key: 'join-score-symbol', title: '홈 · 입단 악보 심벌', category: 'decoration', sources: ['/images/sample/join-open-score-m.svg'], usages: home, description: '입단 안내 악보의 장식 심벌입니다. 투명 배경을 권장합니다.' },
  { key: 'responsive-join-motif', title: '모바일·태블릿 · 입단 장식', category: 'decoration', sources: ['/images/home/responsive-join-motif.svg'], usages: home, description: '모바일 입단 안내의 가로형 장식입니다. 투명 배경을 유지해 주세요.' },
  background('sample-m-rail', '색상 샘플 · 대칭 오선 도형', '/images/sample/symmetric-m-rail.svg'),
]
const assetsBySource = new Map(SITE_PHOTO_ASSETS.flatMap(asset => asset.sources.map(src => [src, asset] as const)))
export function getSitePhotoAsset(src: string | null | undefined): SitePhotoAsset | undefined { return src ? assetsBySource.get(src) : undefined }
