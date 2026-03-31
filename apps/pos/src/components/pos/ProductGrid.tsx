
import { useState } from 'react';
import { ProductCard } from './ProductCard';
import type { PosProduct } from '../../lib/api';

interface ProductGridProps {
  onAddProduct: (product: PosProduct) => void;
}


// Dummy categories
const dummyCategories = [
  { id: 'all', name: 'All' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'personal', name: 'Personal Care' },
];

// Dummy products
const dummyProducts: PosProduct[] = [
  { id: '1', name: 'Cola', sku: 'C001', barcode: '123456', price: 1.5, status: 'active', emoji: '🥤', stockQty: 12, lowStockThreshold: 3 },
  { id: '2', name: 'Potato Chips', sku: 'S001', barcode: '234567', price: 2.0, status: 'active', emoji: '🍟', stockQty: 5, lowStockThreshold: 2 },
  { id: '3', name: 'Toothpaste', sku: 'P001', barcode: '345678', price: 3.5, status: 'active', emoji: '🪥', stockQty: 20, lowStockThreshold: 5 },
  { id: '4', name: 'Milk', sku: 'G001', barcode: '456789', price: 1.2, status: 'active', emoji: '🥛', stockQty: 0, lowStockThreshold: 2 },
  { id: '5', name: 'Chocolate Bar', sku: 'S002', barcode: '567890', price: 1.0, status: 'active', emoji: '🍫', stockQty: 8, lowStockThreshold: 2 },
  { id: '6', name: 'Shampoo', sku: 'P002', barcode: '678901', price: 4.0, status: 'active', emoji: '🧴', stockQty: 2, lowStockThreshold: 2 },
];

export function ProductGrid({ onAddProduct }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const currency = 'USD';

  // Filter products by search and category
  const filteredProducts = dummyProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(search.toLowerCase())) ||
      (product.barcode && product.barcode.includes(search));
    const matchesCategory =
      activeCategory === 'all' ||
      (activeCategory === 'beverages' && product.name.toLowerCase().includes('cola')) ||
      (activeCategory === 'snacks' && ['potato chips', 'chocolate bar'].includes(product.name.toLowerCase())) ||
      (activeCategory === 'groceries' && product.name.toLowerCase().includes('milk')) ||
      (activeCategory === 'personal' && ['toothpaste', 'shampoo'].includes(product.name.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

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

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {dummyCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all
              ${activeCategory === cat.id
                ? 'bg-accent border-accent text-bg font-semibold'
                : 'border-border2 text-text2 bg-surface2 hover:border-accent hover:text-accent'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pt-2">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text3 gap-2">
            <span className="text-3xl">🔍</span>
            <span className="text-sm">No products found</span>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
            {filteredProducts.map((product: PosProduct) => (
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
