'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { fetchOrder, fetchPayments } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { OrderDetail } from '@/components/features/orders/order-detail';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', { orderId: id }],
    queryFn: () => fetchPayments({ order_id: id }),
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={order?.orderNumber ?? 'Order Detail'}>
        <Button variant="ghost" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : order ? (
        <OrderDetail order={order} payments={payments} />
      ) : (
        <p className="text-sm text-destructive">Order not found.</p>
      )}
    </div>
  );
}
