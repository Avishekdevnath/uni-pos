'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchDiscountPresets, updateDiscountPreset, setDiscountBranches } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DiscountForm, type DiscountFormData } from '@/components/features/discounts/discount-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditDiscountPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: presets, isLoading } = useQuery({
    queryKey: ['discounts', { id }],
    queryFn: () => fetchDiscountPresets({}),
  });
  const preset = presets?.find((p) => p.id === id);

  const mutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const { branch_ids, ...presetData } = data;
      await updateDiscountPreset(id, presetData);
      await setDiscountBranches(id, branch_ids);
    },
    onSuccess: () => {
      toast.success('Discount updated');
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      router.push('/discounts');
    },
    onError: () => toast.error('Failed to update discount'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Discount Preset">
        <Button variant="ghost" asChild>
          <Link href="/discounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4 max-w-xl">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : preset ? (
        <DiscountForm
          defaultValues={preset}
          onSubmit={(data) => mutation.mutateAsync(data)}
          isSubmitting={mutation.isPending}
        />
      ) : (
        <p className="text-sm text-destructive">Discount not found.</p>
      )}
    </div>
  );
}
