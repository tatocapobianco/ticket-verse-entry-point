ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_url text;
GRANT SELECT(flyer_url) ON public.events TO anon, authenticated;