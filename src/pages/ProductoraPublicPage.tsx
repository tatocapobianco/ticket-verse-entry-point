import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertCircle, Instagram, Calendar, MapPin } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';
import { EventCover } from '@/components/EventCover';
import { formatEventDate, eventInitials } from '@/lib/format';

const ProductoraPublicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productora, setProductora] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data: p } = await supabase
        .from('productoras')
        .select('id,nombre,slug,logo_url,descripcion')
        .eq('slug', slug)
        .maybeSingle();
      if (!p) { setProductora(null); setLoading(false); return; }
      setProductora(p);
      const { data: evs } = await supabase
        .from('events')
        .select('id,name,event_date,event_time,location,image_url,status,is_public')
        .eq('productora_id', p.id)
        .eq('status', 'active')
        .eq('is_public', true)
        .order('event_date', { ascending: true });
      setEvents(evs ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!productora) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="rounded-3xl soft-shadow max-w-md w-full">
          <CardContent className="p-10 text-center space-y-4">
            <AlertCircle className="h-14 w-14 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-display font-bold">Productora no encontrada</h1>
            <Button onClick={() => navigate('/')} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Ver eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const instagram: string | null = null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link to="/"><img src={cupoLogo} alt="Cupo" className="h-8 w-auto" /></Link>
        </div>
      </header>

      <section className="brand-gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary-foreground/40">
            {productora.logo_url && <AvatarImage src={productora.logo_url} alt={`Logo de ${productora.nombre}`} className="object-cover" />}
            <AvatarFallback className="bg-card text-primary font-display font-bold">{eventInitials(productora.nombre)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary-foreground">{productora.nombre}</h1>
            {productora.descripcion && (
              <p className="text-primary-foreground/85 text-sm mt-1">{productora.descripcion}</p>
            )}
            {instagram && (
              <p className="text-primary-foreground/85 text-sm mt-1 flex items-center gap-1">
                <Instagram className="h-4 w-4" /> {instagram}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <h2 className="text-xl font-display font-bold">Próximos eventos</h2>
        {events.length === 0 ? (
          <Card className="rounded-2xl soft-shadow border-border">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Esta productora todavía no tiene eventos publicados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <Card
                key={ev.id}
                onClick={() => navigate(`/evento/${ev.id}`)}
                className="rounded-2xl overflow-hidden border-border soft-shadow cursor-pointer transition-shadow hover:shadow-lg"
              >
                <EventCover name={ev.name} imageUrl={ev.image_url} date={ev.event_date} />
                <CardContent className="p-4 space-y-1">
                  <p className="font-display font-semibold">{ev.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatEventDate(ev.event_date, ev.event_time)}
                  </p>
                  {ev.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {ev.location}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductoraPublicPage;
