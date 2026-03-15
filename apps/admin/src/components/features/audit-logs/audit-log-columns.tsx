'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@/types/audit';
import { DateDisplay } from '@/components/shared/date-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function getAuditLogColumns(
  expandedId: string | null,
  onToggleExpand: (id: string) => void,
): ColumnDef<AuditLog>[] {
  return [
    {
      id: 'expand',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleExpand(row.original.id)}>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${expandedId === row.original.id ? 'rotate-90' : ''}`}
          />
        </Button>
      ),
    },
    {
      accessorKey: 'eventType',
      header: 'Event',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.eventType}
        </Badge>
      ),
    },
    {
      id: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.entityType}{' '}
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.entityId?.slice(0, 8)}…
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'actorId',
      header: 'Actor',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.actorId?.slice(0, 8)}…
        </span>
      ),
    },
    {
      accessorKey: 'occurredAt',
      header: 'Time',
      cell: ({ row }) => <DateDisplay date={row.original.occurredAt} format="datetime" />,
    },
  ];
}
