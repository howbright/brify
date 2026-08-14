alter table public.youtube_reservations
  add column if not exists admin_request_email_sent_at timestamptz,
  add column if not exists admin_request_email_error text;
