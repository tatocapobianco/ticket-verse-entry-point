
CREATE TABLE IF NOT EXISTS public.rrpps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rrpps TO authenticated;
GRANT ALL ON public.rrpps TO service_role;
ALTER TABLE public.rrpps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_rrpps" ON public.rrpps FOR ALL TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.event_rrpps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rrpp_id UUID NOT NULL REFERENCES public.rrpps(id) ON DELETE CASCADE,
  max_tickets INTEGER,
  max_courtesies INTEGER NOT NULL DEFAULT 0,
  link_type TEXT NOT NULL DEFAULT 'general' CHECK (link_type IN ('general','unique')),
  link_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, rrpp_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rrpps TO authenticated;
GRANT SELECT ON public.event_rrpps TO anon;
GRANT ALL ON public.event_rrpps TO service_role;
ALTER TABLE public.event_rrpps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_manage_event_rrpps" ON public.event_rrpps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
CREATE POLICY "public_read_event_rrpps_by_code" ON public.event_rrpps FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE TABLE IF NOT EXISTS public.rrpp_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_rrpp_id UUID NOT NULL REFERENCES public.event_rrpps(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rrpp_sales TO authenticated;
GRANT ALL ON public.rrpp_sales TO service_role;
ALTER TABLE public.rrpp_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_view_rrpp_sales" ON public.rrpp_sales FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_rrpps er
    JOIN public.events e ON e.id = er.event_id
    WHERE er.id = event_rrpp_id AND e.organizer_id = auth.uid()
  ));
CREATE POLICY "buyer_insert_own_rrpp_sale" ON public.rrpp_sales FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_id AND p.buyer_id = auth.uid()
  ));
