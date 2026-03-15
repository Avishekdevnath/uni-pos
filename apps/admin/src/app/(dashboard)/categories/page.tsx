'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchCategories, archiveCategory } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { getCategoryColumns } from '@/components/features/categories/category-columns';
import { CategoryFormDialog } from '@/components/features/categories/category-form-dialog';
import type { Category } from '@/types/category';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveCategory(id),
    onSuccess: () => {
      toast.success('Category archived');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setArchiveTarget(null);
    },
    onError: () => toast.error('Failed to archive category'),
  });

  const columns = getCategoryColumns(
    categories,
    (cat) => { setEditTarget(cat); setDialogOpen(true); },
    (cat) => setArchiveTarget(cat),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Categories">
        <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        emptyMessage="No categories found."
      />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editTarget}
        allCategories={categories}
        onSuccess={() => setEditTarget(null)}
      />

      {archiveTarget && (
        <ConfirmDialog
          title="Archive Category"
          description={`Archive "${archiveTarget.name}"? Products in this category won't be affected.`}
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
