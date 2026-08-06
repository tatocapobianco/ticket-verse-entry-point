import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, Loader2, Calendar, MapPin, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatEventDate, formatARS } from '@/lib/format';

const SERVICE_FEE = 0.15;

type TicketType = {
  id: string;
  name: string;
  price: number;
  status: string;
  requires_auth_code: boolean;
  event: { id: string; name: string; event_date: string | null; event_time: string | null; location: string | null } | null;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (key: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const loadRecaptcha = (siteKey: string) =>
  new Promise<void>((resolve) => {
    if (document.querySelector(`script[data-cupo-recaptcha]`)) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.dataset.cupoRecaptcha = '1';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });

const PurchasePage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [authCode, setAuthCode] = useState('');
  const [step, setStep] = useState<'details' | 'summary'>('details');
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const [processing, setProcessing] = useState(false);
  const [recaptchaKey, setRecaptchaKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name, price, status, requires_auth_code, event:events!inner(id, name, event_date, event_time, location)')
        .eq('id', ticketId!)
        .single();
      if (error || !data) {
        toast.error('Ticket no encontrado');
        navigate('/buyer-dashboard');
        return;
      }
      setTicket(data as any);
      setLoading(false);
    })();
  }, [ticketId, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke('public-config');
      const key = (data as any)?.recaptcha_site_key;
      if (key) {
        setRecaptchaKey(key);
        await loadRecaptcha(key);
      }
    })();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000)) : 0;

  const subtotal = ticket ? Number(ticket.price) * quantity : 0;
  const fee = Math.round(subtotal * SERVICE_FEE);
  const total = subtotal + fee;

  const getCaptchaToken = async (action: string): Promise<string | null> => {
    if (!recaptchaKey || !window.grecaptcha) return null;
    return new Promise((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(recaptchaKey, { action });
          resolve(token);
        } catch { resolve(null); }
      });
    });
  };

  const handleReserve = async () => {
    if (!ticket) return;
    if (ticket.requires_auth_code && !authCode.trim()) {
      toast.error('Este ticket requiere un código de autorización');
      return;
    }
    setProcessing(true);
    const { data, error } = await supabase.rpc('reserve_stock', {
      _ticket_type_id: ticket.id, _quantity: quantity,
    });
    setProcessing(false);
    if (error) {
      toast.error(error.message === 'insufficient_stock' ? 'Sin stock disponible' : error.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : (data as any);
    setReservationId(row.reservation_id);
    setExpiresAt(new Date(row.expires_at));
    setStep('summary');
  };

  const handlePay = async () => {
    if (!reservationId) return;
    setPayError(null);
    setProcessing(true);
    try {
      const recaptcha_token = await getCaptchaToken('purchase');
      const { data, error } = await supabase.functions.invoke('mp-create-preference', {
        body: {
          reservation_id: reservationId,
          recaptcha_token,
          auth_code: ticket?.requires_auth_code ? authCode.trim() : null,
        },
      });
      let payload: any = data;
      if (error && (error as any).context) {
        const ctx = (error as any).context;
        try { payload = await ctx.json(); }
        catch {
          try { const t = await ctx.text(); payload = { message: t }; } catch { /* ignore */ }
        }
      }
      if (error || payload?.error) {
        const detail =
          payload?.message ||
          payload?.error ||
          (error as any)?.message ||
          'error desconocido';
        setPayError(String(detail));
        toast.error(`No se pudo iniciar el pago: ${detail}`);
        console.error('mp-create-preference failed', { error, payload });
        return;
      }
      if (!payload?.init_point) {
        const msg = 'El servidor no devolvió un link de pago. Intentá de nuevo en unos segundos.';
        setPayError(msg);
        toast.error(msg);
        return;
      }
      window.location.href = payload.init_point;
    } catch (e: any) {
      const msg = e?.message || 'Error de conexión. Revisá tu internet e intentá de nuevo.';
      setPayError(msg);
      toast.error(`No se pudo iniciar el pago: ${msg}`);
      console.error('mp-create-preference threw', e);
    } finally {
      setProcessing(false);
    }
  };


  if (loading || !ticket) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const soldOut = ticket.status === 'sold_out' || ticket.status === 'inactive';
  const ev = ticket.event!;

  if (step === 'summary') {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => setStep('details')} className="mb-6 rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Card className="rounded-3xl soft-shadow">
            <CardHeader>
              <CardTitle>Resumen de compra</CardTitle>
              <CardDescription>
                Reserva vigente por {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{ev.name}</h3>
                <p className="text-sm text-muted-foreground">{formatEventDate(ev.event_date, ev.event_time)}</p>
                {ev.location && <p className="text-sm text-muted-foreground">{ev.location}</p>}
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between"><span>Precio del ticket ({quantity}x)</span><span className="font-medium">{formatARS(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Cargo por servicio (15%)</span><span>{formatARS(fee)}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center rounded-2xl bg-primary/5 p-4">
                <span className="font-display font-semibold">Total a pagar</span>
                <span className="font-display font-bold text-2xl">{formatARS(total)}</span>
              </div>
              <Button onClick={handlePay} disabled={processing || secondsLeft === 0} className="w-full h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-base font-display font-semibold" size="lg">
                {processing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CreditCard className="h-5 w-5 mr-2" />}
                {secondsLeft === 0 ? 'Reserva expirada' : `Pagar ${formatARS(total)}`}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" /> Protegido por reCAPTCHA.</p>

            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/buyer-dashboard')} className="mb-6 rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-3xl soft-shadow">
            <CardHeader><CardTitle>Detalles del evento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">{ev.name}</h3>
              {ev.event_date && <div className="flex items-center text-sm text-muted-foreground"><Calendar className="h-4 w-4 mr-2" />{formatEventDate(ev.event_date, ev.event_time)}</div>}
              {ev.location && <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{ev.location}</div>}
              <Separator />
              <div className="bg-primary/5 p-3 rounded-lg flex justify-between items-center">
                <span className="font-medium">{ticket.name}</span>
                <span className="font-bold">{formatARS(ticket.price)}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl soft-shadow">
            <CardHeader><CardTitle>Cantidad</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="q">Cantidad</Label>
              <Input id="q" type="number" min={1} max={10} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              {ticket.requires_auth_code && (
                <div>
                  <Label htmlFor="auth" className="flex items-center gap-1"><Lock className="h-3 w-3" /> Código de autorización</Label>
                  <Input id="auth" value={authCode} onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Ingresá el código exclusivo" className="rounded-2xl" />
                  <p className="text-xs text-muted-foreground mt-1">Este ticket es exclusivo. Necesitás el código provisto por el organizador.</p>
                </div>
              )}
              {soldOut ? (
                <div className="text-center py-3 text-muted-foreground font-medium">Agotado</div>
              ) : (
                <Button onClick={handleReserve} disabled={processing} className="w-full rounded-full brand-gradient-bg text-primary-foreground" size="lg">
                  {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Comprar
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">Al continuar, aceptás nuestros términos.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
