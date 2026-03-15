'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/types/order';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';

export const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.orderNumber ?? 'Draft'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => <DateDisplay date={row.original.createdAt} format="datetime" />,
  },
  {
    id: 'itemsCount',
    header: 'Items',
    cell: ({ row }) => row.original.items?.length ?? '—',
  },
  {
    accessorKey: 'subtotalAmount',
    header: 'Subtotal',
    cell: ({ row }) => <CurrencyDisplay amount={row.original.subtotalAmount} />,
  },
  {
    accessorKey: 'taxAmount',
    header: 'Tax',
    cell: ({ row }) => <CurrencyDisplay amount={row.original.taxAmount} />,
  },
  {
    accessorKey: 'discountAmount',
    header: 'Discount',
    cell: ({ row }) => <CurrencyDisplay amount={row.original.discountAmount} />,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => (
      <span className="font-medium">
        <CurrencyDisplay amount={row.original.totalAmount} />
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
