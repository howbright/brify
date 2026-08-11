do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'youtube_reservation_status'
  ) then
    create type public.youtube_reservation_status as enum (
      'requested',
      'checking',
      'ready',
      'needs_credits',
      'processing',
      'done',
      'failed',
      'cancelled',
      'unsupported',
      'retry_requested'
    );
  end if;
end
$$;

alter type public.youtube_reservation_status add value if not exists 'retry_requested';

create table if not exists public.youtube_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text null,
  url text not null,
  video_id text null,
  output_language text null,
  status public.youtube_reservation_status not null default 'requested',
  status_reason text null,
  required_credits integer null check (required_credits is null or required_credits >= 0),
  charged_credits integer null check (charged_credits is null or charged_credits >= 0),
  credit_snapshot integer not null default 0 check (credit_snapshot >= 0),
  result_map_id uuid null references public.maps(id) on delete set null,
  admin_notes text null,
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.youtube_reservations
  add column if not exists output_language text null;

create index if not exists idx_youtube_reservations_user_id
  on public.youtube_reservations(user_id);

create index if not exists idx_youtube_reservations_status
  on public.youtube_reservations(status);

create index if not exists idx_youtube_reservations_created_at
  on public.youtube_reservations(created_at desc);

drop trigger if exists trg_youtube_reservations_updated_at on public.youtube_reservations;

create trigger trg_youtube_reservations_updated_at
before update on public.youtube_reservations
for each row
execute function public.set_updated_at();

alter table public.youtube_reservations enable row level security;

drop policy if exists "youtube_reservations_select_own_or_admin" on public.youtube_reservations;
create policy "youtube_reservations_select_own_or_admin"
on public.youtube_reservations
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
);

drop policy if exists "youtube_reservations_insert_own" on public.youtube_reservations;
create policy "youtube_reservations_insert_own"
on public.youtube_reservations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "youtube_reservations_update_admin" on public.youtube_reservations;
create policy "youtube_reservations_update_admin"
on public.youtube_reservations
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
);

drop policy if exists "youtube_reservations_retry_own_failed" on public.youtube_reservations;
create policy "youtube_reservations_retry_own_failed"
on public.youtube_reservations
for update
to authenticated
using (
  auth.uid() = user_id
  and status in ('failed', 'cancelled', 'unsupported', 'needs_credits')
)
with check (
  auth.uid() = user_id
  and status = 'retry_requested'
);
