import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, MapPin, Ticket, QrCode, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type EventRow = {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  ticket_types: {
    id: string;
    name: string;
    price: number;
    status: string;
    is_courtesy: boolean;
  }[];
};

type TicketRow = {
  id: string;
  qr_code: string;
  status: string;
  source: string;
  used_at: string | null;
  created_at: string;
  event: { id: string; name: string; event_date: string | null; event_time: string | null; location: string | null } | null;
  ticket_type: { id: string; name: string } | null;
};

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [revealedQR, setRevealedQR] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate('/');
        return;
      }
      loadEvents();
      loadTickets();
    })();
  }, [navigate]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, name, description, event_date, event_time, location, image_url, ticket_types(id, name, price, status, is_courtesy)')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('event_date', { ascending: true, nullsFirst: false });
    if (error) {
      toast.error('Error cargando eventos: ' + error.message);
    } else {
      setEvents((data as any) ?? []);
    }
    setLoadingEvents(false);
  };

  const loadTickets = async () => {
    setLoadingTickets(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { data, error } = await supabase
      .from('tickets')
      .select('id, qr_code, status, source, used_at, created_at, event:events(id, name, event_date, event_time, location), ticket_type:ticket_types(id, name)')
      .eq('owner_id', sess.session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Error cargando tickets: ' + error.message);
    } else {
      setTickets((data as any) ?? []);
    }
    setLoadingTickets(false);
  };

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.location ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuyTicket = (eventId: string, ticketId: string) => {
    navigate(`/purchase/${eventId}/${ticketId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleQR = (id: string) => {
    setRevealedQR(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success('Este código es único e intransferible.');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/welcome')} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Cupo</h1>
              <Badge variant="secondary" className="ml-3">Mis Eventos</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant={!showMyTickets ? 'default' : 'outline'} onClick={() => setShowMyTickets(false)}>
                Eventos
              </Button>
              <Button variant={showMyTickets ? 'default' : 'outline'} onClick={() => setShowMyTickets(true)}>
                Mis Tickets
              </Button>
              <Button variant="ghost" onClick={handleLogout}>Cerrar Sesión</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showMyTickets ? (
          <>
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos por nombre o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No hay eventos disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const sellable = (event.ticket_types ?? []).filter(t => !t.is_courtesy);
                  return (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <img
                          src={event.image_url || '/placeholder.svg'}
                          alt={event.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {event.event_date && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              {event.event_date}{event.event_time ? ` - ${event.event_time}` : ''}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.location}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {sellable.length === 0 && (
                            <p className="text-sm text-muted-foreground">Sin tickets disponibles.</p>
                          )}
                          {sellable.map((ticket) => {
                            const soldOut = ticket.status === 'sold_out' || ticket.status === 'inactive';
                            return (
                              <div key={ticket.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="font-medium">{ticket.name}</div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">${Number(ticket.price).toLocaleString()}</div>
                                  {!soldOut ? (
                                    <Button size="sm" onClick={() => handleBuyTicket(event.id, ticket.id)} className="mt-1">
                                      Comprar
                                    </Button>
                                  ) : (
                                    <div className="text-sm text-muted-foreground mt-1">Agotado</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Mis Tickets</h2>
            {loadingTickets ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : tickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">Todavía no tenés tickets.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => {
                  const used = ticket.status === 'used' || !!ticket.used_at;
                  const revealed = revealedQR[ticket.id];
                  return (
                    <Card key={ticket.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{ticket.event?.name ?? 'Evento'}</span>
                          <Badge variant={!used ? 'default' : 'destructive'}>
                            {used ? 'Usado' : 'Válido'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>Ticket ID: {ticket.id.slice(0, 8)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <Ticket className="h-4 w-4 mr-2" />
                            {ticket.ticket_type?.name ?? '—'}
                          </div>
                          {ticket.event?.event_date && (
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              {ticket.event.event_date}{ticket.event.event_time ? ` - ${ticket.event.event_time}` : ''}
                            </div>
                          )}
                          {ticket.event?.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-2" />
                              {ticket.event.location}
                            </div>
                          )}
                        </div>

                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground mb-2">Código QR</div>
                          <div className="font-mono text-sm break-all">
                            {revealed ? ticket.qr_code : '••••••••••••'}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleQR(ticket.id)}
                            className="mt-2"
                            disabled={used}
                          >
                            {used ? 'Ticket Usado' : revealed ? 'Ocultar' : 'Ver QR'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            ⚠️ Este QR es único e intransferible. Solo disponible en la app.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
