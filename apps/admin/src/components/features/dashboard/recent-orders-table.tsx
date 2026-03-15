'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface RecentOrdersTableProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

export function RecentOrdersTable({ orders, isLoading }: RecentOrdersTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-sm text-muted-foreground text-center">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground text-center">No recent orders</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/orders/${order.id}`} className="hover:underline text-primary">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay amount={order.totalAmount} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={order.createdAt} format="datetime" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
