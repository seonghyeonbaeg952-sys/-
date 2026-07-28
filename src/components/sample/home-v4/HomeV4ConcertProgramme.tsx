import { useState } from 'react'

import type { HomeV4ConcertFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'

const statusLabels = {
  completed: '종료',
  preparing: '준비 중',
  upcoming: '예정',
} as const

type HomeV4ConcertProgrammeProps = {
  fixture: HomeV4ConcertFixture
}

export function HomeV4ConcertProgramme({
  fixture,
}: HomeV4ConcertProgrammeProps) {
  const [posterFailed, setPosterFailed] = useState(false)
  const showPoster = Boolean(fixture.posterUrl) && !posterFailed

  return (
    <>
      <figure
        className="home-v4-concert__cover"
        data-cover-type={showPoster ? 'poster' : 'typographic'}
      >
        {showPoster ? (
          <img
            alt={fixture.posterAlt ?? '샘플 공연 포스터'}
            decoding="async"
            loading="lazy"
            onError={() => setPosterFailed(true)}
            src={fixture.posterUrl}
          />
        ) : (
          <div
            aria-label={`${fixture.title.replaceAll('\n', ' ')} 프로그램 표지`}
            className="home-v4-concert__typographic-cover"
            role="img"
          >
            <span>SEOUL MOTET YOUTH CHOIR</span>
            <strong>{fixture.title.split('\n').join(' ')}</strong>
            <small>MOTET PROGRAMME</small>
          </div>
        )}
      </figure>

      <dl className="home-v4-concert__meta">
        <div>
          <dt>DATE</dt>
          <dd>{fixture.date}</dd>
        </div>
        <div>
          <dt>TIME</dt>
          <dd>{fixture.time}</dd>
        </div>
        <div>
          <dt>STATUS</dt>
          <dd>
            <span data-status={fixture.status}>
              {statusLabels[fixture.status]}
            </span>
          </dd>
        </div>
      </dl>
    </>
  )
}
