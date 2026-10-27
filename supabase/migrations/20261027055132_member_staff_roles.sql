-- Version matches the migration recorded by Supabase apply_migration.
begin;

alter table public.members add column if not exists staff_role text;
alter table public.members add constraint members_staff_role_check
  check (staff_role is null or staff_role in ('playing_coach', 'planning_pr', 'treasurer'));
comment on column public.members.staff_role is 'Public staff responsibility; free-form private descriptions are never exposed.';

-- The public projection still exposes only approved names and roster metadata.
-- Recreate atomically because PostgreSQL cannot change a TABLE return type in place.
drop function public.get_public_members();
create function public.get_public_members()
returns table (
  id uuid, public_display_name text, public_display_name_en text,
  part text, group_type text, member_status text, display_order integer,
  staff_role text
)
language sql stable security definer set search_path = ''
as $$
  select member.id, member.public_display_name, member.public_display_name_en,
    member.part, member.group_type, member.member_status, member.display_order,
    case when member.group_type = 'staff' and member.part <> 'accompanist'
      then member.staff_role else null end
  from public.members as member
  where member.is_visible = true
  order by member.display_order asc, member.id asc;
$$;
comment on function public.get_public_members() is 'Privacy-safe public roster including approved staff responsibilities; raw names, photos and descriptions remain private.';
revoke all on function public.get_public_members() from public, anon, authenticated;
grant execute on function public.get_public_members() to anon, authenticated;

commit;
