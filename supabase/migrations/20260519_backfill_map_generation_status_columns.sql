do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'map_generation_job_status'
  ) then
    create type public.map_generation_job_status as enum (
      'queued',
      'analyzing',
      'splitting',
      'processing_chunks',
      'merging',
      'done',
      'failed',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'map_generation_chunk_status'
  ) then
    create type public.map_generation_chunk_status as enum (
      'queued',
      'processing',
      'done',
      'merged',
      'failed',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'map_generation_jobs'
  ) then
    alter table public.map_generation_jobs
      add column if not exists status public.map_generation_job_status not null default 'queued',
      add column if not exists current_step text null,
      add column if not exists error_message text null,
      add column if not exists final_map_id uuid null references public.maps(id) on delete set null,
      add column if not exists chunk_count integer not null default 1 check (chunk_count >= 1);

    create index if not exists idx_map_generation_jobs_status
      on public.map_generation_jobs(status);
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'map_generation_chunks'
  ) then
    alter table public.map_generation_chunks
      add column if not exists status public.map_generation_chunk_status not null default 'queued',
      add column if not exists error_message text null,
      add column if not exists chunk_count integer not null default 1 check (chunk_count >= 1);

    create index if not exists idx_map_generation_chunks_status
      on public.map_generation_chunks(status);

    create index if not exists idx_map_generation_chunks_job_status
      on public.map_generation_chunks(job_id, status);
  end if;
end
$$;
