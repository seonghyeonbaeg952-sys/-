-- Extends the existing conductor profile without changing or dropping legacy fields.
-- All fields are nullable so the public page can gracefully hide empty sections.

alter table public.conductor
  add column if not exists profile_image_alt text,
  add column if not exists profile_summary text,
  add column if not exists profile_highlight text,
  add column if not exists hero_quote text,
  add column if not exists current_roles text,
  add column if not exists education_items text,
  add column if not exists career_items text,
  add column if not exists awards_items text,
  add column if not exists activities_items text,
  add column if not exists philosophy_title text,
  add column if not exists philosophy_body text,
  add column if not exists philosophy_quote text,
  add column if not exists teaching_principles text,
  add column if not exists message_title text,
  add column if not exists message_body text,
  add column if not exists activity_images text,
  add column if not exists is_featured boolean not null default true;

comment on column public.conductor.current_roles is
  'One item per line. Displayed in the public conductor profile document.';
comment on column public.conductor.education_items is
  'One education item per line. Empty value hides the section.';
comment on column public.conductor.career_items is
  'One career item per line. Empty value hides the section.';
comment on column public.conductor.activity_images is
  'One image per line: image_url | alt text | caption.';
