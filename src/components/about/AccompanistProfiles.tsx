import { Fragment } from 'react'
import { EmptyState } from '../common/EmptyState'
import { ImageTile } from '../home/ImageTile'
import type { PersonProfileRow } from '../../types/cms'
import '../../styles/accompanist-profiles.css'
import { buildAccompanistProfileModel } from './accompanistProfileModel'

type AccompanistProfilesProps = {
  headingLevel?: 'h1' | 'h2'
  people: PersonProfileRow[]
}

export function AccompanistProfiles({
  headingLevel = 'h1',
  people,
}: AccompanistProfilesProps) {
  const Heading = headingLevel

  return (
    <section
      aria-labelledby="accompanist-profile-title"
      className="accompanist-profile"
      id="accompanist"
    >
      <div className="accompanist-profile__shell">
        <header className="accompanist-profile__intro">
          <div className="accompanist-profile__intro-copy">
            <span aria-hidden="true" className="accompanist-profile__rail" />
            <p className="accompanist-profile__eyebrow">
              ACCOMPANIST PROFILE <span aria-hidden="true">/</span> SEOUL
            </p>
            <Heading id="accompanist-profile-title">반주자 소개</Heading>
            <p className="accompanist-profile__summary">
              연습과 무대에서 합창단과 함께하는 두 반주자의 학력과 현재 활동을
              소개합니다.
            </p>
          </div>
          <p aria-hidden="true" className="accompanist-profile__display">
            Accompanists.
          </p>
        </header>

        <div aria-hidden="true" className="accompanist-profile__baseline" />

        {people.length > 0 ? (
          <div className="accompanist-profile__list">
            {people.map((person, index) => {
              const model = buildAccompanistProfileModel(person)
              const name = person.name?.trim() || '반주자'
              const imageSide = index % 2 === 0 ? 'left' : 'right'

              return (
                <Fragment key={person.id}>
                  <article
                    className="accompanist-profile__card"
                    data-image-side={imageSide}
                    data-portrait-size={name === '박정화' ? 'compact' : undefined}
                    data-tone={index % 2 === 0 ? 'cool' : 'warm'}
                  >
                    <figure className="accompanist-profile__portrait">
                      <ImageTile
                        alt={person.profile_image_alt?.trim() || `${name} 반주자 프로필 사진`}
                        className="accompanist-profile__portrait-image"
                        fallbackVariant="profile"
                        height={800}
                        imgClassName="accompanist-profile__portrait-photo"
                        objectFit="cover"
                        priority={index === 0}
                        sizes="(min-width: 1180px) 320px, (min-width: 701px) 28vw, 260px"
                        src={person.photo_url ?? ''}
                        width={640}
                      />
                    </figure>

                    <div className="accompanist-profile__copy">
                      <p className="accompanist-profile__role">ACCOMPANIST</p>
                      <h2>{name}</h2>
                      <p className="accompanist-profile__role-en">Piano Accompanist</p>
                      <div aria-hidden="true" className="accompanist-profile__copy-divider" />

                      {person.description ? (
                        <p className="accompanist-profile__description">{person.description}</p>
                      ) : null}

                      {model.education.length > 0 ? (
                        <ul aria-label={`${name} 학력과 주요 이력`} className="accompanist-profile__facts">
                          {model.education.map((item, itemIndex) => (
                            <li key={`${person.id}-education-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      ) : null}

                      {model.current.length > 0 ? (
                        <div className="accompanist-profile__current">
                          <p>CURRENT</p>
                          <ul aria-label={`${name} 현재 활동`}>
                            {model.current.map((item, itemIndex) => (
                              <li key={`${person.id}-current-${itemIndex}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {person.message ? (
                        <blockquote className="accompanist-profile__message">
                          {person.message}
                        </blockquote>
                      ) : null}
                    </div>
                  </article>
                  {index < people.length - 1 ? (
                    <div aria-hidden="true" className="accompanist-profile__pair-divider" />
                  ) : null}
                </Fragment>
              )
            })}
          </div>
        ) : (
          <div className="accompanist-profile__empty">
            <EmptyState title="등록된 반주자 소개가 없습니다" />
          </div>
        )}

        <footer className="accompanist-profile__folio">
          SEOUL MOTET YOUTH CHOIR · ACCOMPANIST PROFILE
        </footer>
      </div>
    </section>
  )
}
