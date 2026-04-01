import type { ApiResponse } from '../types/api';
import type { LoginRequest, LoginResponse, PosMeResponse } from '../types/auth';

export interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  status: string;
  emoji?: string;
  stockQty?: number;
  lowStockThreshold?: number;
}

export interface PosProductListResponse {
  items: PosProduct[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface InventoryBalance {
  productId?: string;
  product_id?: string;
  onHandQty?: number;
  on_hand_qty?: number;
}

export interface PosOrder {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  paidAmount: number;
  completedAt?: string;
  createdAt?: string;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  items?: Array<{
    id: string;
    productNameSnapshot?: string;
    description?: string;
    quantity: number;
    lineTotal: number;
  }>;
}

export const TOKEN_KEY = 'uni-pos.pos.access-token';

// Called automatically when any API request returns 401 (token expired / invalid).
// AuthProvider registers its logout function here on mount.
let _on401Handler: (() => void) | null = null;
export function register401Handler(fn: () => void) {
  _on401Handler = fn;
}
export function unregister401Handler() {
  _on401Handler = null;
}
const DEFAULT_API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export const apiBaseUrl =
  (typeof window !== 'undefined' ? (window as Window & { __UNI_POS_API_BASE_URL__?: string }).__UNI_POS_API_BASE_URL__ : undefined) ??
  DEFAULT_API_BASE_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const asString = query.toString();
  return asString ? `?${asString}` : '';
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const token = 'token' in options ? options.token : getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(15_000),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.error === 'string'
          ? payload.error
          : 'Request failed';

    if (response.status === 401) {
      _on401Handler?.();
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiRequest<ApiResponse<LoginResponse>>('/auth/login', {
    method: 'POST',
    body: data,
    token: null,
  });

  return response.data;
}

export async function fetchMe(token?: string): Promise<PosMeResponse> {
  const response = await apiRequest<ApiResponse<PosMeResponse>>('/auth/me', { token });
  return response.data;
}

export async function fetchProducts(params: {
  branchId?: string;
  categoryId?: string;
  search?: string;
  barcode?: string;
  page?: number;
  pageSize?: number;
}): Promise<PosProductListResponse> {
  const response = await apiRequest<ApiResponse<PosProductListResponse>>(
    `/products${toQuery({
      branch_id: params.branchId,
      category_id: params.categoryId,
      search: params.search,
      barcode: params.barcode,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );

  return response.data;
}

export async function fetchInventoryBalances(params: {
  branchId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<InventoryBalance[]> {
  const response = await apiRequest<{ status: string; data: InventoryBalance[] }>(
    `/inventory/balances${toQuery({
      branch_id: params.branchId,
      search: params.search,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );

  return response.data;
}

export async function createStockIn(data: {
  branch_id: string;
  description?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_cost?: number;
    client_event_id?: string;
  }>;
}): Promise<unknown> {
  const response = await apiRequest<ApiResponse<unknown>>('/inventory/stock-in', {
    method: 'POST',
    body: data,
  });

  return response.data;
}

export async function createDraftOrder(data: {
  branch_id: string;
  notes?: string;
  client_event_id?: string;
}): Promise<PosOrder> {
  const response = await apiRequest<ApiResponse<PosOrder>>('/orders', {
    method: 'POST',
    body: data,
  });

  return response.data;
}

export async function addOrderItem(
  orderId: string,
  data: { product_id: string; quantity: number },
): Promise<PosOrder> {
  const response = await apiRequest<ApiResponse<PosOrder>>(`/orders/${orderId}/items`, {
    method: 'POST',
    body: data,
  });

  return response.data;
}

export async function completeOrder(
  orderId: string,
  data: {
    client_event_id: string;
    payments: Array<{
      method: 'cash' | 'card' | 'digital' | 'split';
      amount: number;
      cash_tendered?: number;
      client_event_id?: string;
    }>;
  },
  idempotencyKey: string,
): Promise<PosOrder> {
  const response = await apiRequest<ApiResponse<PosOrder>>(`/orders/${orderId}/complete`, {
    method: 'POST',
    body: data,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });

  return response.data;
}

// ── Reports ──────────────────────────────────────────────────
export interface ReportsSummary {
  revenue: number;
  transactionCount: number;
  avgOrderValue: number;
  itemsSold: number;
  voidCount: number;
}

export async function fetchReportsSummary(
  _branchId: string,
  date: string,
): Promise<ReportsSummary> {
  const response = await apiRequest<ApiResponse<ReportsSummary> | ReportsSummary>(`/reports/summary?date=${date}`);

  // Some backend handlers return payload directly, while others return { data } wrapper.
  if ('data' in (response as Record<string, unknown>)) {
    return (response as ApiResponse<ReportsSummary>).data;
  }

  return response as ReportsSummary;
}

// ── Customers ────────────────────────────────────────────────
export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpend: string;
  lastVisitAt: string | null;
  createdAt: string;
}

export async function fetchCustomers(params: {
  search?: string;
  filter?: string;
  page?: number;
}): Promise<{ items: Customer[]; total: number }> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.filter) q.set('filter', params.filter);
  if (params.page) q.set('page', String(params.page));
  const response = await apiRequest<ApiResponse<{ items: Customer[]; total: number }>>(`/customers?${q.toString()}`);
  return response.data;
}

export async function createCustomer(data: {
  full_name: string;
  phone: string;
  email?: string;
}): Promise<Customer> {
  const response = await apiRequest<ApiResponse<Customer>>('/customers', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

export async function fetchCustomerByPhone(phone: string): Promise<Customer | null> {
  const result = await fetchCustomers({ search: phone });
  return result.items.find((c) => c.phone === phone) ?? null;
}

// ── Invoice Entry (free-text line items) ─────────────────────
export interface InvoiceLineItem {
  product_id?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  manual_tax_rate?: number;
}

export async function addInvoiceItem(
  orderId: string,
  item: InvoiceLineItem,
): Promise<unknown> {
  const response = await apiRequest<ApiResponse<unknown>>(`/orders/${orderId}/items`, {
    method: 'POST',
    body: item,
  });
  return response.data;
}

// ── Products (mutations) ─────────────────────────────────────
export async function updateProductEmoji(productId: string, emoji: string | null): Promise<PosProduct> {
  const response = await apiRequest<ApiResponse<PosProduct>>(`/products/${productId}/emoji`, {
    method: 'PATCH',
    body: { emoji },
  });
  return response.data;
}

export async function updateProduct(
  productId: string,
  data: { name?: string; price?: number; sku?: string | null; barcode?: string | null; emoji?: string | null },
): Promise<PosProduct> {
  const response = await apiRequest<ApiResponse<PosProduct>>(`/products/${productId}`, {
    method: 'PATCH',
    body: data,
  });
  return response.data;
}

// ── Categories ───────────────────────────────────────────────
export async function fetchCategories(): Promise<Array<{ id: string; name: string }>> {
  const response = await apiRequest<ApiResponse<Array<{ id: string; name: string }>>>('/categories');
  return response.data;
}
