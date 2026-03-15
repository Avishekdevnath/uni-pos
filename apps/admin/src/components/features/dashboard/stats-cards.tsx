'use client';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  stats?: {
    total_sales: number;
    orders_count: number;
    avg_order_value: number;
    low_stock_count: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Sales"
        value={formatCurrency(stats?.total_sales ?? 0)}
        icon={DollarSign}
      />
      <StatCard
        title="Orders"
        value={stats?.orders_count ?? 0}
        icon={ShoppingCart}
      />
      <StatCard
        title="Avg Order Value"
        value={formatCurrency(stats?.avg_order_value ?? 0)}
        icon={TrendingUp}
      />
      <StatCard
        title="Low Stock Items"
        value={stats?.low_stock_count ?? 0}
        icon={AlertTriangle}
        description={stats?.low_stock_count ? 'Needs attention' : 'All stocked'}
      />
    </div>
  );
}
