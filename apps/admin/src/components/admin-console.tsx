"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { ApiError, apiBaseUrl, apiRequest } from "@/lib/api";

const tokenStorageKey = "uni-pos.admin.access-token";

type AuthUser = {
  id: string;
  full_name: string;
  role: string;
  tenant_id: string;
  default_branch_id: string | null;
};

type LoginResponse = {
  status: "success";
  data: {
    access_token: string;
    user: AuthUser;
  };
};

type AuthMeResponse = {
  status: "success";
  data: AuthUser;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  status: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  unit: string;
  price: number;
  cost: number;
  status: string;
};

type CategoriesResponse = {
  status: "success";
  data: Category[];
};

type ProductsResponse = {
  status: "success";
  data: {
    items: Product[];
    pagination: {
      total_items: number;
    };
  };
};

const initialLoginForm = {
  email: "owner@example.com",
  password: "ChangeThisPassword123",
};

const initialCategoryForm = {
  name: "",
  parent_id: "",
};

const initialProductForm = {
  name: "",
  sku: "",
  barcode: "",
  category_id: "",
  price: "",
  cost: "",
  unit: "pcs",
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function AdminConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [authError, setAuthError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isPending, startTransition] = useTransition();

  const activeCategories = useMemo(
    () => categories.filter((item) => item.status === "active"),
    [categories],
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenStorageKey);

    if (!storedToken) {
      setIsBootstrapping(false);
      return;
    }

    void loadWorkspace(storedToken);
  }, []);

  async function loadWorkspace(nextToken: string) {
    setWorkspaceError(null);
    setIsBootstrapping(true);

    try {
      const [me, categoriesResponse, productsResponse] = await Promise.all([
        apiRequest<AuthMeResponse>("/auth/me", { token: nextToken }),
        apiRequest<CategoriesResponse>("/categories", { token: nextToken }),
        apiRequest<ProductsResponse>("/products?page=1&page_size=12", {
          token: nextToken,
        }),
      ]);

      setToken(nextToken);
      setCurrentUser(me.data);
      setCategories(categoriesResponse.data);
      setProducts(productsResponse.data.items);
      setProductCount(productsResponse.data.pagination.total_items);
      window.localStorage.setItem(tokenStorageKey, nextToken);
    } catch (error) {
      window.localStorage.removeItem(tokenStorageKey);
      setToken(null);
      setCurrentUser(null);
      setCategories([]);
      setProducts([]);
      setProductCount(0);
      setWorkspaceError(getErrorMessage(error));
    } finally {
      setIsBootstrapping(false);
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await apiRequest<LoginResponse>("/auth/login", {
            method: "POST",
            body: loginForm,
          });

          await loadWorkspace(response.data.access_token);
        } catch (error) {
          setAuthError(getErrorMessage(error));
        }
      })();
    });
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setWorkspaceError("Login session is missing.");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await apiRequest("/categories", {
            method: "POST",
            token,
            body: {
              name: categoryForm.name,
              ...(categoryForm.parent_id
                ? { parent_id: categoryForm.parent_id }
                : {}),
            },
          });

          setCategoryForm(initialCategoryForm);
          await loadWorkspace(token);
        } catch (error) {
          setWorkspaceError(getErrorMessage(error));
        }
      })();
    });
  }

  function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setWorkspaceError("Login session is missing.");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await apiRequest("/products", {
            method: "POST",
            token,
            body: {
              name: productForm.name,
              sku: productForm.sku || undefined,
              barcode: productForm.barcode || undefined,
              category_id: productForm.category_id || undefined,
              price: Number(productForm.price),
              cost: Number(productForm.cost),
              unit: productForm.unit,
            },
          });

          setProductForm(initialProductForm);
          await loadWorkspace(token);
        } catch (error) {
          setWorkspaceError(getErrorMessage(error));
        }
      })();
    });
  }

  function handleLogout() {
    window.localStorage.removeItem(tokenStorageKey);
    setToken(null);
    setCurrentUser(null);
    setCategories([]);
    setProducts([]);
    setProductCount(0);
    setWorkspaceError(null);
  }

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-[var(--shadow)]">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
            admin bootstrap
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Loading workspace</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Verifying the saved session and pulling data from{" "}
            <span className="font-mono">{apiBaseUrl}</span>.
          </p>
        </div>
      </main>
    );
  }

  if (!token || !currentUser) {
    return (
      <main className="flex min-h-screen px-6 py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
              uniPOS admin
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
              Back-office control without leaving the browser.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              This first web slice authenticates against the Nest API, then
              lets you create categories and products against the live tenant.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Authenticate with the seeded owner account",
                "Create categories directly from the web app",
                "Add products and confirm tenant-scoped API reads",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                  Sign in
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Connect admin</h2>
              </div>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[11px] text-[var(--muted)]">
                {apiBaseUrl}
              </span>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <Field
                label="Email"
                value={loginForm.email}
                onChange={(value) =>
                  setLoginForm((current) => ({ ...current, email: value }))
                }
                type="email"
              />
              <Field
                label="Password"
                value={loginForm.password}
                onChange={(value) =>
                  setLoginForm((current) => ({ ...current, password: value }))
                }
                type="password"
              />

              {(authError || workspaceError) && (
                <p className="rounded-2xl border border-[color:rgba(181,69,69,0.24)] bg-[color:rgba(181,69,69,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {authError ?? workspaceError}
                </p>
              )}

              <button
                className="w-full rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                Operations cockpit
              </p>
              <h1 className="mt-3 text-4xl font-semibold">
                Welcome, {currentUser.full_name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                This validates auth, tenant scoping, and the first catalog
                management flow against the live backend.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge label="Role" value={currentUser.role} />
              <Badge
                label="Tenant"
                value={`${currentUser.tenant_id.slice(0, 8)}...`}
              />
              <button
                className="rounded-3xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric eyebrow="Categories" value={String(activeCategories.length)} />
          <Metric eyebrow="Products" value={String(productCount)} />
          <Metric eyebrow="API" value="Live" />
        </section>

        {workspaceError && (
          <p className="rounded-2xl border border-[color:rgba(181,69,69,0.24)] bg-[color:rgba(181,69,69,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {workspaceError}
          </p>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel
            title="Categories"
            subtitle="Create and review categories from the same screen."
          >
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCategorySubmit}>
              <Field
                label="Category name"
                value={categoryForm.name}
                onChange={(value) =>
                  setCategoryForm((current) => ({ ...current, name: value }))
                }
                placeholder="Beverages"
              />
              <SelectField
                label="Parent category"
                value={categoryForm.parent_id}
                onChange={(value) =>
                  setCategoryForm((current) => ({
                    ...current,
                    parent_id: value,
                  }))
                }
                options={activeCategories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                emptyLabel="No parent"
              />
              <div className="md:col-span-2">
                <button
                  className="rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending || !categoryForm.name.trim()}
                  type="submit"
                >
                  Create category
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {categories.length === 0 ? (
                <EmptyState message="No categories yet." />
              ) : (
                categories.map((category) => (
                  <article
                    key={category.id}
                    className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                          {category.id}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                        {category.status}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Products"
            subtitle="Create products and review the first page from the API."
          >
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProductSubmit}>
              <div className="md:col-span-2">
                <Field
                  label="Product name"
                  value={productForm.name}
                  onChange={(value) =>
                    setProductForm((current) => ({ ...current, name: value }))
                  }
                  placeholder="Coca-Cola 500ml"
                />
              </div>
              <Field
                label="SKU"
                value={productForm.sku}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, sku: value }))
                }
                placeholder="SKU-001"
              />
              <Field
                label="Barcode"
                value={productForm.barcode}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, barcode: value }))
                }
                placeholder="1234567890123"
              />
              <SelectField
                label="Category"
                value={productForm.category_id}
                onChange={(value) =>
                  setProductForm((current) => ({
                    ...current,
                    category_id: value,
                  }))
                }
                options={activeCategories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                emptyLabel="Uncategorized"
              />
              <Field
                label="Unit"
                value={productForm.unit}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, unit: value }))
                }
                placeholder="pcs"
              />
              <Field
                label="Price"
                value={productForm.price}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, price: value }))
                }
                placeholder="50"
                inputMode="decimal"
              />
              <Field
                label="Cost"
                value={productForm.cost}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, cost: value }))
                }
                placeholder="35"
                inputMode="decimal"
              />
              <div className="md:col-span-2">
                <button
                  className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isPending ||
                    !productForm.name.trim() ||
                    productForm.price === "" ||
                    productForm.cost === ""
                  }
                  type="submit"
                >
                  Create product
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {products.length === 0 ? (
                <EmptyState message="No products yet." />
              ) : (
                products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {product.sku || "No SKU"} • {product.unit}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                        {product.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <SmallStat label="Price" value={formatMoney(product.price)} />
                      <SmallStat label="Cost" value={formatMoney(product.cost)} />
                      <SmallStat
                        label="Category"
                        value={
                          product.categoryId
                            ? categories.find((item) => item.id === product.categoryId)
                                ?.name ?? "Linked"
                            : "Uncategorized"
                        }
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Metric({ eyebrow, value }: { eyebrow: string; value: string }) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold">{value}</h2>
    </article>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        required={type === "email" || type === "password"}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  emptyLabel: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}
