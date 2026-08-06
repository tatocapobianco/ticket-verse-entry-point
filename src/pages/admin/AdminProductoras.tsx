import { useEffect, useState } from 'react';
import { adminRpc, exportCsv, exportExcel, formatMoney, formatDate } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass } from './ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Pencil, Ban, RotateCcw } from 'lucide-react';

const COLS = [
  { key: 'nombre', label: 'Productora' },
  { key: 'owner_email', label: 'Cuenta' },
  { key: 'email_contacto', label: 'Email de contacto' },
  { key: 'telefono_contacto', label: 'Teléfono' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'events_count', label: 'Eventos' },
  { key: 'tickets_sold', label: 'Entradas vendidas' },
  { key: 'revenue', label: 'Facturación' },
  { key: 'created_at', label: 'Alta' },
];

export default function AdminProductoras() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [suspend, setSuspend] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState<any>(null);

  const load = async (q = search) => {
    setLoading(true);
    try {
      setRows((await adminRpc<any[]>('admin_productoras', { _search: q || null })) ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar las productoras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEdit = async () => {
    try {
      await adminRpc('admin_update_productora', {
        _id: edit.id,
        _patch: {
          nombre: edit.nombre,
          descripcion: edit.descripcion,
          instagram: edit.instagram,
          telefono_contacto: edit.telefono_contacto,
          email_contacto: edit.email_contacto,
        },
      });
      toast.success('Productora actualizada');
      setEdit(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos guardar');
    }
  };

  const doSuspend = async (p: any, value: boolean) => {
    try {
      await adminRpc('admin_set_productora_suspended', {
        _id: p.id,
        _suspended: value,
        _reason: value ? reason || null : null,
      });
      toast.success(value ? 'Productora suspendida' : 'Productora reactivada');
      setSuspend(null);
      setReason('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar');
    }
  };

  const exportRows = rows.map((r) => ({
    ...r,
    revenue: formatMoney(r.revenue),
    created_at: formatDate(r.created_at),
  }));

  return (
    <div>
      <PageHead
        title="Productoras"
        description={`${rows.length} productoras en la plataforma.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv('productoras', COLS, exportRows)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel('productoras', COLS, exportRows)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel
            </Button>
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-4 flex gap-2"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="h-9 max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <TableShell cols={['Productora', 'Cuenta', 'Contacto', 'Eventos', 'Entradas', 'Facturación', 'Estado', 'Acciones']}>
          {rows.length === 0 ? (
            <EmptyRow span={8} text="No hay productoras." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className={tdClass}>
                  <button className="text-left hover:underline font-medium" onClick={() => setDetail(r)}>
                    {r.nombre}
                  </button>
                  <div className="text-xs text-muted-foreground">/{r.slug}</div>
                </td>
                <td className={tdClass}>
                  <div className="max-w-[190px] truncate">{r.owner_email ?? '—'}</div>
                </td>
                <td className={tdClass}>
                  <div className="text-xs">{r.email_contacto ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{r.telefono_contacto ?? '—'}</div>
                </td>
                <td className={`${tdClass} tabular-nums`}>{r.events_count}</td>
                <td className={`${tdClass} tabular-nums`}>{r.tickets_sold}</td>
                <td className={`${tdClass} tabular-nums`}>{formatMoney(r.revenue)}</td>
                <td className={tdClass}>
                  <Badge variant={r.suspended ? 'destructive' : 'secondary'}>
                    {r.suspended ? 'Suspendida' : 'Activa'}
                  </Badge>
                </td>
                <td className={tdClass}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEdit({ ...r })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {r.suspended ? (
                      <Button variant="ghost" size="sm" onClick={() => doSuspend(r, false)}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivar
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setSuspend(r)}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Suspender
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </TableShell>
      )}

      {/* Detalle */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.nombre}</DialogTitle>
            <DialogDescription>Detalle de la productora</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <Row k="Cuenta" v={detail.owner_email} />
              <Row k="Responsable" v={detail.owner_name} />
              <Row k="Email de contacto" v={detail.email_contacto} />
              <Row k="Teléfono" v={detail.telefono_contacto} />
              <Row k="Instagram" v={detail.instagram} />
              <Row k="Perfil público" v={`/productora/${detail.slug}`} />
              <Row k="Eventos" v={String(detail.events_count)} />
              <Row k="Entradas vendidas" v={String(detail.tickets_sold)} />
              <Row k="Facturación" v={formatMoney(detail.revenue)} />
              <Row k="Alta" v={formatDate(detail.created_at)} />
              {detail.descripcion && <p className="text-muted-foreground pt-2">{detail.descripcion}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edición */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar productora</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={edit.nombre ?? ''} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email de contacto</Label>
                <Input value={edit.email_contacto ?? ''} onChange={(e) => setEdit({ ...edit, email_contacto: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={edit.telefono_contacto ?? ''} onChange={(e) => setEdit({ ...edit, telefono_contacto: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={edit.instagram ?? ''} onChange={(e) => setEdit({ ...edit, instagram: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea value={edit.descripcion ?? ''} onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspensión */}
      <Dialog open={!!suspend} onOpenChange={(o) => !o && (setSuspend(null), setReason(''))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suspender “{suspend?.nombre}”</DialogTitle>
            <DialogDescription>
              Sus eventos quedan despublicados y en estado inactivo. La acción queda registrada en el historial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspend(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => doSuspend(suspend, true)}>Suspender</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right break-all">{v || '—'}</span>
    </div>
  );
}
