
DROP POLICY IF EXISTS "Public can view visible ticket types" ON public.ticket_types;
CREATE POLICY "Public can view visible ticket types"
  ON public.ticket_types FOR SELECT
  TO anon, authenticated
  USING (
    is_courtesy = false
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = ticket_types.event_id
        AND e.status = 'active'
    )
  );
