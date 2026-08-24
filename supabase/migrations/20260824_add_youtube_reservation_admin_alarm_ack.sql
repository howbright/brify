alter table public.youtube_reservations
  add column if not exists admin_alert_acknowledged_at timestamptz null,
  add column if not exists admin_alert_acknowledged_by text null;

create index if not exists idx_youtube_reservations_admin_alarm_pending
  on public.youtube_reservations(created_at desc)
  where admin_alert_acknowledged_at is null
    and status in ('requested', 'retry_requested');
