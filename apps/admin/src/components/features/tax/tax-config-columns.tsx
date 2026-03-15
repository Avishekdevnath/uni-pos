'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { TaxConfig } from '@/types/tax';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

export function getTaxConfigColumns(
  onEdit: (config: TaxConfig) => void,
  onArchive: (config: TaxConfig) => void,
): ColumnDef<TaxConfig>[] {
  return [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => `${row.original.rate}%`,
    },
    {
      accessorKey: 'isInclusive',
      header: 'Inclusive',
      cell: ({ row }) => (
        <Badge variant={row.original.isInclusive ? 'default' : 'secondary'}>
          {row.original.isInclusive ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Sort',
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
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
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
