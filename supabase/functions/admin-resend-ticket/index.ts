// Reenvía el QR de un ticket al comprador. Sólo para cuentas super_admin.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(url, serviceKey);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', u.user.id)
      .eq('role', 'super_admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'not_found' }, 404);

    const body = await req.json().catch(() => ({}));
    const ticketId = body?.ticket_id;
    const overrideEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!ticketId || typeof ticketId !== 'string') return json({ error: 'invalid_ticket_id' }, 400);

    const { data: ticket } = await admin
      .from('tickets')
      .select('id, qr_code, owner_email, owner_id, event:events(name, event_date, event_time, location), ticket_type:ticket_types(name)')
      .eq('id', ticketId)
      .maybeSingle();
    if (!ticket) return json({ error: 'ticket_not_found' }, 404);

    let to = overrideEmail || ticket.owner_email || '';
    if (!to && ticket.owner_id) {
      const { data: pf } = await admin.from('profiles').select('email').eq('id', ticket.owner_id).maybeSingle();
      to = pf?.email ?? '';
    }
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
        <p style="color:#dc2626;font-size:12px">Este QR es único e intransferible.</p>
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
    if (!r.ok) {
      const t = await r.text();
      console.error('resend error', t);
      return json({ error: t }, 500);
    }

    await admin.from('admin_audit_log').insert({
      actor_id: u.user.id,
      actor_email: u.user.email,
      action: 'ticket_resent',
      entity_type: 'ticket',
      entity_id: ticket.id,
      entity_label: ticket.qr_code,
      details: { to },
    });

    return json({ ok: true, to });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
