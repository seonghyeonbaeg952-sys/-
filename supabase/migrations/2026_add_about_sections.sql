-- Adds CMS-managed public About page sections.
-- Run after supabase/schema.sql. No secrets or real credentials are included.

create table if not exists public.about_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title text,
  content text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists about_sections_section_key_idx
on public.about_sections (section_key);

create index if not exists about_sections_public_visible_order_idx
on public.about_sections (display_order, section_key)
where is_visible = true;

drop trigger if exists set_updated_at on public.about_sections;
create trigger set_updated_at
before update on public.about_sections
for each row execute function public.set_updated_at();

alter table public.about_sections enable row level security;
alter table public.about_sections force row level security;

grant select on public.about_sections to anon, authenticated;
grant select, insert, update, delete on public.about_sections to authenticated;

drop policy if exists public_read_visible on public.about_sections;
create policy public_read_visible
on public.about_sections
for select
to anon, authenticated
using (is_visible = true);

drop policy if exists admin_full_access on public.about_sections;
create policy admin_full_access
on public.about_sections
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
