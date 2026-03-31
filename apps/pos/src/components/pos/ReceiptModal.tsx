import type { PosOrder } from '../../lib/api';

interface ReceiptModalProps {
  order: PosOrder;
  currency: string;
  onNewSale: () => void;
}

export function ReceiptModal({ order, currency, onNewSale }: ReceiptModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-surface border border-border2 rounded-2xl w-[440px] max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 bg-gradient-to-br from-surface to-surface2 rounded-t-2xl border-b border-border2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-bg font-bold text-lg">U</div>
            <div>
              <div className="font-bold text-[18px] text-text1">uniPOS</div>
              <div className="text-[11px] text-text2">Invoice Receipt</div>
            </div>
          </div>
          <div className="flex justify-between text-[13px]">
            <div>
              <div className="text-[10px] text-text3 uppercase tracking-wide mb-0.5">Order #</div>
              <div className="font-mono font-medium text-accent">{order.orderNumber ?? order.id.slice(0, 8)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text3 uppercase tracking-wide mb-0.5">Date</div>
              <div className="font-medium">{new Date(order.completedAt ?? order.createdAt ?? '').toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-7 py-5">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border2">
                <th className="text-left text-[10px] text-text3 uppercase tracking-wide pb-2">Item</th>
                <th className="text-right text-[10px] text-text3 uppercase tracking-wide pb-2">Qty</th>
                <th className="text-right text-[10px] text-text3 uppercase tracking-wide pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item: any) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-2.5">{item.productNameSnapshot ?? item.description ?? '—'}</td>
                  <td className="py-2.5 text-right font-mono text-text2">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">{currency} {Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between text-text2">
              <span>Subtotal</span>
              <span className="font-mono">{currency} {Number(order.subtotalAmount ?? 0).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-pos-red">
                <span>Discount</span>
                <span className="font-mono">−{currency} {Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(order.taxAmount ?? 0) > 0 && (
              <div className="flex justify-between text-text2">
                <span>Tax</span>
                <span className="font-mono">+{currency} {Number(order.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[18px] font-bold mt-3 pt-3 border-t border-border2">
              <span className="text-text1">Total</span>
              <span className="font-mono text-pos-green">{currency} {Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Paid stamp */}
          <div className="mt-4 text-center py-3 border-2 border-pos-green rounded-lg text-pos-green font-bold text-[15px] tracking-widest">
            ✓ PAID
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 bg-accent text-bg font-semibold text-[13px] rounded-xl hover:bg-accent/90 transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 py-2.5 bg-surface2 border border-border2 text-text1 font-semibold text-[13px] rounded-xl hover:bg-surface3 transition-colors"
          >
            ＋ New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
