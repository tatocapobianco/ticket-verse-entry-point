
-- Explicit restrictive lockdown for user_roles writes (defense in depth)
CREATE POLICY "Deny client inserts on user_roles"
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated, anon
  WITH CHECK (false);
CREATE POLICY "Deny client updates on user_roles"
  ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);
CREATE POLICY "Deny client deletes on user_roles"
  ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated, anon
  USING (false);

-- Explicit restrictive lockdown for ticket_scans update/delete (immutable audit log)
CREATE POLICY "Deny client updates on ticket_scans"
  ON public.ticket_scans AS RESTRICTIVE FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);
CREATE POLICY "Deny client deletes on ticket_scans"
  ON public.ticket_scans AS RESTRICTIVE FOR DELETE TO authenticated, anon
  USING (false);

-- Revoke EXECUTE on internal trigger/helper functions from anon and authenticated.
-- These are only called via triggers (owner runs them) or via RLS policy expressions (evaluated as definer inline via has_role) or via explicit RPC needs.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_pending_tickets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies; RLS evaluates it regardless of EXECUTE grants,
-- but there's no need for clients to call it directly via RPC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- email_for_dni: needed by anon during DNI-based login flow. Keep executable to anon only.
REVOKE EXECUTE ON FUNCTION public.email_for_dni(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.email_for_dni(text) TO anon;

-- get_courtesy_link_by_code: needed by anon to preview courtesy links before signup.
REVOKE EXECUTE ON FUNCTION public.get_courtesy_link_by_code(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_courtesy_link_by_code(text) TO anon;
