import { useEffect, useState } from 'react';
import { adminRpc, exportCsv, exportExcel, formatMoney, formatDateTime } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass } from './ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';

const COLS = [
  { key: 'productora_nombre', label: 'Productora' },
  { key: 'event_name', label: 'Evento' },
  { key: 'gross', label: 'Total recaudado' },
  { key: 'commission', label: 'Comisión Cupo' },
  { key: 'net', label: 'A transferir' },
  { key: 'status', label: 'Estado' },
  { key: 'paid_at', label: 'Fecha de pago' },
  { key: 'paid_by_email', label: 'Marcada por' },
];

export default function AdminSettlements() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [eventId, setEventId] = useState('all');
  const [events, setEvents] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [settlements, evs] = await Promise.all([
        adminRpc<any[]>('admin_settlements', {
          _from: from ? new Date(from).toISOString() : null,
          _to: to ? new Date(to + 'T23:59:59').toISOString() : null,
          _event_id: eventId === 'all' ? null : eventId,
        }),
        events.length ? Promise.resolve(events) : adminRpc<any[]>('admin_events', {}),
      ]);
      setRows(settlements ?? []);
      setEvents(evs ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar las liquidaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, eventId]);

  const mark = async (r: any, status: 'paid' | 'pending') => {
    try {
      await adminRpc('admin_mark_settlement', {
        _productora_id: r.productora_id,
        _event_id: r.event_id,
        _status: status,
      });
      toast.success(status === 'paid' ? 'Liquidación marcada como pagada' : 'Liquidación marcada como pendiente');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar la liquidación');
    }
  };

  const exportRows = rows.map((r) => ({
    ...r,
    gross: formatMoney(r.gross),
    commission: formatMoney(r.commission),
    net: formatMoney(r.net),
    status: r.status === 'paid' ? 'Pagado' : 'Pendiente',
    paid_at: r.paid_at ? formatDateTime(r.paid_at) : '',
  }));

  const totalNet = rows.reduce((a, r) => a + Number(r.net ?? 0), 0);
  const pendingNet = rows.filter((r) => r.status !== 'paid').reduce((a, r) => a + Number(r.net ?? 0), 0);

  return (
    <div>
      <PageHead
        title="Liquidaciones a productoras"
        description={`A transferir en total ${formatMoney(totalNet)} · pendiente ${formatMoney(pendingNet)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv('liquidaciones', COLS, exportRows)}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel('liquidaciones', COLS, exportRows)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Excel
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Desde</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Evento</label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="h-9 w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(from || to || eventId !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom('');
              setTo('');
              setEventId('all');
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <TableShell cols={[...COLS.map((c) => c.label), 'Acciones']}>
          {rows.length === 0 ? (
            <EmptyRow span={COLS.length + 1} text="No hay ventas aprobadas para liquidar." />
          ) : (
            rows.map((r) => (
              <tr key={`${r.productora_id}-${r.event_id}`} className="hover:bg-muted/40">
                <td className={tdClass}>{r.productora_nombre}</td>
                <td className={tdClass}>{r.event_name}</td>
                <td className={`${tdClass} tabular-nums`}>{formatMoney(r.gross)}</td>
                <td className={`${tdClass} tabular-nums`}>{formatMoney(r.commission)}</td>
                <td className={`${tdClass} tabular-nums font-medium`}>{formatMoney(r.net)}</td>
                <td className={tdClass}>
                  <Badge variant={r.status === 'paid' ? 'default' : 'secondary'}>
                    {r.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </td>
                <td className={tdClass}>{r.paid_at ? formatDateTime(r.paid_at) : '—'}</td>
                <td className={tdClass}>{r.paid_by_email ?? '—'}</td>
                <td className={tdClass}>
                  {r.status === 'paid' ? (
                    <Button variant="ghost" size="sm" onClick={() => mark(r, 'pending')}>
                      Revertir
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => mark(r, 'paid')}>
                      Marcar pagada
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </TableShell>
      )}
    </div>
  );
}
