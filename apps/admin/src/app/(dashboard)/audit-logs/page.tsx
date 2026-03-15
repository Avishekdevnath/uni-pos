'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { getAuditLogColumns } from '@/components/features/audit-logs/audit-log-columns';
import { AuditLogDetail } from '@/components/features/audit-logs/audit-log-detail';
import type { AuditLog } from '@/types/audit';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EVENT_TYPES = [
  'order.completed',
  'order.cancelled',
  'payment.recorded',
  'inventory.deducted',
  'inventory.low_stock',
  'inventory.stock_in',
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [eventType, setEventType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', { page, pageSize, eventType, from, to }],
    queryFn: () =>
      fetchAuditLogs({
        page,
        page_size: pageSize,
        ...(eventType ? { event_type: eventType } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  const columns = getAuditLogColumns(expandedId, (id) =>
    setExpandedId(expandedId === id ? null : id),
  );

  const expandedLog = logs.find((l: AuditLog) => l.id === expandedId);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="System event trail" />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No audit logs found."
        toolbar={
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Select value={eventType || 'all'} onValueChange={(v) => { setEventType(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" className="w-36" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" className="w-36" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
              </div>
            </div>
          </div>
        }
      />

      {expandedLog && (
        <div className="rounded-md border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Payload — {expandedLog.eventType}</p>
          <AuditLogDetail payload={expandedLog.payload} />
        </div>
      )}
    </div>
  );
}
