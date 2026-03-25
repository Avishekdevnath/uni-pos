'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RevenueHeroProps {
  data: Array<{ date: string; total: number; orders: number }>;
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{formatDate(label)}</p>
      <p className="text-primary font-semibold">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-muted-foreground">{payload[1]?.value ?? 0} orders</p>
    </div>
  );
}

export function RevenueHero({ data, isLoading }: RevenueHeroProps) {
  return (
    <div className="p-5 h-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">Revenue Trend</p>
        <p className="text-xl font-bold mt-0.5">Sales Over Time</p>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="revenue"
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1.5}
                fill="url(#ordersGrad)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-primary" />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-[hsl(var(--chart-2))]" />
          Orders
        </span>
      </div>
    </div>
  );
}
