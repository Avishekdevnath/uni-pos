import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface DailySummary {
  revenue: number;
  transactionCount: number;
  avgOrderValue: number;
  itemsSold: number;
  voidCount: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactionCount: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface HourlyHeatmapEntry {
  hour: number;
  dayOfWeek: number;
  transactionCount: number;
}

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getSummary(tenantId: string, branchId: string, date: string): Promise<DailySummary> {
    const [completedRow] = await this.dataSource.query(
      `SELECT
         COALESCE(SUM(total_amount), 0)::numeric AS revenue,
         COUNT(*)::int AS transaction_count,
         COALESCE(AVG(total_amount), 0)::numeric AS avg_order_value
       FROM orders
       WHERE tenant_id = $1
         AND branch_id = $2
         AND status = 'completed'
         AND DATE(completed_at AT TIME ZONE 'UTC') = $3::date`,
      [tenantId, branchId, date],
    );

    const [itemsRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(oi.quantity), 0)::numeric AS items_sold
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = $1
         AND o.branch_id = $2
         AND o.status = 'completed'
         AND DATE(o.completed_at AT TIME ZONE 'UTC') = $3::date`,
      [tenantId, branchId, date],
    );

    const [voidRow] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS void_count
       FROM orders
       WHERE tenant_id = $1
         AND branch_id = $2
         AND status = 'cancelled'
         AND DATE(cancelled_at AT TIME ZONE 'UTC') = $3::date`,
      [tenantId, branchId, date],
    );

    return {
      revenue: Number(completedRow?.revenue ?? 0),
      transactionCount: Number(completedRow?.transaction_count ?? 0),
      avgOrderValue: Number(completedRow?.avg_order_value ?? 0),
      itemsSold: Number(itemsRow?.items_sold ?? 0),
      voidCount: Number(voidRow?.void_count ?? 0),
    };
  }

  async getRevenue(
    tenantId: string,
    branchId: string,
    from: string,
    to: string,
  ): Promise<DailyRevenue[]> {
    const rows = await this.dataSource.query(
      `SELECT
         DATE(completed_at AT TIME ZONE 'UTC')::text AS date,
         SUM(total_amount)::numeric AS revenue,
         COUNT(*)::int AS transaction_count
       FROM orders
       WHERE tenant_id = $1
         AND branch_id = $2
         AND status = 'completed'
         AND completed_at >= $3::date
         AND completed_at < ($4::date + INTERVAL '1 day')
       GROUP BY DATE(completed_at AT TIME ZONE 'UTC')
       ORDER BY date`,
      [tenantId, branchId, from, to],
    );

    return rows.map((r: any) => ({
      date: r.date,
      revenue: Number(r.revenue),
      transactionCount: Number(r.transaction_count),
    }));
  }

  async getPaymentMethods(
    tenantId: string,
    branchId: string,
    from: string,
    to: string,
  ): Promise<PaymentMethodBreakdown[]> {
    const rows = await this.dataSource.query(
      `SELECT
         method,
         SUM(amount)::numeric AS amount,
         COUNT(*)::int AS count
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.tenant_id = $1
         AND p.branch_id = $2
         AND o.status = 'completed'
         AND o.completed_at >= $3::date
         AND o.completed_at < ($4::date + INTERVAL '1 day')
       GROUP BY method
       ORDER BY amount DESC`,
      [tenantId, branchId, from, to],
    );

    return rows.map((r: any) => ({
      method: r.method,
      amount: Number(r.amount),
      count: Number(r.count),
    }));
  }

  async getTopProducts(
    tenantId: string,
    branchId: string,
    from: string,
    to: string,
    limit = 10,
  ): Promise<TopProduct[]> {
    const rows = await this.dataSource.query(
      `SELECT
         oi.product_id,
         COALESCE(oi.product_name_snapshot, 'Unknown') AS product_name,
         SUM(oi.quantity)::numeric AS units_sold,
         SUM(oi.line_total)::numeric AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = $1
         AND o.branch_id = $2
         AND o.status = 'completed'
         AND oi.product_id IS NOT NULL
         AND o.completed_at >= $3::date
         AND o.completed_at < ($4::date + INTERVAL '1 day')
       GROUP BY oi.product_id, oi.product_name_snapshot
       ORDER BY revenue DESC
       LIMIT $5`,
      [tenantId, branchId, from, to, limit],
    );

    return rows.map((r: any) => ({
      productId: r.product_id,
      productName: r.product_name,
      unitsSold: Number(r.units_sold),
      revenue: Number(r.revenue),
    }));
  }

  async getHourlyHeatmap(tenantId: string, branchId: string): Promise<HourlyHeatmapEntry[]> {
    const rows = await this.dataSource.query(
      `SELECT
         EXTRACT(HOUR FROM completed_at AT TIME ZONE 'UTC')::int AS hour,
         EXTRACT(DOW FROM completed_at AT TIME ZONE 'UTC')::int AS day_of_week,
         COUNT(*)::int AS transaction_count
       FROM orders
       WHERE tenant_id = $1
         AND branch_id = $2
         AND status = 'completed'
         AND completed_at >= NOW() - INTERVAL '7 days'
       GROUP BY hour, day_of_week
       ORDER BY day_of_week, hour`,
      [tenantId, branchId],
    );

    return rows.map((r: any) => ({
      hour: Number(r.hour),
      dayOfWeek: Number(r.day_of_week),
      transactionCount: Number(r.transaction_count),
    }));
  }
}
