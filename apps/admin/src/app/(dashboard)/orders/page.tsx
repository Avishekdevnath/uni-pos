'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/hooks/use-branch';
import { fetchOrders } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { SearchInput } from '@/components/shared/search-input';
import { orderColumns } from '@/components/features/orders/order-columns';
import type { Order } from '@/types/order';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrdersPage() {
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, pageSize, status, search, branchId: selectedBranch?.id }],
    queryFn: () =>
      fetchOrders({
        page,
        page_size: pageSize,
        branch_id: selectedBranch?.id,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      }),
    enabled: !!selectedBranch,
  });

  const orders = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="View all orders across your store" />

      <DataTable
        columns={orderColumns}
        data={orders}
        isLoading={isLoading}
        pagination={{ page, pageSize, total }}
        onPaginationChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        onRowClick={(order: Order) => router.push(`/orders/${order.id}`)}
        toolbar={
          <div className="flex gap-3">
            <SearchInput
              placeholder="Search order number…"
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
            />
            <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyMessage="No orders found."
      />
    </div>
  );
}
