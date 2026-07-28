
-- 1) Hide authorization_code column from client roles
REVOKE SELECT ON public.ticket_types FROM anon, authenticated;
GRANT SELECT (
  id, event_id, name, description, price, quantity_total, quantity_sold,
  valid_from, valid_until, status, is_courtesy, requires_auth_code,
  created_at, updated_at
) ON public.ticket_types TO anon, authenticated;
-- organizers read the code via SECURITY DEFINER RPC get_ticket_type_auth_code
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
-- Re-restrict SELECT to safe columns (the GRANT above re-added full SELECT, so revoke again)
REVOKE SELECT ON public.ticket_types FROM authenticated;
GRANT SELECT (
  id, event_id, name, description, price, quantity_total, quantity_sold,
  valid_from, valid_until, status, is_courtesy, requires_auth_code,
  created_at, updated_at
) ON public.ticket_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;

-- 2) Revoke EXECUTE on definer functions that are only called server-side
REVOKE EXECUTE ON FUNCTION public.check_purchase_rate_limit(text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.verify_ticket_auth_code(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_expired_reservations() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
