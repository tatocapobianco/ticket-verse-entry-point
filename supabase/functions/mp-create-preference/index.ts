// Create MercadoPago Checkout Pro preference for a stock reservation.
// - Verifies reCAPTCHA v3
// - Enforces rate limits (10 attempts/min per IP, 3 failed payments/15min per user)
// - Validates optional ticket authorization code
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SERVICE_FEE = 0.15;
const RECAPTCHA_MIN_SCORE = 0.5;

async function verifyRecaptcha(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  if (!secret) return true; // if not configured, don't block
  if (!token) return false;
  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.append('remoteip', ip);
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!r.ok) return false;
  const j = await r.json();
  return j.success === true && (typeof j.score !== 'number' || j.score >= RECAPTCHA_MIN_SCORE);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: 'unauthorized' }, 401);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Rate limit gate
    const { data: rl } = await admin.rpc('check_purchase_rate_limit', { _ip: ip, _user_id: user.id });
    const rlRow = Array.isArray(rl) ? rl[0] : rl;
    if (rlRow && rlRow.allowed === false) {
      return json({
        error: 'rate_limited',
        reason: rlRow.reason,
        message: rlRow.reason === 'user_blocked_15min'
          ? 'Demasiados pagos fallidos. Esperá 15 minutos antes de reintentar.'
          : 'Demasiados intentos. Esperá un minuto antes de reintentar.',
      }, 429);
    }

    const { reservation_id, recaptcha_token, auth_code } = await req.json();
    if (!reservation_id) return json({ error: 'reservation_id required' }, 400);

    // reCAPTCHA
    const captchaOk = await verifyRecaptcha(recaptcha_token, ip);
    if (!captchaOk) {
      await admin.from('purchase_attempts').insert({ ip, user_id: user.id, success: false });
      return json({ error: 'captcha_failed', message: 'No pudimos verificar que no seas un bot. Actualizá la página e intentá de nuevo.' }, 400);
    }

    // Load reservation (RLS ensures ownership)
    const { data: reservation, error: resErr } = await supabase
      .from('stock_reservations')
      .select('id, ticket_type_id, quantity, status, expires_at')
      .eq('id', reservation_id)
      .single();
    if (resErr || !reservation) return json({ error: 'reservation_not_found' }, 404);
    if (reservation.status !== 'active') return json({ error: 'reservation_inactive' }, 400);
    if (new Date(reservation.expires_at) < new Date()) return json({ error: 'reservation_expired' }, 400);

    // Verify authorization code if the ticket type requires one
    const { data: codeOk } = await admin.rpc('verify_ticket_auth_code', {
      _ticket_type_id: reservation.ticket_type_id,
      _code: auth_code ?? null,
    });
    if (codeOk !== true) {
      await admin.from('purchase_attempts').insert({ ip, user_id: user.id, success: false });
      return json({ error: 'invalid_auth_code', message: 'El código de autorización es inválido.' }, 403);
    }

    const { data: ticketType } = await admin
      .from('ticket_types')
      .select('id, name, price, event_id, events(id, name, organizer_id)')
      .eq('id', reservation.ticket_type_id)
      .single();
    if (!ticketType) return json({ error: 'ticket_type_not_found' }, 404);

    const unitPrice = Number(ticketType.price);
    const subtotal = unitPrice * reservation.quantity;
    const fee = Math.round(subtotal * SERVICE_FEE);
    const total = subtotal + fee;

    const { data: purchase, error: pErr } = await admin
      .from('purchases')
      .insert({
        buyer_id: user.id,
        event_id: (ticketType as any).events.id,
        subtotal, service_fee: fee, total,
        status: 'pending',
        buyer_email: user.email,
      }).select('id').single();
    if (pErr) return json({ error: pErr.message }, 500);

    await admin.from('purchase_items').insert({
      purchase_id: purchase.id,
      ticket_type_id: ticketType.id,
      quantity: reservation.quantity,
      unit_price: unitPrice,
    });

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpToken) return json({ error: 'mp_not_configured' }, 500);

    const origin = req.headers.get('origin') || 'https://ticket-verse-entry-point.lovable.app';

    const prefBody = {
      items: [{
        title: `${(ticketType as any).events.name} - ${ticketType.name}`,
        quantity: reservation.quantity,
        unit_price: Math.round((total / reservation.quantity) * 100) / 100,
        currency_id: 'ARS',
      }],
      payer: { email: user.email },
      external_reference: `${purchase.id}|${reservation.id}`,
      back_urls: {
        success: `${origin}/purchase-result?purchase_id=${purchase.id}`,
        pending: `${origin}/purchase-result?purchase_id=${purchase.id}`,
        failure: `${origin}/purchase-result?purchase_id=${purchase.id}`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mpToken}` },
      body: JSON.stringify(prefBody),
    });
    if (!mpRes.ok) {
      const t = await mpRes.text();
      console.error('MP error', mpRes.status, t);
      await admin.from('purchase_attempts').insert({ ip, user_id: user.id, success: false });
      return json({ error: 'mp_error', details: t }, mpRes.status);
    }
    const pref = await mpRes.json();
    await admin.from('purchases').update({ mp_preference_id: pref.id }).eq('id', purchase.id);

    // Record attempt (pending — settled by webhook)
    await admin.from('purchase_attempts').insert({ ip, user_id: user.id, success: false });

    return json({
      preference_id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
      purchase_id: purchase.id,
      subtotal, service_fee: fee, total,
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
