
-- =========================================================
-- 1) Fix courtesy_links security
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active courtesy links" ON public.courtesy_links;

-- Function to validate a courtesy link by code (used by claim page, no direct table read needed)
CREATE OR REPLACE FUNCTION public.get_courtesy_link_by_code(_code text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  ticket_type_id uuid,
  max_uses integer,
  uses_count integer,
  is_active boolean,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, event_id, ticket_type_id, max_uses, uses_count, is_active, expires_at
  FROM public.courtesy_links
  WHERE code = _code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND uses_count < max_uses
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_courtesy_link_by_code(text) TO anon, authenticated;

-- =========================================================
-- 2) user_roles table (roles in separate table per best practice)
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('buyer', 'organizer', 'scanner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- =========================================================
-- 3) Extend profiles for MercadoPago (organizer marketplace)
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mp_user_id text,
  ADD COLUMN IF NOT EXISTS mp_access_token text,
  ADD COLUMN IF NOT EXISTS mp_refresh_token text,
  ADD COLUMN IF NOT EXISTS mp_public_key text,
  ADD COLUMN IF NOT EXISTS mp_connected_at timestamptz;

-- =========================================================
-- 4) Update handle_new_user: also assign buyer role + copy dni
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dni)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'dni', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET dni = COALESCE(public.profiles.dni, EXCLUDED.dni);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill buyer role for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'buyer'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- =========================================================
-- 5) DNI -> email lookup (for login with DNI)
-- =========================================================
CREATE OR REPLACE FUNCTION public.email_for_dni(_dni text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles
  WHERE dni = _dni AND email IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.email_for_dni(text) TO anon, authenticated;
