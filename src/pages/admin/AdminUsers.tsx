import { useEffect, useState } from 'react';
import { adminRpc, exportCsv, exportExcel, formatMoney, formatDate, formatDateTime } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, Pager } from './ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Ban, RotateCcw, Ticket } from 'lucide-react';

const PAGE_SIZE = 25;

const COLS = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Nombre' },
  { key: 'dni', label: 'DNI' },
  { key: 'created_at', label: 'Registro' },
  { key: 'purchases', label: 'Compras' },
  { key: 'spent', label: 'Gastado' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'estado', label: 'Estado' },
];

export default function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [ticketsOf, setTicketsOf] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminRpc<any>('admin_users', {
        _search: query || null,
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
      });
      setRows(res?.rows ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page]);

  const suspend = async (u: any, value: boolean) => {
    try {
      await adminRpc('admin_set_user_suspended', { _id: u.id, _suspended: value });
      toast.success(value ? 'Cuenta suspendida' : 'Cuenta reactivada');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos actualizar la cuenta');
    }
  };

  const openTickets = async (u: any) => {
    setTicketsOf(u);
    setTickets([]);
    try {
      setTickets((await adminRpc<any[]>('admin_user_tickets', { _user_id: u.id })) ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar los tickets');
    }
  };

  const exportRows = rows.map((r) => ({
    ...r,
    created_at: formatDate(r.created_at),
    spent: formatMoney(r.spent),
    estado: r.suspended ? 'Suspendido' : 'Activo',
  }));

  return (
    <div>
      <PageHead
        title="Usuarios"
        description={`${total.toLocaleString('es-AR')} cuentas registradas.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv('usuarios', COLS, exportRows)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel('usuarios', COLS, exportRows)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel
            </Button>
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(search.trim());
        }}
        className="mb-4 flex gap-2"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email, nombre o DNI"
          className="h-9 max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <TableShell cols={['Usuario', 'DNI', 'Registro', 'Compras', 'Gastado', 'Tickets', 'Estado', 'Acciones']}>
            {rows.length === 0 ? (
              <EmptyRow span={8} text="No hay usuarios con ese criterio." />
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className={tdClass}>
                    <div className="font-medium max-w-[220px] truncate">{r.email ?? '—'}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {r.full_name ?? '—'}
                      {Array.isArray(r.roles) && r.roles.length > 0 && ` · ${r.roles.join(', ')}`}
                    </div>
                  </td>
                  <td className={tdClass}>{r.dni ?? '—'}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDate(r.created_at)}</td>
                  <td className={`${tdClass} tabular-nums`}>{r.purchases}</td>
                  <td className={`${tdClass} tabular-nums`}>{formatMoney(r.spent)}</td>
                  <td className={`${tdClass} tabular-nums`}>{r.tickets}</td>
                  <td className={tdClass}>
                    <Badge variant={r.suspended ? 'destructive' : 'secondary'}>
                      {r.suspended ? 'Suspendido' : 'Activo'}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openTickets(r)}>
                        <Ticket className="h-3.5 w-3.5 mr-1" /> Tickets
                      </Button>
                      {r.suspended ? (
                        <Button variant="ghost" size="sm" onClick={() => suspend(r, false)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivar
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => suspend(r, true)}>
                          <Ban className="h-3.5 w-3.5 mr-1" /> Suspender
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableShell>
          <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Dialog open={!!ticketsOf} onOpenChange={(o) => !o && setTicketsOf(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tickets de {ticketsOf?.email}</DialogTitle>
            <DialogDescription>{tickets.length} tickets asociados a esta cuenta.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <TableShell cols={['Evento', 'Tanda', 'Código', 'Origen', 'Estado', 'Usado']}>
              {tickets.length === 0 ? (
                <EmptyRow span={6} text="Sin tickets." />
              ) : (
                tickets.map((t) => (
                  <tr key={t.id}>
                    <td className={tdClass}>{t.event_name}</td>
                    <td className={tdClass}>{t.ticket_type}</td>
                    <td className={`${tdClass} font-mono text-xs`}>{t.qr_code}</td>
                    <td className={tdClass}>{t.source === 'courtesy' ? 'Cortesía' : 'Compra'}</td>
                    <td className={tdClass}>
                      <Badge variant={t.status === 'used' ? 'secondary' : 'default'}>
                        {t.status === 'used' ? 'Usado' : t.status === 'valid' ? 'Válido' : t.status}
                      </Badge>
                    </td>
                    <td className={tdClass}>{t.used_at ? formatDateTime(t.used_at) : '—'}</td>
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
