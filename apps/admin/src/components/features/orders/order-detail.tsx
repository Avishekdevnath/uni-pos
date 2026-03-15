import type { Order } from '@/types/order';
import type { Payment } from '@/types/payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';
import { Separator } from '@/components/ui/separator';
import { OrderItemsTable } from './order-items-table';
import { OrderPaymentsTable } from './order-payments-table';

interface OrderDetailProps {
  order: Order;
  payments: Payment[];
}

export function OrderDetail({ order, payments }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-mono">{order.orderNumber ?? 'Draft'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created <DateDisplay date={order.createdAt} format="datetime" />
            </p>
          </div>
          <StatusBadge status={order.status} />
        </CardHeader>
        {order.cancellationReason && (
          <CardContent>
            <p className="text-sm text-destructive">
              <strong>Cancellation reason:</strong> {order.cancellationReason}
            </p>
          </CardContent>
        )}
      </Card>

      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItemsTable items={order.items} />
          </CardContent>
        </Card>
      )}

      {order.discounts && order.discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discounts Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.discounts.map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span>{d.presetNameSnapshot} <span className="text-muted-foreground capitalize">({d.scopeSnapshot})</span></span>
                  <CurrencyDisplay amount={d.computedAmount} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <CurrencyDisplay amount={order.subtotalAmount} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive">−<CurrencyDisplay amount={order.discountAmount} /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <CurrencyDisplay amount={order.taxAmount} />
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <CurrencyDisplay amount={order.totalAmount} />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <CurrencyDisplay amount={order.paidAmount} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderPaymentsTable payments={payments} />
        </CardContent>
      </Card>
    </div>
  );
}
