import type { HomeV4JoinStepFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'

type HomeV4JoinStepsProps = {
  steps: HomeV4JoinStepFixture[]
}

export function HomeV4JoinSteps({ steps }: HomeV4JoinStepsProps) {
  const visibleSteps = steps
    .filter((step) => step.isVisible)
    .sort((left, right) => left.displayOrder - right.displayOrder)

  return (
    <ol
      className="home-v4-join__steps"
      data-step-count={visibleSteps.length}
    >
      {visibleSteps.map((step, index) => (
        <li className="home-v4-join__step" key={step.id}>
          <span aria-hidden="true" className="home-v4-join__step-dot" />
          <span className="home-v4-join__step-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="home-v4-join__step-copy">
            <h4>{step.title}</h4>
            <p className="home-v4-join__step-description--desktop">
              {step.description}
            </p>
            <p className="home-v4-join__step-description--mobile">
              {step.mobileDescription}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
