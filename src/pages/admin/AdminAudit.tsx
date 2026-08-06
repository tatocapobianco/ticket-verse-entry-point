import { useEffect, useState } from 'react';
import { adminRpc, exportCsv, formatDateTime } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, Pager } from './ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  event_updated: 'Evento editado',
  event_deleted: 'Evento eliminado',
  user_suspended: 'Usuario suspendido',
  user_reactivated: 'Usuario reactivado',
  productora_suspended: 'Productora suspendida',
  productora_reactivated: 'Productora reactivada',
  productora_updated: 'Productora editada',
  settlement_paid: 'Liquidación marcada como pagada',
  settlement_pending: 'Liquidación vuelta a pendiente',
  courtesy_revoked: 'Cortesía revocada',
  rrpp_disabled: 'RRPP desactivado',
  rrpp_enabled: 'RRPP reactivado',
  ticket_marked_used: 'Ticket marcado como usado',
  ticket_reverted: 'Ticket revertido',
  ticket_resent: 'Ticket reenviado',
  admin_granted: 'Administrador dado de alta',
  admin_revoked: 'Administrador dado de baja',
};

const ENTITY_LABEL: Record<string, string> = {
  event: 'Evento',
  user: 'Usuario',
  productora: 'Productora',
  settlement: 'Liquidación',
  courtesy_link: 'Cortesía',
  event_rrpp: 'RRPP',
  ticket: 'Ticket',
};

const COLS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'actor_email', label: 'Administrador' },
  { key: 'accion', label: 'Acción' },
  { key: 'entidad', label: 'Tipo' },
  { key: 'entity_label', label: 'Registro' },
  { key: 'entity_id', label: 'ID' },
];

export default function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminRpc<any>('admin_audit', { _limit: PAGE_SIZE, _offset: page * PAGE_SIZE });
        setRows(res?.rows ?? []);
        setTotal(Number(res?.total ?? 0));
      } catch (e: any) {
        toast.error(e.message ?? 'No pudimos cargar el registro de actividad');
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const exportRows = rows.map((r) => ({
    ...r,
    created_at: formatDateTime(r.created_at),
    accion: ACTION_LABEL[r.action] ?? r.action,
    entidad: ENTITY_LABEL[r.entity_type] ?? r.entity_type,
  }));

  return (
    <div>
      <PageHead
        title="Registro de actividad"
        description="Toda acción sensible o destructiva del panel queda registrada acá."
        actions={
          <Button variant="outline" size="sm" onClick={() => exportCsv('registro-actividad', COLS, exportRows)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <>
          <TableShell cols={['Fecha', 'Administrador', 'Acción', 'Registro afectado', 'Detalle']}>
            {rows.length === 0 ? (
              <EmptyRow span={5} text="Todavía no hay actividad registrada." />
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.created_at)}</td>
                  <td className={tdClass}>
                    <div className="max-w-[200px] truncate">{r.actor_email ?? '—'}</div>
                  </td>
                  <td className={tdClass}>
                    <Badge variant={r.action?.includes('deleted') || r.action?.includes('suspended') || r.action?.includes('revoked') ? 'destructive' : 'secondary'}>
                      {ACTION_LABEL[r.action] ?? r.action}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <div className="font-medium">{r.entity_label ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {ENTITY_LABEL[r.entity_type] ?? r.entity_type} · <span className="font-mono">{String(r.entity_id ?? '').slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className={`${tdClass} max-w-[280px]`}>
                    <code className="text-xs text-muted-foreground break-all">
                      {r.details && Object.keys(r.details).length ? JSON.stringify(r.details) : '—'}
                    </code>
                  </td>
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
