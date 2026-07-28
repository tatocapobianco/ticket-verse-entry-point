
CREATE OR REPLACE FUNCTION public.self_assign_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _role NOT IN ('buyer','organizer') THEN
    RAISE EXCEPTION 'role_not_self_assignable';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.self_assign_role(app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_assign_role(app_role) TO authenticated;
