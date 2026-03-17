import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { ReceiptTokenEntity } from './entities/receipt-token.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';

export interface ReceiptData {
  token: string;
  orderNumber: string | null;
  orderDate: Date;
  tenantName: string;
  tenantCurrency: string;
  branchName: string;
  branchAddress: string | null;
  branchPhone: string | null;
  items: Array<{
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  payments: Array<{
    method: string;
    amount: number;
  }>;
  receiptFooter: string;
}

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    @InjectRepository(ReceiptTokenEntity)
    private readonly tokenRepo: Repository<ReceiptTokenEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createToken(orderId: string, tenantId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);

    const attempt = async (): Promise<string> => {
      const token = crypto.randomBytes(6).toString('hex');
      const entity = this.tokenRepo.create({ orderId, tenantId, token, expiresAt });
      await this.tokenRepo.save(entity);
      return token;
    };

    try {
      return await attempt();
    } catch (err: unknown) {
      // Retry once on unique constraint collision
      const isUniqueViolation =
        err instanceof Error &&
        (err.message.includes('unique') || err.message.includes('duplicate'));
      if (isUniqueViolation) {
        this.logger.warn(`Token collision for orderId=${orderId}, retrying...`);
        return attempt();
      }
      throw err;
    }
  }

  async getTokenByOrderId(orderId: string): Promise<string | null> {
    const entity = await this.tokenRepo.findOne({ where: { orderId }, select: ['token'] });
    return entity?.token ?? null;
  }

  async getReceiptByToken(token: string): Promise<ReceiptData | null> {
    const tokenEntity = await this.tokenRepo.findOne({
      where: { token },
      relations: ['order', 'order.branch', 'order.tenant', 'order.items', 'order.discounts'],
    });

    if (!tokenEntity) return null;

    if (tokenEntity.expiresAt < new Date()) return null;

    const order = tokenEntity.order;

    const payments = await this.paymentRepo.find({
      where: { orderId: order.id },
    });

    return {
      token,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      tenantName: order.tenant.name,
      tenantCurrency: order.tenant.defaultCurrency,
      branchName: order.branch.name,
      branchAddress: order.branch.address,
      branchPhone: order.branch.phone,
      items: order.items.map((item) => ({
        name: item.productNameSnapshot ?? 'Product',
        sku: item.skuSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
      receiptFooter: order.tenant.receiptFooter,
    };
  }

  renderReceiptHtml(receiptData: ReceiptData): string {
    const fmt = (n: number) =>
      `${receiptData.tenantCurrency} ${n.toFixed(2)}`;

    const itemRows = receiptData.items
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(item.name)}${item.sku ? `<br><span class="sku">${escapeHtml(item.sku)}</span>` : ''}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${fmt(item.unitPrice)}</td>
        <td class="right">${fmt(item.lineTotal)}</td>
      </tr>`,
      )
      .join('');

    const paymentRows = receiptData.payments
      .map(
        (p) =>
          `<tr><td class="label">${escapeHtml(p.method.toUpperCase())}:</td><td class="right">${fmt(p.amount)}</td></tr>`,
      )
      .join('');

    const orderDateStr = receiptData.orderDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt ${receiptData.orderNumber ?? ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 24px;
      max-width: 400px;
      margin: 0 auto;
    }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    .branch { text-align: center; font-size: 12px; color: #444; margin-bottom: 2px; }
    .divider { border: none; border-top: 1px dashed #999; margin: 12px 0; }
    .meta { font-size: 12px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding: 4px 2px; }
    td { padding: 4px 2px; vertical-align: top; }
    td:first-child { width: 50%; }
    .sku { font-size: 10px; color: #666; }
    .center { text-align: center; }
    .right { text-align: right; }
    .label { color: #444; }
    .totals-table { margin-top: 8px; }
    .totals-table td { padding: 2px; }
    .total-row td { font-weight: bold; font-size: 15px; border-top: 1px solid #111; padding-top: 6px; }
    .payments-section { margin-top: 8px; }
    .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #555; }
    @media print {
      body { padding: 0; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(receiptData.tenantName)}</h1>
  <p class="branch">${escapeHtml(receiptData.branchName)}</p>
  ${receiptData.branchAddress ? `<p class="branch">${escapeHtml(receiptData.branchAddress)}</p>` : ''}
  ${receiptData.branchPhone ? `<p class="branch">Tel: ${escapeHtml(receiptData.branchPhone)}</p>` : ''}

  <hr class="divider">

  <p class="meta"><strong>Order #:</strong> ${escapeHtml(receiptData.orderNumber ?? 'N/A')}</p>
  <p class="meta"><strong>Date:</strong> ${orderDateStr}</p>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <hr class="divider">

  <table class="totals-table">
    <tr><td class="label">Subtotal:</td><td class="right">${fmt(receiptData.subtotalAmount)}</td></tr>
    ${receiptData.discountAmount > 0 ? `<tr><td class="label">Discount:</td><td class="right">- ${fmt(receiptData.discountAmount)}</td></tr>` : ''}
    ${receiptData.taxAmount > 0 ? `<tr><td class="label">Tax:</td><td class="right">${fmt(receiptData.taxAmount)}</td></tr>` : ''}
    <tr class="total-row"><td>TOTAL:</td><td class="right">${fmt(receiptData.totalAmount)}</td></tr>
  </table>

  ${
    receiptData.payments.length > 0
      ? `<div class="payments-section">
    <hr class="divider">
    <table>
      ${paymentRows}
    </table>
  </div>`
      : ''
  }

  <hr class="divider">

  <div class="footer">
    <p>${escapeHtml(receiptData.receiptFooter)}</p>
  </div>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
