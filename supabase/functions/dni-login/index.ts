import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const { dni, password } = await req.json().catch(() => ({}));

    if (typeof dni !== "string" || !/^\d{6,12}$/.test(dni.trim())) {
      return json({ error: "invalid_dni" }, 400);
    }
    if (typeof password !== "string" || password.length < 1 || password.length > 200) {
      return json({ error: "invalid_password" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Resolve the DNI to an email server-side (never returned to the client)
    const { data: email, error: lookupErr } = await admin.rpc("email_for_dni", {
      _dni: dni.trim(),
    });

    if (lookupErr || !email) {
      // Generic message: do not reveal whether the DNI exists
      return json({ error: "invalid_credentials" }, 400);
    }

    const anonClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
    });

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: email as string,
      password,
    });

    if (error || !data.session) {
      const code = (error as any)?.code ?? "invalid_credentials";
      return json({ error: code === "email_not_confirmed" ? code : "invalid_credentials" }, 400);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (_e) {
    return json({ error: "unexpected_error" }, 500);
  }
});
