import { NavLink } from 'react-router'

import { mockSiteSettings } from '../../constants/mockData'
import { publicNavigation } from '../../constants/navigation'
import { useContactData } from '../../hooks/usePublicData'
import { BrandLogo } from '../common/BrandLogo'
import { Container } from '../common/Container'

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
  const emailLabel = settings.email || '등록 예정'
  const address = settings.address || FALLBACK_ADDRESS
  const footerDescription =
    settings.about_summary ||
    '서울모테트음악재단 청소년아카데미 부설 합창단으로, 청소년의 맑은 목소리와 클래식 합창의 깊이를 함께 전합니다.'
  const socialLinks = getSocialLinks(settings)

  return (
    <footer className="bg-navy-midnight text-bg-ivory">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:py-16">
        <section>
          <BrandLogo size="lg" theme="dark" withSurface />
          <p className="mt-4 max-w-xl text-sm leading-7 text-bg-ivory/72">
            {footerDescription}
          </p>
          <dl className="mt-6 grid gap-2 text-sm text-bg-ivory/72">
            <div className="flex gap-3">
              <dt className="w-12 shrink-0 text-gold-soft">주소</dt>
              <dd>{address}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-12 shrink-0 text-gold-soft">전화</dt>
              <dd>{settings.phone || mockSiteSettings.phone}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-12 shrink-0 text-gold-soft">FAX</dt>
              <dd>{settings.fax || mockSiteSettings.fax}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-12 shrink-0 text-gold-soft">이메일</dt>
              <dd>{emailLabel}</dd>
            </div>
          </dl>
        </section>

        <nav aria-label="푸터 메뉴">
          <p className="text-sm font-semibold text-gold-soft">메뉴</p>
          <div className="mt-4 grid gap-2 text-sm text-bg-ivory/72">
            {publicNavigation.map((item) => (
              <NavLink
                className="transition hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
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
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {socialLinks.map((link) => (
                <a
                  aria-label={`${link.label} 새 창으로 열기`}
                  className="rounded-pill border border-bg-warm-white/25 px-3 py-2 text-bg-ivory/78 transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
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
            className="mt-7 inline-block text-xs text-bg-ivory/35 transition hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
            to="/admin/login"
          >
            관리자 로그인
          </NavLink>
          <div className="mt-8 border-t border-bg-warm-white/10 pt-6">
            <p className="mb-3 text-xs font-semibold text-bg-ivory/58">
              서울모테트음악재단 청소년아카데미 부설
            </p>
            <BrandLogo brand="smf" size="md" theme="dark" withSurface />
          </div>
        </section>
      </Container>
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
