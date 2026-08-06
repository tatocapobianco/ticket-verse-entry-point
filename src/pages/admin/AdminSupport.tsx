import { useEffect, useState } from 'react';
import { adminRpc, formatMoney, formatDateTime, formatDate } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, AdminCard, StatusBadge } from './ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Mail, Ban, RotateCcw, Check, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

export default function AdminSupport() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState(params.get('event') ?? '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<any[]>([]);
  const [tab, setTab] = useState('rrpps');
  const [tickets, setTickets] = useState<any[]>([]);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [evs, fp] = await Promise.all([
          adminRpc<any[]>('admin_events', {}),
          adminRpc<any[]>('admin_failed_payments', {}),
        ]);
        setEvents(evs ?? []);
        setFailed(fp ?? []);
      } catch (e: any) {
        toast.error(e.message ?? 'No pudimos cargar los datos de soporte');
      }
    })();
  }, []);

  const load = async (id = eventId) => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await adminRpc<any>('admin_event_support', { _event_id: id }));
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) load(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const pickEvent = (id: string) => {
    setEventId(id);
    setParams(id ? { event: id } : {});
  };

  const revokeCourtesy = async (c: any) => {
    try {
      await adminRpc('admin_revoke_courtesy', { _link_id: c.id });
      toast.success('Cortesía revocada');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos revocar la cortesía');
    }
  };

  const toggleRrpp = async (r: any) => {
    try {
      await adminRpc('admin_set_rrpp_active', { _event_rrpp_id: r.id, _active: !r.active });
      toast.success(r.active ? 'RRPP desactivado' : 'RRPP reactivado');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar el RRPP');
    }
  };

  const openPurchase = async (id: string) => {
    setPurchaseId(id);
    try {
      const d = await adminRpc<any>('admin_purchase_detail', { _purchase_id: id });
      setTickets(d?.tickets ?? []);
      setTab('tickets');
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar la compra');
    }
  };

  const setUsed = async (t: any, used: boolean) => {
    try {
      await adminRpc('admin_set_ticket_used', { _ticket_id: t.id, _used: used });
      toast.success(used ? 'Ticket marcado como usado' : 'Ticket revertido a válido');
      if (purchaseId) openPurchase(purchaseId);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar el ticket');
    }
  };

  const resend = async (t: any) => {
    try {
      const { data: r, error } = await supabase.functions.invoke('admin-resend-ticket', {
        body: { ticket_id: t.id },
      });
      if (error) throw error;
      if ((r as any)?.error) throw new Error((r as any).error);
      toast.success('Ticket reenviado por email');
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos reenviar el ticket');
    }
  };

  return (
    <div>
      <PageHead
        title="Resolución de problemas"
        description="RRPPs, cortesías, tickets y pagos con problemas de cualquier evento."
      />

      <div className="mb-5 max-w-md">
        <label className="block text-xs text-muted-foreground mb-1">Evento</label>
        <Select value={eventId} onValueChange={pickEvent}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Elegí un evento" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} · #{e.event_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <Spinner />}

      {!loading && data && (
        <>
          <AdminCard className="p-4 mb-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold font-display">{data.event?.name}</span>
              <Badge variant="outline">#{data.event?.event_number}</Badge>
              <Badge variant={data.event?.status === 'active' ? 'default' : 'secondary'}>
                {data.event?.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="outline">{data.event?.is_public ? 'Público' : 'Oculto'}</Badge>
              <span className="text-muted-foreground">{data.event?.productora_nombre ?? 'Sin productora'}</span>
            </div>
          </AdminCard>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="rrpps">RRPPs</TabsTrigger>
              <TabsTrigger value="cortesias">Cortesías y links</TabsTrigger>
              <TabsTrigger value="pagos">Pagos con problemas</TabsTrigger>
              <TabsTrigger value="tickets">Tickets de una compra</TabsTrigger>
            </TabsList>

            <TabsContent value="rrpps">
              <TableShell cols={['RRPP', 'Contacto', 'Link', 'Tipo', 'Cupo', 'Cortesías', 'Ventas', 'Estado', 'Acciones']}>
                {(data.rrpps ?? []).length === 0 ? (
                  <EmptyRow span={9} text="Este evento no tiene RRPPs asignados." />
                ) : (
                  data.rrpps.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className={tdClass}>{r.name}</td>
                      <td className={tdClass}>{r.contact ?? '—'}</td>
                      <td className={`${tdClass} font-mono text-xs`}>/rrpp/{r.link_code}</td>
                      <td className={tdClass}>{r.link_type === 'courtesy' ? 'Cortesías' : 'Venta'}</td>
                      <td className={`${tdClass} tabular-nums`}>{r.max_tickets ?? 'Sin límite'}</td>
                      <td className={`${tdClass} tabular-nums`}>{r.max_courtesies}</td>
                      <td className={`${tdClass} tabular-nums`}>{r.sales}</td>
                      <td className={tdClass}>
                        <Badge variant={r.active ? 'default' : 'secondary'}>{r.active ? 'Activo' : 'Desactivado'}</Badge>
                      </td>
                      <td className={tdClass}>
                        <Button variant="ghost" size="sm" onClick={() => toggleRrpp(r)}>
                          {r.active ? <><Ban className="h-3.5 w-3.5 mr-1" /> Desactivar</> : <><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivar</>}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </TableShell>
            </TabsContent>

            <TabsContent value="cortesias">
              <TableShell cols={['Nombre', 'Tanda', 'Código', 'Generadas', 'Usadas', 'Vence', 'Estado', 'Acciones']}>
                {(data.courtesies ?? []).length === 0 ? (
                  <EmptyRow span={8} text="Este evento no tiene cortesías generadas." />
                ) : (
                  data.courtesies.map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/40">
                      <td className={tdClass}>{c.label ?? '—'}</td>
                      <td className={tdClass}>{c.ticket_type}</td>
                      <td className={`${tdClass} font-mono text-xs`}>/cortesia/{c.code}</td>
                      <td className={`${tdClass} tabular-nums`}>{c.max_uses}</td>
                      <td className={`${tdClass} tabular-nums`}>{c.used}</td>
                      <td className={tdClass}>{c.expires_at ? formatDate(c.expires_at) : 'Sin vencimiento'}</td>
                      <td className={tdClass}>
                        <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Activa' : 'Revocada'}</Badge>
                      </td>
                      <td className={tdClass}>
                        {c.is_active && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeCourtesy(c)}>
                            <Ban className="h-3.5 w-3.5 mr-1" /> Revocar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </TableShell>
            </TabsContent>

            <TabsContent value="pagos">
              <TableShell cols={['Fecha', 'Comprador', 'Monto', 'Estado', 'N° de operación', 'Acciones']}>
                {(data.failed_payments ?? []).length === 0 ? (
                  <EmptyRow span={6} text="No hay pagos rechazados ni pendientes en este evento." />
                ) : (
                  data.failed_payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(p.created_at)}</td>
                      <td className={tdClass}>{p.buyer_email ?? '—'}</td>
                      <td className={`${tdClass} tabular-nums`}>{formatMoney(p.total)}</td>
                      <td className={tdClass}><StatusBadge status={p.status} /></td>
                      <td className={`${tdClass} font-mono text-xs`}>{p.mp_payment_id ?? '—'}</td>
                      <td className={tdClass}>
                        <Button variant="ghost" size="sm" onClick={() => openPurchase(p.id)}>Ver compra</Button>
                      </td>
                    </tr>
                  ))
                )}
              </TableShell>
            </TabsContent>

            <TabsContent value="tickets">
              {!purchaseId ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Elegí una compra desde “Pagos con problemas”, Transacciones o el buscador global para ver sus tickets.
                </p>
              ) : (
                <TableShell cols={['Tanda', 'Código', 'Titular', 'Estado', 'Usado', 'Acciones']}>
                  {tickets.length === 0 ? (
                    <EmptyRow span={6} text="Esta compra todavía no generó tickets." />
                  ) : (
                    tickets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/40">
                        <td className={tdClass}>{t.ticket_type}</td>
                        <td className={`${tdClass} font-mono text-xs`}>{t.qr_code}</td>
                        <td className={tdClass}>{t.owner_email ?? '—'}</td>
                        <td className={tdClass}>
                          <Badge variant={t.status === 'used' ? 'secondary' : 'default'}>
                            {t.status === 'used' ? 'Usado' : 'Válido'}
                          </Badge>
                        </td>
                        <td className={tdClass}>{t.used_at ? formatDateTime(t.used_at) : '—'}</td>
                        <td className={tdClass}>
                          <div className="flex flex-wrap gap-1">
                            <Button variant="ghost" size="sm" onClick={() => resend(t)}>
                              <Mail className="h-3.5 w-3.5 mr-1" /> Reenviar
                            </Button>
                            {t.status === 'used' ? (
                              <Button variant="ghost" size="sm" onClick={() => setUsed(t, false)}>
                                <Undo2 className="h-3.5 w-3.5 mr-1" /> Revertir
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => setUsed(t, true)}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Marcar usado
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </TableShell>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {!eventId && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold font-display mb-3">Pagos rechazados o pendientes de toda la plataforma</h2>
          <TableShell cols={['Fecha', 'Comprador', 'Evento', 'Productora', 'Monto', 'Estado', 'N° de operación', 'Acciones']}>
            {failed.length === 0 ? (
              <EmptyRow span={8} text="No hay pagos con problemas." />
            ) : (
              failed.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(p.created_at)}</td>
                  <td className={tdClass}>{p.buyer_email ?? '—'}</td>
                  <td className={tdClass}>{p.event_name}</td>
                  <td className={tdClass}>{p.productora_nombre ?? '—'}</td>
                  <td className={`${tdClass} tabular-nums`}>{formatMoney(p.total)}</td>
                  <td className={tdClass}><StatusBadge status={p.status} /></td>
                  <td className={`${tdClass} font-mono text-xs`}>{p.mp_payment_id ?? '—'}</td>
                  <td className={tdClass}>
                    <Button variant="ghost" size="sm" onClick={() => openPurchase(p.id)}>Ver tickets</Button>
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </div>
      )}

      <Dialog open={!eventId && !!purchaseId} onOpenChange={(o) => !o && setPurchaseId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tickets de la compra</DialogTitle>
            <DialogDescription>Podés reenviarlos por email o cambiar su estado de uso.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <TableShell cols={['Tanda', 'Código', 'Titular', 'Estado', 'Acciones']}>
              {tickets.length === 0 ? (
                <EmptyRow span={5} text="Esta compra todavía no generó tickets." />
              ) : (
                tickets.map((t: any) => (
                  <tr key={t.id}>
                    <td className={tdClass}>{t.ticket_type}</td>
                    <td className={`${tdClass} font-mono text-xs`}>{t.qr_code}</td>
                    <td className={tdClass}>{t.owner_email ?? '—'}</td>
                    <td className={tdClass}>
                      <Badge variant={t.status === 'used' ? 'secondary' : 'default'}>
                        {t.status === 'used' ? 'Usado' : 'Válido'}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <Button variant="ghost" size="sm" onClick={() => resend(t)}>
                          <Mail className="h-3.5 w-3.5 mr-1" /> Reenviar
                        </Button>
                        {t.status === 'used' ? (
                          <Button variant="ghost" size="sm" onClick={() => setUsed(t, false)}>
                            <Undo2 className="h-3.5 w-3.5 mr-1" /> Revertir
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setUsed(t, true)}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Marcar usado
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
