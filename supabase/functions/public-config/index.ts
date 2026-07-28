// Returns public (non-secret) config values needed by the browser client,
// like the reCAPTCHA v3 site key (site keys are publishable — only the
// secret key must remain server-side).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({
    recaptcha_site_key: Deno.env.get('RECAPTCHA_SITE_KEY') ?? null,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
