-- Preserve existing voice parts and add accompaniment / no part display.
-- No member records, name privacy settings, grants or RLS policies are changed.
alter table public.members
  drop constraint members_part_check,
  add constraint members_part_check
    check (part in ('soprano', 'alto', 'tenor', 'bass', 'accompanist', 'hidden', 'other'));
