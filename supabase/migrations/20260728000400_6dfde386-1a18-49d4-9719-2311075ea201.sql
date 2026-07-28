
-- Stock reservations (10-minute holds)
CREATE TABLE public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_reservations TO authenticated;
GRANT ALL ON public.stock_reservations TO service_role;

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reservations" ON public.stock_reservations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users create own reservations" ON public.stock_reservations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own reservations" ON public.stock_reservations
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_reservations_expiry ON public.stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_reservations_ticket_type ON public.stock_reservations(ticket_type_id, status);

-- Release expired reservations
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock_reservations
     SET status = 'expired'
   WHERE status = 'active'
     AND expires_at < now();
$$;

REVOKE ALL ON FUNCTION public.release_expired_reservations() FROM PUBLIC, anon, authenticated;

-- Reserve stock
CREATE OR REPLACE FUNCTION public.reserve_stock(_ticket_type_id UUID, _quantity INTEGER)
RETURNS TABLE(reservation_id UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_sold INTEGER;
  v_reserved INTEGER;
  v_available INTEGER;
  v_res_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- release stale reservations first
  UPDATE public.stock_reservations SET status = 'expired'
   WHERE status = 'active' AND expires_at < now();

  SELECT quantity_total, quantity_sold INTO v_total, v_sold
    FROM public.ticket_types WHERE id = _ticket_type_id FOR UPDATE;

  IF v_total IS NULL THEN
    -- unlimited
    v_available := _quantity;
  ELSE
    SELECT COALESCE(SUM(quantity),0) INTO v_reserved
      FROM public.stock_reservations
     WHERE ticket_type_id = _ticket_type_id AND status = 'active';
    v_available := v_total - v_sold - v_reserved;
  END IF;

  IF v_available < _quantity THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;

  v_expires := now() + interval '10 minutes';
  INSERT INTO public.stock_reservations(ticket_type_id, user_id, quantity, expires_at)
  VALUES (_ticket_type_id, auth.uid(), _quantity, v_expires)
  RETURNING id INTO v_res_id;

  RETURN QUERY SELECT v_res_id, v_expires;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_stock(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_stock(UUID, INTEGER) TO authenticated;

-- Validate and scan ticket (used by scanner)
CREATE OR REPLACE FUNCTION public.validate_and_scan_ticket(
  _qr_code TEXT,
  _event_number TEXT,
  _access_key TEXT
)
RETURNS TABLE(result TEXT, ticket_id UUID, attendee TEXT, ticket_type_name TEXT, event_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_ticket RECORD;
  v_result TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_event FROM public.events
   WHERE event_number = _event_number LIMIT 1;

  IF v_event IS NULL THEN
    INSERT INTO public.ticket_scans(event_id, scanner_id, qr_code, result)
    VALUES ('00000000-0000-0000-0000-000000000000', auth.uid(), _qr_code, 'invalid_event')
    ON CONFLICT DO NOTHING;
    RETURN QUERY SELECT 'invalid_event'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_event.access_key IS DISTINCT FROM _access_key THEN
    RETURN QUERY SELECT 'invalid_access_key'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, v_event.name;
    RETURN;
  END IF;

  SELECT t.*, tt.name AS type_name
    INTO v_ticket
    FROM public.tickets t
    JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
   WHERE t.qr_code = _qr_code
   LIMIT 1;

  IF v_ticket IS NULL THEN
    v_result := 'invalid_qr';
    INSERT INTO public.ticket_scans(event_id, scanner_id, qr_code, result)
    VALUES (v_event.id, auth.uid(), _qr_code, v_result);
    RETURN QUERY SELECT v_result, NULL::UUID, NULL::TEXT, NULL::TEXT, v_event.name;
    RETURN;
  END IF;

  IF v_ticket.event_id <> v_event.id THEN
    v_result := 'wrong_event';
  ELSIF v_ticket.status = 'used' OR v_ticket.used_at IS NOT NULL THEN
    v_result := 'already_used';
  ELSIF v_ticket.status <> 'valid' THEN
    v_result := 'invalid';
  ELSE
    v_result := 'valid';
    UPDATE public.tickets
       SET status = 'used', used_at = now(), used_by = auth.uid()
     WHERE id = v_ticket.id;
  END IF;

  INSERT INTO public.ticket_scans(ticket_id, event_id, scanner_id, qr_code, result)
  VALUES (v_ticket.id, v_event.id, auth.uid(), _qr_code, v_result);

  RETURN QUERY SELECT v_result, v_ticket.id,
    COALESCE(v_ticket.owner_email, v_ticket.owner_dni, 'Anónimo')::TEXT,
    v_ticket.type_name::TEXT,
    v_event.name::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_scan_ticket(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_and_scan_ticket(TEXT, TEXT, TEXT) TO authenticated;
