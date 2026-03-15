'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/hooks/use-branch';
import { fetchDashboardStats } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RevenueChart } from '@/components/features/dashboard/revenue-chart';
import { RecentOrdersTable } from '@/components/features/dashboard/recent-orders-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const [period, setPeriod] = useState('today');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedBranch?.id, period],
    queryFn: () => fetchDashboardStats({ branch_id: selectedBranch!.id, period }),
    enabled: !!selectedBranch,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your store performance">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      <StatsCards stats={data?.stats} isLoading={isLoading} />
      <RevenueChart data={data?.revenue_trend ?? []} isLoading={isLoading} />
      <RecentOrdersTable orders={data?.recent_orders ?? []} isLoading={isLoading} />
    </div>
  );
}
