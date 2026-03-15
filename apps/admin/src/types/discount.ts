export interface DiscountPreset {
  id: string;
  name: string;
  type: string;
  value: number;
  scope: string;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isCombinable: boolean;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountPresetInput {
  name: string;
  type: "percentage" | "flat";
  value: number;
  scope: "order" | "line_item";
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_combinable?: boolean;
}

export interface UpdateDiscountPresetInput {
  name?: string;
  type?: "percentage" | "flat";
  value?: number;
  scope?: "order" | "line_item";
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_combinable?: boolean;
  status?: string;
}
