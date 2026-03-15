'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { InventoryBalance } from '@/types/inventory';

export const balanceColumns: ColumnDef<InventoryBalance>[] = [
  {
    id: 'productName',
    header: 'Product',
    cell: ({ row }) => row.original.product?.name ?? row.original.productId,
  },
  {
    id: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.product?.sku ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'onHandQty',
    header: 'On Hand',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.onHandQty}</span>
    ),
  },
];
