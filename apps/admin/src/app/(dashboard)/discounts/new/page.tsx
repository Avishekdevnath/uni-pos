'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createDiscountPreset, setDiscountBranches } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DiscountForm, type DiscountFormData } from '@/components/features/discounts/discount-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewDiscountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const { branch_ids, ...presetData } = data;
      const preset = await createDiscountPreset(presetData);
      if (branch_ids.length > 0) {
        await setDiscountBranches(preset.id, branch_ids);
      }
      return preset;
    },
    onSuccess: () => {
      toast.success('Discount created');
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      router.push('/discounts');
    },
    onError: () => toast.error('Failed to create discount'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New Discount Preset">
        <Button variant="ghost" asChild>
          <Link href="/discounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      <DiscountForm
        onSubmit={(data) => mutation.mutateAsync(data)}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
