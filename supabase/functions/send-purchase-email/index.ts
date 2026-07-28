// Sends the purchase confirmation email via Resend (no QR content — the QR
// lives only inside the app in "Mis Tickets").
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { purchase_id } = await req.json();
    if (!purchase_id) return json({ error: 'purchase_id required' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: purchase } = await admin.from('purchases')
      .select('id, buyer_email, total, event:events(name, event_date, event_time, location)')
      .eq('id', purchase_id).single();
    if (!purchase?.buyer_email) return json({ error: 'no_email' }, 400);

    const ev: any = purchase.event;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'resend_not_configured' }, 500);

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#7C3AED">¡Compra confirmada!</h1>
        <p>Gracias por tu compra en Cupo.</p>
        <div style="background:#f6f4ff;padding:16px;border-radius:12px;margin:16px 0">
          <strong>${ev?.name ?? 'Evento'}</strong><br/>
          ${ev?.event_date ?? ''} ${ev?.event_time ?? ''}<br/>
          ${ev?.location ?? ''}
        </div>
        <p><strong>Total:</strong> $${Number(purchase.total).toLocaleString('es-AR')}</p>
        <p>Tu ticket con código QR está disponible <strong>solo dentro de la app</strong>, en <em>Mis Tickets</em>. El QR es único e intransferible.</p>
        <a href="https://ticket-verse-entry-point.lovable.app/buyer-dashboard" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none">Ver mis tickets</a>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'Cupo <onboarding@resend.dev>',
        to: [purchase.buyer_email],
        subject: `Confirmación de compra - ${ev?.name ?? 'Cupo'}`,
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('resend error', t);
      return json({ error: t }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
