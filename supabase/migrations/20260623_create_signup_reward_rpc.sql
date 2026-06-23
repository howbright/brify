create or replace function public.grant_signup_reward_once(
  p_user_id uuid,
  p_reward integer default 15
)
returns table (
  already_granted boolean,
  granted integer,
  balance_free_after integer,
  balance_paid_after integer,
  balance_total_after integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_free integer;
  v_current_paid integer;
  v_next_free integer;
  v_next_paid integer;
  v_next_total integer;
begin
  if p_user_id is null then
    raise exception 'MISSING_USER_ID';
  end if;

  if p_reward is null or p_reward <= 0 then
    raise exception 'BAD_REWARD';
  end if;

  select
    coalesce(credits_free, 0),
    coalesce(credits_paid, 0)
  into
    v_current_free,
    v_current_paid
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.credit_transactions
    where user_id = p_user_id
      and reason = 'signup_reward'
    limit 1
  ) then
    already_granted := true;
    granted := 0;
    balance_free_after := v_current_free;
    balance_paid_after := v_current_paid;
    balance_total_after := v_current_free + v_current_paid;
    return next;
    return;
  end if;

  v_next_free := v_current_free + p_reward;
  v_next_paid := v_current_paid;
  v_next_total := v_next_free + v_next_paid;

  insert into public.credit_transactions (
    user_id,
    tx_type,
    source,
    delta_total,
    delta_free,
    delta_paid,
    balance_total_after,
    balance_free_after,
    balance_paid_after,
    reason,
    payment_id,
    map_id
  )
  values (
    p_user_id,
    'bonus',
    'system',
    p_reward,
    p_reward,
    0,
    v_next_total,
    v_next_free,
    v_next_paid,
    'signup_reward',
    null,
    null
  );

  update public.profiles
  set
    credits_free = v_next_free,
    credits_paid = v_next_paid
  where id = p_user_id;

  already_granted := false;
  granted := p_reward;
  balance_free_after := v_next_free;
  balance_paid_after := v_next_paid;
  balance_total_after := v_next_total;
  return next;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.credit_transactions
    where reason = 'signup_reward'
    group by user_id
    having count(*) > 1
  ) then
    create unique index if not exists credit_transactions_one_signup_reward_per_user
      on public.credit_transactions (user_id)
      where reason = 'signup_reward';
  else
    raise notice 'Skipped credit_transactions_one_signup_reward_per_user because duplicate signup_reward rows exist.';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from public.notifications
    where dedupe_key is not null
    group by dedupe_key
    having count(*) > 1
  ) then
    create unique index if not exists notifications_dedupe_key_unique
      on public.notifications (dedupe_key)
      where dedupe_key is not null;
  else
    raise notice 'Skipped notifications_dedupe_key_unique because duplicate dedupe_key rows exist.';
  end if;
end $$;
