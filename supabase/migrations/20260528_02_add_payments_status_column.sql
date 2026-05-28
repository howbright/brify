alter table public.payments
  add column if not exists status public.payment_status;

update public.payments
set status = case
  when refunded_at is not null then 'refunded'::public.payment_status
  when paid_at is not null then 'paid'::public.payment_status
  else 'pending'::public.payment_status
end
where status is null;

alter table public.payments
  alter column status set default 'pending'::public.payment_status,
  alter column status set not null;

create index if not exists payments_user_status_idx
  on public.payments (user_id, status);

notify pgrst, 'reload schema';
