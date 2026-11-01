begin;

-- Extend CMS responsibilities without changing member visibility, protected
-- names, public projections, table grants, or RLS policies.
alter table public.members drop constraint if exists members_staff_role_check;
alter table public.members add constraint members_staff_role_check
  check (staff_role is null or staff_role in (
    'playing_coach', 'trainer', 'administration_planning', 'planning_pr', 'treasurer'
  ));

commit;
