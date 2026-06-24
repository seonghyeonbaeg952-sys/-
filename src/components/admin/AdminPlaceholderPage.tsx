import { Card } from '../common/Card'

type AdminPlaceholderPageProps = {
  description?: string
  title: string
}

export function AdminPlaceholderPage({
  description = '이 기능은 다음 CMS CRUD 단계에서 구현됩니다.',
  title,
}: AdminPlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold-warm">CMS</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-deep">{title}</h1>
      </div>
      <Card className="p-8">
        <p className="text-base font-semibold text-navy-deep">
          이 기능은 다음 CMS CRUD 단계에서 구현됩니다.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      </Card>
    </section>
  )
}
