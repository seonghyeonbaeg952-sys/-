-- Stage the public projection first, deploy its consumer, then apply the full transaction.
-- Existing sponsor rows, notes, applications and attachment objects are never deleted.
begin;

create or replace function public.get_public_sponsors()
returns table (
  id uuid, name text, display_name text, category text, tier text, description text,
  logo_url text, website_url text, show_on_home boolean, show_on_support boolean,
  show_on_footer boolean, display_order integer, is_visible boolean, created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select s.id, coalesce(nullif(btrim(s.display_name),''),s.name), s.display_name,
    s.category,s.tier,s.description,s.logo_url,s.website_url,s.show_on_home,
    s.show_on_support,s.show_on_footer,s.display_order,s.is_visible,s.created_at
  from public.sponsors s
  where s.is_visible = true and s.consent_public = true;
$$;
revoke all on function public.get_public_sponsors() from public,anon,authenticated;
grant execute on function public.get_public_sponsors() to anon,authenticated;
comment on function public.get_public_sponsors() is 'Fixed public projection of visible, consented sponsors. Private notes and original names replaced by a public display name are never returned.';

-- Authenticated administrators keep their existing full-access RLS policy and grants.
revoke select on public.sponsors from public,anon;
revoke select(internal_notes) on public.sponsors from public,anon;
drop policy if exists sponsors_public_read_visible on public.sponsors;

-- Public readers must use the projection: a raw name may differ from its public alias.
-- Revoke any column grants left by an earlier compatibility experiment as well.
revoke select(id,name,display_name,category,tier,description,logo_url,website_url,
  show_on_home,show_on_support,show_on_footer,display_order,is_visible,created_at,consent_public)
  on public.sponsors from public,anon;
drop policy if exists sponsors_anon_public_projection on public.sponsors;

-- /join uses submit_join_application_v2. Remove the independent retired v1 entry points.
revoke insert on public.join_applications from public,anon;
drop policy if exists join_applications_public_insert on public.join_applications;
drop policy if exists join_application_files_public_insert on storage.objects;

do $$
begin
  if has_column_privilege('anon','public.sponsors','internal_notes','SELECT')
    or has_column_privilege('anon','public.sponsors','name','SELECT') then
    raise exception 'Unexpected inherited private sponsor column grant. Migration rolled back.';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='sponsors'
    and policyname not in ('sponsors_admin_full_access')) then
    raise exception 'Unexpected sponsor policy: review before changing public access.';
  end if;
  if pg_has_role('authenticated','anon','MEMBER') then
    raise exception 'Unexpected authenticated-to-anon role inheritance.';
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='join_application_files_admin_select') then
    raise exception 'Historical attachment administrator access is missing.';
  end if;
end;
$$;
notify pgrst,'reload schema';
commit;
