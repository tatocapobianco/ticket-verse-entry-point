import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { STATUS_LABEL, pctChange } from '@/lib/admin';

export const thClass =
  'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap';
export const tdClass = 'px-3 py-2 text-sm align-middle border-t border-border';

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Card className={`rounded-lg border-border shadow-none ${className}`}>{children}</Card>;
}

export function StatCard({
  label,
  value,
  current,
  previous,
  hint,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  hint?: string;
}) {
  const delta = current !== undefined && previous !== undefined ? pctChange(current, previous) : null;
  const up = (delta ?? 0) >= 0;
  return (
    <AdminCard className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold font-display tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== null && (
          <span className={`inline-flex items-center gap-0.5 font-medium ${up ? 'text-primary' : 'text-destructive'}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </AdminCard>
  );
}

export function TableShell({ children, cols }: { children: ReactNode; cols: string[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="bg-muted/60">
          <tr>
            {cols.map((c) => (
              <th key={c} className={thClass}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ span, text = 'Sin resultados' }: { span: number; text?: string }) {
  return (
    <tr>
      <td className={`${tdClass} text-center text-muted-foreground py-8`} colSpan={span}>
        {text}
      </td>
    </tr>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-muted-foreground">
        {total.toLocaleString('es-AR')} registros · página {page + 1} de {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const variant =
    s === 'approved' || s === 'paid'
      ? 'default'
      : s === 'pending'
        ? 'secondary'
        : 'destructive';
  return <Badge variant={variant as any}>{STATUS_LABEL[s] ?? status}</Badge>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

export function PageHead({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold font-display">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
