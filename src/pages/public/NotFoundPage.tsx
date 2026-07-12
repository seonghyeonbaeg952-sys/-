import { Button } from '../../components/common/Button'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { SeoHead } from '../../components/common/SeoHead'

export function NotFoundPage() {
  return (
    <>
      <SeoHead
        description="요청한 페이지를 찾을 수 없습니다."
        noIndex
        title="페이지를 찾을 수 없습니다"
      />
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
    </>
  )
}
