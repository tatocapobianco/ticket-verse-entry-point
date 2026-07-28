import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  ArrowLeft, Plus, Ticket, Gift, Link as LinkIcon, BarChart3, Settings,
  Loader2, Copy, Trash2, Eye, EyeOff, AlertTriangle, MapPin, Calendar,
  Megaphone, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatEventDate, formatARS } from '@/lib/format';

type EventRow = {
  id: string; name: string; description: string | null;
  event_date: string | null; event_time: string | null; location: string | null;
  event_number: string; access_key: string; is_public: boolean; status: string;
};
type TicketTypeRow = {
  id: string; event_id: string; name: string; description: string | null;
  price: number; quantity_total: number | null; quantity_sold: number;
  status: string; is_courtesy: boolean; requires_auth_code: boolean;
  authorization_code: string | null;
};
type CourtesyLinkRow = {
  id: string; event_id: string; ticket_type_id: string; code: string;
  max_uses: number; uses_count: number; is_active: boolean;
  label: string | null;
};
type RrppRow = { id: string; name: string; contact: string | null };
type EventRrppRow = {
  id: string; event_id: string; rrpp_id: string;
  max_tickets: number | null; max_courtesies: number;
  link_type: 'general' | 'unique'; link_code: string; active: boolean;
};

const genCode = (prefix = '', len = 6) =>
  prefix + Math.random().toString(36).slice(2, 2 + len).toUpperCase();

const OrganizerEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<EventRow | null>(null);
  const [tickets, setTickets] = useState<TicketTypeRow[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [links, setLinks] = useState<CourtesyLinkRow[]>([]);
  const [scannedByTicket, setScannedByTicket] = useState<Record<string, number>>({});
  const [courtesyByTicket, setCourtesyByTicket] = useState<Record<string, number>>({});
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [showKey, setShowKey] = useState(false);

  // rrpps
  const [rrpps, setRrpps] = useState<RrppRow[]>([]);
  const [eventRrpps, setEventRrpps] = useState<EventRrppRow[]>([]);
  const [rrppSalesByEventRrpp, setRrppSalesByEventRrpp] = useState<Record<string, number>>({});
  const [erForm, setErForm] = useState({ rrpp_name: '', max_tickets: '', max_courtesies: '0', link_type: 'general' as 'general' | 'unique' });

  // ticket form
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketTypeRow | null>(null);
  const [tForm, setTForm] = useState({
    name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteTicket, setDeleteTicket] = useState<TicketTypeRow | null>(null);

  // courtesy form
  const [cForm, setCForm] = useState({ ticket_type_id: '', quantity: '1', label: '' });
  const [lForm, setLForm] = useState({ ticket_type_id: '', max_uses: '10', label: '' });

  // settings form
  const [sForm, setSForm] = useState({
    name: '', description: '', location: '', date: '', time: '',
    is_public: true, status: 'active',
  });

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);
    const { data: evd, error: evErr } = await supabase
      .from('events').select('*').eq('id', id).maybeSingle();
    if (evErr || !evd) {
      toast.error('Evento no encontrado');
      navigate('/organizer-dashboard');
      return;
    }
    if (evd.organizer_id !== user.id) {
      toast.error('No autorizado');
      navigate('/organizer-dashboard');
      return;
    }
    setEv(evd as EventRow);
    setSForm({
      name: evd.name, description: evd.description ?? '', location: evd.location ?? '',
      date: evd.event_date ?? '', time: (evd.event_time ?? '').slice(0, 5),
      is_public: evd.is_public, status: evd.status,
    });

    const ttRes = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', id)
      .order('created_at');
    if (ttRes.error) {
      setTicketsError(ttRes.error.message);
      setTickets([]);
    } else {
      setTicketsError(null);
      setTickets((ttRes.data ?? []) as TicketTypeRow[]);
    }
    const tt = (ttRes.data ?? []) as TicketTypeRow[];

    const [{ data: cls }, { data: cts }, { data: scans }, { data: rr }, { data: er }] = await Promise.all([
      supabase.from('courtesy_links').select('*').eq('event_id', id).order('created_at', { ascending: false }),
      supabase.from('tickets').select('ticket_type_id').eq('event_id', id).eq('source', 'courtesy'),
      supabase.from('tickets').select('ticket_type_id').eq('event_id', id).eq('status', 'used'),
      supabase.from('rrpps').select('id, name, contact').eq('organizer_id', user.id).order('name'),
      supabase.from('event_rrpps').select('*').eq('event_id', id).order('created_at', { ascending: false }),
    ]);
    setLinks((cls ?? []) as CourtesyLinkRow[]);
    setRrpps((rr ?? []) as RrppRow[]);
    setEventRrpps((er ?? []) as EventRrppRow[]);
    const c: Record<string, number> = {};
    (cts ?? []).forEach((r: any) => { c[r.ticket_type_id] = (c[r.ticket_type_id] || 0) + 1; });
    setCourtesyByTicket(c);
    const s: Record<string, number> = {};
    (scans ?? []).forEach((r: any) => { s[r.ticket_type_id] = (s[r.ticket_type_id] || 0) + 1; });
    setScannedByTicket(s);
    setRevenueTotal(tt.reduce((a, t) => a + t.quantity_sold * Number(t.price), 0));
    // rrpp sales count per event_rrpp
    const erIds = (er ?? []).map((x: any) => x.id);
    if (erIds.length) {
      const { data: sales } = await supabase.from('rrpp_sales').select('event_rrpp_id').in('event_rrpp_id', erIds);
      const rs: Record<string, number> = {};
      (sales ?? []).forEach((r: any) => { rs[r.event_rrpp_id] = (rs[r.event_rrpp_id] || 0) + 1; });
      setRrppSalesByEventRrpp(rs);
    } else {
      setRrppSalesByEventRrpp({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user?.id]);

  const totalSold = tickets.reduce((a, t) => a + t.quantity_sold, 0);
  const totalStock = tickets.reduce((a, t) => a + (t.quantity_total ?? 0), 0);

  const openTicketSheet = (t?: TicketTypeRow) => {
    if (t) {
      setEditingTicket(t);
      setTForm({
        name: t.name, description: t.description ?? '',
        price: String(t.price ?? ''),
        quantity: t.quantity_total?.toString() ?? '',
        is_courtesy: t.is_courtesy,
        auth_code: t.authorization_code ?? '',
      });
    } else {
      setEditingTicket(null);
      setTForm({ name: '', description: '', price: '', quantity: '', is_courtesy: false, auth_code: '' });
    }
    setTicketSheetOpen(true);
  };

  const saveTicket = async () => {
    if (!ev) return;
    if (!tForm.name.trim()) return toast.error('Ingresá el nombre del ticket');
    setSaving(true);
    const code = tForm.auth_code.trim();
    const payload = {
      event_id: ev.id,
      name: tForm.name.trim(),
      description: tForm.description.trim() || null,
      price: tForm.is_courtesy ? 0 : Number(tForm.price || 0),
      quantity_total: tForm.quantity ? Number(tForm.quantity) : null,
      is_courtesy: tForm.is_courtesy,
      authorization_code: code || null,
      requires_auth_code: !!code,
    };
    const query = editingTicket
      ? supabase.from('ticket_types').update(payload).eq('id', editingTicket.id).select('*').single()
      : supabase.from('ticket_types').insert({ ...payload, quantity_sold: 0, status: 'active' }).select('*').single();
    const { data: saved, error } = await query;
    setSaving(false);
    if (error) return toast.error(error.message);
    // Optimistically update local state so the new/edited ticket appears immediately
    if (saved) {
      const row = saved as TicketTypeRow;
      setTickets(prev => editingTicket
        ? prev.map(t => t.id === row.id ? row : t)
        : [...prev, row]);
    }
    toast.success(editingTicket ? 'Ticket actualizado' : 'Ticket creado');
    setTicketSheetOpen(false);
    load();
  };

  const toggleTicketStatus = async (t: TicketTypeRow) => {
    const next = t.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('ticket_types').update({ status: next }).eq('id', t.id);
    if (error) return toast.error(error.message);
    load();
  };

  const doDeleteTicket = async () => {
    if (!deleteTicket) return;
    const { error } = await supabase.from('ticket_types').delete().eq('id', deleteTicket.id);
    setDeleteTicket(null);
    if (error) return toast.error(error.message);
    toast.success('Ticket eliminado');
    load();
  };

  const createCourtesy = async () => {
    if (!ev || !user) return;
    if (!cForm.ticket_type_id) return toast.error('Elegí un tipo de ticket');
    const qty = Math.max(1, Number(cForm.quantity || 1));
    setSaving(true);
    const code = genCode('CX', 8);
    const { error } = await supabase.from('courtesy_links').insert({
      event_id: ev.id, ticket_type_id: cForm.ticket_type_id,
      code, max_uses: qty, created_by: user.id, is_active: true,
      label: cForm.label.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/cortesia/${code}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Cortesía creada — link copiado');
    setCForm({ ticket_type_id: '', quantity: '1', label: '' });
    load();
  };

  const createLink = async () => {
    if (!ev || !user) return;
    if (!lForm.ticket_type_id) return toast.error('Elegí un tipo de ticket');
    const uses = Math.max(1, Number(lForm.max_uses || 1));
    setSaving(true);
    const code = genCode('LX', 8);
    const { error } = await supabase.from('courtesy_links').insert({
      event_id: ev.id, ticket_type_id: lForm.ticket_type_id,
      code, max_uses: uses, created_by: user.id, is_active: true,
      label: lForm.label.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/cortesia/${code}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Link creado — copiado');
    setLForm({ ticket_type_id: '', max_uses: '10', label: '' });
    load();
  };

  const assignRrpp = async () => {
    if (!ev || !user) return;
    const name = erForm.rrpp_name.trim();
    if (!name) return toast.error('Ingresá el nombre del RRPP');
    // Find existing RRPP by name (case-insensitive) or create new one
    let rrppId = rrpps.find(r => r.name.toLowerCase() === name.toLowerCase())?.id;
    if (!rrppId) {
      const { data: created, error: cErr } = await supabase
        .from('rrpps').insert({ organizer_id: user.id, name })
        .select('id, name, contact').single();
      if (cErr || !created) return toast.error(cErr?.message ?? 'No se pudo crear el RRPP');
      rrppId = created.id;
      setRrpps(prev => [...prev, created as RrppRow]);
    }
    const code = genCode('R', 8);
    const { error } = await supabase.from('event_rrpps').insert({
      event_id: ev.id, rrpp_id: rrppId,
      max_tickets: erForm.max_tickets ? Number(erForm.max_tickets) : null,
      max_courtesies: Number(erForm.max_courtesies || 0),
      link_type: erForm.link_type, link_code: code, active: true,
    });
    if (error) return toast.error(error.message);
    toast.success('RRPP asignado');
    setErForm({ rrpp_name: '', max_tickets: '', max_courtesies: '0', link_type: 'general' });
    load();
  };
  const toggleEventRrpp = async (er: EventRrppRow) => {
    const { error } = await supabase.from('event_rrpps').update({ active: !er.active }).eq('id', er.id);
    if (error) return toast.error(error.message);
    load();
  };
  const removeEventRrpp = async (er: EventRrppRow) => {
    const { error } = await supabase.from('event_rrpps').delete().eq('id', er.id);
    if (error) return toast.error(error.message);
    toast.success('RRPP removido');
    load();
  };
  const copyRrppLink = async (er: EventRrppRow) => {
    const url = `${window.location.origin}/rrpp/${er.link_code}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const revoke = async (linkId: string) => {
    const { error } = await supabase.from('courtesy_links').update({ is_active: false }).eq('id', linkId);
    if (error) return toast.error(error.message);
    toast.success('Revocado'); load();
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/cortesia/${code}`);
    toast.success('Link copiado');
  };

  const copyAccessKey = async () => {
    if (!ev) return;
    await navigator.clipboard.writeText(ev.access_key);
    toast.success('Clave copiada');
  };

  const saveSettings = async () => {
    if (!ev) return;
    setSaving(true);
    const { error } = await supabase.from('events').update({
      name: sForm.name, description: sForm.description || null,
      location: sForm.location || null,
      event_date: sForm.date || null, event_time: sForm.time || null,
      is_public: sForm.is_public, status: sForm.status,
    }).eq('id', ev.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Cambios guardados');
    load();
  };

  const rows = useMemo(() =>
    tickets.map((t) => {
      const sent = courtesyByTicket[t.id] || 0;
      const scanned = scannedByTicket[t.id] || 0;
      const total = t.quantity_total ?? 0;
      const overflow = total > 0 && (t.quantity_sold + sent) > total;
      return { t, sent, scanned, total, overflow };
    }), [tickets, courtesyByTicket, scannedByTicket]);

  if (loading || !ev) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <header className="glass-card border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/organizer-dashboard')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg truncate">{ev.name}</h1>
            <p className="text-xs text-muted-foreground truncate">N° {ev.event_number}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Event summary */}
        <Card className="glass-card border-border/60 rounded-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-2xl">{ev.name}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <span className="flex items-center gap-2 text-sm"><Calendar className="h-3.5 w-3.5" />{formatEventDate(ev.event_date, ev.event_time)}</span>
                  {ev.location && <span className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5" />{ev.location}</span>}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.status !== 'active' && <Badge variant="secondary">Inactivo</Badge>}
                {!ev.is_public && <Badge variant="outline">Privado</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Vendidas</p>
                <p className="text-lg font-bold">{totalSold}{totalStock ? ` / ${totalStock}` : ''}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-lg font-bold">{formatARS(revenueTotal)}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Tipos de ticket</p>
                <p className="text-lg font-bold">{tickets.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40">
                <p className="text-xs text-muted-foreground">Clave del escáner</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono flex-1 truncate">{showKey ? ev.access_key : '••••••••'}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowKey(v => !v)}>
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyAccessKey}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="w-full flex overflow-x-auto whitespace-nowrap rounded-2xl h-auto justify-start">
            <TabsTrigger value="tickets" className="rounded-2xl shrink-0"><Ticket className="h-4 w-4 mr-1" />Tickets</TabsTrigger>
            <TabsTrigger value="courtesy" className="rounded-2xl shrink-0"><Gift className="h-4 w-4 mr-1" />Cortesías</TabsTrigger>
            <TabsTrigger value="links" className="rounded-2xl shrink-0"><LinkIcon className="h-4 w-4 mr-1" />Links únicos</TabsTrigger>
            <TabsTrigger value="rrpps" className="rounded-2xl shrink-0"><Megaphone className="h-4 w-4 mr-1" />RRPPs</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-2xl shrink-0"><BarChart3 className="h-4 w-4 mr-1" />Estadísticas</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-2xl shrink-0"><Settings className="h-4 w-4 mr-1" />Configuración</TabsTrigger>
          </TabsList>

          {/* TICKETS */}
          <TabsContent value="tickets" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display">Tickets</CardTitle>
                  <CardDescription>Gestioná tus tipos de entrada.</CardDescription>
                </div>
                <Button onClick={() => openTicketSheet()} className="rounded-full brand-gradient-bg text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Agregar ticket
                </Button>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Este evento no tiene tipos de entrada. ¡Agregá el primero!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-3 text-xs text-muted-foreground px-3 py-2">
                      <div className="col-span-4">Nombre</div>
                      <div className="col-span-2">Precio</div>
                      <div className="col-span-2">Stock</div>
                      <div className="col-span-1">Vendidos</div>
                      <div className="col-span-1">Estado</div>
                      <div className="col-span-2 text-right">Acciones</div>
                    </div>
                    {tickets.map((t) => {
                      const soldOut = t.quantity_total !== null && t.quantity_sold >= t.quantity_total;
                      return (
                        <div key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-secondary/30">
                          <div className="md:col-span-4">
                            <p className="font-medium">{t.name}{t.is_courtesy && <Badge className="ml-2" variant="secondary">Cortesía</Badge>}</p>
                            {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                          </div>
                          <div className="md:col-span-2 text-sm">{t.is_courtesy ? '—' : formatARS(t.price)}</div>
                          <div className="md:col-span-2 text-sm">{t.quantity_total ?? '∞'}</div>
                          <div className="md:col-span-1 text-sm">{t.quantity_sold}</div>
                          <div className="md:col-span-1">
                            <Badge variant={t.status === 'active' ? (soldOut ? 'destructive' : 'default') : 'secondary'}>
                              {t.status === 'active' ? (soldOut ? 'Agotado' : 'Activo') : 'Inactivo'}
                            </Badge>
                          </div>
                          <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
                            <div className="flex items-center gap-1">
                              <Switch checked={t.status === 'active'} onCheckedChange={() => toggleTicketStatus(t)} />
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => openTicketSheet(t)} className="rounded-full">Editar</Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTicket(t)} className="rounded-full text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COURTESY */}
          <TabsContent value="courtesy" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Cortesías</CardTitle>
                <CardDescription>Generá un link único para compartir por WhatsApp o mail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/30 space-y-3">
                  <div>
                    <Label>Tipo de ticket</Label>
                    <select value={cForm.ticket_type_id} onChange={(e) => setCForm({ ...cForm, ticket_type_id: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="">— Elegí —</option>
                      {tickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cantidad</Label><Input type="number" min={1} value={cForm.quantity} onChange={(e) => setCForm({ ...cForm, quantity: e.target.value })} className="rounded-2xl" /></div>
                    <div><Label>Nombre (opcional)</Label><Input value={cForm.label} onChange={(e) => setCForm({ ...cForm, label: e.target.value })} placeholder="Ej: Invitados VIP" className="rounded-2xl" /></div>
                  </div>
                  <Button onClick={createCourtesy} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generar link'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Cortesías enviadas</p>
                  {links.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">No hay cortesías generadas para este evento.</div>
                  ) : links.map(l => {
                    const t = tickets.find(x => x.id === l.ticket_type_id);
                    const done = l.uses_count >= l.max_uses || !l.is_active;
                    return (
                      <div key={l.id} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-medium">{l.label ? `${l.label} · ` : ''}{t?.name || 'Ticket'} — {l.uses_count}/{l.max_uses} usos</p>
                          <p className="text-xs text-muted-foreground font-mono">/cortesia/{l.code}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={done ? 'secondary' : 'default'}>{done ? 'Agotado' : 'Activo'}</Badge>
                          <Button size="icon" variant="outline" onClick={() => copyLink(l.code)} className="rounded-full h-8 w-8"><Copy className="h-3 w-3" /></Button>
                          {l.is_active && <Button size="sm" variant="ghost" onClick={() => revoke(l.id)} className="rounded-full text-destructive">Revocar</Button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LINKS */}
          <TabsContent value="links" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Links únicos</CardTitle>
                <CardDescription>Link con límite total de usos compartido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/30 space-y-3">
                  <div>
                    <Label>Tipo de ticket</Label>
                    <select value={lForm.ticket_type_id} onChange={(e) => setLForm({ ...lForm, ticket_type_id: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="">— Elegí —</option>
                      {tickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cantidad máxima</Label><Input type="number" min={1} value={lForm.max_uses} onChange={(e) => setLForm({ ...lForm, max_uses: e.target.value })} className="rounded-2xl" /></div>
                    <div><Label>Nombre (opcional)</Label><Input value={lForm.label} onChange={(e) => setLForm({ ...lForm, label: e.target.value })} placeholder="Ej: Radio X" className="rounded-2xl" /></div>
                  </div>
                  <Button onClick={createLink} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generar link'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Links generados</p>
                  {links.filter(l => l.max_uses > 1).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">Aún no generaste links.</div>
                  ) : links.filter(l => l.max_uses > 1).map(l => {
                    const t = tickets.find(x => x.id === l.ticket_type_id);
                    const remaining = l.max_uses - l.uses_count;
                    const done = remaining <= 0 || !l.is_active;
                    return (
                      <div key={l.id} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-medium">{l.label ? `${l.label} · ` : ''}{t?.name || 'Ticket'}</p>
                          <p className="text-xs text-muted-foreground">Usados: {l.uses_count} · Disponibles: {Math.max(0, remaining)}</p>
                          <p className="text-xs font-mono text-muted-foreground">/cortesia/{l.code}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={done ? 'secondary' : 'default'}>{done ? 'Agotado' : 'Activo'}</Badge>
                          <Button size="icon" variant="outline" onClick={() => copyLink(l.code)} className="rounded-full h-8 w-8"><Copy className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RRPPs */}
          <TabsContent value="rrpps" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">RRPPs del evento</CardTitle>
                <CardDescription>Asigná RRPPs con cupo, tipo de link y activá/desactivá.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <div className="md:col-span-2">
                    <Label>RRPP</Label>
                    <Input
                      list="rrpp-suggestions"
                      value={erForm.rrpp_name}
                      onChange={(e) => setErForm({ ...erForm, rrpp_name: e.target.value })}
                      placeholder="Nombre del RRPP"
                      className="rounded-2xl"
                    />
                    <datalist id="rrpp-suggestions">
                      {rrpps.map(r => <option key={r.id} value={r.name} />)}
                    </datalist>
                    <p className="text-xs text-muted-foreground mt-1">
                      Elegí uno existente o escribí un nombre nuevo para crearlo.
                    </p>
                  </div>
                  <div>
                    <Label>Cupo tickets</Label>
                    <Input type="number" min="0" placeholder="∞" value={erForm.max_tickets}
                      onChange={(e) => setErForm({ ...erForm, max_tickets: e.target.value })} className="rounded-2xl" />
                  </div>
                  <div>
                    <Label>Cortesías</Label>
                    <Input type="number" min="0" value={erForm.max_courtesies}
                      onChange={(e) => setErForm({ ...erForm, max_courtesies: e.target.value })} className="rounded-2xl" />
                  </div>
                  <div>
                    <Label>Tipo de link</Label>
                    <select
                      value={erForm.link_type}
                      onChange={(e) => setErForm({ ...erForm, link_type: e.target.value as 'general' | 'unique' })}
                      className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm"
                    >
                      <option value="general">General</option>
                      <option value="unique">Único</option>
                    </select>
                  </div>
                    <div className="md:col-span-5">
                      <Button onClick={assignRrpp} className="rounded-full brand-gradient-bg text-primary-foreground">
                        <Plus className="h-4 w-4 mr-1" /> Asignar RRPP
                      </Button>
                    </div>
                  </div>
                )}

                {eventRrpps.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No hay RRPPs asignados a este evento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventRrpps.map((er) => {
                      const rrpp = rrpps.find(r => r.id === er.rrpp_id);
                      const sold = rrppSalesByEventRrpp[er.id] || 0;
                      return (
                        <div key={er.id} className="p-3 rounded-xl bg-secondary/30 flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-[180px]">
                            <p className="font-medium">{rrpp?.name ?? 'RRPP'}</p>
                            <p className="text-xs text-muted-foreground">
                              Vendidas {sold}{er.max_tickets ? ` / ${er.max_tickets}` : ''} · Cortesías {er.max_courtesies} · {er.link_type === 'unique' ? 'Único' : 'General'}
                            </p>
                          </div>
                          <Badge variant={er.active ? 'default' : 'secondary'}>
                            {er.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyRrppLink(er)}>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Link
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleEventRrpp(er)}>
                            {er.active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => removeEventRrpp(er)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* STATS */}
          <TabsContent value="stats" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Estadísticas</CardTitle>
                <CardDescription>Detalle por tipo de ticket y totales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin datos aún.</p>
                ) : rows.map(({ t, sent, scanned, total, overflow }) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-secondary/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{t.name}</p>
                      {overflow && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Excede stock</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Vendidas</p><p className="font-bold text-sm">{t.quantity_sold}</p></div>
                      <div><p className="text-muted-foreground">Ingresos</p><p className="font-bold text-sm">{formatARS(t.quantity_sold * Number(t.price))}</p></div>
                      <div><p className="text-muted-foreground">Cortesías enviadas</p><p className="font-bold text-sm">{sent}</p></div>
                      <div><p className="text-muted-foreground">Escaneadas</p><p className="font-bold text-sm">{scanned}</p></div>
                      {total > 0 && <div className="col-span-2 md:col-span-4"><p className="text-muted-foreground">Disponibles</p><p className="font-bold text-sm">{Math.max(0, total - t.quantity_sold - sent)} / {total}</p></div>}
                    </div>
                  </div>
                ))}
                {rows.length > 0 && (
                  <div className="p-4 rounded-2xl brand-gradient-bg text-primary-foreground">
                    <p className="text-xs opacity-90">Total del evento</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-1">
                      <div><p className="opacity-90">Vendidas</p><p className="font-bold text-base">{totalSold}</p></div>
                      <div><p className="opacity-90">Ingresos</p><p className="font-bold text-base">{formatARS(revenueTotal)}</p></div>
                      <div><p className="opacity-90">Cortesías</p><p className="font-bold text-base">{rows.reduce((a, r) => a + r.sent, 0)}</p></div>
                      <div><p className="opacity-90">Escaneadas</p><p className="font-bold text-base">{rows.reduce((a, r) => a + r.scanned, 0)}</p></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Configuración</CardTitle>
                <CardDescription>Editá los datos del evento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Nombre</Label><Input value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} className="rounded-2xl" /></div>
                <div><Label>Descripción</Label><Textarea value={sForm.description} onChange={(e) => setSForm({ ...sForm, description: e.target.value })} className="rounded-2xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Fecha</Label><Input type="date" value={sForm.date} onChange={(e) => setSForm({ ...sForm, date: e.target.value })} className="rounded-2xl" /></div>
                  <div><Label>Hora</Label><Input type="time" value={sForm.time} onChange={(e) => setSForm({ ...sForm, time: e.target.value })} className="rounded-2xl" /></div>
                </div>
                <div><Label>Lugar</Label><Input value={sForm.location} onChange={(e) => setSForm({ ...sForm, location: e.target.value })} className="rounded-2xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Visibilidad</Label>
                    <select value={sForm.is_public ? 'public' : 'private'} onChange={(e) => setSForm({ ...sForm, is_public: e.target.value === 'public' })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="public">Público</option><option value="private">Privado</option>
                    </select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select value={sForm.status} onChange={(e) => setSForm({ ...sForm, status: e.target.value })} className="w-full rounded-2xl border border-input bg-background h-10 px-3 text-sm">
                      <option value="active">Activo</option><option value="inactive">Inactivo</option>
                    </select>
                  </div>
                </div>
                <Button onClick={saveSettings} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket sheet */}
      <Sheet open={ticketSheetOpen} onOpenChange={setTicketSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTicket ? 'Editar ticket' : 'Nuevo tipo de ticket'}</SheetTitle>
            <SheetDescription>Configurá precio, stock y opciones.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 mt-4">
            <div><Label>Nombre *</Label><Input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className="rounded-2xl" /></div>
            <div><Label>Descripción</Label><Input value={tForm.description} onChange={(e) => setTForm({ ...tForm, description: e.target.value })} className="rounded-2xl" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tForm.is_courtesy} onChange={(e) => setTForm({ ...tForm, is_courtesy: e.target.checked })} />
              Ticket de cortesía (sin precio, oculto al público)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Precio (ARS)</Label><Input type="number" disabled={tForm.is_courtesy} value={tForm.price} onChange={(e) => setTForm({ ...tForm, price: e.target.value })} className="rounded-2xl" /></div>
              <div><Label>Stock</Label><Input type="number" value={tForm.quantity} onChange={(e) => setTForm({ ...tForm, quantity: e.target.value })} className="rounded-2xl" placeholder="Sin límite" /></div>
            </div>
            <div>
              <Label>Código de autorización (opcional)</Label>
              <Input value={tForm.auth_code} onChange={(e) => setTForm({ ...tForm, auth_code: e.target.value })} placeholder="Ej: PRENSA2025" className="rounded-2xl" />
              <p className="text-xs text-muted-foreground mt-1">Si lo completás, el comprador deberá ingresar este código para comprar.</p>
            </div>
          </div>
          <SheetFooter className="mt-4">
            <Button variant="ghost" onClick={() => setTicketSheetOpen(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={saveTicket} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingTicket ? 'Guardar' : 'Crear ticket')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTicket} onOpenChange={(o) => !o && setDeleteTicket(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el ticket {deleteTicket?.name} permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si ya se vendieron entradas de este tipo, la eliminación fallará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteTicket} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrganizerEventDetail;
