import { legacyLocationSeed } from '../../constants/legacyContent'
import type { SiteSettings } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'

type SupportLetterFoldProps = {
  buttonLabel?: string | null
  cardDescription?: string | null
  cardTitle?: string | null
  secondaryButtonLabel?: string | null
  settings?: SiteSettings
  supportText?: string | null
  title?: string | null
}

const fallback = {
  body:
    '후원금은 악보와 교육 자료, 연습과 공연 준비, 국제교류 활동에 사용됩니다. 후원 상담과 일반 문의는 공식 문의 폼으로 접수합니다.',
  title: '후원은 청소년 합창교육과 공연 활동을 지원합니다',
}

export function SupportLetterFold({
  buttonLabel,
  cardDescription,
  cardTitle,
  secondaryButtonLabel,
  settings,
  supportText,
  title,
}: SupportLetterFoldProps) {
  const phone = settings?.phone || legacyLocationSeed.phone
  const address =
    settings?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()

  return (
    <section
      className="flow-section support-letter-section home-section relative"
      data-flow-section="support-letter"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--support"
        label="후원"
        noteOffset={11}
        symbol="♩"
      />
      <div
        aria-hidden="true"
        className="stage-staff-lines stage-staff-lines-support"
      />
      <Container>
        <div className="support-letter-layout">
          <Reveal variant="fade-up">
            <div>
              <div className="mb-6 h-1 w-16 rounded-full bg-gold-warm" />
              <StaffSectionLabel className="max-w-sm" variant="inverted">
                SUPPORT
              </StaffSectionLabel>
              <h2 className="mt-4 max-w-3xl whitespace-pre-line break-keep text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.14]">
                {title || fallback.title}
              </h2>
              <p className="mt-5 max-w-2xl whitespace-pre-line break-keep text-base leading-8 text-bg-ivory/76">
                {supportText || fallback.body}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href="/contact?section=support" size="lg" variant="gold">
                  {buttonLabel || '후원 상담 신청'}
                </Button>
                <Button
                  className="!border-bg-warm-white/24 !bg-bg-warm-white/[0.06] !text-bg-warm-white hover:!border-gold-soft hover:!text-gold-soft"
                  href="/contact"
                  size="lg"
                  variant="secondary"
                >
                  {secondaryButtonLabel || '문의'}
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90} variant="card-rise">
            <article className="support-letter-card">
              <StaffLines className="mb-6 opacity-45" density="light" variant="gold" />
              <p className="type-eyebrow text-gold-warm">PLEDGE LETTER</p>
              <h3 className="type-card-title mt-4 text-navy-deep">
                {cardTitle || '문의 접수 안내'}
              </h3>
              <p className="type-body mt-4 text-text-muted">
                {cardDescription ||
                  '공연 초청, 후원 상담, 입단 문의를 공식 문의 폼으로 접수합니다. 담당자가 확인한 뒤 이메일 또는 연락처로 안내합니다.'}
              </p>
              <dl className="support-letter-contact">
                <div>
                  <dt>전화</dt>
                  <dd>{phone}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{address}</dd>
                </div>
              </dl>
            </article>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
