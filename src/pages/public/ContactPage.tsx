import { FormattedCopy } from '../../components/site-editor/FormattedCopy'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { useEffect } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { ContactInquiryForm } from '../../components/contact/ContactInquiryForm'
import { SupportPledgeForm } from '../../components/contact/SupportPledgeForm'
import { formatSupportAmounts, getContactSection, getInitialInquiryType, inquiryTypes } from '../../components/contact/contactFormModel'
import { LoadingState } from '../../components/common/LoadingState'
import { OptimizedImage } from '../../components/common/OptimizedImage'
import { SeoHead } from '../../components/common/SeoHead'
import { SponsorsSection } from '../../components/sponsors/SponsorsSection'
import { useContactData } from '../../hooks/usePublicData'
import { getMapActions } from '../../utils/mapLinks'
import { usePageCopy } from '../../components/site-editor/usePageCopy'
import { CopyLines } from '../../components/site-editor/SiteCopy'
import '../../styles/contact-page.css'

const navigation = [
  { label: '후원 안내', href: '/contact#support', section: 'support' },
  { label: '후원사', href: '/contact?section=sponsors#sponsors', section: 'sponsors' },
  { label: '공연 의뢰', href: '/contact?section=performance#form', section: 'performance' },
  { label: '문의하기', href: '/contact?section=inquiry#form', section: 'inquiry' },
  { label: '오시는 길', href: '/contact?section=location#location', section: 'location' },
] as const

export function ContactPage() {
  const [searchParams] = useSearchParams()
  const route = useLocation()
  if (searchParams.get('section') === 'join') {
    return <Navigate replace to="/join?section=contact#application" />
  }
  if (searchParams.get('section') === 'support' && route.hash === '#form') {
    return <Navigate replace to="/contact?section=inquiry&type=support#form" />
  }
  return <ContactContent />
}

function ContactContent() {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('contact')
  const contactData = useContactData()
  const [params] = useSearchParams()
  const route = useLocation()
  const activeSection = getContactSection(params.get('section'))
  const { siteSettings, supportSettings, location, sponsors } = contactData.data
  const showAll = activeSection === 'all'
  const showInquiry = showAll || activeSection === 'inquiry' || activeSection === 'performance' || (activeSection === 'support' && !supportSettings)
  const initialType = inquiryTypes.find(item => item.value === params.get('type'))?.value ?? getInitialInquiryType(activeSection)
  const address = location?.address || siteSettings.address
  const maps = getMapActions({ address, embedUrl: location?.map_embed_url, kakaoMapUrl: location?.kakao_map_url, naverMapUrl: location?.naver_map_url })
  const ready = !contactData.isLoading && !contactData.error
  const title = activeSection === 'support' ? (supportSettings?.title || '후원 약정서') : t('title')

  useEffect(() => {
    if (!ready || !route.hash) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(route.hash.slice(1))?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [ready, route.hash, activeSection])

  return (
    <div className="contact-atelier">
      <SeoHead title={title} path="/contact" description={copyText("contact", "contact.fixed.ContactPage.eccca7b73b", "서울모테트청소년합창단 후원, 공연, 입단과 일반 문의를 공식 채널로 접수합니다.")} />
      <header className="contact-atelier__intro contact-atelier__shell">
        {activeSection !== 'all' ? <Link className="contact-atelier__back" to="/contact">{<FormattedCopy page="contact" id="contact.back" text={t('back')}>{t('back')}</FormattedCopy>}</Link> : null}
        <p className="contact-atelier__eyebrow">{<FormattedCopy page="contact" id="contact.fixed.ContactPage.f34c03131f" text={copyText("contact", "contact.fixed.ContactPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}>{copyText("contact", "contact.fixed.ContactPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}</FormattedCopy>}</p>
        <div className="contact-atelier__title-row">
          <h1>{title}</h1>
          <p>{activeSection === 'support' ? (supportSettings?.subtitle || '후원 방식과 약정 내용을 확인해 주세요.') : <FormattedCopy page="contact" id="contact.description" text={t('description')} lineBreaks><CopyLines text={t('description')} /></FormattedCopy>}</p>
        </div>
      </header>
      <nav className="contact-atelier__navigation contact-atelier__shell" aria-label={copyText("contact", "contact.fixed.ContactPage.29d1e6fdd4", "후원·문의 섹션 선택")}>
        {navigation.map(item => <Link key={item.section} to={item.href} aria-current={activeSection === item.section ? 'page' : undefined}>{t(item.section)}</Link>)}
      </nav>

      {contactData.isLoading ? <div className="contact-atelier__state contact-atelier__shell"><LoadingState label={copyText("contact", "contact.fixed.ContactPage.739ad63f2f", "문의 정보를 불러오는 중입니다")} /></div> : null}
      {contactData.error ? <section className="contact-atelier__state contact-atelier__shell" role="alert"><h2>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.f51f71b9d6" text={copyText("contact", "contact.fixed.ContactPage.f51f71b9d6", "문의 정보를 불러오지 못했습니다.")}>{copyText("contact", "contact.fixed.ContactPage.f51f71b9d6", "문의 정보를 불러오지 못했습니다.")}</FormattedCopy>}</h2><p>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.4ac734f478" text={copyText("contact", "contact.fixed.ContactPage.4ac734f478", "연결 상태를 확인하고 다시 시도해 주세요. 운영 정보가 확인되기 전에는 약정서를 표시하지 않습니다.")}>{copyText("contact", "contact.fixed.ContactPage.4ac734f478", "연결 상태를 확인하고 다시 시도해 주세요. 운영 정보가 확인되기 전에는 약정서를 표시하지 않습니다.")}</FormattedCopy>}</p><button type="button" className="contact-atelier__action" onClick={contactData.refetch}>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.196856a662" text={copyText("contact", "contact.fixed.ContactPage.196856a662", "다시 시도")}>{copyText("contact", "contact.fixed.ContactPage.196856a662", "다시 시도")}</FormattedCopy>}</button></section> : null}

      {ready && showAll ? (
        <section className="contact-atelier__section contact-atelier__support" id="support" aria-labelledby="contact-support-title">
          <div className="contact-atelier__shell contact-atelier__columns">
            <div className="contact-atelier__aside">
              <p className="contact-atelier__eyebrow">{<FormattedCopy page="contact" id="contact.support" text={t('support')}>{t('support')}</FormattedCopy>}</p>
              <h2 id="contact-support-title"><FormattedCopy page="contact" id="contact.supportTitle" text={t('supportTitle')} lineBreaks><CopyLines text={t('supportTitle')} /></FormattedCopy></h2>
              <p>{supportSettings?.description || siteSettings.support_text || '후원 관련 안내는 문의를 통해 도와드리겠습니다.'}</p>
              <Link className="contact-atelier__action contact-atelier__action--primary" to={supportSettings ? '/contact?section=support#support' : '/contact?section=inquiry&type=support#form'}>{supportSettings ? <FormattedCopy page="contact" id="contact.pledgeAction" text={t('pledgeAction')}>{t('pledgeAction')}</FormattedCopy> : <FormattedCopy page="contact" id="contact.supportInquiry" text={t('supportInquiry')}>{t('supportInquiry')}</FormattedCopy>} <span aria-hidden="true">→</span></Link>
            </div>
            <div>
              <h3>{<FormattedCopy page="contact" id="contact.regular" text={t('regular')}>{t('regular')}</FormattedCopy>}</h3>
              {supportSettings ? <>
                <dl className="contact-atelier__amounts">
                  {supportSettings.individual_amounts.length ? <div><dt>{<FormattedCopy page="contact" id="contact.individual" text={t('individual')}>{t('individual')}</FormattedCopy>}</dt><dd>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.450d32b52e" text={copyText("contact", "contact.fixed.ContactPage.450d32b52e", "월 ")}>{copyText("contact", "contact.fixed.ContactPage.450d32b52e", "월 ")}</FormattedCopy>}{formatSupportAmounts(supportSettings.individual_amounts)}</dd></div> : null}
                  {supportSettings.corporate_amounts.length ? <div><dt>{<FormattedCopy page="contact" id="contact.corporate" text={t('corporate')}>{t('corporate')}</FormattedCopy>}</dt><dd>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.450d32b52e" text={copyText("contact", "contact.fixed.ContactPage.450d32b52e", "월 ")}>{copyText("contact", "contact.fixed.ContactPage.450d32b52e", "월 ")}</FormattedCopy>}{formatSupportAmounts(supportSettings.corporate_amounts)}</dd></div> : null}
                </dl>
                {supportSettings.allow_custom_amount ? <p className="contact-atelier__support-note">{<FormattedCopy page="contact" id="contact.fixed.ContactPage.c43d9df174" text={copyText("contact", "contact.fixed.ContactPage.c43d9df174", "다른 금액도 직접 입력하실 수 있습니다.")}>{copyText("contact", "contact.fixed.ContactPage.c43d9df174", "다른 금액도 직접 입력하실 수 있습니다.")}</FormattedCopy>}</p> : null}
                <p className="contact-atelier__support-note">{<FormattedCopy page="contact" id="contact.fixed.ContactPage.bb4b9f91d5" text={copyText("contact", "contact.fixed.ContactPage.bb4b9f91d5", "약정서를 보내도 결제되거나 자동 출금되지 않습니다.")}>{copyText("contact", "contact.fixed.ContactPage.bb4b9f91d5", "약정서를 보내도 결제되거나 자동 출금되지 않습니다.")}</FormattedCopy>}</p>
                <p>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.a18802069e" text={copyText("contact", "contact.fixed.ContactPage.a18802069e", "후원 관련 자세한 안내는 문의를 통해 도와드리겠습니다.")}>{copyText("contact", "contact.fixed.ContactPage.a18802069e", "후원 관련 자세한 안내는 문의를 통해 도와드리겠습니다.")}</FormattedCopy>}</p>
              </> : <p className="contact-atelier__support-note">{<FormattedCopy page="contact" id="contact.fixed.ContactPage.0fe35f361f" text={copyText("contact", "contact.fixed.ContactPage.0fe35f361f", "현재 후원 약정 접수를 준비하고 있습니다. 후원 방식과 금액은 문의를 통해 확인해 주세요.")}>{copyText("contact", "contact.fixed.ContactPage.0fe35f361f", "현재 후원 약정 접수를 준비하고 있습니다. 후원 방식과 금액은 문의를 통해 확인해 주세요.")}</FormattedCopy>}</p>}
            </div>
          </div>
        </section>
      ) : null}

      {ready && activeSection === 'support' ? (
        supportSettings ? <div className="contact-atelier__shell"><SupportPledgeForm settings={supportSettings} siteSettings={siteSettings} /><p className="contact-atelier__support-note"><Link className="contact-atelier__action" to="/contact?section=inquiry&type=support#form">{<FormattedCopy page="contact" id="contact.fixed.ContactPage.cb4a92fb56" text={copyText("contact", "contact.fixed.ContactPage.cb4a92fb56", "후원에 대해 문의하기 ")}>{copyText("contact", "contact.fixed.ContactPage.cb4a92fb56", "후원에 대해 문의하기 ")}</FormattedCopy>}<span aria-hidden="true">→</span></Link></p></div>
          : <section className="contact-atelier__state contact-atelier__shell"><h2>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.5a0e526131" text={copyText("contact", "contact.fixed.ContactPage.5a0e526131", "후원 약정 접수를 준비하고 있습니다.")}>{copyText("contact", "contact.fixed.ContactPage.5a0e526131", "후원 약정 접수를 준비하고 있습니다.")}</FormattedCopy>}</h2><p>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.a043c327a1" text={copyText("contact", "contact.fixed.ContactPage.a043c327a1", "운영 설정이 확인되기 전에는 온라인 약정서를 표시하지 않습니다. 아래 문의 양식으로 연락해 주세요.")}>{copyText("contact", "contact.fixed.ContactPage.a043c327a1", "운영 설정이 확인되기 전에는 온라인 약정서를 표시하지 않습니다. 아래 문의 양식으로 연락해 주세요.")}</FormattedCopy>}</p></section>
      ) : null}

      <ContactInquiryForm initialType={initialType} hidden={!ready || !showInquiry} />

      {ready && (showAll || activeSection === 'sponsors') ? (
        <section id="contact-sponsors" className="contact-atelier__sponsors contact-atelier__shell">
          {sponsors.length > 0 ? <SponsorsSection sponsors={sponsors} /> : <div className="contact-atelier__sponsor-empty" id="sponsors"><h2>{<FormattedCopy page="contact" id="contact.sponsorTitle" text={t('sponsorTitle')}>{t('sponsorTitle')}</FormattedCopy>}</h2><p><FormattedCopy page="contact" id="contact.sponsorEmpty" text={t('sponsorEmpty')} lineBreaks><CopyLines text={t('sponsorEmpty')} /></FormattedCopy></p></div>}
        </section>
      ) : null}

      {ready && (showAll || activeSection === 'location') ? (
        <section className="contact-atelier__section contact-atelier__location" id="location" aria-labelledby="contact-location-title">
          <div className="contact-atelier__shell">
            <div className="contact-atelier__columns">
              <div>
                <p className="contact-atelier__eyebrow">{<FormattedCopy page="contact" id="contact.location" text={t('location')}>{t('location')}</FormattedCopy>}</p>
                <h2 id="contact-location-title">{address || '장소 정보를 준비하고 있습니다.'}</h2>
                {location?.transit_info ? <p>{location.transit_info}</p> : null}
                {location?.parking_info ? <p>{location.parking_info}</p> : null}
                <div className="contact-atelier__map-actions">{maps.buttons.map(action => <a key={action.provider} className="contact-atelier__action" href={action.href} target="_blank" rel="noopener noreferrer">{action.label} <span aria-hidden="true">↗</span></a>)}</div>
              </div>
              <dl className="contact-atelier__contacts">
                {siteSettings.phone?.trim() ? <div><dt>{<FormattedCopy page="contact" id="contact.phone" text={t('phone')}>{t('phone')}</FormattedCopy>}</dt><dd><a href={'tel:' + siteSettings.phone.replace(/[^0-9+]/g, '')}>{siteSettings.phone}</a></dd></div> : null}
                {siteSettings.email?.trim() ? <div><dt>{<FormattedCopy page="contact" id="contact.email" text={t('email')}>{t('email')}</FormattedCopy>}</dt><dd>{siteSettings.email}</dd></div> : null}
                {siteSettings.fax?.trim() ? <div><dt>{<FormattedCopy page="contact" id="contact.fixed.ContactPage.6f110978f5" text={copyText("contact", "contact.fixed.ContactPage.6f110978f5", "FAX")}>{copyText("contact", "contact.fixed.ContactPage.6f110978f5", "FAX")}</FormattedCopy>}</dt><dd>{siteSettings.fax}</dd></div> : null}
              </dl>
            </div>
            {maps.embedSrc || location?.image_url ? <details className="contact-atelier__location-media"><summary>{<FormattedCopy page="contact" id="contact.map" text={t('map')}>{t('map')}</FormattedCopy>}</summary>
              {maps.embedSrc ? <iframe src={maps.embedSrc} title={(location?.place_name || '서울모테트음악재단') + ' 지도'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : null}
              {location?.image_url ? <figure><OptimizedImage className="contact-atelier__location-image" src={location.image_url} alt={location.image_alt || (location.place_name || '오시는 길') + ' 사진'} objectFit="contain" />{location.image_caption ? <figcaption>{location.image_caption}</figcaption> : null}</figure> : null}
            </details> : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

