import { formatCurrency } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
}

export function CurrencyDisplay({ amount, currency }: CurrencyDisplayProps) {
  return <span>{formatCurrency(amount, currency)}</span>;
}
