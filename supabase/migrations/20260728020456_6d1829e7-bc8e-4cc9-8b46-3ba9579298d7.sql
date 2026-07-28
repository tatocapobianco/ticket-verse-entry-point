
ALTER TABLE public.courtesy_links ADD COLUMN IF NOT EXISTS label text;

-- Allow viewing any event by direct link (private events accessible via /evento/:id)
DROP POLICY IF EXISTS "Authenticated can view public events" ON public.events;
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.ticket_types TO anon;
