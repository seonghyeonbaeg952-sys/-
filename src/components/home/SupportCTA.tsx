import { legacyLocationSeed } from '../../constants/legacyContent'
import type { SiteSettings } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'

type SupportCTAProps = {
  buttonLabel?: string | null
  settings?: SiteSettings
  supportText?: string | null
  title?: string | null
}

export function SupportCTA({
  buttonLabel,
  settings,
  supportText,
  title,
}: SupportCTAProps) {
  const phone = settings?.phone || legacyLocationSeed.phone
  const address =
    settings?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()

  return (
    <section className="home-section relative overflow-hidden bg-navy-midnight text-bg-warm-white">
      <Reveal
        className="absolute left-1/2 top-10 w-full max-w-4xl -translate-x-1/2"
        variant="line-draw"
      >
        <StaffLines
          className="opacity-55"
          density="light"
          variant="inverted"
        />
      </Reveal>
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <Reveal variant="fade-up">
            <div>
              <div className="mb-6 h-1 w-16 rounded-full bg-gold-warm" />
              <StaffSectionLabel className="max-w-sm" variant="inverted">
                SUPPORT
              </StaffSectionLabel>
              <h2 className="mt-4 max-w-3xl whitespace-pre-line break-keep text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.14]">
                {title ||
                  '한 사람의 목소리가 자라기 위해서는\n보이지 않는 많은 손길이 필요합니다'}
              </h2>
              <p className="mt-5 max-w-2xl whitespace-pre-line break-keep text-base leading-8 text-bg-ivory/76">
                {supportText ||
                  '후원은 단순한 재정 지원이 아니라,\n다음 세대가 음악 안에서 자신을 발견하고\n함께 살아가는 법을 배우도록 돕는 동행입니다.'}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/contact?section=support" size="lg" variant="gold">
                  {buttonLabel || '후원약정 보기'}
                </Button>
                <Button
                  className="!border-bg-warm-white/24 !bg-bg-warm-white/[0.06] !text-bg-warm-white hover:!border-gold-soft hover:!text-gold-soft"
                  href="/contact"
                  size="lg"
                  variant="secondary"
                >
                  문의하기
                </Button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80} variant="card-rise">
            <div className="rounded-soft border border-bg-warm-white/12 bg-bg-warm-white/7 p-6">
              <p className="text-sm font-semibold text-gold-soft">문의 정보</p>
              <p className="mt-3 text-2xl font-semibold">{phone}</p>
              <p className="mt-3 break-keep text-sm leading-6 text-bg-ivory/68">
                {address}
              </p>
              <Button className="mt-6 w-full" href="/contact" size="lg" variant="gold">
                문의하기
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
