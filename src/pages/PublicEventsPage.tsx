import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';

type Ev = {
  id: string; name: string; description: string | null;
  event_date: string | null; event_time: string | null;
  location: string | null; image_url: string | null;
};

const PublicEventsPage = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,name,description,event_date,event_time,location,image_url')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('event_date', { ascending: true, nullsFirst: false });
      setEvents((data ?? []) as Ev[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      <header className="glass-card border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src={cupoLogo} alt="Cupo" className="h-9 w-auto" /></Link>
          <Link to="/"><Button variant="ghost" className="rounded-full">Iniciar sesión</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Eventos disponibles</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <Card className="glass-card rounded-2xl"><CardContent className="p-10 text-center text-muted-foreground">No hay eventos disponibles por el momento.</CardContent></Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link key={ev.id} to={`/evento/${ev.id}`} className="block">
                <Card className="glass-card rounded-2xl border-border/60 hover:shadow-lg transition overflow-hidden">
                  {ev.image_url && <div className="aspect-video bg-secondary/40" style={{ backgroundImage: `url(${ev.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                  <CardContent className="p-5 space-y-2">
                    <h3 className="font-display font-bold text-lg line-clamp-2">{ev.name}</h3>
                    {ev.event_date && <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {ev.event_date} {ev.event_time}</p>}
                    {ev.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</p>}
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

export default PublicEventsPage;
