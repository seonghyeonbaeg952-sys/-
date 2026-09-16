begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';

-- The observed trigger only assigns pg_catalog.now() and returns NEW. Keep its
-- body, owner, ACL and invoker mode; refuse an unexpected implementation.
do $$ begin
  if not exists(select 1 from pg_proc where oid=to_regprocedure('public.set_updated_at()')
    and regexp_replace(prosrc,'\s','','g')='beginnew.updated_at=now();returnnew;end;'
    and not prosecdef) then
    raise exception 'Review the updated_at trigger before changing its search_path';
  end if;
end $$;
alter function public.set_updated_at() set search_path = '';

-- Retain the constraint-backed unique index. Remove only the verified duplicate
-- standalone index; no rows, constraints or other index definitions are removed.
do $$ begin
  if to_regclass('public.site_texts_key_uidx') is not null then
    if not exists(
      select 1 from pg_index redundant join pg_index retained
        on retained.indexrelid=to_regclass('public.site_texts_key_unique')
      join pg_constraint c on c.conindid=retained.indexrelid
      where redundant.indexrelid=to_regclass('public.site_texts_key_uidx')
        and redundant.indrelid='public.site_texts'::regclass
        and retained.indrelid=redundant.indrelid and c.contype='u'
        and redundant.indisvalid and retained.indisvalid
        and redundant.indisunique and retained.indisunique
        and redundant.indkey=retained.indkey
        and redundant.indcollation=retained.indcollation
        and redundant.indclass=retained.indclass
        and redundant.indoption=retained.indoption
        and redundant.indnkeyatts=retained.indnkeyatts
        and redundant.indnatts=retained.indnatts
        and redundant.indnullsnotdistinct=retained.indnullsnotdistinct
        and redundant.indexprs is null and retained.indexprs is null
        and redundant.indpred is null and retained.indpred is null
        and not exists(select 1 from pg_constraint dependency where dependency.conindid=redundant.indexrelid)
    ) then raise exception 'Refusing to remove an index that is not the verified redundant index'; end if;
    execute 'drop index public.site_texts_key_uidx';
  end if;
end $$;
commit;

-- Structural rollback if needed (no content restoration is necessary):
-- CREATE UNIQUE INDEX site_texts_key_uidx ON public.site_texts USING btree (key);
-- The safe search_path should remain fixed; reverting it is not required for
-- compatibility with the observed trigger body.
