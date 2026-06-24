import { Button } from '../../components/common/Button'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'

export function NotFoundPage() {
  return (
    <section className="pt-[72px]">
      <Container className="py-section-mobile lg:py-section-desktop">
        <EmptyState
          action={
            <Button href="/" variant="gold">
              홈으로 이동
            </Button>
          }
          description="주소를 다시 확인하거나 홈으로 이동해 주세요."
          title="페이지를 찾을 수 없습니다"
        />
      </Container>
    </section>
  )
}
