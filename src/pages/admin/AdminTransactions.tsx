import { useEffect, useState } from 'react';
import { adminRpc, exportCsv, exportExcel, formatMoney, formatDateTime, STATUS_LABEL } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, Pager, StatusBadge } from './ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Search } from 'lucide-react';

const PAGE_SIZE = 25;

const COLS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'buyer_email', label: 'Comprador' },
  { key: 'event_name', label: 'Evento' },
  { key: 'productora_nombre', label: 'Productora' },
  { key: 'tandas', label: 'Tanda' },
  { key: 'total', label: 'Monto' },
  { key: 'commission', label: 'Comisión' },
  { key: 'method', label: 'Medio de pago' },
  { key: 'status', label: 'Estado' },
  { key: 'mp_payment_id', label: 'N° de operación' },
];

export default function AdminTransactions() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [productora, setProductora] = useState('all');
  const [eventId, setEventId] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [productoras, setProductoras] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [prs, evs] = await Promise.all([
          adminRpc<any[]>('admin_productoras', {}),
          adminRpc<any[]>('admin_events', {}),
        ]);
        setProductoras(prs ?? []);
        setEvents(evs ?? []);
      } catch {
        /* filtros opcionales */
      }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminRpc<any>('admin_transactions', {
        _from: from ? new Date(from).toISOString() : null,
        _to: to ? new Date(to + 'T23:59:59').toISOString() : null,
        _productora_id: productora === 'all' ? null : productora,
        _event_id: eventId === 'all' ? null : eventId,
        _status: status === 'all' ? null : status,
        _search: query || null,
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
      });
      setRows(res?.rows ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status, productora, eventId, query, page]);

  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status, productora, eventId, query]);

  const buildExport = async () => {
    const res = await adminRpc<any>('admin_transactions', {
      _from: from ? new Date(from).toISOString() : null,
      _to: to ? new Date(to + 'T23:59:59').toISOString() : null,
      _productora_id: productora === 'all' ? null : productora,
      _event_id: eventId === 'all' ? null : eventId,
      _status: status === 'all' ? null : status,
      _search: query || null,
      _limit: 5000,
      _offset: 0,
    });
    return (res?.rows ?? []).map((r: any) => ({
      ...r,
      created_at: formatDateTime(r.created_at),
      total: formatMoney(r.total),
      commission: formatMoney(r.commission),
      status: STATUS_LABEL[r.status] ?? r.status,
    }));
  };

  const doExport = async (kind: 'csv' | 'xls') => {
    try {
      const data = await buildExport();
      if (kind === 'csv') exportCsv('transacciones', COLS, data);
      else exportExcel('transacciones', COLS, data);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos exportar');
    }
  };

  return (
    <div>
      <PageHead
        title="Transacciones"
        description="Todos los pagos de la plataforma."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => doExport('csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => doExport('xls')}>
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
          <label className="block text-xs text-muted-foreground mb-1">Productora</label>
          <Select value={productora} onValueChange={setProductora}>
            <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {productoras.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Evento</label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Estado</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
          className="relative"
        >
          <label className="block text-xs text-muted-foreground mb-1">Buscar</label>
          <Search className="absolute left-2.5 bottom-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email o N° de operación"
            className="h-9 w-[230px] pl-8"
          />
        </form>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <TableShell cols={COLS.map((c) => c.label)}>
            {rows.length === 0 ? (
              <EmptyRow span={COLS.length} text="No hay transacciones con estos filtros." />
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.created_at)}</td>
                  <td className={tdClass}>
                    <div className="max-w-[200px] truncate">{r.buyer_email ?? '—'}</div>
                    {r.buyer_name && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{r.buyer_name}</div>}
                  </td>
                  <td className={tdClass}>{r.event_name}</td>
                  <td className={tdClass}>{r.productora_nombre ?? '—'}</td>
                  <td className={`${tdClass} max-w-[180px]`}>{r.tandas ?? '—'}</td>
                  <td className={`${tdClass} tabular-nums`}>{formatMoney(r.total)}</td>
                  <td className={`${tdClass} tabular-nums`}>{formatMoney(r.commission)}</td>
                  <td className={tdClass}>{r.mp_payment_id ? 'MercadoPago' : '—'}</td>
                  <td className={tdClass}><StatusBadge status={r.status} /></td>
                  <td className={`${tdClass} font-mono text-xs`}>{r.mp_payment_id ?? r.id.slice(0, 8)}</td>
                </tr>
              ))
            )}
          </TableShell>
          <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
