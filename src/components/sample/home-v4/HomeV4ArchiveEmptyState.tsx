type HomeV4ArchiveEmptyStateProps = {
  galleryHref?: string
  galleryLabel: string
  message: string
}

export function HomeV4ArchiveEmptyState({
  galleryHref,
  galleryLabel,
  message,
}: HomeV4ArchiveEmptyStateProps) {
  return (
    <div className="home-v4-archive__empty" role="status">
      <span aria-hidden="true">00</span>
      <p>{message}</p>
      {galleryHref ? (
        <a href={galleryHref}>
          <span>{galleryLabel}</span>
          <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </div>
  )
}
