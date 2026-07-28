import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar, Ticket, Copy, LogOut, Loader2, DollarSign, Users, Wallet, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import cupoLogo from '@/assets/cupo-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type EventRow = {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  event_number: string;
  access_key: string;
  is_public: boolean;
  status: string;
};

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number | null;
  quantity_sold: number;
  status: string;
  is_courtesy: boolean;
};

const genCode = (prefix = '', len = 6) => prefix + Math.random().toString(36).slice(2, 2 + len).toUpperCase();

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeRow[]>([]);
  const [mpConnected, setMpConnected] = useState(false);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState<null | string>(null);
  const [saving, setSaving] = useState(false);

  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', time: '', location: '' });
  const [newTicket, setNewTicket] = useState({ name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '' });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: evs }, { data: profile }] = await Promise.all([
      supabase.from('events').select('*').eq('organizer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('mp_access_token').eq('id', user.id).maybeSingle(),
    ]);
    setEvents((evs ?? []) as EventRow[]);
    setMpConnected(!!profile?.mp_access_token);
    if (evs && evs.length) {
      const ids = evs.map((e: any) => e.id);
      const { data: tts } = await supabase.from('ticket_types').select('*').in('event_id', ids);
      setTicketTypes((tts ?? []) as TicketTypeRow[]);
    } else {
      setTicketTypes([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast.error('Completá nombre, fecha, hora y lugar');
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('events').insert({
      organizer_id: user.id,
      name: newEvent.name,
      description: newEvent.description || null,
      event_date: newEvent.date,
      event_time: newEvent.time,
      location: newEvent.location,
      event_number: genCode('EVT', 6),
      access_key: genCode('', 8).toLowerCase(),
      is_public: true,
      status: 'active',
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Evento creado');
    setShowCreateEvent(false);
    setNewEvent({ name: '', description: '', date: '', time: '', location: '' });
    load();
  };

  const handleCreateTicket = async () => {
    if (!showCreateTicket) return;
    if (!newTicket.name) { toast.error('Ingresá el nombre del ticket'); return; }
    setSaving(true);
    const code = newTicket.auth_code.trim();
    const { error } = await supabase.from('ticket_types').insert({
      event_id: showCreateTicket,
      name: newTicket.name,
      description: newTicket.description || null,
      price: newTicket.is_courtesy ? 0 : Number(newTicket.price || 0),
      quantity_total: newTicket.quantity ? Number(newTicket.quantity) : null,
      quantity_sold: 0,
      is_courtesy: newTicket.is_courtesy,
      status: 'active',
      authorization_code: code || null,
      requires_auth_code: !!code,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Ticket creado');
    setShowCreateTicket(null);
    setNewTicket({ name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '' });
    load();
  };

  const handleConnectMP = async () => {
    const { data, error } = await supabase.functions.invoke('mp-oauth-start');
    if (error || !(data as any)?.url) {
      toast.error((data as any)?.error ?? error?.message ?? 'No se pudo iniciar');
      return;
    }
    window.location.href = (data as any).url;
  };

  const copyEventLink = (ev: EventRow) => {
    const url = `${window.location.origin}/event/${ev.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const ticketStatus = (t: TicketTypeRow) => {
    if (t.status !== 'active') return t.status === 'inactive' ? 'Inactivo' : 'Oculto';
    if (t.quantity_total !== null && t.quantity_sold >= t.quantity_total) return 'Agotado';
    return 'Activo';
  };

  const eventStats = (evId: string) => {
    const tts = ticketTypes.filter((t) => t.event_id === evId);
    const sold = tts.reduce((a, t) => a + t.quantity_sold, 0);
    const revenue = tts.reduce((a, t) => a + t.quantity_sold * Number(t.price), 0);
    const total = tts.reduce((a, t) => a + (t.quantity_total ?? 0), 0);
    return { sold, revenue, total };
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="glass-card border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cupoLogo} alt="Cupo" className="h-9 w-auto" />
            <div>
              <h1 className="font-display font-bold text-lg">Panel Organizador</h1>
              <p className="text-xs text-muted-foreground">Gestioná tus eventos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/welcome')} className="rounded-full">Inicio</Button>
            <Button variant="ghost" onClick={async () => { await signOut(); navigate('/'); }} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* MP status */}
        <Card className="glass-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mpConnected ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                {mpConnected ? <CheckCircle2 className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">MercadoPago</p>
                <p className="text-xs text-muted-foreground">
                  {mpConnected ? 'Conectado — vas a recibir los pagos en tu cuenta' : 'Conectá tu cuenta para recibir pagos'}
                </p>
              </div>
            </div>
            {!mpConnected && (
              <Button onClick={handleConnectMP} className="rounded-full brand-gradient-bg text-primary-foreground">
                Conectar MercadoPago
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">Mis eventos</h2>
          <Button onClick={() => setShowCreateEvent(true)} className="rounded-full brand-gradient-bg text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Crear evento
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              Todavía no creaste ningún evento. Empezá creando el primero.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5">
            {events.map((ev) => {
              const stats = eventStats(ev.id);
              const tts = ticketTypes.filter((t) => t.event_id === ev.id);
              return (
                <Card key={ev.id} className="glass-card rounded-2xl border-border/60">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="font-display">{ev.name}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ev.event_date} {ev.event_time}</span>
                          <span>{ev.location}</span>
                          <Badge variant="secondary">N° {ev.event_number}</Badge>
                          <Badge variant="outline">Clave: {ev.access_key}</Badge>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyEventLink(ev)} className="rounded-full">
                        <Copy className="h-3 w-3 mr-1" /> Link del evento
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/40">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Vendidos</p>
                        <p className="text-lg font-bold">{stats.sold}{stats.total ? ` / ${stats.total}` : ''}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Ingresos</p>
                        <p className="text-lg font-bold">${stats.revenue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> Tipos</p>
                        <p className="text-lg font-bold">{tts.length}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">Tickets</p>
                        <Button size="sm" variant="outline" onClick={() => setShowCreateTicket(ev.id)} className="rounded-full">
                          <Plus className="h-3 w-3 mr-1" /> Agregar
                        </Button>
                      </div>
                      {tts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin tickets configurados aún.</p>
                      ) : (
                        <div className="space-y-2">
                          {tts.map((t) => {
                            const status = ticketStatus(t);
                            return (
                              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                                <div>
                                  <p className="font-medium">
                                    {t.name}
                                    {t.is_courtesy && <Badge className="ml-2" variant="secondary">Cortesía</Badge>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.is_courtesy ? 'Sin costo' : `$${Number(t.price).toLocaleString()}`} · Vendidos: {t.quantity_sold}{t.quantity_total ? `/${t.quantity_total}` : ''}
                                  </p>
                                </div>
                                <Badge variant={status === 'Agotado' ? 'destructive' : status === 'Activo' ? 'default' : 'secondary'}>
                                  {status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create event */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Crear evento</DialogTitle>
            <DialogDescription>Completá los datos básicos. Podés editar el resto luego.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} className="rounded-2xl" /></div>
            <div><Label>Descripción</Label><Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="rounded-2xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha *</Label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="rounded-2xl" /></div>
              <div><Label>Hora *</Label><Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="rounded-2xl" /></div>
            </div>
            <div><Label>Lugar *</Label><Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="rounded-2xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateEvent(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={handleCreateEvent} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create ticket */}
      <Dialog open={!!showCreateTicket} onOpenChange={(o) => !o && setShowCreateTicket(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nuevo tipo de ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={newTicket.name} onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })} className="rounded-2xl" /></div>
            <div><Label>Descripción</Label><Input value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="rounded-2xl" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newTicket.is_courtesy} onChange={(e) => setNewTicket({ ...newTicket, is_courtesy: e.target.checked })} />
              Ticket de cortesía (sin precio, oculto al público)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Precio</Label><Input type="number" disabled={newTicket.is_courtesy} value={newTicket.price} onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })} className="rounded-2xl" /></div>
              <div><Label>Stock</Label><Input type="number" value={newTicket.quantity} onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })} className="rounded-2xl" /></div>
            </div>
            <div>
              <Label>Código de autorización (opcional)</Label>
              <Input value={newTicket.auth_code} onChange={(e) => setNewTicket({ ...newTicket, auth_code: e.target.value })} placeholder="Ej: PRENSA2025" className="rounded-2xl" />
              <p className="text-xs text-muted-foreground mt-1">Si lo activás, solo quienes ingresen este código podrán comprar el ticket (ideal para prensa, VIP, invitados).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateTicket(null)} className="rounded-full">Cancelar</Button>
            <Button onClick={handleCreateTicket} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerDashboard;
