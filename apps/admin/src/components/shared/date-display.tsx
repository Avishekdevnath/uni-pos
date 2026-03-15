import { formatDate, formatDateTime, formatRelative } from '@/lib/utils';

interface DateDisplayProps {
  date: string | Date;
  format?: 'date' | 'datetime' | 'relative';
}

export function DateDisplay({ date, format = 'date' }: DateDisplayProps) {
  if (format === 'datetime') return <span>{formatDateTime(date)}</span>;
  if (format === 'relative') return <span>{formatRelative(date)}</span>;
  return <span>{formatDate(date)}</span>;
}
