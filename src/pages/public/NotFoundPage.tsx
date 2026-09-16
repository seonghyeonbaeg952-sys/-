import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { Button } from '../../components/common/Button'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { SeoHead } from '../../components/common/SeoHead'

export function NotFoundPage() {
  const { copy: copyText } = useSiteEditor()
  return (
    <>
      <SeoHead
        description={copyText("common", "common.fixed.NotFoundPage.b0f54f5a5b", "요청한 페이지를 찾을 수 없습니다.")}
        noIndex
        title={copyText("common", "common.fixed.NotFoundPage.031cc1a110", "페이지를 찾을 수 없습니다")}
      />
      <section className="pt-[72px]">
        <Container className="py-section-mobile lg:py-section-desktop">
          <EmptyState
            action={
              <Button href="/" variant="gold">{copyText("common", "common.fixed.NotFoundPage.64a9bf4fc5", "홈으로 이동")}</Button>
            }
            description={copyText("common", "common.fixed.NotFoundPage.5e80327cc4", "주소를 다시 확인하거나 홈으로 이동해 주세요.")}
            title={copyText("common", "common.fixed.NotFoundPage.031cc1a110", "페이지를 찾을 수 없습니다")}
          />
        </Container>
      </section>
    </>
  )
}
