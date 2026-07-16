import { Link } from 'react-router';

import { classNames } from '../../utils/classNames';
import type { SpiritCopy, SpiritValue } from '../../constants/spiritContent';
import { StaffLines } from './StaffLines';

type SpiritStatementBlockProps = {
  copy: SpiritCopy;
  align?: 'left' | 'center';
  tone?: 'light' | 'navy';
  className?: string;
};

export function SpiritStatementBlock({
  copy,
  align = 'left',
  tone = 'light',
  className,
}: SpiritStatementBlockProps) {
  const isCenter = align === 'center';
  const isNavy = tone === 'navy';

  return (
    <section
      className={classNames(
        'relative isolate overflow-hidden rounded-[18px] border px-5 py-7 sm:px-8 sm:py-9 lg:px-10',
        isNavy
          ? 'border-white/12 bg-navy-deep text-white shadow-premium'
          : 'border-line-default bg-bg-warm-white text-text-charcoal shadow-soft',
        className,
      )}
    >
      <div className="pointer-events-none absolute right-6 top-6 w-48 opacity-30">
        <StaffLines variant={isNavy ? 'inverted' : 'gold'} />
      </div>
      <div
        className={classNames(
          'relative z-10 max-w-3xl',
          isCenter ? 'mx-auto text-center' : 'text-left',
        )}
      >
        <p
          className={classNames(
            'type-eyebrow mb-4',
            isNavy ? 'text-gold-soft' : 'text-gold-ink',
          )}
        >
          {copy.eyebrow}
        </p>
        <h2
          className={classNames(
            'type-section-title text-navy-deep',
            isNavy && 'text-white',
          )}
        >
          {copy.title}
        </h2>
        {copy.subtitle ? (
          <p
            className={classNames(
              'type-body-strong mt-4',
              isNavy ? 'text-gold-soft' : 'text-navy-deep',
            )}
          >
            {copy.subtitle}
          </p>
        ) : null}
        <p
          className={classNames(
            'type-body mt-5 whitespace-pre-line',
            isNavy ? 'text-white/78' : 'text-text-muted',
          )}
        >
          {copy.body}
        </p>
        {copy.quote ? (
          <p
            className={classNames(
              'mt-6 border-l-2 pl-4 text-base font-semibold leading-relaxed',
              isCenter && 'mx-auto inline-block text-left',
              isNavy ? 'border-gold-soft text-gold-soft' : 'border-gold-warm text-navy-deep',
            )}
          >
            {copy.quote}
          </p>
        ) : null}
        {copy.ctaLabel && copy.ctaUrl ? (
          <Link
            to={copy.ctaUrl}
            className={classNames(
              'type-button mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-5 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              isNavy
                ? 'bg-gold-warm text-navy-midnight focus-visible:outline-gold-soft'
                : 'bg-navy-deep text-white focus-visible:outline-gold-ink',
            )}
          >
            {copy.ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

type SpiritValueCardsProps = {
  values: SpiritValue[];
  compact?: boolean;
  className?: string;
};

export function SpiritValueCards({ values, compact = false, className }: SpiritValueCardsProps) {
  return (
    <div
      className={classNames(
        'grid gap-4 sm:grid-cols-2',
        compact ? 'lg:grid-cols-4' : 'lg:grid-cols-2',
        className,
      )}
    >
      {values.map((value, index) => {
        return (
          <article
            key={value.title}
            className="group rounded-[16px] border border-line-default bg-bg-warm-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold-warm/55"
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft/45 text-gold-ink">
              <span aria-hidden="true" className="text-xs font-bold">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="type-card-title text-navy-deep">{value.title}</h3>
            <p className="mt-3 break-keep text-sm leading-[1.75] text-text-muted">
              {value.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}

type MotetMeaningCardProps = {
  copy: SpiritCopy;
};

export function MotetMeaningCard({ copy }: MotetMeaningCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[18px] border border-navy-deep/10 bg-navy-deep p-6 text-white shadow-premium sm:p-8">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border border-gold-soft/25" />
      <div className="absolute bottom-5 right-5 w-40 opacity-25">
        <StaffLines variant="inverted" />
      </div>
      <div className="relative z-10">
        <p className="type-eyebrow text-gold-soft">
          {copy.eyebrow}
        </p>
        <h3 className="type-card-title mt-4 text-bg-warm-white">{copy.title}</h3>
        <p className="type-body mt-5 whitespace-pre-line text-white/78">
          {copy.body}
        </p>
      </div>
    </article>
  );
}

type SpiritRibbonProps = {
  items: string[];
  className?: string;
};

export function SpiritRibbon({ items, className }: SpiritRibbonProps) {
  return (
    <div
      className={classNames(
        'rounded-full border border-line-default bg-bg-warm-white/90 px-4 py-3 shadow-soft',
        className,
      )}
    >
      <ol className="type-eyebrow flex flex-wrap items-center justify-center gap-2 text-center text-navy-deep">
        {items.map((item, index) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-warm" aria-hidden="true" />
            <span className="break-keep">{item}</span>
            {index < items.length - 1 ? (
              <span className="hidden h-px w-8 bg-line-default sm:block" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HarmonyBreathEffect({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        'pointer-events-none relative h-24 overflow-hidden rounded-[18px] border border-line-default bg-bg-ivory',
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-x-8 top-1/2 h-[1px] bg-gold-warm/35" />
      <div className="spirit-breath-dot absolute left-[16%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gold-warm" />
      <div className="spirit-breath-dot spirit-breath-dot-delay absolute left-[48%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-navy-deep" />
      <div className="spirit-breath-dot spirit-breath-dot-late absolute left-[78%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gold-warm" />
    </div>
  );
}
