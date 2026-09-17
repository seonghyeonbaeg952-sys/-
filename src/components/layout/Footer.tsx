import { FormattedCopy } from '../site-editor/FormattedCopy'
import { NavLink } from 'react-router'

import { mockSiteSettings } from '../../constants/mockData'
import { useContactData } from '../../hooks/usePublicData'
import { BrandLogo } from '../common/BrandLogo'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { navigationCopyKey, navigationLabelKey } from '../../content/siteCopyCommonCatalog'
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
  titleCopyKey,
}: {
  className?: string
  links: FooterLink[]
  title: string
  titleCopyKey: string
}) {
  const { copy } = useSiteEditor()
  return (
    <nav
      aria-label={`${title} 푸터 메뉴`}
      className={['footer-utility__link-group', className]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="footer-utility__group-title"><FormattedCopy page="common" id={titleCopyKey} text={title}>{title}</FormattedCopy></p>
      <div className="footer-utility__link-list">
        {links.map((link) => (
          <NavLink className="footer-utility__link" key={link.href} to={link.href}>
            <span><FormattedCopy page="common" id={navigationLabelKey(link.href, link.label)} text={copy('common', navigationLabelKey(link.href, link.label), link.label)}>{copy('common', navigationLabelKey(link.href, link.label), link.label)}</FormattedCopy></span>
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
  const { copy: copyText } = useSiteEditor()
  const { copy } = useSiteEditor()
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
            aria-label={copyText("common", "common.fixed.Footer.8975e38d2f", "서울모테트청소년합창단 홈으로 이동")}
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
              <strong>{<FormattedCopy page="common" id="common.fixed.Footer.9bb6e639c7" text={copyText("common", "common.fixed.Footer.9bb6e639c7", "서울모테트청소년합창단")}>{copyText("common", "common.fixed.Footer.9bb6e639c7", "서울모테트청소년합창단")}</FormattedCopy>}</strong>
              <span>{<FormattedCopy page="common" id="common.fixed.Footer.f34c03131f" text={copyText("common", "common.fixed.Footer.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}>{copyText("common", "common.fixed.Footer.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}</FormattedCopy>}</span>
            </span>
          </NavLink>

          <nav aria-label={copyText("common", "common.fixed.Footer.66b325059d", "주요 바로가기")} className="footer-utility__actions">
            <NavLink
              className="footer-utility__action footer-utility__action--primary"
              to="/join"
            >
              <span><FormattedCopy page="common" id={navigationLabelKey('/join', '입단 안내')} text={copy('common', navigationLabelKey('/join', '입단 안내'), '입단 안내')}>{copy('common', navigationLabelKey('/join', '입단 안내'), '입단 안내')}</FormattedCopy></span>
              <span aria-hidden="true">↗</span>
            </NavLink>
            <NavLink
              className="footer-utility__action footer-utility__action--secondary"
              to="/contact?section=support"
            >
              <span><FormattedCopy page="common" id={navigationCopyKey('/contact')} text={copy('common', navigationCopyKey('/contact'), '후원·문의')}>{copy('common', navigationCopyKey('/contact'), '후원·문의')}</FormattedCopy></span>
              <span aria-hidden="true">↗</span>
            </NavLink>
          </nav>
        </div>

        <div aria-hidden="true" className="footer-utility__divider" />

        <div className="footer-utility__body">
          <section className="footer-utility__contact" aria-labelledby="footer-contact-title">
            <p className="footer-utility__group-title" id="footer-contact-title">
              <FormattedCopy page="common" id="common.footer.contact" text={copy('common', 'common.footer.contact', 'CONTACT')}>{copy('common', 'common.footer.contact', 'CONTACT')}</FormattedCopy>
            </p>
            <address className="footer-utility__contact-list">
              <div>
                <p className="footer-utility__contact-label"><FormattedCopy page="common" id="common.footer.address" text={copy('common', 'common.footer.address', '주소')}>{copy('common', 'common.footer.address', '주소')}</FormattedCopy></p>
                <p className="footer-utility__contact-value">{address}</p>
              </div>
              <div>
                <p className="footer-utility__contact-label"><FormattedCopy page="common" id="common.footer.phone" text={copy('common', 'common.footer.phone', '전화')}>{copy('common', 'common.footer.phone', '전화')}</FormattedCopy></p>
                <a
                  className="footer-utility__contact-value footer-utility__contact-link"
                  href={getTelephoneHref(phone)}
                >
                  {phone}
                </a>
              </div>
              {email ? (
                <div>
                  <p className="footer-utility__contact-label"><FormattedCopy page="common" id="common.footer.email" text={copy('common', 'common.footer.email', '이메일')}>{copy('common', 'common.footer.email', '이메일')}</FormattedCopy></p>
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
            title={copy('common', 'common.footer.explore', 'EXPLORE')}
            titleCopyKey="common.footer.explore"
          />
          <FooterLinkGroup
            className="footer-utility__participate"
            links={PARTICIPATION_LINKS}
            title={copy('common', 'common.footer.participate', 'TAKE PART')}
            titleCopyKey="common.footer.participate"
          />

          <nav
            aria-label={copyText("common", "common.fixed.Footer.ee6bcbc10b", "공식 소셜 채널")}
            className="footer-utility__link-group footer-utility__social"
          >
            <p className="footer-utility__group-title"><FormattedCopy page="common" id="common.footer.connect" text={copy('common', 'common.footer.connect', 'CONNECT')}>{copy('common', 'common.footer.connect', 'CONNECT')}</FormattedCopy></p>
            {socialLinks.length > 0 ? (
              <div className="footer-utility__link-list">
                {socialLinks.map((link) => (
                  <a
                    aria-label={`${copyText('common', `common.footer.social.${link.label}`, link.label)} 새 창으로 열기`}
                    className="footer-utility__link"
                    href={link.href}
                    key={link.label}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    <span><FormattedCopy page="common" id={`common.footer.social.${link.label}`} text={copyText('common', `common.footer.social.${link.label}`, link.label)}>{copyText('common', `common.footer.social.${link.label}`, link.label)}</FormattedCopy></span>
                    <span aria-hidden="true" className="footer-utility__link-arrow">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="footer-utility__empty"><FormattedCopy page="common" id="common.footer.empty" text={copy('common', 'common.footer.empty', '공식 채널 준비 중')}>{copy('common', 'common.footer.empty', '공식 채널 준비 중')}</FormattedCopy></p>
            )}
          </nav>
        </div>

        <div aria-hidden="true" className="footer-utility__divider footer-utility__divider--legal" />

        <div className="footer-utility__legal">
          <p>© {currentYear}{<FormattedCopy page="common" id="common.fixed.Footer.189e34321f" text={copyText("common", "common.fixed.Footer.189e34321f", " Seoul Motet Youth Choir. All rights reserved.")}>{copyText("common", "common.fixed.Footer.189e34321f", " Seoul Motet Youth Choir. All rights reserved.")}</FormattedCopy>}</p>
          <NavLink className="footer-utility__admin-link" to="/admin/login">
            <FormattedCopy page="common" id="common.footer.admin" text={copy('common', 'common.footer.admin', '관리자 로그인')}>{copy('common', 'common.footer.admin', '관리자 로그인')}</FormattedCopy>
          </NavLink>
          <button
            aria-label={copyText("common", "common.fixed.Footer.f3f317ea45", "페이지 맨 위로 이동")}
            className="footer-utility__top-button"
            onClick={scrollToPageTop}
            type="button"
          >
            <span><FormattedCopy page="common" id="common.footer.top" text={copy('common', 'common.footer.top', 'TOP')}>{copy('common', 'common.footer.top', 'TOP')}</FormattedCopy></span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
