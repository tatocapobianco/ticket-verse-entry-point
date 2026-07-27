// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { code, state } = await req.json();
    if (!code || !state) return new Response(JSON.stringify({ error: "missing code/state" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET")!;
    const redirect = Deno.env.get("MERCADOPAGO_REDIRECT_URI")!;

    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect,
      }),
    });
    const tokenBody = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error("MP token error", tokenRes.status, tokenBody);
      return new Response(JSON.stringify({ error: "mp_token_failed", status: tokenRes.status, details: tokenBody }), { status: tokenRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = JSON.parse(tokenBody);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin.from("profiles").update({
      mp_access_token: token.access_token,
      mp_refresh_token: token.refresh_token,
      mp_user_id: String(token.user_id ?? ""),
      mp_public_key: token.public_key ?? null,
      mp_connected_at: new Date().toISOString(),
    }).eq("id", state);

    if (error) {
      console.error("profile update error", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
