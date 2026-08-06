import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminRpc, formatMoney, formatDateTime, formatDate } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, StatusBadge } from './ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminSearch() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setData(await adminRpc<any>('admin_global_search', { _q: q }));
      } catch (e: any) {
        toast.error(e.message ?? 'No pudimos completar la búsqueda');
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  const openPurchase = async (id: string) => {
    try {
      setDetail(await adminRpc<any>('admin_purchase_detail', { _purchase_id: id }));
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar la compra');
    }
  };

  const counts = data
    ? ['purchases', 'tickets', 'users', 'events'].reduce((a, k) => a + (data[k]?.length ?? 0), 0)
    : 0;

  return (
    <div>
      <PageHead title={`Resultados para “${q}”`} description={loading ? undefined : `${counts} coincidencias.`} />

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold font-display mb-2">Compras</h2>
            <TableShell cols={['Fecha', 'Comprador', 'Evento', 'Monto', 'Estado', 'N° de operación', '']}>
              {(data?.purchases ?? []).length === 0 ? (
                <EmptyRow span={7} text="Sin compras." />
              ) : (
                data.purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(p.created_at)}</td>
                    <td className={tdClass}>{p.buyer_email ?? '—'}</td>
                    <td className={tdClass}>{p.event_name}</td>
                    <td className={`${tdClass} tabular-nums`}>{formatMoney(p.total)}</td>
                    <td className={tdClass}><StatusBadge status={p.status} /></td>
                    <td className={`${tdClass} font-mono text-xs`}>{p.mp_payment_id ?? p.id.slice(0, 8)}</td>
                    <td className={tdClass}>
                      <Button variant="ghost" size="sm" onClick={() => openPurchase(p.id)}>Ver contexto</Button>
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </section>

          <section>
            <h2 className="text-sm font-semibold font-display mb-2">Tickets</h2>
            <TableShell cols={['Código', 'Evento', 'Tanda', 'Titular', 'Estado', 'Usado', '']}>
              {(data?.tickets ?? []).length === 0 ? (
                <EmptyRow span={7} text="Sin tickets." />
              ) : (
                data.tickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/40">
                    <td className={`${tdClass} font-mono text-xs`}>{t.qr_code}</td>
                    <td className={tdClass}>{t.event_name}</td>
                    <td className={tdClass}>{t.ticket_type}</td>
                    <td className={tdClass}>{t.owner_email ?? '—'}</td>
                    <td className={tdClass}>
                      <Badge variant={t.status === 'used' ? 'secondary' : 'default'}>
                        {t.status === 'used' ? 'Usado' : 'Válido'}
                      </Badge>
                    </td>
                    <td className={tdClass}>{t.used_at ? formatDateTime(t.used_at) : '—'}</td>
                    <td className={tdClass}>
                      {t.purchase_id && (
                        <Button variant="ghost" size="sm" onClick={() => openPurchase(t.purchase_id)}>Ver compra</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </section>

          <section>
            <h2 className="text-sm font-semibold font-display mb-2">Usuarios</h2>
            <TableShell cols={['Email', 'Nombre', 'DNI', 'Registro', 'Estado']}>
              {(data?.users ?? []).length === 0 ? (
                <EmptyRow span={5} text="Sin usuarios." />
              ) : (
                data.users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className={tdClass}>{u.email ?? '—'}</td>
                    <td className={tdClass}>{u.full_name ?? '—'}</td>
                    <td className={tdClass}>{u.dni ?? '—'}</td>
                    <td className={tdClass}>{formatDate(u.created_at)}</td>
                    <td className={tdClass}>
                      <Badge variant={u.suspended ? 'destructive' : 'secondary'}>
                        {u.suspended ? 'Suspendido' : 'Activo'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </section>

          <section>
            <h2 className="text-sm font-semibold font-display mb-2">Eventos</h2>
            <TableShell cols={['Evento', 'N° de evento', 'Estado', '']}>
              {(data?.events ?? []).length === 0 ? (
                <EmptyRow span={4} text="Sin eventos." />
              ) : (
                data.events.map((e: any) => (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className={tdClass}>{e.name}</td>
                    <td className={`${tdClass} font-mono text-xs`}>#{e.event_number}</td>
                    <td className={tdClass}>
                      <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                        {e.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/soporte?event=${e.id}`)}>
                        Ver soporte
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </section>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compra {detail?.purchase?.mp_payment_id ?? detail?.purchase?.id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>Contexto completo de la operación.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm max-h-[65vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <Row k="Fecha" v={formatDateTime(detail.purchase.created_at)} />
                <Row k="Estado" v={detail.purchase.status} />
                <Row k="Comprador" v={detail.purchase.buyer_email} />
                <Row k="Nombre" v={detail.purchase.buyer_name} />
                <Row k="Evento" v={detail.event?.name} />
                <Row k="Productora" v={detail.event?.productora_nombre} />
                <Row k="Subtotal" v={formatMoney(detail.purchase.subtotal)} />
                <Row k="Comisión Cupo" v={formatMoney(detail.purchase.service_fee)} />
                <Row k="Total" v={formatMoney(detail.purchase.total)} />
              </div>

              <div>
                <h3 className="font-medium mb-1.5">Ítems</h3>
                <ul className="space-y-1 text-muted-foreground">
                  {(detail.items ?? []).map((i: any, idx: number) => (
                    <li key={idx}>
                      {i.ticket_type} × {i.quantity} · {formatMoney(i.unit_price)}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-1.5">Tickets</h3>
                <TableShell cols={['Tanda', 'Código', 'Estado', 'Usado']}>
                  {(detail.tickets ?? []).length === 0 ? (
                    <EmptyRow span={4} text="Sin tickets generados." />
                  ) : (
                    detail.tickets.map((t: any) => (
                      <tr key={t.id}>
                        <td className={tdClass}>{t.ticket_type}</td>
                        <td className={`${tdClass} font-mono text-xs`}>{t.qr_code}</td>
                        <td className={tdClass}>{t.status === 'used' ? 'Usado' : 'Válido'}</td>
                        <td className={tdClass}>{t.used_at ? formatDateTime(t.used_at) : '—'}</td>
                      </tr>
                    ))
                  )}
                </TableShell>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right break-all">{v || '—'}</span>
    </div>
  );
}
