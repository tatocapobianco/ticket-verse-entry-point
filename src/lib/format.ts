import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formats a date + optional time into a human-readable Spanish string.
 * Example: "Viernes 31 de julio a las 22:28hs"
 */
export function formatEventDate(date?: string | null, time?: string | null): string {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    const day = format(d, "EEEE d 'de' MMMM", { locale: es });
    const capitalized = day.charAt(0).toUpperCase() + day.slice(1);
    if (time) {
      const t = time.slice(0, 5);
      return `${capitalized} a las ${t}hs`;
    }
    return capitalized;
  } catch {
    return `${date}${time ? ' ' + time : ''}`;
  }
}

/**
 * Formats a datetime string into a legible Spanish label with time.
 */
export function formatDateTimeLong(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = format(d, "EEEE d 'de' MMMM", { locale: es });
    const capitalized = day.charAt(0).toUpperCase() + day.slice(1);
    const t = format(d, 'HH:mm', { locale: es });
    return `${capitalized} a las ${t}hs`;
  } catch {
    return iso;
  }
}

/**
 * Formats an amount as Argentine pesos with thousand separators.
 * Example: 10000 -> "$10.000"
 */
export function formatARS(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '$0';
  return '$' + Math.round(n).toLocaleString('es-AR');
}
