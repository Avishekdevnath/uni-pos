'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProduct } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/features/products/product-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
    onError: () => toast.error('Failed to create product'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New Product">
        <Button variant="ghost" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      <ProductForm
        onSubmit={(data) => mutation.mutateAsync(data)}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
