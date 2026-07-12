import { legacyChoirIntro } from '../../constants/legacyContent'
import { formatKoreanDate } from '../../utils/formatDate'
import { BrandLogo } from '../common/BrandLogo'
import { TransitionLink } from '../common/TransitionLink'

type GlobalIdentityNextStage = {
  date: string
  location?: string
  title: string
}

type GlobalIdentityPlateProps = {
  description?: string
  instagramUrl?: string | null
  nextStage?: GlobalIdentityNextStage
  tagline?: string
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
  description = '서울에서 시작한 청소년 합창교육과 무대의 기록을 세계 관객과 공유합니다.',
  instagramUrl,
  nextStage,
  tagline = 'Voice, learning and the stage',
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
          <strong>{tagline}</strong>
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

      {nextStage ? (
        <TransitionLink className="home-global-identity-next" to="/concerts">
          <span>NEXT STAGE</span>
          <strong>{nextStage.title}</strong>
          <span className="home-global-identity-next__meta">
            <time dateTime={nextStage.date}>{formatKoreanDate(nextStage.date)}</time>
            {nextStage.location ? <span>{nextStage.location}</span> : null}
          </span>
          <span aria-hidden="true" className="home-global-identity-next__arrow">
            ↗
          </span>
        </TransitionLink>
      ) : null}

      <div className="home-global-identity-footer">
        <p>{description}</p>
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
