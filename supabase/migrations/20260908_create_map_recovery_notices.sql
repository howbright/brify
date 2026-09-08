DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'map_recovery_notice_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.map_recovery_notice_status AS ENUM ('sent', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.map_recovery_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text NOT NULL,
  locale text,
  status public.map_recovery_notice_status NOT NULL,
  subject text NOT NULL,
  map_url text NOT NULL,
  refunded_credits integer NOT NULL DEFAULT 0,
  compensation_credits integer NOT NULL DEFAULT 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS map_recovery_notices_map_created_idx
  ON public.map_recovery_notices (map_id, created_at DESC);

CREATE INDEX IF NOT EXISTS map_recovery_notices_user_created_idx
  ON public.map_recovery_notices (user_id, created_at DESC);
