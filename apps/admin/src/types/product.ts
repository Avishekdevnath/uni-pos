export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  taxGroupId: string | null;
  price: number;
  cost: number;
  unit: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string | null;
  tax_group_id?: string | null;
  price: number;
  cost: number;
  unit?: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  barcode?: string;
  category_id?: string | null;
  tax_group_id?: string | null;
  price?: number;
  cost?: number;
  unit?: string;
}
