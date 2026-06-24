export function hasImageSource(src: string | null | undefined): src is string {
  return typeof src === 'string' && src.trim().length > 0
}
