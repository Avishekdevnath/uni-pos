import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCustomers, createCustomer, type Customer } from '../../lib/api';
import { Spinner } from '../shared/Spinner';
import { Drawer } from '../shared/Drawer';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(n: string | number): string {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', search, filter, page],
    queryFn: () => fetchCustomers({ search: search || undefined, filter: filter || undefined, page }),
    staleTime: 30 * 1000,
  });

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  function openCustomer(c: Customer) {
    setSelected(c);
    setDrawerOpen(true);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg">
      {/* Page header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-text1 text-xl font-semibold">Customers</h1>
          <p className="text-text3 text-xs mt-0.5">Customer database and history</p>
        </div>
        <div className="flex-1" />
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-surface2 border border-border2 rounded-[10px] px-3.5 py-2 w-64">
          <span className="text-text3 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Name or phone…"
            className="flex-1 bg-transparent border-none outline-none text-text1 text-[13.5px] placeholder:text-text3"
          />
        </div>
        {/* New customer */}
        <button
          onClick={() => { setSelected(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          + New Customer
        </button>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Spinner size={28} />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-40 text-pos-red text-sm">
            Failed to load customers
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-text3">
            <span className="text-4xl opacity-50">👤</span>
            <p className="text-sm">No customers yet. Complete a sale with customer info to add them here.</p>
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => openCustomer(c)}
                className="bg-surface2 border border-border rounded-xl p-4 cursor-pointer transition-all duration-150"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Avatar + name */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-bold mb-3"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                >
                  {c.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-[15px] font-semibold text-text1 mb-0.5">{c.fullName}</div>
                <div className="font-mono text-[12px] text-text2">{c.phone ?? '—'}</div>

                {/* Stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                  <div>
                    <div className="font-mono text-[14px] font-medium" style={{ color: 'var(--accent)' }}>
                      {formatCurrency(c.totalSpend)}
                    </div>
                    <div className="text-[10px] text-text3 uppercase tracking-[0.06em]">Total Spent</div>
                  </div>
                  <div>
                    <div className="font-mono text-[14px] font-medium" style={{ color: 'var(--accent)' }}>
                      {c.totalOrders}
                    </div>
                    <div className="text-[10px] text-text3 uppercase tracking-[0.06em]">Visits</div>
                  </div>
                  {c.lastVisitAt && (
                    <div>
                      <div className="font-mono text-[12px] font-medium text-text2">
                        {new Date(c.lastVisitAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-text3 uppercase tracking-[0.06em]">Last Visit</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <span className="text-text3 text-xs">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text2 disabled:opacity-40 hover:border-accent hover:text-text1 transition-colors"
              >← Prev</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text2 disabled:opacity-40 hover:border-accent hover:text-text1 transition-colors"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / New customer drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected ? selected.fullName : 'New Customer'}
      >
        {selected ? (
          <CustomerDetail customer={selected} />
        ) : (
          <NewCustomerForm
            onSuccess={(c) => {
              queryClient.invalidateQueries({ queryKey: ['customers'] });
              setSelected(c);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl font-semibold">
          {customer.fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-text1 text-lg font-semibold">{customer.fullName}</div>
          {customer.email && <div className="text-text2 text-sm">{customer.email}</div>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg border border-border rounded-lg p-3 text-center">
          <div className="text-text3 text-xs mb-1">Orders</div>
          <div className="text-text1 text-xl font-semibold font-mono">{customer.totalOrders}</div>
        </div>
        <div className="bg-bg border border-border rounded-lg p-3 text-center">
          <div className="text-text3 text-xs mb-1">Total Spend</div>
          <div className="text-accent text-base font-semibold font-mono">
            {Number(customer.totalSpend).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-bg border border-border rounded-lg p-3 text-center">
          <div className="text-text3 text-xs mb-1">Last Visit</div>
          <div className="text-text1 text-xs font-medium">
            {customer.lastVisitAt
              ? new Date(customer.lastVisitAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : '—'}
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-bg border border-border rounded-lg divide-y divide-border">
        <div className="flex items-center gap-3 p-3">
          <span className="text-text3 text-sm w-5">📱</span>
          <span className="text-text2 text-sm font-mono">{customer.phone}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-3 p-3">
            <span className="text-text3 text-sm w-5">✉️</span>
            <span className="text-text2 text-sm">{customer.email}</span>
          </div>
        )}
        <div className="flex items-center gap-3 p-3">
          <span className="text-text3 text-sm w-5">📅</span>
          <span className="text-text2 text-sm">
            Customer since {new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function NewCustomerForm({ onSuccess }: { onSuccess: (c: Customer) => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => createCustomer({ full_name: fullName, phone, email: email || undefined }),
    onSuccess: (c) => onSuccess(c),
    onError: (err: Error) => setError(err.message ?? 'Failed to create customer'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) return setError('Name is required');
    if (!phone.trim()) return setError('Phone is required');
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-text2 text-xs font-medium">Full Name *</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Smith"
          className="bg-bg border border-border rounded-lg text-text1 text-sm px-3 py-2.5 focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-text2 text-xs font-medium">Phone *</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          type="tel"
          className="bg-bg border border-border rounded-lg text-text1 text-sm px-3 py-2.5 font-mono focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-text2 text-xs font-medium">Email <span className="text-text3">(optional)</span></label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          type="email"
          className="bg-bg border border-border rounded-lg text-text1 text-sm px-3 py-2.5 focus:outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-pos-red text-xs">{error}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? <Spinner size={16} /> : null}
        {mutation.isPending ? 'Saving…' : 'Create Customer'}
      </button>
    </form>
  );
}
