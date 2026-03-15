export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string | null;
  orderNumber: string | null;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  cancellationReason: string | null;
  notes: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  discounts?: OrderDiscount[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  productNameSnapshot: string;
  skuSnapshot: string | null;
  lineSubtotal: number;
  lineDiscountAmount: number;
  orderDiscountShare: number;
  discountedAmount: number;
  baseAmount: number;
  taxAmount: number;
  lineTotal: number;
  taxes?: OrderItemTax[];
}

export interface OrderItemTax {
  id: string;
  orderItemId: string;
  taxConfigId: string;
  taxNameSnapshot: string;
  taxRateSnapshot: number;
  isInclusive: boolean;
  taxAmount: number;
}

export interface OrderDiscount {
  id: string;
  orderId: string;
  discountPresetId: string;
  computedAmount: number;
  presetNameSnapshot: string;
  typeSnapshot: string;
  valueSnapshot: number;
  scopeSnapshot: string;
  orderItemIdSnapshot: string | null;
}
