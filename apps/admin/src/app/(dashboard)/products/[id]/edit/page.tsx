'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchProduct, updateProduct } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/features/products/product-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProduct(id),
  });

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateProduct>[1]) => updateProduct(id, data),
    onSuccess: () => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
    onError: () => toast.error('Failed to update product'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Product">
        <Button variant="ghost" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4 max-w-xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : product ? (
        <ProductForm
          defaultValues={product}
          onSubmit={(data) => mutation.mutateAsync(data)}
          isSubmitting={mutation.isPending}
        />
      ) : (
        <p className="text-sm text-destructive">Product not found.</p>
      )}
    </div>
  );
}
