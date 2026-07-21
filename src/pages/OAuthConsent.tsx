import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

// Minimal typed wrapper for the beta supabase.auth.oauth namespace so this
// route compiles even before the SDK ships public types for it.
type OAuthClient = { name?: string; client_name?: string; redirect_uris?: string[] };
type AuthDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthMethods = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authOAuth = (supabase.auth as any).oauth as OAuthMethods;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Falta el parámetro authorization_id en la URL.");
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the full consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);

      if (!authOAuth?.getAuthorizationDetails) {
        setError("Este proyecto no tiene el servidor OAuth activado. Contactá al organizador.");
        return;
      }

      const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorizationId)
      : await authOAuth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("El servidor de autorización no devolvió una URL de redirección.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-gradient border-border/50">
          <CardHeader>
            <CardTitle>No se pudo cargar la autorización</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      </div>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "una aplicación";

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-gradient startup-shadow border-border/50">
        <CardHeader className="text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle className="text-xl">Conectar {clientName} a Accoro</CardTitle>
          <CardDescription>
            Esta aplicación podrá usar las herramientas de Accoro mientras iniciás sesión con tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail && (
            <div className="rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm">
              Sesión iniciada como <span className="font-medium">{userEmail}</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <span className="font-medium text-foreground">{clientName}</span> podrá:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ver tu perfil (nombre, email).</li>
              <li>Listar y crear tus eventos en Accoro.</li>
              <li>Buscar eventos públicos disponibles.</li>
            </ul>
            <p className="text-xs">
              Esto no le da acceso más allá de lo que ya podés hacer vos como usuario de Accoro.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={busy} onClick={() => decide(true)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprobar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
