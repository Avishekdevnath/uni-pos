'use client';
import { Store, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BranchStat {
  id: string;
  name: string;
  revenue: number;
  orders: number;
}

interface BranchComparisonProps {
  branches?: BranchStat[];
  isLoading?: boolean;
}

export function BranchComparison({ branches = [], isLoading }: BranchComparisonProps) {
  const maxRevenue = Math.max(...branches.map((b) => b.revenue), 1);

  return (
    <div className="p-5 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Branch Performance</p>
          <p className="text-xl font-bold mt-0.5">Revenue by Branch</p>
        </div>
        <div className="p-2 rounded-xl text-primary bg-primary/10">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <Store className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No branch data available</p>
          </div>
        ) : (
          branches.map((branch, index) => {
            const pct = (branch.revenue / maxRevenue) * 100;
            const isTop = index === 0;
            return (
              <div key={branch.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium truncate max-w-[60%]', isTop && 'text-primary')}>
                    {isTop && <span className="mr-1 text-xs">🥇</span>}
                    {branch.name}
                  </span>
                  <span className="font-semibold tabular-nums text-xs">
                    {formatCurrency(branch.revenue)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isTop ? 'bg-primary' : 'bg-primary/40',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{branch.orders} orders</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
