'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { TaxGroup } from '@/types/tax';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react';

export function getTaxGroupColumns(
  expandedId: string | null,
  onToggleExpand: (id: string) => void,
  onEdit: (group: TaxGroup) => void,
  onArchive: (group: TaxGroup) => void,
): ColumnDef<TaxGroup>[] {
  return [
    {
      id: 'expand',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleExpand(row.original.id)}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${expandedId === row.original.id ? 'rotate-90' : ''}`}
          />
        </Button>
      ),
    },
    { accessorKey: 'name', header: 'Name' },
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
