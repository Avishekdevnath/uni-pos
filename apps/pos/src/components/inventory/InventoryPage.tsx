import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchCategories,
  updateProduct,
  type PosProduct,
} from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { Spinner } from '../shared/Spinner';
import { Badge } from '../shared/Badge';
import { EmojiButton } from '../shared/EmojiPicker';

// ── Edit Product Modal ───────────────────────────────────────

interface EditModalProps {
  product: PosProduct;
  onClose: () => void;
}

function EditProductModal({ product, onClose }: EditModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [sku, setSku] = useState(product.sku ?? '');
  const [barcode, setBarcode] = useState(product.barcode ?? '');
  const [emoji, setEmoji] = useState<string | null>(product.emoji ?? null);

  const mutation = useMutation({
    mutationFn: () =>
      updateProduct(product.id, {
        name: name.trim() || undefined,
        price: Number(price) || undefined,
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        emoji,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm mx-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3 border-b"
          style={{ borderColor: 'var(--border2)' }}
        >
          <span className="text-lg font-semibold text-text1" style={{ fontFamily: 'var(--font-serif)' }}>
            Edit Product
          </span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text1 transition-colors"
            style={{ background: 'var(--surface2)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Emoji */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-text3 mb-2 font-medium uppercase tracking-wider">Icon</p>
              <EmojiButton value={emoji} onChange={setEmoji} size={52} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text3 font-medium uppercase tracking-wider block mb-1.5">
                Product Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-text1 focus:outline-none focus:border-accent transition-colors"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-text3 font-medium uppercase tracking-wider block mb-1.5">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-text1 focus:outline-none focus:border-accent transition-colors font-mono"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
            />
          </div>

          {/* SKU + Barcode row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text3 font-medium uppercase tracking-wider block mb-1.5">
                SKU
              </label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 rounded-lg text-sm text-text1 focus:outline-none focus:border-accent transition-colors font-mono"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
              />
            </div>
            <div>
              <label className="text-xs text-text3 font-medium uppercase tracking-wider block mb-1.5">
                Barcode
              </label>
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 rounded-lg text-sm text-text1 focus:outline-none focus:border-accent transition-colors font-mono"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex gap-2 border-t"
          style={{ borderColor: 'var(--border2)', background: 'var(--surface2)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-text2 hover:text-text1 transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {mutation.isError && (
          <p className="px-5 pb-3 text-xs text-pos-red">Failed to save. Please try again.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export function InventoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory', search, page, selectedCategory, user?.defaultBranchId],
    queryFn: () =>
      fetchProducts({
        branchId: user?.defaultBranchId,
        search: search || undefined,
        page,
        pageSize: 20,
      }),
    staleTime: 30 * 1000,
  });

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-text1 text-xl font-semibold">Inventory</h1>
          {pagination && (
            <p className="text-text3 text-xs mt-0.5">{pagination.total_items} products</p>
          )}
        </div>
        <div className="flex-1" />
        {/* Search */}
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text3 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-text1 text-sm placeholder:text-text3 focus:outline-none focus:border-accent"
          />
        </div>
        {/* Category filter */}
        {categories && categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-surface border border-border rounded-lg text-text1 text-sm px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={28} />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full text-pos-red text-sm">
            Failed to load inventory
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-4xl">📦</span>
            <p className="text-text3 text-sm">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface border-b border-border">
              <tr>
                <th className="text-left text-text3 font-medium px-6 py-3">Product</th>
                <th className="text-left text-text3 font-medium px-4 py-3">SKU / Barcode</th>
                <th className="text-right text-text3 font-medium px-4 py-3">Price</th>
                <th className="text-right text-text3 font-medium px-4 py-3">Stock</th>
                <th className="text-left text-text3 font-medium px-4 py-3">Status</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={() => setEditingProduct(product)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="shrink-0 px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-text3 text-xs">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text2 disabled:opacity-40 hover:border-accent hover:text-text1 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text2 disabled:opacity-40 hover:border-accent hover:text-text1 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

// ── Product Row ──────────────────────────────────────────────

function ProductRow({ product, onEdit }: { product: PosProduct; onEdit: () => void }) {
  const stockQty = product.stockQty ?? null;
  const threshold = product.lowStockThreshold ?? 5;
  const isLowStock = stockQty !== null && stockQty <= threshold && stockQty > 0;
  const isOutOfStock = stockQty !== null && stockQty === 0;

  return (
    <tr className="hover:bg-surface transition-colors group">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl w-7 text-center flex-shrink-0">{product.emoji ?? '📦'}</span>
          <span className="text-text1 font-medium">{product.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          {product.sku && <span className="text-text2 font-mono text-xs">{product.sku}</span>}
          {product.barcode && <span className="text-text3 font-mono text-xs">{product.barcode}</span>}
          {!product.sku && !product.barcode && <span className="text-text3 text-xs">—</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-text1">{Number(product.price).toFixed(2)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {stockQty !== null ? (
          <span className={`font-mono font-medium ${isOutOfStock ? 'text-pos-red' : isLowStock ? 'text-pos-amber' : 'text-text1'}`}>
            {stockQty}
          </span>
        ) : (
          <span className="text-text3">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {product.status === 'active' ? (
          isOutOfStock ? (
            <Badge variant="red">Out of Stock</Badge>
          ) : isLowStock ? (
            <Badge variant="amber">Low Stock</Badge>
          ) : (
            <Badge variant="green">Active</Badge>
          )
        ) : (
          <Badge>{product.status}</Badge>
        )}
      </td>
      <td className="px-3 py-3">
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-text3 hover:text-text1 text-xs"
          style={{ background: 'var(--surface2)' }}
          title="Edit product"
        >
          ✏️
        </button>
      </td>
    </tr>
  );
}
