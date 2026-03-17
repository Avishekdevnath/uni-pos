export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roleId: string;
  tenantId: string;
  defaultBranchId: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  tenantId: string;
  address: string | null;
  phone: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  defaultCurrency: string;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost: number | null;
  categoryId: string | null;
  tenantId: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  tenantId: string;
  createdBy: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface AuthMeResponse {
  user: User;
  role: Role;
  permissions: string[];
  branch: { id: string; name: string; code: string };
  tenant: { name: string; defaultCurrency: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
