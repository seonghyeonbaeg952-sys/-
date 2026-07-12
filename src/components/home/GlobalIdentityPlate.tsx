import { legacyChoirIntro } from '../../constants/legacyContent'
import { BrandLogo } from '../common/BrandLogo'

type GlobalIdentityPlateProps = {
  instagramUrl?: string | null
  youtubeUrl?: string | null
}

const identityFacts = [
  { label: 'FOUNDED', value: String(legacyChoirIntro.foundedYear) },
  { label: 'BASE', value: 'SEOUL, KOREA' },
  { label: 'FOCUS', value: 'CHORAL EDUCATION' },
  { label: 'STAGE', value: 'CONCERT & EXCHANGE' },
] as const

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

export function GlobalIdentityPlate({
  instagramUrl,
  youtubeUrl,
}: GlobalIdentityPlateProps) {
  const socialLinks = [
    { href: getSafeExternalUrl(youtubeUrl), label: 'YOUTUBE' },
    { href: getSafeExternalUrl(instagramUrl), label: 'INSTAGRAM' },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href))

  return (
    <aside className="home-global-identity-plate" aria-label="합창단 영문 소개">
      <div className="home-global-identity-heading">
        <BrandLogo brand="smyc" size="md" theme="dark" />
        <div>
          <p>SEOUL MOTET YOUTH CHOIR</p>
          <strong>Voice, learning and the stage</strong>
        </div>
      </div>

      <dl className="home-global-identity-facts">
        {identityFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="home-global-identity-footer">
        <p>
          서울에서 시작한 청소년 합창교육과 무대의 기록을 세계 관객과
          공유합니다.
        </p>
        {socialLinks.length > 0 ? (
          <nav aria-label="합창단 공식 소셜 채널">
            {socialLinks.map((link) => (
              <a
                href={link.href}
                key={link.label}
                rel="noreferrer noopener"
                target="_blank"
              >
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </aside>
  )
}
