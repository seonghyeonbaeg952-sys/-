-- Youth member records contain raw names and optional photos/descriptions.
-- Anonymous visitors receive only a generated display name and roster metadata.
begin;

alter table public.members
add column if not exists public_display_name text generated always as (
  case
    when name_display_type = 'full' then nullif(btrim(name), '')
    when name_display_type = 'partial' and nullif(btrim(name), '') is not null
      then left(btrim(name), 1) || '○'
    else null
  end
) stored;

comment on column public.members.public_display_name is
'Consent-aware public name. Raw name, photo, and description remain unavailable to anonymous visitors.';

create or replace function public.get_public_members()
returns table (
  id uuid,
  public_display_name text,
  part text,
  group_type text,
  member_status text,
  display_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    member.id,
    member.public_display_name,
    member.part,
    member.group_type,
    member.member_status,
    member.display_order
  from public.members as member
  where member.is_visible = true
  order by member.display_order asc, member.id asc;
$$;

comment on function public.get_public_members() is
'Role-independent, visibility-filtered public youth roster with an explicit safe field set.';

revoke all on function public.get_public_members() from public, anon, authenticated;
grant execute on function public.get_public_members() to anon, authenticated;

drop policy if exists public_read_visible on public.members;
drop policy if exists members_public_read_safe on public.members;
create policy members_public_read_safe
on public.members
for select
to anon
using (is_visible = true);

revoke select on public.members from public, anon;
grant select (
  id,
  public_display_name,
  part,
  group_type,
  member_status,
  display_order,
  is_visible
) on public.members to anon;

notify pgrst, 'reload schema';

commit;
