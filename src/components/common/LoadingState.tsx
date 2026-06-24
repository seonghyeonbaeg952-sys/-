type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = '내용을 불러오는 중입니다' }: LoadingStateProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-card border border-line-default/90 bg-bg-warm-white p-8 text-text-muted shadow-card"
      role="status"
    >
      <span className="size-8 animate-spin rounded-full border-2 border-line-default border-t-gold-warm motion-reduce:animate-none" />
      <span className="break-keep text-center text-sm leading-6">{label}</span>
    </div>
  )
}
