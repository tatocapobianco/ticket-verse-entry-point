import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PurchaseResult = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'rejected'>('loading');

  useEffect(() => {
    const id = params.get('purchase_id');
    if (!id) { navigate('/buyer-dashboard'); return; }
    let cancelled = false;
    const poll = async () => {
      for (let i = 0; i < 8; i++) {
        const { data } = await supabase.from('purchases').select('status').eq('id', id).single();
        if (cancelled) return;
        if (data?.status === 'paid') { setStatus('paid'); return; }
        if (data?.status === 'rejected') { setStatus('rejected'); return; }
        await new Promise(r => setTimeout(r, 1500));
      }
      setStatus('pending');
    };
    poll();
    return () => { cancelled = true; };
  }, [params, navigate]);

  const config = {
    loading: { icon: Loader2, color: 'text-primary', title: 'Confirmando pago…', msg: 'Estamos validando tu pago con MercadoPago.' },
    paid:    { icon: CheckCircle, color: 'text-green-500', title: '¡Compra exitosa!', msg: 'Tu ticket ya está en Mis Tickets dentro de la app. El QR es único e intransferible.' },
    pending: { icon: Clock, color: 'text-orange-500', title: 'Pago pendiente', msg: 'Tu pago está en proceso. Vas a recibir un mail cuando se confirme.' },
    rejected:{ icon: XCircle, color: 'text-destructive', title: 'Pago rechazado', msg: 'El pago no pudo procesarse. Intentá nuevamente.' },
  }[status];
  const Icon = config.icon;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl soft-shadow">
        <CardContent className="text-center pt-8">
          <Icon className={`h-16 w-16 mx-auto mb-4 ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`} />
          <h2 className="text-2xl font-bold font-display mb-2">{config.title}</h2>
          <p className="text-muted-foreground mb-6">{config.msg}</p>
          <Button onClick={() => navigate('/buyer-dashboard')} className="w-full rounded-full brand-gradient-bg text-primary-foreground">
            Ver mis tickets
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseResult;
