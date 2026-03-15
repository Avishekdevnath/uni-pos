'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { DiscountPreset } from '@/types/discount';
import { StatusBadge } from '@/components/shared/status-badge';
import { DateDisplay } from '@/components/shared/date-display';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function getDiscountColumns(
  onArchive: (preset: DiscountPreset) => void,
): ColumnDef<DiscountPreset>[] {
  return [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) =>
        row.original.type === 'percentage'
          ? `${row.original.value}%`
          : <CurrencyDisplay amount={row.original.value} />,
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => <span className="capitalize">{row.original.scope.replace('_', ' ')}</span>,
    },
    {
      accessorKey: 'isCombinable',
      header: 'Combinable',
      cell: ({ row }) => (
        <Badge variant={row.original.isCombinable ? 'default' : 'secondary'}>
          {row.original.isCombinable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'validFrom',
      header: 'Valid From',
      cell: ({ row }) =>
        row.original.validFrom ? <DateDisplay date={row.original.validFrom} /> : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }) =>
        row.original.validUntil ? <DateDisplay date={row.original.validUntil} /> : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/discounts/${row.original.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(row.original)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
