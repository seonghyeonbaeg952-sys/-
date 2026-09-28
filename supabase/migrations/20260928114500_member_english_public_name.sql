-- A youth member's English spelling is private until the existing consent
-- setting permits a full or masked public display. Keep raw names off the
-- anonymous roster, including when an administrator views the public site.
begin;

alter table public.members
  add column if not exists name_en text;

alter table public.members
  add column if not exists public_display_name_en text generated always as (
    case
      when name_display_type = 'full' then nullif(btrim(name_en), '')
      when name_display_type = 'partial' and nullif(btrim(name_en), '') is not null
        then left(btrim(name_en), 1) || '○'
      else null
    end
  ) stored;

comment on column public.members.name_en is
  'Private, administrator-entered official English spelling of a youth member name.';
comment on column public.members.public_display_name_en is
  'Consent-aware English display name; raw English spelling remains private.';

drop function public.get_public_members();
create function public.get_public_members()
returns table (
  id uuid,
  public_display_name text,
  public_display_name_en text,
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
    member.public_display_name_en,
    member.part,
    member.group_type,
    member.member_status,
    member.display_order
  from public.members as member
  where member.is_visible = true
  order by member.display_order asc, member.id asc;
$$;

comment on function public.get_public_members() is
  'Role-independent public youth roster with only consent-filtered names and non-identifying metadata.';

revoke all on function public.get_public_members() from public, anon, authenticated;
grant execute on function public.get_public_members() to anon, authenticated;
revoke select on public.members from public, anon;
grant select (
  id, public_display_name, public_display_name_en, part, group_type,
  member_status, display_order, is_visible
) on public.members to anon;

notify pgrst, 'reload schema';
commit;
