import type { PosProduct } from '../../lib/api';

interface ProductCardProps {
  product: PosProduct;
  currency: string;
  onAdd: (product: PosProduct) => void;
}

export function ProductCard({ product, currency, onAdd }: ProductCardProps) {
  const stockQty = product.stockQty ?? null;
  const isOutOfStock = stockQty !== null && stockQty <= 0;
  const isLowStock = stockQty !== null && stockQty > 0 && product.lowStockThreshold != null && stockQty <= product.lowStockThreshold;

  return (
    <div
      onClick={() => !isOutOfStock && onAdd(product)}
      className={`relative bg-surface2 border border-border rounded-xl p-3.5 cursor-pointer transition-all duration-200 group overflow-hidden
        ${isOutOfStock ? 'opacity-40 pointer-events-none' : 'hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40'}`}
      style={!isOutOfStock ? { borderColor: 'var(--border)' } : {}}
      onMouseEnter={(e) => { if (!isOutOfStock) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; }}
      onMouseLeave={(e) => { if (!isOutOfStock) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      {/* Hover add button */}
      {!isOutOfStock && (
        <div
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-[6px] flex items-center justify-center text-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
        >
          +
        </div>
      )}

      <span className="text-[32px] mb-2 block">{product.emoji ?? '📦'}</span>
      <div className="text-[13px] font-semibold text-text1 mb-1 leading-snug line-clamp-2">
        {product.name}
      </div>
      <div className="font-mono text-[14px] font-medium mb-1" style={{ color: 'var(--accent)' }}>
        {currency} {Number(product.price).toFixed(2)}
      </div>
      {stockQty !== null && (
        <div className="text-[11px] mt-1" style={{ color: isLowStock ? 'orange' : 'var(--text3)' }}>
          {isLowStock ? `Low stock: ${Math.floor(stockQty)}` : `In stock: ${Math.floor(stockQty)}`}
        </div>
      )}
    </div>
  );
}
