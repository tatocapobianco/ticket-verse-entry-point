
-- Rate limiting table
CREATE TABLE public.purchase_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text,
  user_id uuid,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.purchase_attempts TO service_role;
ALTER TABLE public.purchase_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access on purchase_attempts"
  ON public.purchase_attempts AS RESTRICTIVE FOR ALL
  TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX purchase_attempts_ip_idx ON public.purchase_attempts (ip, created_at);
CREATE INDEX purchase_attempts_user_idx ON public.purchase_attempts (user_id, created_at);

-- Public boolean flag for auth-code protected ticket types
ALTER TABLE public.ticket_types ADD COLUMN IF NOT EXISTS requires_auth_code boolean NOT NULL DEFAULT false;

-- Backfill flag from existing authorization_code values
UPDATE public.ticket_types
   SET requires_auth_code = true
 WHERE authorization_code IS NOT NULL AND authorization_code <> '';

-- Hide the actual authorization_code from public/authenticated clients.
-- Column-level revoke: only service_role (and organizer via SECURITY DEFINER helpers) can read the secret.
REVOKE SELECT (authorization_code) ON public.ticket_types FROM anon, authenticated;

-- Helper for organizer to read the code for their own event
CREATE OR REPLACE FUNCTION public.get_ticket_type_auth_code(_ticket_type_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tt.authorization_code
    FROM public.ticket_types tt
    JOIN public.events e ON e.id = tt.event_id
   WHERE tt.id = _ticket_type_id
     AND e.organizer_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_ticket_type_auth_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ticket_type_auth_code(uuid) TO authenticated;

-- Verify a submitted auth code (called from edge function via service_role bypass)
CREATE OR REPLACE FUNCTION public.verify_ticket_auth_code(_ticket_type_id uuid, _code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ticket_types
     WHERE id = _ticket_type_id
       AND (requires_auth_code = false
            OR authorization_code IS NOT DISTINCT FROM _code)
  );
$$;
REVOKE ALL ON FUNCTION public.verify_ticket_auth_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ticket_auth_code(uuid, text) TO service_role;

-- Rate limit check (used from edge function)
CREATE OR REPLACE FUNCTION public.check_purchase_rate_limit(_ip text, _user_id uuid)
RETURNS TABLE(allowed boolean, reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ip_count int;
  v_recent_fails int;
  v_last_fail timestamptz;
BEGIN
  -- 10 attempts / minute per IP
  IF _ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_count
      FROM public.purchase_attempts
     WHERE ip = _ip AND created_at > now() - interval '1 minute';
    IF v_ip_count >= 10 THEN
      RETURN QUERY SELECT false, 'ip_rate_limited'; RETURN;
    END IF;
  END IF;

  -- 3 failed payments in last 15 min for this user => blocked
  IF _user_id IS NOT NULL THEN
    SELECT COUNT(*), MAX(created_at) INTO v_recent_fails, v_last_fail
      FROM public.purchase_attempts
     WHERE user_id = _user_id
       AND success = false
       AND created_at > now() - interval '15 minutes';
    IF v_recent_fails >= 3 THEN
      RETURN QUERY SELECT false, 'user_blocked_15min'; RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;
REVOKE ALL ON FUNCTION public.check_purchase_rate_limit(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_purchase_rate_limit(text, uuid) TO service_role;
