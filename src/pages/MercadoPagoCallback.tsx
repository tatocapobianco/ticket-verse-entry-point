import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MercadoPagoCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando tu cuenta de MercadoPago...');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    if (error) {
      setStatus('error');
      setMessage(`MercadoPago devolvió un error: ${error}`);
      return;
    }
    if (!code || !state) {
      setStatus('error');
      setMessage('Faltan parámetros de OAuth.');
      return;
    }
    (async () => {
      const { data, error: fnErr } = await supabase.functions.invoke('mp-oauth-callback', { body: { code, state } });
      if (fnErr || (data as any)?.error) {
        setStatus('error');
        setMessage((data as any)?.error ?? fnErr?.message ?? 'No se pudo conectar MercadoPago');
      } else {
        setStatus('ok');
        setMessage('¡MercadoPago conectado con éxito!');
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />}
        {status === 'ok' && <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />}
        {status === 'error' && <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />}
        <h1 className="text-2xl font-bold font-display mb-2">MercadoPago</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button
          onClick={() => navigate('/organizer-dashboard')}
          className="w-full h-11 rounded-2xl brand-gradient-bg text-primary-foreground"
        >
          Ir al panel
        </Button>
      </div>
    </div>
  );
}
