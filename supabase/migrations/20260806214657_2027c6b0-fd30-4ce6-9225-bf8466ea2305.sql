ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access to audit log"
  ON public.admin_audit_log AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  productora_id uuid NOT NULL REFERENCES public.productoras(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  gross numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  paid_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX settlements_productora_event_uniq
  ON public.settlements (productora_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT ALL ON public.settlements TO service_role;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access to settlements"
  ON public.settlements AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE TRIGGER trg_settlements_updated BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.productoras
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;