'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBranch } from '@/hooks/use-branch';
import { fetchProducts, archiveProduct } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { ProductFilters } from '@/components/features/products/product-filters';
import { getProductColumns } from '@/components/features/products/product-columns';
import type { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, pageSize, search, categoryId, status, branchId: selectedBranch?.id }],
    queryFn: () =>
      fetchProducts({
        page,
        page_size: pageSize,
        ...(search ? { search } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(status ? { status } : {}),
        ...(selectedBranch ? { branch_id: selectedBranch.id } : {}),
      }),
    enabled: !!selectedBranch,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => {
      toast.success('Product archived');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setArchiveTarget(null);
    },
    onError: () => toast.error('Failed to archive product'),
  });

  const columns = getProductColumns((product) => setArchiveTarget(product));

  const products = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Manage your product catalog">
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        pagination={
          pagination
            ? { page: pagination.page, pageSize: pagination.page_size, total: pagination.total_items }
            : undefined
        }
        onPaginationChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        toolbar={
          <ProductFilters
            search={search}
            categoryId={categoryId}
            status={status}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onCategoryChange={(v) => { setCategoryId(v); setPage(1); }}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
        emptyMessage="No products found."
        emptyAction={
          <Button asChild size="sm">
            <Link href="/products/new">Add your first product</Link>
          </Button>
        }
      />

      {archiveTarget && (
        <ConfirmDialog
          title="Archive Product"
          description={`Are you sure you want to archive "${archiveTarget.name}"? It will no longer be available for sale.`}
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
