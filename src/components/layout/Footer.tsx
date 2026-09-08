import { NavLink } from 'react-router'

import { mockSiteSettings } from '../../constants/mockData'
import { useContactData } from '../../hooks/usePublicData'
import { BrandLogo } from '../common/BrandLogo'
import '../../styles/footer-utility.css'

type FooterLink = {
  href: string
  label: string
}

type SocialLink = {
  href: string
  label: string
}

const FALLBACK_ADDRESS = '서울특별시 서초구 사임당로 8길 17 서주빌딩 B1'

const EXPLORE_LINKS = [
  { href: '/spirit', label: '합창단 정신' },
  { href: '/about?section=overview', label: '합창단 소개' },
  { href: '/concerts', label: '공연·소식' },
  { href: '/gallery', label: '갤러리' },
] satisfies FooterLink[]

const PARTICIPATION_LINKS = [
  { href: '/join', label: '입단 안내' },
  { href: '/contact?section=support', label: '후원·문의' },
  { href: '/contact?section=location', label: '오시는 길' },
] satisfies FooterLink[]

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

function getTelephoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, '')}`
}

function scrollToPageTop() {
  if (typeof window === 'undefined') {
    return
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  window.scrollTo({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    top: 0,
  })
}

function FooterLinkGroup({
  className,
  links,
  title,
}: {
  className?: string
  links: FooterLink[]
  title: string
}) {
  return (
    <nav
      aria-label={`${title} 푸터 메뉴`}
      className={['footer-utility__link-group', className]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="footer-utility__group-title">{title}</p>
      <div className="footer-utility__link-list">
        {links.map((link) => (
          <NavLink className="footer-utility__link" key={link.href} to={link.href}>
            <span>{link.label}</span>
            <span aria-hidden="true" className="footer-utility__link-arrow">
              ↗
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const contactData = useContactData()
  const settings = contactData.data.siteSettings
  const address = settings.address?.trim() || FALLBACK_ADDRESS
  const phone = settings.phone?.trim() || mockSiteSettings.phone
  const email = settings.email?.trim()
  const socialLinks = getSocialLinks(settings)

  return (
    <footer
      className="flow-section site-footer site-footer--utility"
      data-flow-section="footer"
    >
      <div className="footer-utility__frame">
        <div className="footer-utility__header">
          <NavLink
            aria-label="서울모테트청소년합창단 홈으로 이동"
            className="footer-utility__brand"
            to="/"
          >
            <BrandLogo
              className="footer-utility__brand-symbol"
              loading="lazy"
              size="lg"
              theme="dark"
              variant="symbol"
            />
            <span className="footer-utility__brand-copy">
              <strong>서울모테트청소년합창단</strong>
              <span>SEOUL MOTET YOUTH CHOIR</span>
            </span>
          </NavLink>

          <nav aria-label="주요 바로가기" className="footer-utility__actions">
            <NavLink
              className="footer-utility__action footer-utility__action--primary"
              to="/join"
            >
              <span>입단 안내</span>
              <span aria-hidden="true">↗</span>
            </NavLink>
            <NavLink
              className="footer-utility__action footer-utility__action--secondary"
              to="/contact?section=support"
            >
              <span>후원·문의</span>
              <span aria-hidden="true">↗</span>
            </NavLink>
          </nav>
        </div>

        <div aria-hidden="true" className="footer-utility__divider" />

        <div className="footer-utility__body">
          <section className="footer-utility__contact" aria-labelledby="footer-contact-title">
            <p className="footer-utility__group-title" id="footer-contact-title">
              CONTACT
            </p>
            <address className="footer-utility__contact-list">
              <div>
                <p className="footer-utility__contact-label">주소</p>
                <p className="footer-utility__contact-value">{address}</p>
              </div>
              <div>
                <p className="footer-utility__contact-label">전화</p>
                <a
                  className="footer-utility__contact-value footer-utility__contact-link"
                  href={getTelephoneHref(phone)}
                >
                  {phone}
                </a>
              </div>
              {email ? (
                <div>
                  <p className="footer-utility__contact-label">이메일</p>
                  <p className="footer-utility__contact-value footer-utility__contact-email">
                    {email}
                  </p>
                </div>
              ) : null}
            </address>
          </section>

          <FooterLinkGroup
            className="footer-utility__explore"
            links={EXPLORE_LINKS}
            title="EXPLORE"
          />
          <FooterLinkGroup
            className="footer-utility__participate"
            links={PARTICIPATION_LINKS}
            title="TAKE PART"
          />

          <nav
            aria-label="공식 소셜 채널"
            className="footer-utility__link-group footer-utility__social"
          >
            <p className="footer-utility__group-title">CONNECT</p>
            {socialLinks.length > 0 ? (
              <div className="footer-utility__link-list">
                {socialLinks.map((link) => (
                  <a
                    aria-label={`${link.label} 새 창으로 열기`}
                    className="footer-utility__link"
                    href={link.href}
                    key={link.label}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true" className="footer-utility__link-arrow">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="footer-utility__empty">공식 채널 준비 중</p>
            )}
          </nav>
        </div>

        <div aria-hidden="true" className="footer-utility__divider footer-utility__divider--legal" />

        <div className="footer-utility__legal">
          <p>© {currentYear} Seoul Motet Youth Choir. All rights reserved.</p>
          <NavLink className="footer-utility__admin-link" to="/admin/login">
            관리자 로그인
          </NavLink>
          <button
            aria-label="페이지 맨 위로 이동"
            className="footer-utility__top-button"
            onClick={scrollToPageTop}
            type="button"
          >
            <span>TOP</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
