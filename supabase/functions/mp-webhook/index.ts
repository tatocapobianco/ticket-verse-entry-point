// MercadoPago webhook. Validates x-signature, marks purchase paid,
// decrements stock, generates tickets, and triggers confirmation email.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

async function verifyMpSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
  if (!secret) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not set — rejecting webhook');
    return false;
  }
  const sigHeader = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id') ?? '';
  if (!sigHeader) return false;

  // "ts=1700000000,v1=abcdef..."
  const parts = Object.fromEntries(
    sigHeader.split(',').map((s) => s.trim().split('=').map((x) => x.trim())) as [string, string][],
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === v1;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};
    const url = new URL(req.url);
    const topic = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    if (topic !== 'payment' || !paymentId) return new Response('ignored', { status: 200 });

    // Signature verification
    const ok = await verifyMpSignature(req, String(paymentId));
    if (!ok) {
      console.error('Invalid MP webhook signature');
      return new Response('invalid_signature', { status: 401 });
    }

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    if (!payRes.ok) {
      console.error('MP payment fetch failed', payRes.status);
      return new Response('mp_error', { status: 200 });
    }
    const payment = await payRes.json();
    const externalRef: string = payment.external_reference || '';
    const [purchaseId, reservationId] = externalRef.split('|');
    if (!purchaseId) return new Response('no_ref', { status: 200 });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: purchase } = await admin.from('purchases')
      .select('id, buyer_id, event_id, status, buyer_email').eq('id', purchaseId).single();
    if (!purchase) return new Response('purchase_not_found', { status: 200 });

    const status = payment.status; // approved, pending, rejected, in_process
    const dbStatus = status === 'approved' ? 'paid'
      : status === 'pending' || status === 'in_process' ? 'pending'
      : 'rejected';

    await admin.from('purchases').update({
      status: dbStatus, mp_payment_id: String(paymentId),
    }).eq('id', purchase.id);

    // Record success/failure for user rate limiting
    if (dbStatus === 'rejected') {
      await admin.from('purchase_attempts').insert({
        user_id: purchase.buyer_id, success: false,
      });
    }

    if (dbStatus !== 'paid') return new Response('ok', { status: 200 });
    if (purchase.status === 'paid') return new Response('already_paid', { status: 200 });

    const { data: items } = await admin.from('purchase_items')
      .select('ticket_type_id, quantity, unit_price').eq('purchase_id', purchase.id);

    for (const it of items ?? []) {
      await admin.rpc('release_expired_reservations');
      const { data: tt } = await admin.from('ticket_types')
        .select('quantity_sold, quantity_total, status').eq('id', it.ticket_type_id).single();
      const newSold = (tt?.quantity_sold ?? 0) + it.quantity;
      const soldOut = tt?.quantity_total != null && newSold >= tt.quantity_total;
      await admin.from('ticket_types').update({
        quantity_sold: newSold,
        status: soldOut ? 'sold_out' : tt?.status,
      }).eq('id', it.ticket_type_id);

      for (let i = 0; i < it.quantity; i++) {
        await admin.from('tickets').insert({
          event_id: purchase.event_id,
          ticket_type_id: it.ticket_type_id,
          purchase_id: purchase.id,
          owner_id: purchase.buyer_id,
          owner_email: purchase.buyer_email,
          source: 'purchase',
          status: 'valid',
        });
      }
    }

    if (reservationId) {
      await admin.from('stock_reservations').update({ status: 'consumed' }).eq('id', reservationId);
    }

    // Mark success attempt
    await admin.from('purchase_attempts').insert({
      user_id: purchase.buyer_id, success: true,
    });

    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-purchase-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ purchase_id: purchase.id }),
      });
    } catch (e) { console.error('email trigger failed', e); }

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 200 });
  }
});
