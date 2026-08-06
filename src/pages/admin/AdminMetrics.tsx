import { useEffect, useMemo, useState } from 'react';
import { adminRpc, formatMoney } from '@/lib/admin';
import { PageHead, StatCard, Spinner, AdminCard } from './ui';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const RANGES = [
  { key: '7', label: 'Últimos 7 días' },
  { key: '30', label: 'Últimos 30 días' },
  { key: '90', label: 'Últimos 90 días' },
  { key: '365', label: 'Último año' },
];

export default function AdminMetrics() {
  const [range, setRange] = useState('30');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - Number(range) * 24 * 60 * 60 * 1000);
      const res = await adminRpc('admin_metrics', {
        _from: from.toISOString(),
        _to: to.toISOString(),
        _granularity: granularity,
      });
      setData(res);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, granularity]);

  const series = useMemo(() => {
    const rows: any[] = data?.series ?? [];
    return rows.map((r) => ({
      label: new Date(r.bucket).toLocaleDateString('es-AR', {
        day: granularity === 'month' ? undefined : '2-digit',
        month: '2-digit',
        year: granularity === 'month' ? '2-digit' : undefined,
      }),
      gmv: Number(r.gmv ?? 0),
      comision: Number(r.commission ?? 0),
    }));
  }, [data, granularity]);

  if (loading && !data) return <Spinner />;

  const c = data?.current ?? {};
  const p = data?.previous ?? {};

  return (
    <div>
      <PageHead
        title="Métricas y facturación"
        description="Comparado contra el período anterior de la misma duración."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[170px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as any)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por día</SelectItem>
                <SelectItem value="week">Por semana</SelectItem>
                <SelectItem value="month">Por mes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load}>
              Actualizar
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Volumen transaccionado (GMV)"
          value={formatMoney(c.gmv)}
          current={Number(c.gmv ?? 0)}
          previous={Number(p.gmv ?? 0)}
        />
        <StatCard
          label="Comisión ganada por Cupo"
          value={formatMoney(c.commission)}
          current={Number(c.commission ?? 0)}
          previous={Number(p.commission ?? 0)}
        />
        <StatCard
          label="Entradas vendidas"
          value={Number(c.tickets ?? 0).toLocaleString('es-AR')}
          current={Number(c.tickets ?? 0)}
          previous={Number(p.tickets ?? 0)}
        />
        <StatCard
          label="Ticket promedio"
          value={formatMoney(c.avg_ticket)}
          hint={`${Number(c.orders ?? 0).toLocaleString('es-AR')} operaciones`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-3">
        <StatCard label="Eventos activos" value={Number(data?.active_events ?? 0).toLocaleString('es-AR')} hint={`${Number(data?.total_events ?? 0)} en total`} />
        <StatCard label="Productoras" value={Number(data?.productoras ?? 0).toLocaleString('es-AR')} />
        <StatCard label="Usuarios registrados" value={Number(data?.users ?? 0).toLocaleString('es-AR')} />
        <StatCard label="Operaciones aprobadas" value={Number(c.orders ?? 0).toLocaleString('es-AR')} current={Number(c.orders ?? 0)} previous={Number(p.orders ?? 0)} />
      </div>

      <AdminCard className="mt-4 p-4">
        <p className="text-sm font-medium mb-3">Evolución de ventas</p>
        {series.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Todavía no hay ventas aprobadas en este período.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70}
                  tickFormatter={(v) => formatMoney(v)} />
                <Tooltip
                  formatter={(v: any, n: any) => [formatMoney(v), n === 'gmv' ? 'GMV' : 'Comisión']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                />
                <Line type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="comision" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
