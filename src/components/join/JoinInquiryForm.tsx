import { Button } from '../common/Button'
import { Card } from '../common/Card'

export function JoinInquiryForm() {
  return (
    <Card className="p-6" radius="formal">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-warm">
        APPLICATION
      </p>
      <h3 className="mt-3 break-keep text-2xl font-semibold text-navy-deep">
        입단 안내 페이지에서 절차를 확인해 주세요
      </h3>
      <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
        현재 공개 화면에서는 입단 절차와 문의 동선을 안내합니다. 입단지원서 전용 양식은
        운영 설정에 연결된 신청 경로를 통해 접수합니다.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href="/join?section=process" size="lg" variant="gold">
          입단 절차 보기
        </Button>
        <Button href="/contact?section=performance" size="lg" variant="secondary">
          문의 보내기
        </Button>
      </div>
    </Card>
  )
}
