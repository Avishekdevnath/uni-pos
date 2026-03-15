import type { ApiResponse } from "@/types/api";
import type { LoginRequest, LoginResponse, User } from "@/types/auth";
import type { Branch } from "@/types/branch";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";
import type {
  TaxGroup,
  TaxConfig,
  CreateTaxGroupInput,
  UpdateTaxGroupInput,
  CreateTaxConfigInput,
  UpdateTaxConfigInput,
} from "@/types/tax";
import type {
  DiscountPreset,
  CreateDiscountPresetInput,
  UpdateDiscountPresetInput,
} from "@/types/discount";
import type {
  InventoryBalance,
  InventoryMovement,
  CreateStockInInput,
  CreateAdjustmentInput,
} from "@/types/inventory";
import type { Order } from "@/types/order";
import type { Payment } from "@/types/payment";
import type { AuditLog } from "@/types/audit";

// ─── Core ────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "uni-pos.admin.access-token";

const DEFAULT_API_BASE_URL = "http://localhost:3001/api/v1";

export const apiBaseUrl =
  (typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : undefined
  )?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token ?? getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
    throw new ApiError("Unauthorized", 401);
  }

  const contentType = response.headers.get("content-type");
  const payload =
    contentType?.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : "Request failed";

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
    method: "POST",
    body: data,
    token: null,
  });
  return res.data;
}

export async function fetchMe(token?: string): Promise<User> {
  const res = await apiRequest<ApiResponse<User>>("/auth/me", { token });
  return res.data;
}

// ─── Branches ────────────────────────────────────────────────────────────────

export async function fetchBranches(): Promise<Branch[]> {
  const res = await apiRequest<ApiResponse<Branch[]>>("/branches");
  return res.data;
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(params: Record<string, string | number | undefined>) {
  return apiRequest<{
    status: string;
    data: {
      items: Product[];
      pagination: { page: number; page_size: number; total_items: number; total_pages: number };
    };
  }>(`/products${toQuery(params)}`);
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>("/products", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>(`/products/${id}`, {
    method: "PATCH",
    body: data,
  });
  return res.data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>(`/products/${id}`);
  return res.data;
}

export async function archiveProduct(id: string): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>(`/products/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await apiRequest<ApiResponse<Category[]>>("/categories");
  return res.data;
}

export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  const res = await apiRequest<ApiResponse<Category>>("/categories", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
  const res = await apiRequest<ApiResponse<Category>>(`/categories/${id}`, {
    method: "PATCH",
    body: data,
  });
  return res.data;
}

export async function archiveCategory(id: string): Promise<Category> {
  const res = await apiRequest<ApiResponse<Category>>(`/categories/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

// ─── Tax Groups ──────────────────────────────────────────────────────────────

export async function fetchTaxGroups(): Promise<TaxGroup[]> {
  const res = await apiRequest<ApiResponse<TaxGroup[]>>("/tax-groups");
  return res.data;
}

export async function createTaxGroup(data: CreateTaxGroupInput): Promise<TaxGroup> {
  const res = await apiRequest<ApiResponse<TaxGroup>>("/tax-groups", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateTaxGroup(id: string, data: UpdateTaxGroupInput): Promise<TaxGroup> {
  const res = await apiRequest<ApiResponse<TaxGroup>>(`/tax-groups/${id}`, {
    method: "PATCH",
    body: data,
  });
  return res.data;
}

export async function archiveTaxGroup(id: string): Promise<TaxGroup> {
  const res = await apiRequest<ApiResponse<TaxGroup>>(`/tax-groups/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

// ─── Tax Configs ─────────────────────────────────────────────────────────────

export async function fetchTaxConfigs(params: Record<string, string | undefined>): Promise<TaxConfig[]> {
  const res = await apiRequest<ApiResponse<TaxConfig[]>>(`/tax-configs${toQuery(params)}`);
  return res.data;
}

export async function createTaxConfig(data: CreateTaxConfigInput): Promise<TaxConfig> {
  const res = await apiRequest<ApiResponse<TaxConfig>>("/tax-configs", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateTaxConfig(id: string, data: UpdateTaxConfigInput): Promise<TaxConfig> {
  const res = await apiRequest<ApiResponse<TaxConfig>>(`/tax-configs/${id}`, {
    method: "PATCH",
    body: data,
  });
  return res.data;
}

export async function archiveTaxConfig(id: string): Promise<TaxConfig> {
  const res = await apiRequest<ApiResponse<TaxConfig>>(`/tax-configs/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

// ─── Discounts ───────────────────────────────────────────────────────────────

export async function fetchDiscountPresets(
  params: Record<string, string | number | undefined>,
): Promise<DiscountPreset[]> {
  const res = await apiRequest<ApiResponse<DiscountPreset[]>>(`/discounts${toQuery(params)}`);
  return res.data;
}

export async function createDiscountPreset(data: CreateDiscountPresetInput): Promise<DiscountPreset> {
  const res = await apiRequest<ApiResponse<DiscountPreset>>("/discounts", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateDiscountPreset(
  id: string,
  data: UpdateDiscountPresetInput,
): Promise<DiscountPreset> {
  const res = await apiRequest<ApiResponse<DiscountPreset>>(`/discounts/${id}`, {
    method: "PATCH",
    body: data,
  });
  return res.data;
}

export async function archiveDiscountPreset(id: string): Promise<DiscountPreset> {
  const res = await apiRequest<ApiResponse<DiscountPreset>>(`/discounts/${id}`, {
    method: "DELETE",
  });
  return res.data;
}

export async function setDiscountBranches(
  presetId: string,
  branchIds: string[],
): Promise<void> {
  await apiRequest(`/discounts/${presetId}/branches`, {
    method: "PUT",
    body: { branch_ids: branchIds },
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export async function fetchInventoryBalances(
  params: Record<string, string | number | boolean | undefined>,
): Promise<InventoryBalance[]> {
  const res = await apiRequest<ApiResponse<InventoryBalance[]>>(
    `/inventory/balances${toQuery(params)}`,
  );
  return res.data;
}

export async function fetchInventoryMovements(
  params: Record<string, string | number | undefined>,
): Promise<InventoryMovement[]> {
  const res = await apiRequest<ApiResponse<InventoryMovement[]>>(
    `/inventory/movements${toQuery(params)}`,
  );
  return res.data;
}

export async function createStockIn(data: CreateStockInInput) {
  return apiRequest<ApiResponse<unknown>>("/inventory/stock-in", {
    method: "POST",
    body: data,
  });
}

export async function createAdjustment(data: CreateAdjustmentInput) {
  return apiRequest<ApiResponse<unknown>>("/inventory/adjustments", {
    method: "POST",
    body: data,
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchOrders(
  params: Record<string, string | number | undefined>,
) {
  return apiRequest<{
    status: string;
    data: { data: Order[]; total: number; page: number; limit: number };
  }>(`/orders${toQuery(params)}`);
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await apiRequest<ApiResponse<Order>>(`/orders/${id}`);
  return res.data;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function fetchPayments(
  params: Record<string, string | number | undefined>,
): Promise<Payment[]> {
  const res = await apiRequest<ApiResponse<Payment[]>>(
    `/payments${toQuery(params)}`,
  );
  return res.data;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  stats: {
    total_sales: number;
    orders_count: number;
    avg_order_value: number;
    low_stock_count: number;
  };
  revenue_trend: Array<{ date: string; total: number; orders: number }>;
  recent_orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export async function fetchDashboardStats(
  params: Record<string, string | undefined>,
): Promise<DashboardStats> {
  const res = await apiRequest<ApiResponse<DashboardStats>>(
    `/stats/dashboard${toQuery(params)}`,
  );
  return res.data;
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function fetchAuditLogs(
  params: Record<string, string | number | undefined>,
): Promise<AuditLog[]> {
  const res = await apiRequest<ApiResponse<AuditLog[]>>(
    `/audit-logs${toQuery(params)}`,
  );
  return res.data;
}
