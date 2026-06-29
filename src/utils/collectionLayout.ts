export type CollectionLayoutMode = 'empty' | 'featured' | 'two-up' | 'grid'

export function getCollectionLayoutMode(count: number): CollectionLayoutMode {
  if (count === 0) {
    return 'empty'
  }

  if (count === 1) {
    return 'featured'
  }

  if (count === 2) {
    return 'two-up'
  }

  return 'grid'
}
