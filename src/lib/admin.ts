import { supabase } from '@/integrations/supabase/client';

/** Todas las consultas del panel pasan por funciones SECURITY DEFINER
 *  que validan el rol super_admin del lado del servidor. */
export async function adminRpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (supabase as any).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const ADMIN_IDLE_MS = 30 * 60 * 1000;

export function formatMoney(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '$0';
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado',
  paid: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
};

function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

export function exportCsv(filename: string, columns: { key: string; label: string }[], rows: any[]) {
  const head = columns.map((c) => `"${c.label}"`).join(';');
  const body = rows
    .map((r) => columns.map((c) => `"${cell(r[c.key]).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  download(`${filename}.csv`, '\uFEFF' + head + '\n' + body, 'text/csv;charset=utf-8');
}

/** Excel: tabla HTML con extensión .xls, se abre nativamente en Excel y Sheets. */
export function exportExcel(filename: string, columns: { key: string; label: string }[], rows: any[]) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(cell(r[c.key]))}</td>`).join('')}</tr>`)
    .join('');
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  download(`${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
}
