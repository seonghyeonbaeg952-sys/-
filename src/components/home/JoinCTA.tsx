import { Button } from '../common/Button'
import { Container } from '../common/Container'

type JoinCTAProps = {
  text?: string | null
}

export function JoinCTA({ text }: JoinCTAProps) {
  return (
    <section className="bg-bg-ivory py-section-mobile lg:py-section-desktop">
      <Container>
        <div className="grid min-w-0 gap-8 rounded-card border border-line-default bg-linear-to-br from-bg-warm-white via-bg-warm-white to-gold-soft/60 p-8 shadow-card md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:p-10">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-warm">
              JOIN
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-navy-deep md:text-4xl">
              서울모테트청소년합창단과 함께 노래할 단원을 기다립니다.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              {text ||
                '음악을 사랑하는 청소년들이 함께 배우고 성장할 수 있도록 입단 안내와 문의 흐름을 준비합니다.'}
            </p>
          </div>
          <Button
            className="w-full max-w-full justify-self-start sm:w-auto"
            href="/join"
            size="lg"
            variant="primary"
          >
            입단 안내 보기
          </Button>
        </div>
      </Container>
    </section>
  )
}
