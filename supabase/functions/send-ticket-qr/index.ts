// Emails the QR of a ticket to the ticket owner. Called from the buyer dashboard.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return json({ error: 'unauthorized' }, 401);

    const { ticket_id } = await req.json();
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, qr_code, owner_email, event:events(name, event_date, event_time, location), ticket_type:ticket_types(name)')
      .eq('id', ticket_id).eq('owner_id', u.user.id).single();
    if (!ticket) return json({ error: 'ticket_not_found' }, 404);

    const to = ticket.owner_email || u.user.email;
    if (!to) return json({ error: 'no_email' }, 400);

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'resend_not_configured' }, 500);
    const ev: any = ticket.event;
    const tt: any = ticket.ticket_type;
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(ticket.qr_code)}`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;text-align:center">
        <h1 style="color:#7C3AED">Tu ticket - Cupo</h1>
        <p><strong>${ev?.name ?? 'Evento'}</strong><br/>${ev?.event_date ?? ''} ${ev?.event_time ?? ''}<br/>${ev?.location ?? ''}</p>
        <p>${tt?.name ?? ''}</p>
        <img src="${qrImg}" alt="QR" style="margin:16px auto"/>
        <p style="font-family:monospace;font-size:12px;color:#666">${ticket.qr_code}</p>
        <p style="color:#dc2626;font-size:12px">⚠️ Este QR es único e intransferible. Presentarlo desde la app es más seguro.</p>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'Cupo <noreply@cupotickets.com>',
        to: [to],
        subject: `Tu QR - ${ev?.name ?? 'Cupo'}`,
        html,
      }),
    });
    if (!r.ok) { const t = await r.text(); console.error(t); return json({ error: t }, 500); }
    return json({ ok: true });
  } catch (e) {
    console.error(e); return json({ error: String(e) }, 500);
  }
});
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
