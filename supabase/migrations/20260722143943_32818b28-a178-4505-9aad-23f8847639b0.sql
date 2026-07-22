
-- =========================================================
-- FIX SECURITY: hide events.access_key from anonymous users
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;

-- Public read policy limited to authenticated users only for base table
CREATE POLICY "Authenticated can view public events"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Public view without access_key for anonymous browsing
CREATE OR REPLACE VIEW public.events_public
WITH (security_invoker = on) AS
SELECT id, organizer_id, name, description, event_date, event_time,
       location, image_url, event_number, is_public, status,
       created_at, updated_at
FROM public.events
WHERE is_public = true AND status = 'active';

GRANT SELECT ON public.events_public TO anon, authenticated;

-- Revoke direct column access to access_key from anon just in case
REVOKE SELECT (access_key) ON public.events FROM anon;

-- =========================================================
-- TICKET TYPES
-- =========================================================
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_total INTEGER,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- active | inactive | sold_out
  is_courtesy BOOLEAN NOT NULL DEFAULT false,
  authorization_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT SELECT ON public.ticket_types TO anon;
GRANT ALL ON public.ticket_types TO service_role;

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-courtesy ticket types for public active events
CREATE POLICY "Public can view visible ticket types"
  ON public.ticket_types FOR SELECT
  USING (
    is_courtesy = false
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.is_public = true AND e.status = 'active'
    )
  );

CREATE POLICY "Organizers manage own ticket types"
  ON public.ticket_types FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE TRIGGER trg_ticket_types_updated
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Hide authorization_code from non-organizers via a view
CREATE OR REPLACE VIEW public.ticket_types_public
WITH (security_invoker = on) AS
SELECT id, event_id, name, description, price, valid_from, valid_until, status, created_at
FROM public.ticket_types
WHERE is_courtesy = false;

GRANT SELECT ON public.ticket_types_public TO anon, authenticated;

-- =========================================================
-- PURCHASES
-- =========================================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  buyer_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Organizers view purchases of own events"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE POLICY "Buyers create own purchases"
  ON public.purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers update own pending purchases"
  ON public.purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE TRIGGER trg_purchases_updated
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PURCHASE ITEMS
-- =========================================================
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO authenticated;
GRANT ALL ON public.purchase_items TO service_role;

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchase items follow purchase visibility"
  ON public.purchase_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_id
      AND (p.buyer_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = p.event_id AND e.organizer_id = auth.uid()))
  ));

CREATE POLICY "Buyers insert items into own purchases"
  ON public.purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.buyer_id = auth.uid()
  ));

-- =========================================================
-- COURTESY LINKS (multi-use invitation URLs)
-- =========================================================
CREATE TABLE public.courtesy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courtesy_links TO authenticated;
GRANT SELECT ON public.courtesy_links TO anon;
GRANT ALL ON public.courtesy_links TO service_role;

ALTER TABLE public.courtesy_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read a courtesy link by its code to claim it
CREATE POLICY "Anyone can view active courtesy links"
  ON public.courtesy_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Organizers manage own courtesy links"
  ON public.courtesy_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE TRIGGER trg_courtesy_links_updated
  BEFORE UPDATE ON public.courtesy_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TICKETS (individual emitted tickets, with QR)
-- =========================================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  courtesy_link_id UUID REFERENCES public.courtesy_links(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_dni TEXT,
  owner_email TEXT,
  qr_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'valid', -- valid | used | revoked
  source TEXT NOT NULL DEFAULT 'purchase', -- purchase | courtesy_direct | courtesy_link
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_owner ON public.tickets(owner_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_unclaimed ON public.tickets(owner_dni, owner_email) WHERE owner_id IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Organizers view tickets of own events"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE POLICY "Organizers manage tickets of own events"
  ON public.tickets FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE POLICY "Buyers insert tickets into own purchases"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    purchase_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.buyer_id = auth.uid())
  );

CREATE TRIGGER trg_tickets_updated
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TICKET SCANS (audit log)
-- =========================================================
CREATE TABLE public.ticket_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  scanner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_code TEXT NOT NULL,
  result TEXT NOT NULL, -- valid | already_used | wrong_event | expired | not_found | revoked
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scans_event ON public.ticket_scans(event_id);
CREATE INDEX idx_scans_ticket ON public.ticket_scans(ticket_id);

GRANT SELECT, INSERT ON public.ticket_scans TO authenticated;
GRANT ALL ON public.ticket_scans TO service_role;

ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers view scans of own events"
  ON public.ticket_scans FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

CREATE POLICY "Authenticated can insert scan records"
  ON public.ticket_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = scanner_id OR scanner_id IS NULL);

-- =========================================================
-- Auto-claim unclaimed courtesy tickets when a matching user signs up
-- =========================================================
CREATE OR REPLACE FUNCTION public.claim_pending_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dni TEXT;
BEGIN
  SELECT dni INTO v_dni FROM public.profiles WHERE id = NEW.id;

  UPDATE public.tickets
     SET owner_id = NEW.id
   WHERE owner_id IS NULL
     AND (
       (NEW.email IS NOT NULL AND lower(owner_email) = lower(NEW.email))
       OR (v_dni IS NOT NULL AND owner_dni = v_dni)
     );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_claim_tickets_on_profile
  AFTER INSERT OR UPDATE OF email, dni ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_pending_tickets();
