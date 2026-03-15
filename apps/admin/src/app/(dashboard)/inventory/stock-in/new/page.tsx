'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createStockIn } from '@/lib/api';
import { useBranch } from '@/hooks/use-branch';
import { PageHeader } from '@/components/shared/page-header';
import { StockInForm } from '@/components/features/inventory/stock-in-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewStockInPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedBranch } = useBranch();

  const mutation = useMutation({
    mutationFn: createStockIn,
    onSuccess: () => {
      toast.success('Stock in recorded');
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      router.push('/inventory');
    },
    onError: () => toast.error('Failed to record stock in'),
  });

  if (!selectedBranch) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="New Stock In">
        <Button variant="ghost" asChild>
          <Link href="/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      <StockInForm
        branchId={selectedBranch.id}
        onSubmit={(data) => mutation.mutateAsync(data)}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
