import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Wallet, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import cupoLogo from '@/assets/cupo-logo.png';

const OrganizerOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshRoles } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!orgName.trim()) {
      toast.error('Ingresá el nombre de tu productora');
      return;
    }
    if (!user) return;
    setLoading(true);

    // Update profile with productora name
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ organization_name: orgName.trim() })
      .eq('id', user.id);

    if (profErr) {
      setLoading(false);
      toast.error(profErr.message);
      return;
    }

    // Grant organizer role via server-side function (RLS blocks direct client insert)
    const { error: roleErr } = await supabase.rpc('self_assign_role', { _role: 'organizer' });

    setLoading(false);
    if (roleErr) {
      toast.error(roleErr.message);
      return;
    }

    await refreshRoles();
    toast.success('¡Modo organizador activado!');
    navigate('/organizer-dashboard');
  };

  const handleConnectMP = async () => {
    const { data, error } = await supabase.functions.invoke('mp-oauth-start');
    if (error || !(data as any)?.url) {
      toast.error((data as any)?.error ?? error?.message ?? 'No se pudo iniciar la conexión con MercadoPago');
      return;
    }
    window.location.href = (data as any).url;
  };

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <img src={cupoLogo} alt="Cupo" className="h-10 w-auto" />
          <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </header>

        <div className="glass-card rounded-3xl p-8">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-5">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">Activá tu modo Organizador</h1>
          <p className="text-muted-foreground mb-8">
            Contanos de tu productora y conectá MercadoPago para recibir los pagos de tus eventos.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la productora *</Label>
              <Input
                id="orgName"
                placeholder="Ej. Producciones El Faro"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="h-12 rounded-2xl bg-secondary/40"
              />
            </div>

            <div className="rounded-2xl border border-border p-5 bg-secondary/30">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Vincular MercadoPago</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Vas a poder cobrar directo a tu cuenta de MercadoPago. Cupo retiene una comisión del 15% del comprador.
                  </p>
                  <Button variant="outline" onClick={handleConnectMP} className="rounded-full">
                    Conectar MercadoPago
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Podés activar el modo organizador ahora y conectar tu cuenta más tarde desde el panel.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleActivate}
              disabled={loading}
              className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold startup-shadow"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activar modo organizador'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerOnboarding;
