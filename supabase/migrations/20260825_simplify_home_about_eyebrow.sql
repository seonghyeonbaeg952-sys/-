-- Keeps an already-migrated CMS row aligned with the simplified home label.
-- Custom administrator copy remains untouched.

begin;

update public.site_texts
set
  value = case
    when btrim(value) = ''
      or value = default_value
      or value = 'ABOUT · COLLECTIVE PORTRAIT'
      then 'ABOUT'
    else value
  end,
  default_value = 'ABOUT'
where key = 'home.current.about.eyebrowEn';

commit;
