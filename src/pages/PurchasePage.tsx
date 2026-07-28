import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, Loader2, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SERVICE_FEE = 0.15;

type TicketType = {
  id: string;
  name: string;
  price: number;
  status: string;
  event: { id: string; name: string; event_date: string | null; event_time: string | null; location: string | null } | null;
};

const PurchasePage = () => {
  const { eventId, ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'details' | 'summary'>('details');
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name, price, status, event:events!inner(id, name, event_date, event_time, location)')
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
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000)) : 0;

  const subtotal = ticket ? Number(ticket.price) * quantity : 0;
  const fee = Math.round(subtotal * SERVICE_FEE);
  const total = subtotal + fee;

  const handleReserve = async () => {
    if (!ticket) return;
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
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke('mp-create-preference', {
      body: { reservation_id: reservationId },
    });
    setProcessing(false);
    if (error || !data?.init_point) {
      toast.error('No se pudo iniciar el pago');
      console.error(error, data);
      return;
    }
    window.location.href = data.init_point;
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
                <p className="text-sm text-muted-foreground">{ev.event_date} {ev.event_time}</p>
                <p className="text-sm text-muted-foreground">{ev.location}</p>
              </div>
              <Separator />
              <div className="flex justify-between"><span>Ticket: {ticket.name} ({quantity}x)</span><span>${subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cargo por servicio</span><span>${fee.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total.toLocaleString()}</span></div>
              <Button onClick={handlePay} disabled={processing || secondsLeft === 0} className="w-full rounded-full brand-gradient-bg text-primary-foreground" size="lg">
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {secondsLeft === 0 ? 'Reserva expirada' : 'Finalizar compra'}
              </Button>
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
              {ev.event_date && <div className="flex items-center text-sm text-muted-foreground"><Calendar className="h-4 w-4 mr-2" />{ev.event_date} {ev.event_time}</div>}
              {ev.location && <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-2" />{ev.location}</div>}
              <Separator />
              <div className="bg-primary/5 p-3 rounded-lg flex justify-between items-center">
                <span className="font-medium">{ticket.name}</span>
                <span className="font-bold">${Number(ticket.price).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl soft-shadow">
            <CardHeader><CardTitle>Cantidad</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="q">Cantidad</Label>
              <Input id="q" type="number" min={1} max={10} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
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
