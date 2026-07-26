-- Synchronize the V2 homepage copy contract with public.site_texts.
--
-- Safety properties:
--   * additive and idempotent;
--   * never deletes a row or column;
--   * never overwrites an administrator-authored V2 value;
--   * copies non-blank legacy values before deactivating legacy keys;
--   * leaves RLS, grants, triggers and unrelated CMS groups unchanged.
--
-- Canonical display defaults live in src/constants/homeContentV2.ts. New rows
-- intentionally start with a blank value/default_value so the application
-- fallback remains the single source of truth until an administrator saves.

begin;

with canonical_keys as (
  select
    btrim(key_line) as key,
    row_number() over ()::integer as contract_order
  from regexp_split_to_table(
    $home_v2_keys$
home.heroSupplement.fallbackDescription
home.heroSupplement.mottoChips.1
home.heroSupplement.mottoChips.2
home.heroSupplement.mottoChips.3
home.quickActions.join.title
home.quickActions.join.description
home.quickActions.join.ctaLabel
home.quickActions.join.displayOrder
home.quickActions.join.isVisible
home.quickActions.concert.title
home.quickActions.concert.description
home.quickActions.concert.ctaLabel
home.quickActions.concert.displayOrder
home.quickActions.concert.isVisible
home.quickActions.support.title
home.quickActions.support.description
home.quickActions.support.ctaLabel
home.quickActions.support.displayOrder
home.quickActions.support.isVisible
home.about.eyebrowKo
home.about.eyebrowEn
home.about.title
home.about.paragraphs.1
home.about.paragraphs.2
home.about.ctaLabel
home.about.globalTagline
home.about.globalDescription
home.choirProgram.eyebrowKo
home.choirProgram.eyebrowEn
home.choirProgram.title
home.choirProgram.items.foundation.title
home.choirProgram.items.foundation.description
home.choirProgram.items.foundation.displayOrder
home.choirProgram.items.foundation.isVisible
home.choirProgram.items.education.title
home.choirProgram.items.education.description
home.choirProgram.items.education.displayOrder
home.choirProgram.items.education.isVisible
home.choirProgram.items.performance.title
home.choirProgram.items.performance.description
home.choirProgram.items.performance.displayOrder
home.choirProgram.items.performance.isVisible
home.choirProgram.items.growth.title
home.choirProgram.items.growth.description
home.choirProgram.items.growth.displayOrder
home.choirProgram.items.growth.isVisible
home.joinLetter.eyebrowKo
home.joinLetter.eyebrowEn
home.joinLetter.title
home.joinLetter.description
home.joinLetter.ctaLabel
home.concertProgram.eyebrowKo
home.concertProgram.eyebrowEn
home.concertProgram.title
home.concertProgram.description
home.concertProgram.concertsCtaLabel
home.concertProgram.noticesCtaLabel
home.concertProgram.detailCtaLabel
home.concertProgram.inquiryCtaLabel
home.concertProgram.noticePanelTitle
home.concertProgram.noticePanelCtaLabel
home.concertProgram.emptyConcertTitle
home.concertProgram.emptyConcertDescription
home.concertProgram.emptyConcertCtaLabel
home.concertProgram.emptyNoticeTitle
home.concertProgram.emptyNoticeDescription
home.concertProgram.emptyNoticeCtaLabel
home.scoreBook.eyebrowKo
home.scoreBook.cover.titleLines
home.scoreBook.leftPage.titleLines
home.scoreBook.leftPage.body
home.scoreBook.leftPage.keywords
home.scoreBook.leftPage.calloutTitle
home.scoreBook.leftPage.calloutBody
home.scoreBook.rightPage.prefix
home.scoreBook.rightPage.titleLines
home.scoreBook.rightPage.body
home.scoreBook.rightPage.keywords
home.scoreBook.rightPage.calloutTitle
home.scoreBook.rightPage.calloutBody
home.scoreBook.final.titleLines
home.scoreBook.final.summary
home.scoreBook.final.primaryCtaLabel
home.scoreBook.final.secondaryCtaLabel
home.scoreBook.valueItems.voice.label
home.scoreBook.valueItems.voice.description
home.scoreBook.valueItems.voice.displayOrder
home.scoreBook.valueItems.voice.isVisible
home.scoreBook.valueItems.score.label
home.scoreBook.valueItems.score.description
home.scoreBook.valueItems.score.displayOrder
home.scoreBook.valueItems.score.isVisible
home.scoreBook.valueItems.part.label
home.scoreBook.valueItems.part.description
home.scoreBook.valueItems.part.displayOrder
home.scoreBook.valueItems.part.isVisible
home.scoreBook.valueItems.ensemble.label
home.scoreBook.valueItems.ensemble.description
home.scoreBook.valueItems.ensemble.displayOrder
home.scoreBook.valueItems.ensemble.isVisible
home.scoreBook.valueItems.stage.label
home.scoreBook.valueItems.stage.description
home.scoreBook.valueItems.stage.displayOrder
home.scoreBook.valueItems.stage.isVisible
home.scoreBook.valueItems.guide.label
home.scoreBook.valueItems.guide.description
home.scoreBook.valueItems.guide.displayOrder
home.scoreBook.valueItems.guide.isVisible
home.spiritWrapper.eyebrowKo
home.spiritWrapper.title
home.spiritWrapper.ctaLabel
home.archive.eyebrowKo
home.archive.eyebrowEn
home.archive.title
home.archive.description
home.archive.expandLabel
home.archive.collapseLabel
home.archive.ctaLabel
home.archive.emptyTitle
home.archive.emptyDescription
home.sponsors.eyebrow
home.sponsors.title
home.sponsors.description
home.sponsors.ctaLabel
home.supportLetter.eyebrowKo
home.supportLetter.eyebrowEn
home.supportLetter.title
home.supportLetter.description
home.supportLetter.primaryCtaLabel
home.supportLetter.secondaryCtaLabel
home.supportLetter.pledgeEyebrow
home.supportLetter.pledgeTitle
home.supportLetter.pledgeDescription
$home_v2_keys$,
    E'\\r?\\n'
  ) as key_line
  where btrim(key_line) <> ''
)
insert into public.site_texts (
  key,
  group_name,
  page,
  section,
  label,
  value,
  default_value,
  description,
  input_type,
  value_type,
  sort_order,
  is_active
)
select
  key,
  'home.' || split_part(key, '.', 2),
  'home',
  'home.' || split_part(key, '.', 2),
  key,
  '',
  '',
  'V2 homepage copy field. Editing guidance is provided by the admin UI.',
  case
    when key ~ '(description|body|summary|paragraphs|titleLines)$'
      then 'textarea'
    else 'text'
  end,
  case
    when key ~ '(description|body|summary|paragraphs|titleLines)$'
      then 'textarea'
    else 'text'
  end,
  contract_order * 10,
  true
from canonical_keys
on conflict (key) do update
set
  group_name = excluded.group_name,
  page = excluded.page,
  section = excluded.section,
  input_type = excluded.input_type,
  value_type = excluded.value_type,
  sort_order = excluded.sort_order,
  is_active = true;

-- Prefer the first non-blank legacy source for each target. A non-blank V2
-- value always wins, so rerunning this migration cannot undo later edits.
with legacy_map (target_key, source_key, priority) as (
  values
    ('home.heroSupplement.fallbackDescription', 'home.hero.subtitle', 1),
    ('home.heroSupplement.fallbackDescription', 'home.hero.description', 2),
    ('home.heroSupplement.mottoChips.1', 'home.hero.chip1', 1),
    ('home.heroSupplement.mottoChips.2', 'home.hero.chip2', 1),
    ('home.heroSupplement.mottoChips.3', 'home.hero.chip3', 1),
    ('home.quickActions.join.title', 'home.quick.join.title', 1),
    ('home.quickActions.join.title', 'home.quick.1.title', 2),
    ('home.quickActions.join.description', 'home.quick.join.description', 1),
    ('home.quickActions.join.description', 'home.quick.1.description', 2),
    ('home.quickActions.concert.title', 'home.quick.concert.title', 1),
    ('home.quickActions.concert.title', 'home.quick.2.title', 2),
    ('home.quickActions.concert.description', 'home.quick.concert.description', 1),
    ('home.quickActions.concert.description', 'home.quick.2.description', 2),
    ('home.quickActions.support.title', 'home.quick.support.title', 1),
    ('home.quickActions.support.title', 'home.quick.3.title', 2),
    ('home.quickActions.support.description', 'home.quick.support.description', 1),
    ('home.quickActions.support.description', 'home.quick.3.description', 2),
    ('home.about.eyebrowEn', 'home.about.kicker', 1),
    ('home.about.paragraphs.1', 'home.about.body', 1),
    ('home.about.ctaLabel', 'home.about.cta', 1),
    ('home.about.globalTagline', 'home.global.tagline', 1),
    ('home.about.globalDescription', 'home.global.description', 1),
    ('home.joinLetter.eyebrowEn', 'home.join.kicker', 1),
    ('home.joinLetter.title', 'home.join.title', 1),
    ('home.joinLetter.description', 'home.join.body', 1),
    ('home.joinLetter.description', 'home.join.description', 2),
    ('home.joinLetter.ctaLabel', 'home.join.cta', 1),
    ('home.joinLetter.ctaLabel', 'home.join.button', 2),
    ('home.concertProgram.eyebrowEn', 'home.concert.kicker', 1),
    ('home.concertProgram.eyebrowEn', 'home.concert.eyebrow', 2),
    ('home.concertProgram.title', 'home.concert.title', 1),
    ('home.concertProgram.title', 'home.concert.sectionTitle', 2),
    ('home.concertProgram.description', 'home.concert.description', 1),
    ('home.concertProgram.concertsCtaLabel', 'home.concert.cta.schedule', 1),
    ('home.concertProgram.concertsCtaLabel', 'home.concert.concertButton', 2),
    ('home.concertProgram.noticesCtaLabel', 'home.concert.cta.notice', 1),
    ('home.concertProgram.noticesCtaLabel', 'home.concert.noticeButton', 2),
    ('home.concertProgram.detailCtaLabel', 'home.concert.cta.more', 1),
    ('home.concertProgram.detailCtaLabel', 'common.cta.more', 2),
    ('home.concertProgram.inquiryCtaLabel', 'home.concert.cta.inquiry', 1),
    ('home.concertProgram.inquiryCtaLabel', 'common.cta.inquiry', 2),
    ('home.scoreBook.cover.titleLines', 'home.score.cover.title', 1),
    ('home.scoreBook.cover.titleLines', 'home.scorebook.coverTitle', 2),
    ('home.scoreBook.leftPage.titleLines', 'home.score.final.title', 1),
    ('home.scoreBook.leftPage.titleLines', 'home.scorebook.finalTitle', 2),
    ('home.scoreBook.leftPage.titleLines', 'home.score.left.title', 3),
    ('home.scoreBook.leftPage.body', 'home.score.final.body', 1),
    ('home.scoreBook.leftPage.body', 'home.scorebook.finalDescription', 2),
    ('home.scoreBook.leftPage.body', 'home.score.left.body', 3),
    ('home.scoreBook.rightPage.prefix', 'home.score.right.title', 1),
    ('home.scoreBook.rightPage.prefix', 'home.scorebook.rightTitle', 2),
    ('home.scoreBook.rightPage.body', 'home.score.right.body', 1),
    ('home.scoreBook.final.titleLines', 'home.score.final.title', 1),
    ('home.scoreBook.final.titleLines', 'home.scorebook.finalTitle', 2),
    ('home.scoreBook.final.summary', 'home.score.final.body', 1),
    ('home.scoreBook.final.summary', 'home.scorebook.finalDescription', 2),
    ('home.archive.eyebrowEn', 'home.gallery.kicker', 1),
    ('home.archive.eyebrowEn', 'home.gallery.eyebrow', 2),
    ('home.archive.title', 'home.gallery.title', 1),
    ('home.archive.title', 'home.gallery.sectionTitle', 2),
    ('home.archive.description', 'home.gallery.description', 1),
    ('home.archive.description', 'home.gallery.sectionDescription', 2),
    ('home.archive.ctaLabel', 'home.gallery.cta', 1),
    ('home.archive.emptyTitle', 'home.gallery.empty.title', 1),
    ('home.archive.emptyDescription', 'home.gallery.empty.description', 1),
    ('home.supportLetter.title', 'home.support.title', 1),
    ('home.supportLetter.description', 'home.support.description', 1),
    ('home.supportLetter.primaryCtaLabel', 'home.support.cta.primary', 1),
    ('home.supportLetter.primaryCtaLabel', 'home.support.button', 2),
    ('home.supportLetter.secondaryCtaLabel', 'home.support.cta.secondary', 1),
    ('home.supportLetter.secondaryCtaLabel', 'home.support.secondaryButton', 2),
    ('home.supportLetter.pledgeTitle', 'home.support.card.title', 1),
    ('home.supportLetter.pledgeTitle', 'home.support.cardTitle', 2),
    ('home.supportLetter.pledgeDescription', 'home.support.card.description', 1),
    ('home.supportLetter.pledgeDescription', 'home.support.cardDescription', 2)
),
chosen_legacy_value as (
  select distinct on (legacy_map.target_key)
    legacy_map.target_key,
    source.value
  from legacy_map
  join public.site_texts as source
    on source.key = legacy_map.source_key
  where btrim(source.value) <> ''
  order by legacy_map.target_key, legacy_map.priority
)
update public.site_texts as target
set value = chosen_legacy_value.value
from chosen_legacy_value
where
  target.key = chosen_legacy_value.target_key
  and btrim(target.value) = '';

-- Preserve a legacy value-list by distributing up to six non-blank labels.
with legacy_score_values as (
  select
    value,
    regexp_split_to_array(value, E'\\s*(?:[·,|]|\\r?\\n)\\s*') as labels
  from public.site_texts
  where key = 'home.score.value.list' and btrim(value) <> ''
),
score_targets (target_key, item_index) as (
  values
    ('home.scoreBook.valueItems.voice.label', 1),
    ('home.scoreBook.valueItems.score.label', 2),
    ('home.scoreBook.valueItems.part.label', 3),
    ('home.scoreBook.valueItems.ensemble.label', 4),
    ('home.scoreBook.valueItems.stage.label', 5),
    ('home.scoreBook.valueItems.guide.label', 6)
)
update public.site_texts as target
set value = legacy_score_values.labels[score_targets.item_index]
from legacy_score_values, score_targets
where
  target.key = score_targets.target_key
  and btrim(target.value) = ''
  and coalesce(btrim(legacy_score_values.labels[score_targets.item_index]), '') <> '';

-- Legacy rows remain available for audit/rollback, but public reads no longer
-- return them. Canonical V2 prefixes deliberately do not match these patterns.
update public.site_texts
set is_active = false
where
  is_active = true
  and (
    key like 'home.hero.%'
    or key like 'home.quick.%'
    or key like 'home.join.%'
    or key like 'home.concert.%'
    or key like 'home.score.%'
    or key like 'home.scorebook.%'
    or key like 'home.gallery.%'
    or key like 'home.support.%'
    or key like 'home.global.%'
    or key in ('home.about.kicker', 'home.about.body', 'home.about.cta')
  );

commit;
