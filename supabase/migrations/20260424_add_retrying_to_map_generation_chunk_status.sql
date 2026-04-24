do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'map_generation_chunk_status'
      and e.enumlabel = 'retrying'
  ) then
    alter type public.map_generation_chunk_status add value 'retrying' after 'processing';
  end if;
end
$$;
