type HomeV4SampleButtonProps = {
  children: string
  href: string
  variant?: 'primary' | 'secondary' | 'text'
}

export function HomeV4SampleButton({
  children,
  href,
  variant = 'primary',
}: HomeV4SampleButtonProps) {
  return (
    <a className={`home-v4-button home-v4-button--${variant}`} href={href}>
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </a>
  )
}
