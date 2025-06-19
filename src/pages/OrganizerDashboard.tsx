
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Users, DollarSign, Settings, Gift, Key } from 'lucide-react';
import { toast } from 'sonner';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: ''
  });

  // Mock data - eventos del organizador
  const myEvents = [
    {
      id: 1,
      name: 'Concierto Rock Nacional',
      description: 'Los mejores exponentes del rock nacional',
      date: '2024-07-15',
      time: '21:00',
      location: 'Estadio Luna Park',
      capacity: 5000,
      soldTickets: 3250,
      revenue: 48750000,
      status: 'Activo',
      tickets: [
        { id: 1, type: 'General', price: 15000, sold: 3000, total: 4500 },
        { id: 2, type: 'VIP', price: 35000, sold: 250, total: 500 }
      ]
    },
    {
      id: 2,
      name: 'Festival de Jazz',
      description: 'Tres días de jazz internacional',
      date: '2024-08-20',
      time: '19:00',
      location: 'Centro Cultural Recoleta',
      capacity: 1000,
      soldTickets: 450,
      revenue: 9000000,
      status: 'Activo',
      tickets: [
        { id: 3, type: 'Pase Diario', price: 8000, sold: 300, total: 600 },
        { id: 4, type: 'Pase Completo', price: 20000, sold: 150, total: 400 }
      ]
    }
  ];

  const handleCreateEvent = () => {
    console.log('Creando evento:', newEvent);
    toast.success('Evento creado exitosamente');
    setShowCreateEvent(false);
    setNewEvent({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: ''
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const sendCourtesyTicket = (eventId: number) => {
    toast.success('Ticket de cortesía enviado');
  };

  const toggleAuthCode = (eventId: number) => {
    toast.success('Código de autorización activado/desactivado');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TicketPro</h1>
              <Badge variant="secondary" className="ml-3">Organizador</Badge>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Mis Eventos</TabsTrigger>
            <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Mis Eventos</h2>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Evento
              </Button>
            </div>

            {showCreateEvent && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Crear Nuevo Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Evento</Label>
                      <Input
                        id="name"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                        placeholder="Concierto de Rock"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        placeholder="Estadio Luna Park"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Hora</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newEvent.capacity}
                        onChange={(e) => setNewEvent({...newEvent, capacity: e.target.value})}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Descripción del evento..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateEvent(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEvent}>
                      Crear Evento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <Badge variant={event.status === 'Activo' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {event.date} - {event.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          {event.soldTickets}/{event.capacity}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-semibold">${event.revenue.toLocaleString()}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Tipos de Tickets:</div>
                        {event.tickets.map((ticket) => (
                          <div key={ticket.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <span>{ticket.type}</span>
                            <span>{ticket.sold}/{ticket.total} - ${ticket.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendCourtesyTicket(event.id)}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Cortesía
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAuthCode(event.id)}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Código Auth
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3,700</div>
                  <p className="text-xs text-muted-foreground">+15% desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$57.750.000</div>
                  <p className="text-xs text-muted-foreground">+25% desde el mes pasado</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Pagos</CardTitle>
                <CardDescription>
                  Vincula tu cuenta de MercadoPago para recibir pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">MercadoPago</h3>
                        <p className="text-sm text-gray-600">Estado: No vinculado</p>
                      </div>
                      <Button>Vincular Cuenta</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comisión de la App (%)</Label>
                    <Input type="number" placeholder="5" />
                    <p className="text-xs text-gray-600">
                      Porcentaje que se descontará del total de cada venta
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Organización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Nombre de la Organización</Label>
                      <Input id="orgName" placeholder="Mi Empresa de Eventos" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de Contacto</Label>
                      <Input id="email" type="email" placeholder="contacto@empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" placeholder="+54 11 1234-5678" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT</Label>
                      <Input id="cuit" placeholder="20-12345678-9" />
                    </div>
                  </div>
                  <Button>Guardar Cambios</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
