import { NavLink } from 'react-router'

import { mockSiteSettings } from '../../constants/mockData'
import { footerSpiritMotto } from '../../constants/spiritContent'
import { useContactData } from '../../hooks/usePublicData'
import { createSiteTextMap, getSiteText } from '../../utils/siteText'
import { BrandLogo } from '../common/BrandLogo'
import { Container } from '../common/Container'
import { StaffDivider } from '../common/StaffDivider'
import { StaffLines } from '../common/StaffLines'
import { SponsorLogoCard } from '../sponsors/SponsorLogoCard'

type SocialLink = {
  href: string
  label: string
}

const FALLBACK_ADDRESS = '서울특별시 서초구 사임당로 8길 17 서주빌딩 B1'

function getSafeExternalUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  try {
    const url = new URL(trimmedValue)

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function getSocialLinks(settings: {
  instagram_url?: string | null
  youtube_url?: string | null
}): SocialLink[] {
  return [
    { href: getSafeExternalUrl(settings.youtube_url), label: 'YouTube' },
    { href: getSafeExternalUrl(settings.instagram_url), label: 'Instagram' },
  ].filter((item): item is SocialLink => Boolean(item.href))
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const contactData = useContactData()
  const settings = contactData.data.siteSettings
  const siteTexts = createSiteTextMap(contactData.data.siteTexts)
  const t = (key: string, fallback?: string) => getSiteText(siteTexts, key, fallback)
  const emailLabel = settings.email?.trim()
  const address = settings.address || FALLBACK_ADDRESS
  const footerDescription =
    settings.about_summary ||
    '서울모테트음악재단 청소년아카데미 부설 합창단으로, 청소년의 맑은 목소리와 클래식 합창의 깊이를 함께 전합니다.'
  const footerMotto = `${t('footer.tagline.line1')}\n${t('footer.tagline.line2')}`
  const footerLinks = [
    { href: '/join', label: t('footer.quick.join') },
    { href: '/concerts', label: t('footer.quick.concert') },
    { href: '/contact?section=support', label: t('footer.quick.support') },
    { href: '/gallery', label: t('footer.quick.gallery') },
    { href: '/about', label: t('footer.quick.about') },
  ]
  const socialLinks = getSocialLinks(settings)
  const footerSponsors = contactData.data.sponsors
    .filter((sponsor) => sponsor.show_on_footer)
    .slice(0, 6)

  return (
    <footer
      className="flow-section site-footer relative overflow-hidden bg-navy-midnight text-bg-ivory"
      data-flow-section="footer"
    >
      <div aria-hidden="true" className="score-ribbon pre-footer-score-band absolute inset-x-0 top-0" />
      <div aria-hidden="true" className="spotlight-glow footer-spotlight-glow" />
      <StaffDivider className="absolute inset-x-0 top-0 max-w-none py-0 opacity-85" variant="inverted" />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-10 hidden size-72 rounded-full border border-bg-warm-white/10 bg-bg-warm-white/[0.03] lg:block"
      />
      <Container className="relative grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:py-12">
        <section>
          <BrandLogo loading="lazy" size="lg" theme="dark" withSurface />
          <StaffLines className="mt-5 max-w-sm opacity-65" density="light" variant="inverted" />
          <p className="mt-4 max-w-xl text-sm leading-7 text-bg-ivory/72">
            {footerDescription}
          </p>
          <p className="mt-4 max-w-xl rounded-button border border-gold-soft/25 bg-bg-warm-white/[0.04] px-4 py-3 break-keep text-sm font-semibold leading-7 text-gold-soft">
            {footerMotto || footerSpiritMotto}
          </p>
          <dl className="mt-6 grid gap-2 text-sm text-bg-ivory/72">
            <div className="flex gap-3 rounded-button border border-bg-warm-white/10 bg-bg-warm-white/[0.035] px-4 py-3">
              <dt className="w-12 shrink-0 text-gold-soft">주소</dt>
              <dd>{address}</dd>
            </div>
            <div className="flex gap-3 rounded-button border border-bg-warm-white/10 bg-bg-warm-white/[0.035] px-4 py-3">
              <dt className="w-12 shrink-0 text-gold-soft">전화</dt>
              <dd>{settings.phone || mockSiteSettings.phone}</dd>
            </div>
            <div className="flex gap-3 rounded-button border border-bg-warm-white/10 bg-bg-warm-white/[0.035] px-4 py-3">
              <dt className="w-12 shrink-0 text-gold-soft">FAX</dt>
              <dd>{settings.fax || mockSiteSettings.fax}</dd>
            </div>
            {emailLabel ? (
              <div className="flex gap-3 rounded-button border border-bg-warm-white/10 bg-bg-warm-white/[0.035] px-4 py-3">
                <dt className="w-12 shrink-0 text-gold-soft">이메일</dt>
                <dd>{emailLabel}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <nav aria-label="푸터 메뉴">
          <p className="text-sm font-semibold text-gold-soft">메뉴</p>
          <StaffLines className="mt-3 max-w-36 opacity-55" density="light" variant="inverted" />
          <div className="mt-4 grid gap-2 text-sm text-bg-ivory/72">
            {footerLinks.map((item) => (
              <NavLink
                className="flex min-h-10 items-center transition hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                key={item.href}
                to={item.href}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <section>
          <p className="text-sm font-semibold text-gold-soft">소셜</p>
          <StaffLines className="mt-3 max-w-36 opacity-55" density="light" variant="inverted" />
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {socialLinks.map((link) => (
                <a
                  aria-label={`${link.label} 새 창으로 열기`}
                  className="inline-flex min-h-[44px] items-center rounded-pill border border-bg-warm-white/25 px-3 py-2 text-bg-ivory/78 transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-bg-ivory/58">
              등록된 소셜 링크가 없습니다.
            </p>
          )}
          <NavLink
            className="mt-7 inline-flex min-h-10 items-center text-xs text-bg-ivory/35 transition hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
            to="/admin/login"
          >
            관리자 로그인
          </NavLink>
          <div className="mt-8 border-t border-bg-warm-white/10 pt-6">
            <p className="mb-3 text-xs font-semibold text-bg-ivory/58">
              서울모테트음악재단 청소년아카데미 부설
            </p>
            <StaffLines className="mb-4 max-w-44 opacity-45" density="light" variant="inverted" />
            <BrandLogo brand="smf" loading="lazy" size="md" theme="dark" withSurface />
          </div>
        </section>
      </Container>
      {footerSponsors.length > 0 ? (
        <div className="hidden border-t border-bg-warm-white/10 py-6 md:block">
          <Container>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
              Partners
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {footerSponsors.map((sponsor) => (
                <SponsorLogoCard compact key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </Container>
        </div>
      ) : null}
      <div className="border-t border-bg-warm-white/10 py-5">
        <Container>
          <p className="text-xs text-bg-ivory/45">
            © {currentYear} Seoul Motet Youth Choir. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  )
}
