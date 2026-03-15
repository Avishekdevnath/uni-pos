'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { InventoryMovement } from '@/types/inventory';
import { DateDisplay } from '@/components/shared/date-display';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const movementColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'productId',
    header: 'Product',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.productId}</span>
    ),
  },
  {
    accessorKey: 'movementType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.movementType.replace(/_/g, ' ')}
      </Badge>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ row }) => {
      const qty = row.original.quantity;
      return (
        <span className={qty > 0 ? 'text-green-600' : 'text-red-600'}>
          {qty > 0 ? `+${qty}` : qty}
        </span>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'orderId',
    header: 'Order',
    cell: ({ row }) =>
      row.original.orderId ? (
        <Link href={`/orders/${row.original.orderId}`} className="text-primary underline text-sm">
          View
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => <DateDisplay date={row.original.createdAt} format="datetime" />,
  },
];
