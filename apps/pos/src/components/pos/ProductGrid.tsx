
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';
import { fetchProducts, type PosProduct } from '../../lib/api';
import { ProductCard } from './ProductCard';
import { Spinner } from '../shared/Spinner';

interface ProductGridProps {
  onAddProduct: (product: PosProduct) => void;
}
export function ProductGrid({ onAddProduct }: ProductGridProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const currency = 'USD';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pos-products', search, user?.defaultBranchId],
    queryFn: () =>
      fetchProducts({
        branchId: user?.defaultBranchId,
        search: search || undefined,
        page: 1,
        pageSize: 100,
      }),
    staleTime: 30 * 1000,
    enabled: !!user?.defaultBranchId,
  });

  const products = data?.items ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-[22px] font-semibold text-text1" style={{ fontFamily: 'var(--font-serif)' }}>Products</h2>
        <div className="flex items-center gap-2 bg-surface2 border border-border2 rounded-xl px-3.5 py-2 w-[280px]">
          <span className="text-text3 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search name / SKU / barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-text1 text-[13.5px] placeholder:text-text3"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-40 text-text3 gap-2">
            <span className="text-3xl">⚠️</span>
            <span className="text-sm">Failed to load products</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text3 gap-2">
            <span className="text-3xl">🔍</span>
            <span className="text-sm">No products found</span>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
            {products.map((product: PosProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                onAdd={onAddProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
