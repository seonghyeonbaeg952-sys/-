type LoadingStateProps = {
  label?: string
  variant?: 'block' | 'inline'
}

export function LoadingState({
  label = '내용을 불러오는 중입니다',
  variant = 'block',
}: LoadingStateProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={
        variant === 'inline'
          ? 'inline-flex items-center gap-3 rounded-pill border border-line-default bg-bg-warm-white px-4 py-2 text-text-muted shadow-card'
          : 'loading-state flex min-h-[18rem] flex-col items-center justify-center gap-5 rounded-balanced border border-line-default/90 bg-bg-warm-white p-6 text-text-muted shadow-card sm:p-8'
      }
      role="status"
    >
      {variant === 'inline' ? (
        <span className="skeleton size-3 rounded-full" aria-hidden="true" />
      ) : (
        <div aria-hidden="true" className="w-full max-w-sm space-y-3">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      )}
      <span className="break-keep text-center text-sm leading-6">{label}</span>
    </div>
  )
}
