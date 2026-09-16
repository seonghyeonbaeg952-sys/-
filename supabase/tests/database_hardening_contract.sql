-- Synthetic temporary data only; no operational row is updated.
begin;
set local statement_timeout = '10s';
do $$ begin
  assert exists(select 1 from pg_proc where oid='public.set_updated_at()'::regprocedure
    and 'search_path=""'=any(proconfig)), 'updated_at function search_path is not fixed';
  assert to_regclass('public.site_texts_key_uidx') is null, 'redundant key index remains';
  assert exists(select 1 from pg_constraint c join pg_index i on i.indexrelid=c.conindid
    where c.conrelid='public.site_texts'::regclass and c.conname='site_texts_key_unique'
    and c.contype='u' and i.indisvalid and i.indisunique), 'original uniqueness constraint missing';
end $$;
create temp table cms_hardening_fixture(id integer primary key, updated_at timestamptz);
create trigger update_fixture_time before update on cms_hardening_fixture
  for each row execute function public.set_updated_at();
insert into cms_hardening_fixture values (1,'2000-01-01');
update cms_hardening_fixture set id=1 where id=1;
do $$ begin
  assert (select updated_at=transaction_timestamp() from cms_hardening_fixture where id=1), 'timestamp trigger regression';
end $$;
rollback;
select 'PASS: fixed function path and retained uniqueness; temporary data rolled back' as result;
