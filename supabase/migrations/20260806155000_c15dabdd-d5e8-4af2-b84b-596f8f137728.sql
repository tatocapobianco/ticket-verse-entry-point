-- 1) Ensure authorization_code is not readable by public/authenticated clients
REVOKE SELECT ON public.ticket_types FROM anon;
REVOKE SELECT ON public.ticket_types FROM authenticated;

GRANT SELECT (
  id, event_id, name, description, price, quantity_total, quantity_sold,
  valid_from, valid_until, status, is_courtesy, requires_auth_code,
  created_at, updated_at
) ON public.ticket_types TO anon;

GRANT SELECT (
  id, event_id, name, description, price, quantity_total, quantity_sold,
  valid_from, valid_until, status, is_courtesy, requires_auth_code,
  created_at, updated_at
) ON public.ticket_types TO authenticated;

-- 2) DNI -> email lookup must not be callable from the browser (email enumeration)
REVOKE EXECUTE ON FUNCTION public.email_for_dni(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_for_dni(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.email_for_dni(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.email_for_dni(text) TO service_role;
