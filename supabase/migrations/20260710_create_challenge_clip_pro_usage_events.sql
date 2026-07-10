do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'challenge_clip_pro_usage_event_type'
  ) then
    create type public.challenge_clip_pro_usage_event_type as enum (
      'created_extra_challenge',
      'created_extra_clip'
    );
  end if;
end $$;

alter type public.challenge_clip_pro_usage_event_type add value if not exists 'created_extra_challenge';
alter type public.challenge_clip_pro_usage_event_type add value if not exists 'created_extra_clip';

create table if not exists public.challenge_clip_pro_usage_events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  purchase_id uuid null,
  event_type public.challenge_clip_pro_usage_event_type not null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  constraint challenge_clip_pro_usage_events_device_fk
    foreign key (device_id)
    references public.challenge_clip_devices (id)
    on delete cascade,
  constraint challenge_clip_pro_usage_events_purchase_fk
    foreign key (purchase_id)
    references public.challenge_clip_purchases (id)
    on delete set null
);

create index if not exists challenge_clip_pro_usage_events_device_created_idx
  on public.challenge_clip_pro_usage_events (device_id, created_at desc);

create index if not exists challenge_clip_pro_usage_events_purchase_created_idx
  on public.challenge_clip_pro_usage_events (purchase_id, created_at desc)
  where purchase_id is not null;
