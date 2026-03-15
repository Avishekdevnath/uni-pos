import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(tenantId: string, branchId: string, period: string) {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      let startDate: Date;
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const [orderStats] = await manager.query(
        `SELECT COUNT(*)::int as orders_count, COALESCE(SUM(total_amount), 0)::float as total_sales, COALESCE(AVG(total_amount), 0)::float as avg_order_value FROM orders WHERE tenant_id = $1 AND branch_id = $2 AND status = 'completed' AND created_at >= $3`,
        [tenantId, branchId, startDate],
      );

      const [lowStock] = await manager.query(
        `SELECT COUNT(*)::int as low_stock_count FROM inventory_balances ib INNER JOIN branch_product_configs bpc ON bpc.tenant_id = ib.tenant_id AND bpc.branch_id = ib.branch_id AND bpc.product_id = ib.product_id WHERE ib.tenant_id = $1 AND ib.branch_id = $2 AND bpc.low_stock_threshold IS NOT NULL AND ib.on_hand_qty <= bpc.low_stock_threshold`,
        [tenantId, branchId],
      );

      const revenueTrend = await manager.query(
        `SELECT DATE(created_at) as date, COALESCE(SUM(total_amount), 0)::float as total, COUNT(*)::int as orders FROM orders WHERE tenant_id = $1 AND branch_id = $2 AND status = 'completed' AND created_at >= $3 GROUP BY DATE(created_at) ORDER BY date ASC`,
        [tenantId, branchId, startDate],
      );

      const recentOrders = await manager.query(
        `SELECT id, order_number as "orderNumber", total_amount as "totalAmount", status, created_at as "createdAt" FROM orders WHERE tenant_id = $1 AND branch_id = $2 ORDER BY created_at DESC LIMIT 5`,
        [tenantId, branchId],
      );

      return {
        stats: {
          total_sales: orderStats.total_sales,
          orders_count: orderStats.orders_count,
          avg_order_value: orderStats.avg_order_value,
          low_stock_count: lowStock.low_stock_count,
        },
        revenue_trend: revenueTrend,
        recent_orders: recentOrders,
      };
    });
  }
}
