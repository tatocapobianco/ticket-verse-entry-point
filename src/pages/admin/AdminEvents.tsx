import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Download, FileSpreadsheet, Pencil, Trash2, EyeOff, Eye, LifeBuoy } from 'lucide-react';

const COLS = [
  { key: 'name', label: 'Evento' },
  { key: 'event_number', label: 'N° de evento' },
  { key: 'productora_nombre', label: 'Productora' },
  { key: 'event_date', label: 'Fecha' },
  { key: 'location', label: 'Lugar' },
  { key: 'status', label: 'Estado' },
  { key: 'visibility', label: 'Visibilidad' },
  { key: 'tickets_sold', label: 'Entradas vendidas' },
  { key: 'revenue', label: 'Facturación' },
];

export default function AdminEvents() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [confirmName, setConfirmName] = useState('');
  const navigate = useNavigate();

  const load = async (q = search) => {
    setLoading(true);
    try {
      setRows((await adminRpc<any[]>('admin_events', { _search: q || null })) ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (id: string, p: Record<string, unknown>, msg: string) => {
    try {
      await adminRpc('admin_update_event', { _id: id, _patch: p });
      toast.success(msg);
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar el evento');
    }
  };

  const saveEdit = async () => {
    await patch(
      edit.id,
      {
        name: edit.name,
        description: edit.description,
        location: edit.location,
        event_date: edit.event_date,
        event_time: edit.event_time,
        status: edit.status,
        is_public: edit.is_public,
      },
      'Evento actualizado',
    );
    setEdit(null);
  };

  const doDelete = async () => {
    try {
      await adminRpc('admin_delete_event', { _id: del.id });
      toast.success('Evento eliminado');
      setDel(null);
      setConfirmName('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos eliminar el evento');
    }
  };

  const exportRows = rows.map((r) => ({
    ...r,
    event_date: formatDate(r.event_date),
    visibility: r.is_public ? 'Público' : 'Oculto',
    revenue: formatMoney(r.revenue),
  }));

  return (
    <div>
      <PageHead
        title="Eventos"
        description={`${rows.length} eventos en toda la plataforma.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv('eventos', COLS, exportRows)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel('eventos', COLS, exportRows)}>
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
          placeholder="Buscar por nombre, N° de evento o productora"
          className="h-9 max-w-sm"
        />
        <Button type="submit" variant="outline" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <TableShell cols={['Evento', 'Productora', 'Fecha', 'Estado', 'Visibilidad', 'Entradas', 'Facturación', 'Acciones']}>
          {rows.length === 0 ? (
            <EmptyRow span={8} text="No hay eventos." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className={tdClass}>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">#{r.event_number}</div>
                </td>
                <td className={tdClass}>{r.productora_nombre ?? '—'}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDate(r.event_date)}</td>
                <td className={tdClass}>
                  <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>
                    {r.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className={tdClass}>
                  <Badge variant="outline">{r.is_public ? 'Público' : 'Oculto'}</Badge>
                </td>
                <td className={`${tdClass} tabular-nums`}>{r.tickets_sold}</td>
                <td className={`${tdClass} tabular-nums`}>{formatMoney(r.revenue)}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" title="Editar" onClick={() => setEdit({ ...r })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={r.is_public ? 'Ocultar' : 'Publicar'}
                      onClick={() => patch(r.id, { is_public: !r.is_public }, r.is_public ? 'Evento oculto' : 'Evento publicado')}
                    >
                      {r.is_public ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        patch(
                          r.id,
                          { status: r.status === 'active' ? 'inactive' : 'active' },
                          r.status === 'active' ? 'Evento despublicado' : 'Evento reactivado',
                        )
                      }
                    >
                      {r.status === 'active' ? 'Despublicar' : 'Reactivar'}
                    </Button>
                    <Button variant="ghost" size="sm" title="Soporte" onClick={() => navigate(`/admin/soporte?event=${r.id}`)}>
                      <LifeBuoy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </TableShell>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" value={edit.event_date ?? ''} onChange={(e) => setEdit({ ...edit, event_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora</Label>
                  <Input type="time" value={(edit.event_time ?? '').slice(0, 5)} onChange={(e) => setEdit({ ...edit, event_time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Lugar</Label>
                <Input value={edit.location ?? ''} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && (setDel(null), setConfirmName(''))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar evento</DialogTitle>
            <DialogDescription>
              {Number(del?.tickets_sold ?? 0) > 0 ? (
                <span className="text-destructive font-medium">
                  Atención: este evento tiene {del?.tickets_sold} entradas vendidas por {formatMoney(del?.revenue)}. Al
                  eliminarlo se borran sus tickets y compras asociadas.
                </span>
              ) : (
                'Esta acción no se puede deshacer.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>
              Para confirmar, escribí el nombre exacto del evento: <strong>{del?.name}</strong>
            </Label>
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={confirmName.trim() !== (del?.name ?? '')} onClick={doDelete}>
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
