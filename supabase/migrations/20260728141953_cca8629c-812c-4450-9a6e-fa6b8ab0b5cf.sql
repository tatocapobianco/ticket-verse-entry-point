
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock_reservations
     SET status = 'expired'
   WHERE status = 'active'
     AND public.stock_reservations.expires_at < now();
$$;

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

  UPDATE public.stock_reservations SET status = 'expired'
   WHERE status = 'active' AND public.stock_reservations.expires_at < now();

  SELECT quantity_total, quantity_sold INTO v_total, v_sold
    FROM public.ticket_types WHERE id = _ticket_type_id FOR UPDATE;

  IF v_total IS NULL THEN
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
