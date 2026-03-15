import type { OrderItem } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/currency-display';

interface OrderItemsTableProps {
  items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-right">Tax</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.productNameSnapshot}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {item.skuSnapshot ?? '—'}
            </TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">
              <CurrencyDisplay amount={item.unitPrice} />
            </TableCell>
            <TableCell className="text-right">
              <CurrencyDisplay amount={item.lineDiscountAmount} />
            </TableCell>
            <TableCell className="text-right">
              <CurrencyDisplay amount={item.taxAmount} />
            </TableCell>
            <TableCell className="text-right font-medium">
              <CurrencyDisplay amount={item.lineTotal} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
