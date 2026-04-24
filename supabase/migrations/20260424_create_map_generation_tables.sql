create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create table if not exists public.map_generation_jobs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,
  final_map_id uuid null references public.maps(id) on delete set null,

  source_type text not null default 'manual'
    check (source_type in ('manual', 'youtube', 'website', 'file')),
  source_url text null,
  output_language text null,

  title text null,
  youtube_title text null,
  channel_name text null,
  thumbnail_url text null,
  tags text[] not null default '{}',
  description text null,

  extracted_text text not null,
  total_char_count integer not null default 0,
  chunk_count integer not null default 1 check (chunk_count >= 1),
  target_chunk_chars integer not null default 50000,
  overlap_chars integer not null default 2500,

  required_credits integer not null default 1 check (required_credits >= 1),
  charged_credits integer not null default 0 check (charged_credits >= 0),

  status public.map_generation_job_status not null default 'queued',
  current_step text null,
  error_message text null,

  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_map_generation_jobs_user_id
  on public.map_generation_jobs(user_id);

create index if not exists idx_map_generation_jobs_status
  on public.map_generation_jobs(status);

create index if not exists idx_map_generation_jobs_created_at
  on public.map_generation_jobs(created_at desc);

drop trigger if exists trg_map_generation_jobs_updated_at on public.map_generation_jobs;

create trigger trg_map_generation_jobs_updated_at
before update on public.map_generation_jobs
for each row
execute function public.set_updated_at();

create table if not exists public.map_generation_chunks (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null references public.map_generation_jobs(id) on delete cascade,
  user_id uuid not null,

  chunk_index integer not null check (chunk_index >= 0),
  chunk_count integer not null check (chunk_count >= 1),

  start_char integer not null default 0 check (start_char >= 0),
  end_char integer not null default 0 check (end_char >= 0),
  overlap_start_char integer null,
  overlap_end_char integer null,

  char_count integer not null default 0 check (char_count >= 0),
  chunk_text text not null,

  chunk_map_id uuid null references public.maps(id) on delete set null,

  status public.map_generation_chunk_status not null default 'queued',
  error_message text null,

  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_map_generation_chunks_job_chunk unique (job_id, chunk_index)
);

create index if not exists idx_map_generation_chunks_job_id
  on public.map_generation_chunks(job_id);

create index if not exists idx_map_generation_chunks_user_id
  on public.map_generation_chunks(user_id);

create index if not exists idx_map_generation_chunks_status
  on public.map_generation_chunks(status);

create index if not exists idx_map_generation_chunks_job_status
  on public.map_generation_chunks(job_id, status);

drop trigger if exists trg_map_generation_chunks_updated_at on public.map_generation_chunks;

create trigger trg_map_generation_chunks_updated_at
before update on public.map_generation_chunks
for each row
execute function public.set_updated_at();

alter table public.map_generation_jobs enable row level security;
alter table public.map_generation_chunks enable row level security;

drop policy if exists "map_generation_jobs_select_own" on public.map_generation_jobs;
create policy "map_generation_jobs_select_own"
on public.map_generation_jobs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "map_generation_chunks_select_own" on public.map_generation_chunks;
create policy "map_generation_chunks_select_own"
on public.map_generation_chunks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "map_generation_jobs_insert_own" on public.map_generation_jobs;
create policy "map_generation_jobs_insert_own"
on public.map_generation_jobs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "map_generation_chunks_insert_own" on public.map_generation_chunks;
create policy "map_generation_chunks_insert_own"
on public.map_generation_chunks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "map_generation_jobs_update_own" on public.map_generation_jobs;
create policy "map_generation_jobs_update_own"
on public.map_generation_jobs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "map_generation_chunks_update_own" on public.map_generation_chunks;
create policy "map_generation_chunks_update_own"
on public.map_generation_chunks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "map_generation_jobs_delete_own" on public.map_generation_jobs;
create policy "map_generation_jobs_delete_own"
on public.map_generation_jobs
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "map_generation_chunks_delete_own" on public.map_generation_chunks;
create policy "map_generation_chunks_delete_own"
on public.map_generation_chunks
for delete
to authenticated
using (auth.uid() = user_id);
