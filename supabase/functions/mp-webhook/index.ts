// MercadoPago webhook. On approved payment: mark purchase paid, decrement stock,
// generate tickets, and trigger confirmation email.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const topic = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    if (topic !== 'payment' || !paymentId) return new Response('ignored', { status: 200 });

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

    if (dbStatus !== 'paid') return new Response('ok', { status: 200 });
    if (purchase.status === 'paid') return new Response('already_paid', { status: 200 });

    // Load items and generate tickets
    const { data: items } = await admin.from('purchase_items')
      .select('ticket_type_id, quantity, unit_price').eq('purchase_id', purchase.id);

    const createdTickets: string[] = [];
    for (const it of items ?? []) {
      // decrement stock via reservation consumption
      await admin.from('ticket_types').update({
        quantity_sold: (undefined as any),
      }).eq('id', it.ticket_type_id);
      // safer: raw rpc-less increment
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
        const { data: tk } = await admin.from('tickets').insert({
          event_id: purchase.event_id,
          ticket_type_id: it.ticket_type_id,
          purchase_id: purchase.id,
          owner_id: purchase.buyer_id,
          owner_email: purchase.buyer_email,
          source: 'purchase',
          status: 'valid',
        }).select('id').single();
        if (tk) createdTickets.push(tk.id);
      }
    }

    // consume reservation
    if (reservationId) {
      await admin.from('stock_reservations').update({ status: 'consumed' }).eq('id', reservationId);
    }

    // Trigger confirmation email (best-effort)
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
