
-- 1) events: restrict public policy to is_public + active, and hide sensitive columns from anon
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Public can view public active events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND status = 'active');

-- Revoke access_key column from anon (organizers still get it via SECURITY DEFINER RPC below;
-- authenticated keeps column access so existing organizer UI queries keep working under row RLS)
REVOKE SELECT (access_key) ON public.events FROM anon;

-- 2) ticket_types: hide authorization_code column from public/authenticated table reads.
--    Organizers already fetch it via get_ticket_type_auth_code() RPC.
REVOKE SELECT (authorization_code) ON public.ticket_types FROM anon, authenticated;

-- 3) event_rrpps: remove broad public read; expose only via RPC that requires the code
DROP POLICY IF EXISTS "public_read_event_rrpps_by_code" ON public.event_rrpps;

CREATE OR REPLACE FUNCTION public.get_event_rrpp_by_code(_code text)
RETURNS TABLE(id uuid, event_id uuid, rrpp_id uuid, link_type text, active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, event_id, rrpp_id, link_type, active
  FROM public.event_rrpps
  WHERE link_code = _code AND active = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_rrpp_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_rrpp_by_code(text) TO anon, authenticated;

-- 4) Tighten SECURITY DEFINER function execution: revoke from anon/authenticated where
--    the function should only be invoked by triggers or server-side (service_role).
REVOKE EXECUTE ON FUNCTION public.check_purchase_rate_limit(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_expired_reservations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_pending_tickets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_for_dni(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ticket_type_auth_code(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_ticket_auth_code(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_courtesy_link_by_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.self_assign_role(public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_and_scan_ticket(text, text, text) FROM PUBLIC, anon;
