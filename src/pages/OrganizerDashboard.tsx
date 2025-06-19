import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Users, DollarSign, Settings, Gift, Key, Edit, Ticket, Mail, Link, BarChart } from 'lucide-react';
import { toast } from 'sonner';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showCourtesy, setShowCourtesy] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: '',
    eventNumber: '',
    accessKey: ''
  });

  const [newTicket, setNewTicket] = useState({
    name: '',
    price: '',
    quantity: '',
    validFrom: '',
    validTo: '',
    status: 'active',
    requiresAuth: false,
    authCode: '',
    isCourtesy: false
  });

  const [courtesyData, setCourtesyData] = useState({
    eventId: '',
    ticketType: '',
    recipientType: 'email',
    email: '',
    dni: ''
  });

  // Mock data - eventos del organizador
  const [myEvents, setMyEvents] = useState([
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
      eventNumber: 'EVT001',
      accessKey: 'rock2024',
      tickets: [
        { id: 1, type: 'General', price: 15000, sold: 3000, total: 4500, status: 'active', requiresAuth: false, isCourtesy: false },
        { id: 2, type: 'VIP', price: 35000, sold: 250, total: 500, status: 'active', requiresAuth: true, authCode: 'VIP2024', isCourtesy: false },
        { id: 3, type: 'Invitados Especiales', price: 0, sold: 0, total: 50, status: 'hidden', requiresAuth: false, isCourtesy: true }
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
      eventNumber: 'EVT002',
      accessKey: 'jazz2024',
      tickets: [
        { id: 4, type: 'Pase Diario', price: 8000, sold: 300, total: 300, status: 'sold_out', requiresAuth: false, isCourtesy: false },
        { id: 5, type: 'Pase Completo', price: 20000, sold: 150, total: 400, status: 'active', requiresAuth: true, authCode: 'JAZZFULL24', isCourtesy: false },
        { id: 6, type: 'Prensa', price: 0, sold: 0, total: 20, status: 'hidden', requiresAuth: false, isCourtesy: true }
      ]
    }
  ]);

  const generateEventNumber = () => {
    return 'EVT' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const generateAccessKey = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.description || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast.error('Por favor, completa todos los campos obligatorios');
      return;
    }

    const eventNumber = generateEventNumber();
    const accessKey = newEvent.accessKey || generateAccessKey();

    const event = {
      id: myEvents.length + 1,
      ...newEvent,
      eventNumber,
      accessKey,
      capacity: 0,
      soldTickets: 0,
      revenue: 0,
      status: 'Activo',
      tickets: []
    };

    setMyEvents([...myEvents, event]);
    toast.success('Evento creado exitosamente');
    setShowCreateEvent(false);
    setNewEvent({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      image: '',
      eventNumber: '',
      accessKey: ''
    });
  };

  const handleCreateTicket = () => {
    if (!newTicket.name || (!newTicket.isCourtesy && !newTicket.price) || (!newTicket.isCourtesy && !newTicket.quantity)) {
      toast.error('Por favor, completa todos los campos obligatorios');
      return;
    }

    const ticket = {
      id: Date.now(),
      type: newTicket.name,
      price: newTicket.isCourtesy ? 0 : parseInt(newTicket.price),
      total: parseInt(newTicket.quantity || '0'),
      sold: 0,
      status: newTicket.isCourtesy ? 'hidden' : newTicket.status,
      requiresAuth: newTicket.requiresAuth,
      authCode: newTicket.authCode,
      validFrom: newTicket.validFrom,
      validTo: newTicket.validTo,
      isCourtesy: newTicket.isCourtesy
    };

    // Actualizar el evento seleccionado
    setMyEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? { ...event, tickets: [...event.tickets, ticket] }
        : event
    ));

    toast.success('Tipo de ticket creado exitosamente');
    setShowCreateTicket(false);
    setNewTicket({
      name: '',
      price: '',
      quantity: '',
      validFrom: '',
      validTo: '',
      status: 'active',
      requiresAuth: false,
      authCode: '',
      isCourtesy: false
    });
  };

  const handleSendCourtesy = () => {
    if (!courtesyData.eventId || !courtesyData.ticketType) {
      toast.error('Selecciona evento y tipo de ticket');
      return;
    }

    if (courtesyData.recipientType === 'email' && !courtesyData.email) {
      toast.error('Ingresa el email del invitado');
      return;
    }

    if (courtesyData.recipientType === 'dni' && !courtesyData.dni) {
      toast.error('Ingresa el DNI del invitado');
      return;
    }

    toast.success('Cortesía enviada exitosamente');
    setShowCourtesy(false);
    setCourtesyData({
      eventId: '',
      ticketType: '',
      recipientType: 'email',
      email: '',
      dni: ''
    });
  };

  const copyEventLink = (eventId) => {
    const eventLink = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(eventLink);
    toast.success('Link del evento copiado al portapapeles');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'sold_out':
        return <Badge variant="destructive" className="bg-red-600/20 text-red-400 border-red-600/30">Agotado</Badge>;
      case 'hidden':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Cortesía</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Accoro
              </h1>
              <Badge variant="secondary" className="ml-3 bg-green-600/20 text-green-400 border-green-600/30">
                Organizador
              </Badge>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="events" className="data-[state=active]:bg-primary">Eventos</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Mis Eventos</h2>
              <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription>
                      Completa la información de tu evento
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Evento *</Label>
                        <Input
                          id="name"
                          value={newEvent.name}
                          onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                          placeholder="Concierto de Rock"
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación *</Label>
                        <Input
                          id="location"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                          placeholder="Estadio Luna Park"
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Fecha *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Hora *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Imagen (URL)</Label>
                        <Input
                          id="image"
                          type="url"
                          value={newEvent.image}
                          onChange={(e) => setNewEvent({...newEvent, image: e.target.value})}
                          placeholder="https://..."
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accessKey">Clave de Acceso</Label>
                        <Input
                          id="accessKey"
                          value={newEvent.accessKey}
                          onChange={(e) => setNewEvent({...newEvent, accessKey: e.target.value})}
                          placeholder="Se generará automáticamente"
                          className="bg-secondary/50 border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción *</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        placeholder="Descripción del evento..."
                        rows={3}
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateEvent(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEvent} className="bg-primary hover:bg-primary/90">
                      Crear Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myEvents.map((event) => (
                <Card key={event.id} className="card-gradient startup-shadow border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{event.name}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <Badge variant={event.status === 'Activo' ? 'default' : 'secondary'} className="bg-primary/20 text-primary border-primary/30">
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {event.date} - {event.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          {event.soldTickets}/{event.capacity || 'Sin límite'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">N° Evento:</span>
                          <span className="font-mono ml-1">{event.eventNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clave:</span>
                          <span className="font-mono ml-1">{event.accessKey}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-semibold">${event.revenue.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowTickets(true);
                          }}
                          className="border-border hover:bg-secondary"
                        >
                          <Ticket className="h-4 w-4 mr-1" />
                          Tickets
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            setCourtesyData({...courtesyData, eventId: String(event.id)});
                            setShowCourtesy(true);
                          }}
                          className="border-border hover:bg-secondary"
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Cortesía
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowStats(true);
                          }}
                          className="border-border hover:bg-secondary"
                        >
                          <BarChart className="h-4 w-4 mr-1" />
                          Estadísticas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyEventLink(event.id)}
                          className="border-border hover:bg-secondary"
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-border hover:bg-secondary col-span-2"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Editar Evento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tickets Dialog */}
            <Dialog open={showTickets} onOpenChange={setShowTickets}>
              <DialogContent className="max-w-4xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Gestión de Tickets - {selectedEvent?.name}</DialogTitle>
                  <DialogDescription>
                    Administra los tipos de tickets para este evento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Tipo de Ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Crear Tipo de Ticket</DialogTitle>
                          <DialogDescription>
                            Para el evento: {selectedEvent?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isCourtesy"
                                checked={newTicket.isCourtesy}
                                onChange={(e) => setNewTicket({...newTicket, isCourtesy: e.target.checked})}
                                className="rounded border-border"
                              />
                              <Label htmlFor="isCourtesy">Ticket de cortesía</Label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ticketName">Nombre del Ticket *</Label>
                              <Input
                                id="ticketName"
                                value={newTicket.name}
                                onChange={(e) => setNewTicket({...newTicket, name: e.target.value})}
                                placeholder="General, VIP, etc."
                                className="bg-secondary/50 border-border"
                              />
                            </div>
                            {!newTicket.isCourtesy && (
                              <div className="space-y-2">
                                <Label htmlFor="ticketPrice">Precio *</Label>
                                <Input
                                  id="ticketPrice"
                                  type="number"
                                  value={newTicket.price}
                                  onChange={(e) => setNewTicket({...newTicket, price: e.target.value})}
                                  placeholder="15000"
                                  className="bg-secondary/50 border-border"
                                />
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ticketQuantity">Cantidad Disponible</Label>
                              <Input
                                id="ticketQuantity"
                                type="number"
                                value={newTicket.quantity}
                                onChange={(e) => setNewTicket({...newTicket, quantity: e.target.value})}
                                placeholder="100"
                                className="bg-secondary/50 border-border"
                              />
                            </div>
                            {!newTicket.isCourtesy && (
                              <div className="space-y-2">
                                <Label htmlFor="ticketStatus">Estado</Label>
                                <select
                                  id="ticketStatus"
                                  value={newTicket.status}
                                  onChange={(e) => setNewTicket({...newTicket, status: e.target.value})}
                                  className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
                                >
                                  <option value="active">Activo</option>
                                  <option value="inactive">Inactivo</option>
                                  <option value="sold_out">Agotado</option>
                                </select>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="validFrom">Válido desde</Label>
                              <Input
                                id="validFrom"
                                type="datetime-local"
                                value={newTicket.validFrom}
                                onChange={(e) => setNewTicket({...newTicket, validFrom: e.target.value})}
                                className="bg-secondary/50 border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="validTo">Válido hasta</Label>
                              <Input
                                id="validTo"
                                type="datetime-local"
                                value={newTicket.validTo}
                                onChange={(e) => setNewTicket({...newTicket, validTo: e.target.value})}
                                className="bg-secondary/50 border-border"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="requiresAuth"
                                checked={newTicket.requiresAuth}
                                onChange={(e) => setNewTicket({...newTicket, requiresAuth: e.target.checked})}
                                className="rounded border-border"
                              />
                              <Label htmlFor="requiresAuth">Requiere código de autorización</Label>
                            </div>
                            {newTicket.requiresAuth && (
                              <Input
                                placeholder="Código de autorización"
                                value={newTicket.authCode}
                                onChange={(e) => setNewTicket({...newTicket, authCode: e.target.value})}
                                className="bg-secondary/50 border-border"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateTicket} className="bg-primary hover:bg-primary/90">
                            Crear Ticket
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Tipo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Vendidos/Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Auth</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvent?.tickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-border">
                          <TableCell className="font-medium">{ticket.type}</TableCell>
                          <TableCell>{ticket.isCourtesy ? 'Gratis' : `$${ticket.price.toLocaleString()}`}</TableCell>
                          <TableCell>{ticket.sold}/{ticket.total}</TableCell>
                          <TableCell>
                            {getStatusBadge(ticket.status)}
                          </TableCell>
                          <TableCell>
                            {ticket.requiresAuth ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                {ticket.authCode}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="border-border">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

            {/* Courtesy Dialog */}
            <Dialog open={showCourtesy} onOpenChange={setShowCourtesy}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Enviar Ticket de Cortesía</DialogTitle>
                  <DialogDescription>
                    Para el evento: {selectedEvent?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courtesyTicket">Tipo de Ticket</Label>
                    <select
                      id="courtesyTicket"
                      value={courtesyData.ticketType}
                      onChange={(e) => setCourtesyData({...courtesyData, ticketType: e.target.value})}
                      className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar tipo</option>
                      {selectedEvent?.tickets.filter(ticket => ticket.isCourtesy).map((ticket) => (
                        <option key={ticket.id} value={ticket.type}>
                          {ticket.type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de identificación</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="email"
                          checked={courtesyData.recipientType === 'email'}
                          onChange={(e) => setCourtesyData({...courtesyData, recipientType: e.target.value})}
                          className="text-primary"
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="dni"
                          checked={courtesyData.recipientType === 'dni'}
                          onChange={(e) => setCourtesyData({...courtesyData, recipientType: e.target.value})}
                          className="text-primary"
                        />
                        <span>DNI</span>
                      </label>
                    </div>
                  </div>
                  {courtesyData.recipientType === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="courtesyEmail">Email del invitado</Label>
                      <Input
                        id="courtesyEmail"
                        type="email"
                        value={courtesyData.email}
                        onChange={(e) => setCourtesyData({...courtesyData, email: e.target.value})}
                        placeholder="invitado@email.com"
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="courtesyDni">DNI del invitado</Label>
                      <Input
                        id="courtesyDni"
                        value={courtesyData.dni}
                        onChange={(e) => setCourtesyData({...courtesyData, dni: e.target.value})}
                        placeholder="12345678"
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCourtesy(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSendCourtesy} className="bg-primary hover:bg-primary/90">
                    Enviar Cortesía
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Statistics Dialog */}
            <Dialog open={showStats} onOpenChange={setShowStats}>
              <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Estadísticas - {selectedEvent?.name}</DialogTitle>
                  <DialogDescription>
                    Reportes y métricas del evento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="card-gradient startup-shadow border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedEvent?.soldTickets || 0}</div>
                        <p className="text-xs text-muted-foreground">Total de entradas</p>
                      </CardContent>
                    </Card>
                    <Card className="card-gradient startup-shadow border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${selectedEvent?.revenue.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">Total recaudado</p>
                      </CardContent>
                    </Card>
                    <Card className="card-gradient startup-shadow border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipos de Ticket</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedEvent?.tickets.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Categorías disponibles</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Ventas por tipo de ticket</h4>
                    {selectedEvent?.tickets.filter(ticket => !ticket.isCourtesy).map((ticket) => (
                      <div key={ticket.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                        <div>
                          <span className="font-medium">{ticket.type}</span>
                          <div className="text-sm text-muted-foreground">
                            ${ticket.price.toLocaleString()} c/u
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{ticket.sold}/{ticket.total}</div>
                          <div className="text-sm text-muted-foreground">
                            ${(ticket.sold * ticket.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card className="card-gradient startup-shadow border-border/50">
                <CardHeader>
                  <CardTitle>Información de la Organización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Nombre de la Organización</Label>
                      <Input id="orgName" placeholder="Mi Empresa de Eventos" className="bg-secondary/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de Contacto</Label>
                      <Input id="email" type="email" placeholder="contacto@empresa.com" className="bg-secondary/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" placeholder="+54 11 1234-5678" className="bg-secondary/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT</Label>
                      <Input id="cuit" placeholder="20-12345678-9" className="bg-secondary/50 border-border" />
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
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
