'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: Array<{ date: string; total: number; orders: number }>;
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : 'No data for this period'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                labelFormatter={(label) => formatDate(label)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
