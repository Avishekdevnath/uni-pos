'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchDiscountPresets, archiveDiscountPreset } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { getDiscountColumns } from '@/components/features/discounts/discount-columns';
import type { DiscountPreset } from '@/types/discount';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [scope, setScope] = useState('');
  const [status, setStatus] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<DiscountPreset | null>(null);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['discounts', { page, pageSize, scope, status }],
    queryFn: () =>
      fetchDiscountPresets({
        page,
        page_size: pageSize,
        ...(scope ? { scope } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveDiscountPreset(id),
    onSuccess: () => {
      toast.success('Discount archived');
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setArchiveTarget(null);
    },
    onError: () => toast.error('Failed to archive discount'),
  });

  const columns = getDiscountColumns((preset) => setArchiveTarget(preset));

  return (
    <div className="space-y-6">
      <PageHeader title="Discount Presets">
        <Button asChild>
          <Link href="/discounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Preset
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={presets}
        isLoading={isLoading}
        toolbar={
          <div className="flex gap-3">
            <Select value={scope || 'all'} onValueChange={(v) => { setScope(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scopes</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="line_item">Line item</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyMessage="No discount presets found."
      />

      {archiveTarget && (
        <ConfirmDialog
          title="Archive Discount"
          description={`Archive "${archiveTarget.name}"?`}
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
