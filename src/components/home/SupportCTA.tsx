import { legacyLocationSeed } from '../../constants/legacyContent'
import type { SiteSettings } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'

type SupportCTAProps = {
  settings?: SiteSettings
  supportText?: string | null
}

export function SupportCTA({ settings, supportText }: SupportCTAProps) {
  const phone = settings?.phone || legacyLocationSeed.phone
  const address =
    settings?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()

  return (
    <section className="bg-navy-midnight py-section-mobile text-bg-warm-white lg:py-section-desktop">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="mb-6 h-1 w-16 rounded-full bg-gold-warm" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-soft">
              SUPPORT
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
              공연 섭외와 후원 문의를 통해 음악 여정에 함께해 주세요.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-bg-ivory/76">
              {supportText ||
                '서울모테트청소년합창단의 공연, 초청연주, 후원 문의는 공식 문의 페이지에서 이어집니다.'}
            </p>
          </div>
          <div className="rounded-card border border-bg-warm-white/12 bg-bg-warm-white/7 p-6">
            <p className="text-sm font-semibold text-gold-soft">문의 정보</p>
            <p className="mt-3 text-2xl font-semibold">{phone}</p>
            <p className="mt-3 text-sm leading-6 text-bg-ivory/68">
              {address}
            </p>
            <Button className="mt-6 w-full" href="/contact" size="lg" variant="gold">
              문의하기
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
