import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Loader2, AlertCircle, LogIn } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';
import { useAuth } from '@/hooks/useAuth';

const PublicEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (!ev) { setError('not_found'); setLoading(false); return; }
      if (ev.status !== 'active') { setError('inactive'); setLoading(false); return; }
      setEvent(ev);
      const { data: tts } = await supabase
        .from('ticket_types')
        .select('id,name,description,price,quantity_total,quantity_sold,status,is_courtesy')
        .eq('event_id', id)
        .eq('is_courtesy', false)
        .eq('status', 'active');
      setTickets(tts ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center gradient-bg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (error) {
    const msg = error === 'inactive'
      ? 'Este evento no está disponible por el momento'
      : 'Evento no encontrado';
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="glass-card rounded-3xl max-w-md w-full">
          <CardContent className="p-10 text-center space-y-4">
            <AlertCircle className="h-14 w-14 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-display font-bold">{msg}</h2>
            <Button onClick={() => navigate('/eventos')} className="rounded-full brand-gradient-bg text-primary-foreground">Ver otros eventos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSoldOut = (t: any) => t.quantity_total !== null && t.quantity_sold >= t.quantity_total;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="glass-card border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/eventos"><img src={cupoLogo} alt="Cupo" className="h-9 w-auto" /></Link>
          <Link to="/"><Button variant="ghost" className="rounded-full">Iniciar sesión</Button></Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {event.image_url && (
          <div className="rounded-3xl overflow-hidden aspect-video bg-secondary/40" style={{ backgroundImage: `url(${event.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}

        <Card className="glass-card rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {!event.is_public && <Badge variant="secondary">Privado</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">{event.name}</h1>
            {event.description && <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {event.event_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {event.event_date} {event.event_time}</span>}
              {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-display font-bold">Entradas</h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay entradas a la venta.</p>
            ) : tickets.map((t) => {
              const sold = isSoldOut(t);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/40 flex-wrap">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <p className="text-sm font-medium mt-1">${Number(t.price).toLocaleString()}</p>
                  </div>
                  {sold ? (
                    <Button disabled variant="secondary" className="rounded-full">Agotado</Button>
                  ) : (
                    <Button onClick={() => navigate(`/purchase/${event.id}/${t.id}`)} className="rounded-full brand-gradient-bg text-primary-foreground">Comprar</Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PublicEventPage;
