import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Loader2, AlertCircle, LogIn } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { formatEventDate, formatARS, eventInitials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'EV';

const PublicEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [productora, setProductora] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: ev } = await supabase.from('events').select('id,name,description,event_date,event_time,location,image_url,event_number,is_public,status,productora_id').eq('id', id).maybeSingle();
      if (!ev) { setError('not_found'); setLoading(false); return; }
      if (ev.status !== 'active') { setError('inactive'); setLoading(false); return; }
      setEvent(ev);
      if (ev.productora_id) {
        const { data: prod } = await supabase
          .from('productoras')
          .select('nombre,slug,logo_url')
          .eq('id', ev.productora_id)
          .maybeSingle();
        setProductora(prod ?? null);
      }
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

  // SEO / social preview: título, descripción y og:image (flyer) del evento
  useEffect(() => {
    if (!event) return;
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const title = `${event.name} · Entradas en Cupo`;
    const desc = (event.description || `Conseguí tus entradas para ${event.name} en Cupo.`).slice(0, 155);
    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'twitter:card', event.image_url ? 'summary_large_image' : 'summary');
    if (event.image_url) {
      setMeta('property', 'og:image', event.image_url);
      setMeta('name', 'twitter:image', event.image_url);
    }
  }, [event]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (error) {
    const msg = error === 'inactive'
      ? 'Este evento no está disponible por el momento'
      : 'Evento no encontrado';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="rounded-3xl soft-shadow max-w-md w-full">
          <CardContent className="p-10 text-center space-y-4">
            <AlertCircle className="h-14 w-14 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-display font-bold">{msg}</h2>
            <Button onClick={() => navigate('/')} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Ver otros eventos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSoldOut = (t: any) => t.quantity_total !== null && t.quantity_sold >= t.quantity_total;
  const remaining = (t: any) => (t.quantity_total !== null ? Math.max(0, t.quantity_total - t.quantity_sold) : null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><img src={cupoLogo} alt="Cupo" className="h-8 w-auto" /></Link>
          {!user && (
            <Button onClick={() => navigate('/login')} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <LogIn className="h-4 w-4 mr-2" /> Iniciar sesión
            </Button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="relative h-56 md:h-80 w-full overflow-hidden">
          {event.image_url ? (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${event.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ) : (
            <div className="absolute inset-0 brand-hero-gradient flex items-center justify-center">
              <span className="font-display font-bold text-6xl text-primary-foreground/40">{initials(event.name)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />
          <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-4 sm:px-6 pb-6">
            {!event.is_public && <Badge variant="secondary" className="mb-3">Privado</Badge>}
            <h1 className="font-display font-bold text-3xl md:text-5xl text-primary-foreground drop-shadow">{event.name}</h1>
            {productora && (
              <div className="mt-3 flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-primary-foreground/40">
                  {productora.logo_url && <AvatarImage src={productora.logo_url} alt={`Logo de ${productora.nombre}`} className="object-cover" />}
                  <AvatarFallback className="bg-card text-primary text-[10px] font-semibold">
                    {eventInitials(productora.nombre)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-primary-foreground/90">
                  Organiza:{' '}
                  <Link to={`/productora/${productora.slug}`} className="font-semibold underline underline-offset-2 hover:text-primary-foreground">
                    {productora.nombre}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="rounded-3xl soft-shadow border-border">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {event.event_date && (
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></span>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatEventDate(event.event_date, event.event_time)}</p>
                  </div>
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-accent/10 p-2"><MapPin className="h-5 w-5 text-accent" /></span>
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-muted-foreground whitespace-pre-line border-t border-border pt-4">{event.description}</p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold">Entradas disponibles</h2>
          {tickets.length === 0 ? (
            <Card className="rounded-2xl soft-shadow border-border">
              <CardContent className="p-6 text-sm text-muted-foreground">No hay entradas a la venta.</CardContent>
            </Card>
          ) : tickets.map((t) => {
            const sold = isSoldOut(t);
            const left = remaining(t);
            const handleBuy = () => {
              const path = `/purchase/${event.id}/${t.id}`;
              if (!user) { navigate(`/login?next=${encodeURIComponent(path)}`); return; }
              navigate(path);
            };
            return (
              <Card key={t.id} className="rounded-2xl border-border soft-shadow transition-shadow hover:shadow-lg">
                <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display font-semibold text-lg">{t.name}</p>
                    <p className="font-display font-bold text-2xl mt-1">{formatARS(t.price)}</p>
                    {!sold && left !== null && left <= 10 && (
                      <p className="text-xs text-accent font-medium mt-1">Quedan {left}</p>
                    )}
                  </div>
                  {sold ? (
                    <Button disabled variant="secondary" className="rounded-full">Agotado</Button>
                  ) : authLoading ? (
                    <Button disabled variant="secondary" className="rounded-full"><Loader2 className="h-4 w-4 animate-spin" /></Button>
                  ) : !user ? (
                    <Button onClick={handleBuy} variant="outline" className="rounded-full transition-colors">
                      <LogIn className="h-4 w-4 mr-2" /> Iniciar sesión para comprar
                    </Button>
                  ) : (
                    <Button onClick={handleBuy} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6">Comprar</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default PublicEventPage;
