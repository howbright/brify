alter table public.youtube_reservations
  add column if not exists user_email_sent_at timestamptz,
  add column if not exists user_email_error text,
  add column if not exists admin_failure_email_sent_at timestamptz,
  add column if not exists admin_failure_email_error text,
  add column if not exists manual_email_sent_at timestamptz,
  add column if not exists manual_email_error text,
  add column if not exists refunded_credits integer not null default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_error text;
