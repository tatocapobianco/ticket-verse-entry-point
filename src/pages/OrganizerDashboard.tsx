import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Calendar, MapPin, Copy, LogOut, Loader2, DollarSign, Users, Wallet,
  CheckCircle2, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import cupoLogo from '@/assets/cupo-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatEventDate, formatARS } from '@/lib/format';

type EventRow = {
  id: string; name: string; description: string | null;
  event_date: string | null; event_time: string | null; location: string | null;
  event_number: string; access_key: string; is_public: boolean; status: string;
};
type TicketTypeRow = {
  id: string; event_id: string; price: number;
  quantity_total: number | null; quantity_sold: number;
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
  const [saving, setSaving] = useState(false);
  const [revealedKey, setRevealedKey] = useState<Record<string, boolean>>({});
  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', time: '', location: '', is_public: true, status: 'active' });

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
      const { data: tts } = await supabase.from('ticket_types').select('id, event_id, price, quantity_total, quantity_sold').in('event_id', ids);
      setTicketTypes((tts ?? []) as TicketTypeRow[]);
    } else {
      setTicketTypes([]);
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

  const handleConnectMP = async () => {
    const { data, error } = await supabase.functions.invoke('mp-oauth-start');
    if (error || !(data as any)?.url) {
      toast.error((data as any)?.error ?? error?.message ?? 'No se pudo iniciar'); return;
    }
    window.location.href = (data as any).url;
  };

  const copyEventLink = (ev: EventRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/evento/${ev.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const copyAccessKey = async (ev: EventRow, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(ev.access_key);
    toast.success('Clave copiada');
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
            <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full">Inicio</Button>
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
                  {mpConnected ? 'Conectado — vas a recibir los pagos en tu cuenta' : 'Opcional: conectá tu cuenta para recibir pagos.'}
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
            <CardContent className="p-10 text-center space-y-3">
              <p className="text-muted-foreground">Todavía no creaste ningún evento. ¡Creá tu primer evento!</p>
              <Button onClick={() => setShowCreateEvent(true)} className="rounded-full brand-gradient-bg text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Crear evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((ev) => {
              const stats = eventStats(ev.id);
              const revealed = revealedKey[ev.id];
              return (
                <Card
                  key={ev.id}
                  onClick={() => navigate(`/organizer/events/${ev.id}`)}
                  className="glass-card rounded-2xl border-border/60 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="font-display flex items-center gap-2 flex-wrap">
                          {ev.name}
                          {ev.status !== 'active' && <Badge variant="secondary">Inactivo</Badge>}
                          {!ev.is_public && <Badge variant="outline">Privado</Badge>}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <span className="flex items-center gap-1 text-sm"><Calendar className="h-3.5 w-3.5" />{formatEventDate(ev.event_date, ev.event_time)}</span>
                          {ev.location && <span className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5" />{ev.location}</span>}
                          <Badge variant="secondary">N° {ev.event_number}</Badge>
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/40">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Vendidas</p>
                        <p className="text-lg font-bold">{stats.sold}{stats.total ? ` / ${stats.total}` : ''}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Ingresos</p>
                        <p className="text-lg font-bold">{formatARS(stats.revenue)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 col-span-2">
                        <p className="text-xs text-muted-foreground">Clave del escáner</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-mono flex-1 truncate">{revealed ? ev.access_key : '••••••••'}</p>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); setRevealedKey(r => ({ ...r, [ev.id]: !r[ev.id] })); }}>
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => copyAccessKey(ev, e)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button size="sm" variant="outline" onClick={(e) => copyEventLink(ev, e)} className="rounded-full">
                        <Copy className="h-3.5 w-3.5 mr-1" /> Link del evento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create event dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
            <DialogDescription>Completá los datos principales. Podés editar el resto después.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} className="rounded-2xl" /></div>
            <div><Label>Descripción</Label><Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="rounded-2xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha *</Label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="rounded-2xl" /></div>
              <div><Label>Hora *</Label><Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="rounded-2xl" /></div>
            </div>
            <div><Label>Lugar *</Label><Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="rounded-2xl" /></div>
            <div>
              <Label>Visibilidad</Label>
              <select value={newEvent.is_public ? 'public' : 'private'} onChange={(e) => setNewEvent({ ...newEvent, is_public: e.target.value === 'public' })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                <option value="public">Público</option><option value="private">Privado (solo por link)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateEvent(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={handleCreateEvent} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerDashboard;
