CREATE TABLE public.productoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  descripcion text,
  instagram text,
  telefono_contacto text,
  email_contacto text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX productoras_nombre_key ON public.productoras (lower(nombre));
CREATE UNIQUE INDEX productoras_slug_key ON public.productoras (slug);
CREATE INDEX productoras_user_id_idx ON public.productoras (user_id);

GRANT SELECT (id, user_id, nombre, slug, logo_url, descripcion, created_at) ON public.productoras TO anon;
GRANT SELECT (id, user_id, nombre, slug, logo_url, descripcion, created_at) ON public.productoras TO authenticated;
GRANT INSERT, UPDATE ON public.productoras TO authenticated;
GRANT ALL ON public.productoras TO service_role;

ALTER TABLE public.productoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productoras son visibles publicamente"
  ON public.productoras FOR SELECT
  USING (true);

CREATE POLICY "El dueno crea su productora"
  ON public.productoras FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "El dueno edita su productora"
  ON public.productoras FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_productoras_updated
  BEFORE UPDATE ON public.productoras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.events ADD COLUMN productora_id uuid REFERENCES public.productoras(id) ON DELETE SET NULL;
GRANT SELECT (productora_id) ON public.events TO anon;
GRANT SELECT (productora_id) ON public.events TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_productora()
RETURNS TABLE(id uuid, nombre text, slug text, logo_url text, descripcion text, instagram text, telefono_contacto text, email_contacto text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nombre, p.slug, p.logo_url, p.descripcion, p.instagram, p.telefono_contacto, p.email_contacto
  FROM public.productoras p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_productora() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_productora() TO authenticated;

CREATE OR REPLACE FUNCTION public.productora_nombre_disponible(_nombre text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.productoras WHERE lower(nombre) = lower(trim(_nombre)));
$$;

REVOKE ALL ON FUNCTION public.productora_nombre_disponible(text) FROM public;
GRANT EXECUTE ON FUNCTION public.productora_nombre_disponible(text) TO authenticated;