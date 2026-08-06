import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Loader2, LogIn } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';
import { AppSideMenu } from '@/components/AppSideMenu';
import { UserMenu } from '@/components/UserMenu';
import { EventCover } from '@/components/EventCover';
import { formatEventDate, formatARS } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

type Ev = {
  id: string; name: string; description: string | null;
  event_date: string | null; event_time: string | null;
  location: string | null; image_url: string | null;
};


const HomePage = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,name,description,event_date,event_time,location,image_url')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('event_date', { ascending: true, nullsFirst: false });
      const evs = (data ?? []) as Ev[];
      setEvents(evs);

      if (evs.length) {
        const { data: tts } = await supabase
          .from('ticket_types')
          .select('event_id,price')
          .in('event_id', evs.map((e) => e.id))
          .eq('is_courtesy', false)
          .eq('status', 'active');
        const min: Record<string, number> = {};
        (tts ?? []).forEach((t: any) => {
          const p = Number(t.price);
          if (min[t.event_id] === undefined || p < min[t.event_id]) min[t.event_id] = p;
        });
        setPrices(min);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <AppSideMenu />
            <Link to="/" className="flex items-center">
              <img src={cupoLogo} alt="Cupo" className="h-8 w-auto" />
            </Link>
          </div>
          {user ? (
            <UserMenu />

          ) : (
            <Button onClick={() => navigate('/login')} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <LogIn className="h-4 w-4 mr-2" /> Iniciar sesión
            </Button>
          )}
        </div>
      </header>

      <section className="brand-hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-primary-foreground tracking-tight">
            Descubrí los mejores eventos
          </h1>
          <p className="mt-3 text-primary-foreground/85 text-base md:text-lg">
            Comprá tus entradas de forma rápida y segura
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-display font-bold text-2xl mb-6">Eventos disponibles</h2>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <Card className="rounded-2xl soft-shadow border-border">
            <CardContent className="p-10 text-center text-muted-foreground">
              No hay eventos disponibles por el momento.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link key={ev.id} to={`/evento/${ev.id}`} className="block group">
                <Card className="rounded-2xl overflow-hidden border-border soft-shadow transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className="relative aspect-[16/10]">
                    {ev.image_url ? (
                      <div className="absolute inset-0" style={{ backgroundImage: `url(${ev.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    ) : (
                      <div className="absolute inset-0 brand-hero-gradient flex items-center justify-center">
                        <span className="font-display font-bold text-4xl text-primary-foreground/90">{initials(ev.name)}</span>
                      </div>
                    )}
                    {ev.event_date && (
                      <span className="absolute top-3 left-3 rounded-full bg-card/95 px-3 py-1 text-xs font-display font-semibold text-foreground shadow">
                        {shortDate(ev.event_date)}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-5 space-y-2">
                    <h3 className="font-display font-bold text-lg line-clamp-2">{ev.name}</h3>
                    {ev.event_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {formatEventDate(ev.event_date, ev.event_time)}
                      </p>
                    )}
                    {ev.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {ev.location}
                      </p>
                    )}
                    {prices[ev.id] !== undefined && (
                      <p className="pt-1 text-sm text-muted-foreground">
                        Desde <span className="font-display font-bold text-base text-foreground">{formatARS(prices[ev.id])}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
