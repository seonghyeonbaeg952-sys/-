export type BrandKey = 'smf' | 'smyc'

export const BRANDS = {
  smf: {
    alt: '서울모테트음악재단 로고',
    logoPath: '/images/brand/smf-logo.png',
    logoTransparentPath: '/images/brand/smf-logo-transparent.png',
    name: '서울모테트음악재단',
    nameEn: 'Seoul Motet Music Foundation',
    symbolPath: '/images/brand/smf-symbol.png',
    symbolTransparentPath: '/images/brand/smf-symbol-transparent.png',
  },
  smyc: {
    alt: '서울모테트청소년합창단 로고',
    logoPath: '/images/brand/smyc-logo.png',
    logoTransparentPath: '/images/brand/smyc-logo-transparent.png',
    name: '서울모테트청소년합창단',
    nameEn: 'Seoul Motet Youth Choir',
    symbolPath: '/images/brand/smyc-symbol.png',
    symbolTransparentPath: '/images/brand/smyc-symbol-transparent.png',
  },
} as const satisfies Record<
  BrandKey,
  {
    alt: string
    logoPath: string
    logoTransparentPath: string
    name: string
    nameEn: string
    symbolPath: string
    symbolTransparentPath: string
  }
>

export const BRAND_NAME = BRANDS.smyc.name
export const BRAND_NAME_EN = BRANDS.smyc.nameEn
export const BRAND_LOGO_ALT = BRANDS.smyc.alt
export const BRAND_LOGO_PATH = BRANDS.smyc.logoTransparentPath
export const BRAND_SYMBOL_PATH = BRANDS.smyc.symbolTransparentPath
