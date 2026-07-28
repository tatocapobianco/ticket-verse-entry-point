
CREATE OR REPLACE FUNCTION public.reserve_stock(_ticket_type_id uuid, _quantity integer)
 RETURNS TABLE(reservation_id uuid, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  UPDATE public.stock_reservations sr SET status = 'expired'
   WHERE sr.status = 'active' AND sr.expires_at < now();

  SELECT tt.quantity_total, tt.quantity_sold INTO v_total, v_sold
    FROM public.ticket_types tt WHERE tt.id = _ticket_type_id FOR UPDATE;

  IF v_total IS NULL THEN
    v_available := _quantity;
  ELSE
    SELECT COALESCE(SUM(sr.quantity),0) INTO v_reserved
      FROM public.stock_reservations sr
     WHERE sr.ticket_type_id = _ticket_type_id AND sr.status = 'active';
    v_available := v_total - v_sold - v_reserved;
  END IF;

  IF v_available < _quantity THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;

  v_expires := now() + interval '10 minutes';
  INSERT INTO public.stock_reservations(ticket_type_id, user_id, quantity, expires_at)
  VALUES (_ticket_type_id, auth.uid(), _quantity, v_expires)
  RETURNING id INTO v_res_id;

  reservation_id := v_res_id;
  expires_at := v_expires;
  RETURN NEXT;
END;
$function$;
