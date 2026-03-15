import type { Payment } from '@/types/payment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';

interface OrderPaymentsTableProps {
  payments: Payment[];
}

export function OrderPaymentsTable({ payments }: OrderPaymentsTableProps) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments recorded.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Cash Tendered</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Received At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{p.method}</Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              <CurrencyDisplay amount={p.amount} />
            </TableCell>
            <TableCell className="text-right">
              {p.cashTendered != null ? <CurrencyDisplay amount={p.cashTendered} /> : '—'}
            </TableCell>
            <TableCell>
              <StatusBadge status={p.status} />
            </TableCell>
            <TableCell>
              <DateDisplay date={p.receivedAt ?? p.createdAt} format="datetime" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
