export type DocumentDateType = 'SINGLE_DATE' | 'CONTRACT_PERIOD';

type DateInput = Date | string | number | null | undefined;

const LOCALE = 'de-DE';

/** Consistent DD.MM.YYYY formatting used across list views, PDFs, and print views. */
export function formatDate(date: DateInput): string {
  if (!date) return '—';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Renders either a single formatted date or a "From – To" contract period, using the same date format. */
export function formatDateOrPeriod(
  dateType: DocumentDateType | null | undefined,
  date: DateInput,
  toDate?: DateInput
): string {
  if (dateType === 'CONTRACT_PERIOD' && toDate) {
    return `${formatDate(date)} – ${formatDate(toDate)}`;
  }
  return formatDate(date);
}

/** Converts a date to the yyyy-mm-dd string expected by <input type="date">. */
export function toDateInputValue(date: DateInput): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}
