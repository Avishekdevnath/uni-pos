import type { CartItem as CartItemType } from '../../store/cart-store';

interface CartItemProps {
  item: CartItemType;
  currency: string;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, currency, onUpdateQty, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-2.5 py-[10px] border-b border-border last:border-b-0">
      {/* emoji */}
      <span className="text-[22px] flex-shrink-0">{(item as any).emoji ?? '📦'}</span>

      {/* name + unit price */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-text1 leading-snug">{item.name}</div>
        <div className="font-mono text-[12px] text-text2">
          {currency} {item.unitPrice.toFixed(2)}
        </div>
      </div>

      {/* qty controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
          className="w-6 h-6 rounded-[6px] border border-border2 bg-surface3 text-text1 text-[14px] flex items-center justify-center transition-all duration-100 hover:border-accent hover:text-accent"
        >−</button>
        <span className="font-mono text-[13px] text-text1 min-w-[18px] text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
          className="w-6 h-6 rounded-[6px] border border-border2 bg-surface3 text-text1 text-[14px] flex items-center justify-center transition-all duration-100 hover:border-accent hover:text-accent"
        >+</button>
      </div>

      {/* line total */}
      <div className="font-mono text-[13px] font-medium min-w-[60px] text-right flex-shrink-0" style={{ color: 'var(--accent)' }}>
        {currency} {(item.quantity * item.unitPrice).toFixed(2)}
      </div>

      {/* remove */}
      <button
        onClick={() => onRemove(item.productId)}
        className="text-text3 hover:text-pos-red transition-colors text-[16px] flex-shrink-0 p-0.5"
      >✕</button>
    </div>
  );
}
