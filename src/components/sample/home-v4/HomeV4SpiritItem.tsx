import type { HomeV4SpiritItemFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4SpiritItemProps = {
  item: HomeV4SpiritItemFixture
  number: number
  summary: string
}

export function HomeV4SpiritItem({
  item,
  number,
  summary,
}: HomeV4SpiritItemProps) {
  return (
    <article className="home-v4-spirit__item">
      <div className="home-v4-spirit__item-index">
        <span>{String(number).padStart(2, '0')}</span>
        <small>{item.englishLabel}</small>
      </div>
      <h3>{item.label}</h3>
      <p>{summary}</p>
      <span aria-hidden="true" className="home-v4-spirit__measure">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </article>
  )
}
