do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'payment_status'
  ) then
    create type public.payment_status as enum (
      'pending',
      'paid',
      'failed',
      'refunded',
      'part_refunded',
      'canceled'
    );
  end if;
end $$;

alter type public.payment_status add value if not exists 'pending';
alter type public.payment_status add value if not exists 'paid';
alter type public.payment_status add value if not exists 'failed';
alter type public.payment_status add value if not exists 'refunded';
alter type public.payment_status add value if not exists 'part_refunded';
alter type public.payment_status add value if not exists 'canceled';
