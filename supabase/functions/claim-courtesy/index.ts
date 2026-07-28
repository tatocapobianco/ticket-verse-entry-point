import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
    const user = userData.user;

    const { code } = await req.json();
    if (!code || typeof code !== 'string') return json({ error: 'invalid_code' }, 400);

    const admin = createClient(url, serviceKey);

    const { data: linkRows, error: linkErr } = await admin.rpc('get_courtesy_link_by_code', { _code: code });
    if (linkErr) return json({ error: linkErr.message }, 500);
    const link = Array.isArray(linkRows) ? linkRows[0] : linkRows;
    if (!link) return json({ error: 'link_invalid_or_exhausted' }, 400);

    // prevent double-claim by same user on same link
    const { data: existing } = await admin
      .from('tickets')
      .select('id')
      .eq('courtesy_link_id', link.id)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (existing) return json({ ok: true, ticket_id: existing.id, already: true });

    // atomic-ish: increment uses_count only if room left
    const { data: updated, error: updErr } = await admin
      .from('courtesy_links')
      .update({ uses_count: link.uses_count + 1 })
      .eq('id', link.id)
      .lt('uses_count', link.max_uses)
      .select('id')
      .maybeSingle();
    if (updErr) return json({ error: updErr.message }, 500);
    if (!updated) return json({ error: 'link_exhausted' }, 400);

    const { data: ticket, error: tErr } = await admin
      .from('tickets')
      .insert({
        event_id: link.event_id,
        ticket_type_id: link.ticket_type_id,
        courtesy_link_id: link.id,
        owner_id: user.id,
        owner_email: user.email,
        source: 'courtesy',
        status: 'valid',
      })
      .select('id')
      .single();
    if (tErr) return json({ error: tErr.message }, 500);

    return json({ ok: true, ticket_id: ticket.id });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
