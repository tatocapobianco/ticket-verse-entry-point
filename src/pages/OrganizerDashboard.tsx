import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Calendar, Ticket, Copy, LogOut, Loader2, DollarSign, Users, Wallet, CheckCircle2, MoreVertical, Gift, LinkIcon, BarChart3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import cupoLogo from '@/assets/cupo-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type EventRow = {
  id: string; name: string; description: string | null;
  event_date: string | null; event_time: string | null; location: string | null;
  event_number: string; access_key: string; is_public: boolean; status: string;
};
type TicketTypeRow = {
  id: string; event_id: string; name: string; description: string | null;
  price: number; quantity_total: number | null; quantity_sold: number;
  status: string; is_courtesy: boolean;
};
type CourtesyLinkRow = {
  id: string; event_id: string; ticket_type_id: string; code: string;
  max_uses: number; uses_count: number; is_active: boolean; expires_at: string | null;
  label: string | null;
};

const genCode = (prefix = '', len = 6) => prefix + Math.random().toString(36).slice(2, 2 + len).toUpperCase();

type PanelKind = null | 'tickets' | 'courtesy' | 'links' | 'stats';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeRow[]>([]);
  const [courtesyLinks, setCourtesyLinks] = useState<CourtesyLinkRow[]>([]);
  const [scannedByTicket, setScannedByTicket] = useState<Record<string, number>>({});
  const [courtesyByTicket, setCourtesyByTicket] = useState<Record<string, number>>({});
  const [mpConnected, setMpConnected] = useState(false);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState<null | string>(null);
  const [saving, setSaving] = useState(false);

  const [panel, setPanel] = useState<PanelKind>(null);
  const [panelEvent, setPanelEvent] = useState<EventRow | null>(null);

  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', time: '', location: '', is_public: true, status: 'active' });
  const [newTicket, setNewTicket] = useState({ name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '' });
  const [newCourtesy, setNewCourtesy] = useState({ ticket_type_id: '', quantity: '1', label: '' });
  const [newLink, setNewLink] = useState({ ticket_type_id: '', max_uses: '10' });

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
      const [{ data: tts }, { data: cls }, { data: courtesyTickets }, { data: scans }] = await Promise.all([
        supabase.from('ticket_types').select('*').in('event_id', ids),
        supabase.from('courtesy_links').select('*').in('event_id', ids).order('created_at', { ascending: false }),
        supabase.from('tickets').select('ticket_type_id, id').in('event_id', ids).eq('source', 'courtesy'),
        supabase.from('tickets').select('ticket_type_id, id').in('event_id', ids).eq('source', 'courtesy').eq('status', 'used'),
      ]);
      setTicketTypes((tts ?? []) as TicketTypeRow[]);
      setCourtesyLinks((cls ?? []) as CourtesyLinkRow[]);
      const cMap: Record<string, number> = {};
      (courtesyTickets ?? []).forEach((t: any) => { cMap[t.ticket_type_id] = (cMap[t.ticket_type_id] || 0) + 1; });
      setCourtesyByTicket(cMap);
      const sMap: Record<string, number> = {};
      (scans ?? []).forEach((t: any) => { sMap[t.ticket_type_id] = (sMap[t.ticket_type_id] || 0) + 1; });
      setScannedByTicket(sMap);
    } else {
      setTicketTypes([]); setCourtesyLinks([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast.error('Completá nombre, fecha, hora y lugar'); return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('events').insert({
      organizer_id: user.id, name: newEvent.name, description: newEvent.description || null,
      event_date: newEvent.date, event_time: newEvent.time, location: newEvent.location,
      event_number: genCode('EVT', 6), access_key: genCode('', 8).toLowerCase(),
      is_public: newEvent.is_public, status: newEvent.status,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Evento creado');
    setShowCreateEvent(false);
    setNewEvent({ name: '', description: '', date: '', time: '', location: '', is_public: true, status: 'active' });
    load();
  };

  const handleCreateTicket = async () => {
    if (!showCreateTicket) return;
    if (!newTicket.name) { toast.error('Ingresá el nombre del ticket'); return; }
    setSaving(true);
    const code = newTicket.auth_code.trim();
    const { error } = await supabase.from('ticket_types').insert({
      event_id: showCreateTicket, name: newTicket.name, description: newTicket.description || null,
      price: newTicket.is_courtesy ? 0 : Number(newTicket.price || 0),
      quantity_total: newTicket.quantity ? Number(newTicket.quantity) : null,
      quantity_sold: 0, is_courtesy: newTicket.is_courtesy, status: 'active',
      authorization_code: code || null, requires_auth_code: !!code,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Ticket creado');
    setShowCreateTicket(null);
    setNewTicket({ name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '' });
    await load();
  };

  const toggleEventVisibility = async (ev: EventRow) => {
    const { error } = await supabase.from('events').update({ is_public: !ev.is_public }).eq('id', ev.id);
    if (error) return toast.error(error.message);
    toast.success(!ev.is_public ? 'Evento público' : 'Evento privado');
    load();
  };
  const toggleEventStatus = async (ev: EventRow) => {
    const newStatus = ev.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', ev.id);
    if (error) return toast.error(error.message);
    toast.success(newStatus === 'active' ? 'Evento activo' : 'Evento inactivo');
    load();
  };

  const handleConnectMP = async () => {
    const { data, error } = await supabase.functions.invoke('mp-oauth-start');
    if (error || !(data as any)?.url) {
      toast.error((data as any)?.error ?? error?.message ?? 'No se pudo iniciar'); return;
    }
    window.location.href = (data as any).url;
  };

  const copyEventLink = (ev: EventRow) => {
    const url = `${window.location.origin}/evento/${ev.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const createCourtesy = async () => {
    if (!panelEvent || !user) return;
    if (!newCourtesy.ticket_type_id) return toast.error('Elegí un tipo de ticket');
    const qty = Math.max(1, Number(newCourtesy.quantity || 1));
    setSaving(true);
    const code = genCode('CX', 8);
    const { error } = await supabase.from('courtesy_links').insert({
      event_id: panelEvent.id, ticket_type_id: newCourtesy.ticket_type_id,
      code, max_uses: qty, created_by: user.id, is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/cortesia/${code}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Cortesía creada — link copiado');
    setNewCourtesy({ ticket_type_id: '', quantity: '1', label: '' });
    load();
  };

  const createLink = async () => {
    if (!panelEvent || !user) return;
    if (!newLink.ticket_type_id) return toast.error('Elegí un tipo de ticket');
    const uses = Math.max(1, Number(newLink.max_uses || 1));
    setSaving(true);
    const code = genCode('LX', 8);
    const { error } = await supabase.from('courtesy_links').insert({
      event_id: panelEvent.id, ticket_type_id: newLink.ticket_type_id,
      code, max_uses: uses, created_by: user.id, is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/cortesia/${code}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Link creado — copiado al portapapeles');
    setNewLink({ ticket_type_id: '', max_uses: '10' });
    load();
  };

  const revokeCourtesy = async (id: string) => {
    const { error } = await supabase.from('courtesy_links').update({ is_active: false }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Revocado'); load();
  };

  const copyCourtesyLink = (code: string) => {
    const url = `${window.location.origin}/cortesia/${code}`;
    navigator.clipboard.writeText(url); toast.success('Link copiado');
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

  const panelTickets = useMemo(() => panelEvent ? ticketTypes.filter(t => t.event_id === panelEvent.id) : [], [panelEvent, ticketTypes]);
  const panelLinks = useMemo(() => panelEvent ? courtesyLinks.filter(l => l.event_id === panelEvent.id) : [], [panelEvent, courtesyLinks]);

  const openPanel = (ev: EventRow, kind: PanelKind) => { setPanelEvent(ev); setPanel(kind); };
  const closePanel = () => { setPanel(null); setPanelEvent(null); };

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
        <Card className="glass-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mpConnected ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                {mpConnected ? <CheckCircle2 className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">MercadoPago</p>
                <p className="text-xs text-muted-foreground">
                  {mpConnected ? 'Conectado — vas a recibir los pagos en tu cuenta' : 'Opcional: conectá tu cuenta para recibir pagos. Podés seguir usando la app sin conectarla.'}
                </p>
              </div>
            </div>
            <Button onClick={handleConnectMP} variant={mpConnected ? 'outline' : 'default'} className={`rounded-full ${mpConnected ? '' : 'brand-gradient-bg text-primary-foreground'}`}>
              {mpConnected ? 'Reconectar' : 'Conectar MercadoPago'}
            </Button>
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
                        <CardTitle className="font-display flex items-center gap-2 flex-wrap">
                          {ev.name}
                          {ev.status !== 'active' && <Badge variant="secondary">Inactivo</Badge>}
                          {!ev.is_public && <Badge variant="outline">Privado</Badge>}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ev.event_date} {ev.event_time}</span>
                          <span>{ev.location}</span>
                          <Badge variant="secondary">N° {ev.event_number}</Badge>
                          <Badge variant="outline">Clave: {ev.access_key}</Badge>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-full">
                            <MoreVertical className="h-4 w-4 mr-1" /> Opciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => openPanel(ev, 'tickets')}><Ticket className="h-4 w-4 mr-2" /> Tickets</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPanel(ev, 'courtesy')}><Gift className="h-4 w-4 mr-2" /> Cortesías</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPanel(ev, 'links')}><LinkIcon className="h-4 w-4 mr-2" /> Links únicos</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPanel(ev, 'stats')}><BarChart3 className="h-4 w-4 mr-2" /> Estadísticas</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyEventLink(ev)}><Copy className="h-4 w-4 mr-2" /> Link del evento</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleEventVisibility(ev)}>
                            {ev.is_public ? 'Hacer privado' : 'Hacer público'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleEventStatus(ev)}>
                            {ev.status === 'active' ? 'Pausar (inactivo)' : 'Activar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
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
            <DialogDescription>Completá los datos básicos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} className="rounded-2xl" /></div>
            <div><Label>Descripción</Label><Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="rounded-2xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha *</Label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="rounded-2xl" /></div>
              <div><Label>Hora *</Label><Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="rounded-2xl" /></div>
            </div>
            <div><Label>Lugar *</Label><Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="rounded-2xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Visibilidad</Label>
                <select value={newEvent.is_public ? 'public' : 'private'} onChange={(e) => setNewEvent({ ...newEvent, is_public: e.target.value === 'public' })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                  <option value="public">Público</option><option value="private">Privado</option>
                </select>
              </div>
              <div>
                <Label>Estado</Label>
                <select value={newEvent.status} onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                  <option value="active">Activo</option><option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
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
          <DialogHeader><DialogTitle className="font-display">Nuevo tipo de ticket</DialogTitle></DialogHeader>
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

      {/* Panel modal */}
      <Dialog open={!!panel} onOpenChange={(o) => !o && closePanel()}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto">
          {panelEvent && panel === 'tickets' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2"><Ticket className="h-5 w-5" /> Tickets · {panelEvent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Button onClick={() => setShowCreateTicket(panelEvent.id)} className="rounded-full brand-gradient-bg text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Agregar tipo
                </Button>
                {panelTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin tickets configurados aún.</p>
                ) : panelTickets.map((t) => {
                  const status = ticketStatus(t);
                  return (
                    <div key={t.id} className="p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{t.name}{t.is_courtesy && <Badge className="ml-2" variant="secondary">Cortesía</Badge>}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.is_courtesy ? 'Sin costo' : `$${Number(t.price).toLocaleString()}`} · Vendidos: {t.quantity_sold}{t.quantity_total ? `/${t.quantity_total}` : ''}
                          </p>
                        </div>
                        <Badge variant={status === 'Agotado' ? 'destructive' : status === 'Activo' ? 'default' : 'secondary'}>{status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {panelEvent && panel === 'courtesy' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2"><Gift className="h-5 w-5" /> Cortesías · {panelEvent.name}</DialogTitle>
                <DialogDescription>Generá un link único de cortesía para compartir por WhatsApp o mail.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/30 space-y-3">
                  <div>
                    <Label>Tipo de ticket</Label>
                    <select value={newCourtesy.ticket_type_id} onChange={(e) => setNewCourtesy({ ...newCourtesy, ticket_type_id: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="">— Elegí —</option>
                      {panelTickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cantidad</Label><Input type="number" min={1} value={newCourtesy.quantity} onChange={(e) => setNewCourtesy({ ...newCourtesy, quantity: e.target.value })} className="rounded-2xl" /></div>
                    <div><Label>Nombre (opcional)</Label><Input value={newCourtesy.label} onChange={(e) => setNewCourtesy({ ...newCourtesy, label: e.target.value })} placeholder="Ej: Familia López" className="rounded-2xl" /></div>
                  </div>
                  <Button onClick={createCourtesy} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generar link'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Cortesías enviadas</p>
                  {panelLinks.length === 0 ? <p className="text-sm text-muted-foreground">Sin cortesías aún.</p> : panelLinks.map(l => {
                    const t = panelTickets.find(x => x.id === l.ticket_type_id);
                    const done = l.uses_count >= l.max_uses || !l.is_active;
                    return (
                      <div key={l.id} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-medium">{t?.name || 'Ticket'} — {l.uses_count}/{l.max_uses} usos</p>
                          <p className="text-xs text-muted-foreground font-mono">/cortesia/{l.code}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={done ? 'secondary' : 'default'}>{done ? 'Agotado' : 'Activo'}</Badge>
                          <Button size="sm" variant="outline" onClick={() => copyCourtesyLink(l.code)} className="rounded-full"><Copy className="h-3 w-3" /></Button>
                          {l.is_active && <Button size="sm" variant="ghost" onClick={() => revokeCourtesy(l.id)} className="rounded-full text-destructive">Revocar</Button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {panelEvent && panel === 'links' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Links únicos · {panelEvent.name}</DialogTitle>
                <DialogDescription>Link con límite total de usos compartido.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/30 space-y-3">
                  <div>
                    <Label>Tipo de ticket</Label>
                    <select value={newLink.ticket_type_id} onChange={(e) => setNewLink({ ...newLink, ticket_type_id: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="">— Elegí —</option>
                      {panelTickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div><Label>Cantidad máxima de usos</Label><Input type="number" min={1} value={newLink.max_uses} onChange={(e) => setNewLink({ ...newLink, max_uses: e.target.value })} className="rounded-2xl" /></div>
                  <Button onClick={createLink} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generar link'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Links generados</p>
                  {panelLinks.filter(l => l.max_uses > 1).length === 0 ? <p className="text-sm text-muted-foreground">Aún no generaste links.</p> :
                    panelLinks.filter(l => l.max_uses > 1).map(l => {
                      const t = panelTickets.find(x => x.id === l.ticket_type_id);
                      const remaining = l.max_uses - l.uses_count;
                      const done = remaining <= 0 || !l.is_active;
                      return (
                        <div key={l.id} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-medium">{t?.name || 'Ticket'}</p>
                            <p className="text-xs text-muted-foreground">Usados: {l.uses_count} · Disponibles: {Math.max(0, remaining)}</p>
                            <p className="text-xs font-mono text-muted-foreground">/cortesia/{l.code}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={done ? 'secondary' : 'default'}>{done ? 'Agotado' : 'Activo'}</Badge>
                            <Button size="sm" variant="outline" onClick={() => copyCourtesyLink(l.code)} className="rounded-full"><Copy className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </>
          )}

          {panelEvent && panel === 'stats' && (() => {
            const rows = panelTickets.map(t => {
              const sent = courtesyByTicket[t.id] || 0;
              const scanned = scannedByTicket[t.id] || 0;
              const total = t.quantity_total ?? 0;
              const overflow = total > 0 && (t.quantity_sold + sent) > total;
              return { t, sent, scanned, total, overflow };
            });
            const totSold = rows.reduce((a, r) => a + r.t.quantity_sold, 0);
            const totRev = rows.reduce((a, r) => a + r.t.quantity_sold * Number(r.t.price), 0);
            const totSent = rows.reduce((a, r) => a + r.sent, 0);
            const totScan = rows.reduce((a, r) => a + r.scanned, 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Estadísticas · {panelEvent.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {rows.map(({ t, sent, scanned, total, overflow }) => (
                    <div key={t.id} className="p-4 rounded-2xl bg-secondary/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{t.name}</p>
                        {overflow && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Excede stock</Badge>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div><p className="text-muted-foreground">Vendidas</p><p className="font-bold text-sm">{t.quantity_sold}</p></div>
                        <div><p className="text-muted-foreground">Ingresos</p><p className="font-bold text-sm">${(t.quantity_sold * Number(t.price)).toLocaleString()}</p></div>
                        <div><p className="text-muted-foreground">Cortesías enviadas</p><p className="font-bold text-sm">{sent}</p></div>
                        <div><p className="text-muted-foreground">Cortesías escaneadas</p><p className="font-bold text-sm">{scanned}</p></div>
                        {total > 0 && <div className="col-span-2 md:col-span-4"><p className="text-muted-foreground">Disponibles</p><p className="font-bold text-sm">{Math.max(0, total - t.quantity_sold - sent)} / {total}</p></div>}
                      </div>
                    </div>
                  ))}
                  <div className="p-4 rounded-2xl brand-gradient-bg text-primary-foreground">
                    <p className="text-xs opacity-90">Total del evento</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-1">
                      <div><p className="opacity-90">Vendidas</p><p className="font-bold text-base">{totSold}</p></div>
                      <div><p className="opacity-90">Ingresos</p><p className="font-bold text-base">${totRev.toLocaleString()}</p></div>
                      <div><p className="opacity-90">Cortesías</p><p className="font-bold text-base">{totSent}</p></div>
                      <div><p className="opacity-90">Escaneadas</p><p className="font-bold text-base">{totScan}</p></div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerDashboard;
