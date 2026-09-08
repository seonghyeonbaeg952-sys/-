import type { HomeContentV2 } from '../../types/homeContent'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import '../../styles/home-responsive-spirit.css'

type ResponsiveSpiritListProps = {
  wrapper: HomeContentV2['spiritWrapper']
}

export function ResponsiveSpiritList({ wrapper }: ResponsiveSpiritListProps) {
  const labels = [
    wrapper.responsiveLabel1,
    wrapper.responsiveLabel2,
    wrapper.responsiveLabel3,
    wrapper.responsiveLabel4,
    wrapper.responsiveLabel5,
  ]

  return (
    <section
      aria-labelledby="home-responsive-spirit-heading"
      className="flow-section home-section home-responsive-spirit"
      data-flow-section="spirit"
      id="home-responsive-spirit"
    >
      <Container className="home-responsive-spirit__container">
        <p className="home-responsive-spirit__eyebrow">
          {wrapper.responsiveEyebrow}
        </p>
        <h2
          className="home-responsive-spirit__title"
          id="home-responsive-spirit-heading"
        >
          {wrapper.responsiveTitle}
        </h2>
        <p className="home-responsive-spirit__description">
          {wrapper.responsiveDescription}
        </p>
        <ol
          aria-labelledby="home-responsive-spirit-heading"
          className="home-responsive-spirit__values"
        >
          {labels.map((label, index) => (
            <li className="home-responsive-spirit__value" key={index}>
              <span aria-hidden="true" className="home-responsive-spirit__number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <Button
          className="home-responsive-spirit__cta"
          focusTone="dark"
          href="/spirit"
          variant="gold"
        >
          <span>{wrapper.responsiveCtaLabel}</span>
        </Button>
      </Container>
    </section>
  )
}
