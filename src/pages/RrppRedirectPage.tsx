import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

const RrppRedirectPage = () => {
  const { link_code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!link_code) { setError('Link inválido'); return; }
      const { data: er } = await supabase
        .from('event_rrpps')
        .select('id, event_id, active, max_tickets, link_type')
        .eq('link_code', link_code)
        .maybeSingle();
      if (!er || !er.active) {
        setError('Este link no está disponible o fue desactivado.');
        return;
      }
      // Store link_code for the purchase flow to consume
      sessionStorage.setItem('rrpp_link_code', link_code);
      sessionStorage.setItem('rrpp_event_rrpp_id', er.id);
      navigate(`/evento/${er.event_id}`, { replace: true });
    })();
  }, [link_code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="glass-card rounded-3xl max-w-md w-full">
          <CardContent className="p-10 text-center space-y-4">
            <AlertCircle className="h-14 w-14 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-display font-bold">{error}</h2>
            <Button onClick={() => navigate('/')} className="rounded-full brand-gradient-bg text-primary-foreground">Ir al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default RrppRedirectPage;
