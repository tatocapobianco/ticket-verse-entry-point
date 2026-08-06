-- 1) Column-level SELECT so access_key / authorization_code are never readable via the API
REVOKE SELECT ON public.events FROM anon, authenticated;
GRANT SELECT (id, organizer_id, name, description, event_date, event_time, location, image_url, event_number, is_public, status, created_at, updated_at)
  ON public.events TO anon, authenticated;

REVOKE SELECT ON public.ticket_types FROM anon, authenticated;
GRANT SELECT (id, event_id, name, description, price, quantity_total, quantity_sold, valid_from, valid_until, status, is_courtesy, requires_auth_code, created_at, updated_at)
  ON public.ticket_types TO anon, authenticated;

GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.ticket_types TO service_role;

-- 2) Organizer-only accessor for the event access key
CREATE OR REPLACE FUNCTION public.get_event_access_key(_event_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.access_key
    FROM public.events e
   WHERE e.id = _event_id
     AND e.organizer_id = auth.uid()
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_event_access_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_access_key(uuid) TO authenticated;

-- 3) Remove EXECUTE on definer functions that must not be callable from the browser
REVOKE ALL ON FUNCTION public.get_courtesy_link_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_courtesy_link_by_code(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_event_rrpp_by_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_rrpp_by_code(text) TO service_role;

REVOKE ALL ON FUNCTION public.verify_ticket_auth_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ticket_auth_code(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.check_purchase_rate_limit(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_purchase_rate_limit(text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.release_expired_reservations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_reservations() TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.email_for_dni(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.email_for_dni(text) TO anon;
