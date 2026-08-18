do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'map_structure_phase'
  ) then
    create type public.map_structure_phase as enum (
      'outline',
      'expanding',
      'partial',
      'complete'
    );
  end if;
end $$;

alter table public.maps
  add column if not exists structure_phase public.map_structure_phase;

update public.maps
set structure_phase = case
  when map_status in ('queued', 'processing_structure') then 'outline'::public.map_structure_phase
  when map_status = 'failed' then null
  when mind_elixir is null then null
  when exists (
    select 1
    from public.map_node_expansions mne
    where mne.map_id = maps.id
      and mne.status in ('queued', 'processing')
  ) then 'expanding'::public.map_structure_phase
  when exists (
    select 1
    from public.map_node_expansions mne
    where mne.map_id = maps.id
      and mne.status = 'failed'
  ) then 'partial'::public.map_structure_phase
  when exists (
    select 1
    from public.map_node_expansions mne
    where mne.map_id = maps.id
  ) then 'complete'::public.map_structure_phase
  else 'complete'::public.map_structure_phase
end
where structure_phase is null;

create index if not exists idx_maps_structure_phase
  on public.maps(structure_phase);
