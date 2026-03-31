import { useCartStore } from '../../store/cart-store';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import type { PosProduct } from '../../lib/api';

export function PosPage() {
  const { addItem } = useCartStore();

  const handleAddProduct = (product: PosProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      <ProductGrid onAddProduct={handleAddProduct} />
      <CartPanel />
    </div>
  );
}
