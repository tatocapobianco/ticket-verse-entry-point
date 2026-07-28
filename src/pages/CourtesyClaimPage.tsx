import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import cupoLogo from '@/assets/cupo-logo.png';

const CourtesyClaimPage = () => {
  const { courtesyCode } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'invalid' | 'need_auth' | 'claiming' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [linkInfo, setLinkInfo] = useState<{ event_name?: string; ticket_name?: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!courtesyCode) { setStatus('invalid'); return; }
      const { data } = await supabase.rpc('get_courtesy_link_by_code', { _code: courtesyCode });
      const link = Array.isArray(data) ? data[0] : data;
      if (!link) { setStatus('invalid'); return; }
      const [{ data: ev }, { data: tt }] = await Promise.all([
        supabase.from('events').select('name').eq('id', link.event_id).maybeSingle(),
        supabase.from('ticket_types').select('name').eq('id', link.ticket_type_id).maybeSingle(),
      ]);
      setLinkInfo({ event_name: ev?.name, ticket_name: tt?.name });
      if (authLoading) return;
      if (!user) { setStatus('need_auth'); return; }
      // auto-claim
      setStatus('claiming');
      const { data: res, error: err } = await supabase.functions.invoke('claim-courtesy', { body: { code: courtesyCode } });
      if (err || (res as any)?.error) {
        setError((res as any)?.error || err?.message || 'Error');
        setStatus('error');
      } else {
        setStatus('success');
      }
    })();
  }, [courtesyCode, user?.id, authLoading]);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card rounded-3xl">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <img src={cupoLogo} alt="Cupo" className="h-10 w-auto mx-auto" />
          {children}
        </CardContent>
      </Card>
    </div>
  );

  if (status === 'loading' || status === 'claiming') return <Shell><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="text-sm text-muted-foreground">{status === 'claiming' ? 'Reclamando cortesía...' : 'Cargando...'}</p></Shell>;
  if (status === 'invalid') return <Shell><AlertCircle className="h-14 w-14 text-destructive mx-auto" /><h2 className="text-xl font-bold">Link inválido</h2><p className="text-sm text-muted-foreground">Este link ya no está disponible o fue revocado.</p><Button onClick={() => navigate('/eventos')} className="rounded-full">Ver eventos</Button></Shell>;
  if (status === 'need_auth') return <Shell>
    <Gift className="h-14 w-14 text-primary mx-auto" />
    <h2 className="text-xl font-bold">Cortesía disponible</h2>
    {linkInfo?.event_name && <p className="text-sm"><strong>{linkInfo.event_name}</strong>{linkInfo.ticket_name ? ` — ${linkInfo.ticket_name}` : ''}</p>}
    <p className="text-sm text-muted-foreground">Iniciá sesión o creá tu cuenta para reclamar tu entrada.</p>
    <Button onClick={() => navigate(`/?next=${encodeURIComponent(`/cortesia/${courtesyCode}`)}`)} className="rounded-full brand-gradient-bg text-primary-foreground w-full">Continuar</Button>
  </Shell>;
  if (status === 'error') return <Shell><AlertCircle className="h-14 w-14 text-destructive mx-auto" /><h2 className="text-xl font-bold">No se pudo reclamar</h2><p className="text-sm text-muted-foreground">{error}</p><Button onClick={() => navigate('/buyer-dashboard')} className="rounded-full">Ir a mis tickets</Button></Shell>;
  return <Shell>
    <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
    <h2 className="text-xl font-bold">¡Cortesía reclamada!</h2>
    {linkInfo?.event_name && <p className="text-sm text-muted-foreground">Tu entrada para <strong>{linkInfo.event_name}</strong> ya está lista.</p>}
    <Button onClick={() => navigate('/buyer-dashboard')} className="rounded-full brand-gradient-bg text-primary-foreground w-full">Ver mis tickets</Button>
  </Shell>;
};

export default CourtesyClaimPage;
