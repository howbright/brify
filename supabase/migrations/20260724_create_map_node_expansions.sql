do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'map_node_expansion_status'
  ) then
    create type public.map_node_expansion_status as enum (
      'queued',
      'processing',
      'done',
      'failed'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'map_node_expansion_mode'
  ) then
    create type public.map_node_expansion_mode as enum (
      'expand'
    );
  end if;
end
$$;

create table if not exists public.map_node_expansions (
  id uuid primary key default gen_random_uuid(),

  map_id uuid not null references public.maps(id) on delete cascade,
  user_id uuid not null,
  node_id text not null,
  mode public.map_node_expansion_mode not null default 'expand',

  status public.map_node_expansion_status not null default 'queued',
  children_json jsonb null,
  error_message text null,
  queue_job_id text null,
  attempt_count integer not null default 0,

  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint map_node_expansions_node_id_not_empty
    check (length(trim(node_id)) > 0),
  constraint map_node_expansions_attempt_count_nonnegative
    check (attempt_count >= 0),
  constraint map_node_expansions_children_json_array
    check (children_json is null or jsonb_typeof(children_json) = 'array')
);

create unique index if not exists ux_map_node_expansions_map_node_mode
  on public.map_node_expansions(map_id, node_id, mode);

create index if not exists idx_map_node_expansions_user_id
  on public.map_node_expansions(user_id);

create index if not exists idx_map_node_expansions_map_id_status
  on public.map_node_expansions(map_id, status);

create index if not exists idx_map_node_expansions_status_created_at
  on public.map_node_expansions(status, created_at);

drop trigger if exists trg_map_node_expansions_updated_at on public.map_node_expansions;

create trigger trg_map_node_expansions_updated_at
before update on public.map_node_expansions
for each row
execute function public.set_updated_at();

alter table public.map_node_expansions enable row level security;

drop policy if exists "map_node_expansions_select_own" on public.map_node_expansions;
create policy "map_node_expansions_select_own"
on public.map_node_expansions
for select
using (auth.uid() = user_id);
