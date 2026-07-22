
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, MapPin, Ticket, QrCode, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyTickets, setShowMyTickets] = useState(false);

  // Mock data - eventos disponibles
  const events = [
    {
      id: 1,
      name: 'Concierto Rock Nacional',
      description: 'Los mejores exponentes del rock nacional en una noche única',
      date: '2024-07-15',
      time: '21:00',
      location: 'Estadio Luna Park',
      image: '/placeholder.svg',
      tickets: [
        { id: 1, type: 'General', price: 15000, available: 500 },
        { id: 2, type: 'VIP', price: 35000, available: 50 },
      ]
    },
    {
      id: 2,
      name: 'Festival de Jazz',
      description: 'Tres días de jazz con artistas internacionales',
      date: '2024-08-20',
      time: '19:00',
      location: 'Centro Cultural Recoleta',
      image: '/placeholder.svg',
      tickets: [
        { id: 3, type: 'Pase Diario', price: 8000, available: 200 },
        { id: 4, type: 'Pase Completo', price: 20000, available: 100 },
      ]
    }
  ];

  // Mock data actualizado - mis tickets sin referencias a email
  const myTickets = [
    {
      id: 'TKT001',
      eventName: 'Concierto Rock Nacional',
      ticketType: 'General',
      date: '2024-07-15',
      time: '21:00',
      location: 'Estadio Luna Park',
      qrCode: 'QR123456789',
      status: 'Válido',
      purchaseDate: '2024-06-19',
      isUsed: false
    }
  ];

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuyTicket = (eventId: number, ticketId: number) => {
    console.log('Comprando ticket:', { eventId, ticketId });
    navigate(`/purchase/${eventId}/${ticketId}`);
  };

  const handleGoBack = () => {
    navigate('/welcome');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const viewQRCode = (ticketId: string) => {
    // En una implementación real, aquí se mostraría el QR completo
    toast.success('QR mostrado. Este código es único e intransferible.');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleGoBack} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Cupo</h1>
              <Badge variant="secondary" className="ml-3">Mis Eventos</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={!showMyTickets ? "default" : "outline"}
                onClick={() => setShowMyTickets(false)}
              >
                Eventos
              </Button>
              <Button
                variant={showMyTickets ? "default" : "outline"}
                onClick={() => setShowMyTickets(true)}
              >
                Mis Tickets
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showMyTickets ? (
          <>
            {/* Buscador */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date} - {event.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {event.tickets.map((ticket) => (
                        <div key={ticket.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">{ticket.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${ticket.price.toLocaleString()}</div>
                            {ticket.available > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleBuyTicket(event.id, ticket.id)}
                                className="mt-1"
                              >
                                Comprar
                              </Button>
                            ) : (
                              <div className="text-sm text-muted-foreground mt-1">
                                Agotado
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Mis Tickets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map((ticket) => (
                <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{ticket.eventName}</span>
                      <Badge variant={ticket.status === 'Válido' && !ticket.isUsed ? 'default' : 'destructive'}>
                        {ticket.isUsed ? 'Usado' : ticket.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Ticket ID: {ticket.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Ticket className="h-4 w-4 mr-2" />
                        {ticket.ticketType}
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {ticket.date} - {ticket.time}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        {ticket.location}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Comprado: {ticket.purchaseDate}
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground mb-2">Código QR</div>
                      <div className="font-mono text-sm">{ticket.qrCode}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewQRCode(ticket.id)}
                        className="mt-2"
                        disabled={ticket.isUsed}
                      >
                        {ticket.isUsed ? 'Ticket Usado' : 'Ver QR Completo'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Este QR es único e intransferible. Solo disponible en la app.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
