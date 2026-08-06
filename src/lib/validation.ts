/**
 * Validates an event date (yyyy-MM-dd): cannot be in the past nor more than
 * 5 years from today. Returns an error message in Spanish, or null when valid.
 */
export function validateEventDate(date?: string | null): string | null {
  if (!date) return 'Ingresá la fecha del evento';
  const parts = date.split('-');
  if (parts.length !== 3) return 'La fecha no tiene un formato válido';
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return 'La fecha no tiene un formato válido';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return 'La fecha del evento no puede ser anterior a hoy';

  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 5);
  if (d > max) {
    return `La fecha no puede ser posterior a ${max.getFullYear()}. Revisá el año ingresado (${parts[0]}).`;
  }
  return null;
}

/** Min/max values for <input type="date"> on event forms. */
export function eventDateLimits() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 5);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { min: iso(today), max: iso(max) };
}
