'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { Category } from '@/types/category';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface CategoryActionsProps {
  category: Category;
  allCategories: Category[];
  onEdit: (category: Category) => void;
  onArchive: (category: Category) => void;
}

function CategoryActions({ category, onEdit, onArchive }: CategoryActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(category)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getCategoryColumns(
  allCategories: Category[],
  onEdit: (category: Category) => void,
  onArchive: (category: Category) => void,
): ColumnDef<Category>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'parentId',
      header: 'Parent Category',
      cell: ({ row }) => {
        const parent = allCategories.find((c) => c.id === row.original.parentId);
        return parent ? <span>{parent.name}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <CategoryActions
          category={row.original}
          allCategories={allCategories}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ),
    },
  ];
}
