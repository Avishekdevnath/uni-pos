import React, { useState } from 'react';
import { useCartStore } from '../../store/cart-store';
import { useAuth } from '../../hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { CartItemRow } from './CartItem';
import { ReceiptModal } from './ReceiptModal';
import { Spinner } from '../shared/Spinner';
import { toast } from '../../store/toast-store';
import {
  createDraftOrder,
  addOrderItem,
  completeOrder,
  ApiError,
} from '../../lib/api';
import {
  getOrCreateCheckoutIntent,
  setCheckoutIntentOrderId,
  clearCheckoutIntent,
} from '../../lib/idempotency';

type PayMethod = 'cash' | 'card' | 'digital' | 'split';

const METHOD_LABELS: Record<PayMethod, string> = { cash: 'Cash', card: 'Card', digital: 'Digital', split: 'Split' };

const MethodIcons: Record<PayMethod, React.ReactNode> = {
  cash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  card: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  digital: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  split: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

function NumKey({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-12 flex items-center justify-center rounded-xl bg-surface border border-border text-text1 font-semibold text-[17px] hover:bg-surface2 hover:border-accent/30 active:scale-95 transition-all duration-100 cursor-pointer select-none"
    >
      {label}
    </button>
  );
}

export function CartPanel() {
  const { branch, tenant } = useAuth();
  const { items, phase, removeItem, updateQty, clearCart, setPhase, setCompletedOrderId, getTotals } = useCartStore();
  const totals = getTotals();
  const currency = tenant?.defaultCurrency ?? 'BDT';

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  // Discount / Tax
  const [discountPct, setDiscountPct] = useState('');
  const [taxPct, setTaxPct] = useState('');
  // Payment state
  const [payStep, setPayStep] = useState(false);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const discountAmt = totals.subtotal * (Math.min(Number(discountPct) || 0, 100) / 100);
  const afterDiscount = totals.subtotal - discountAmt;
  const taxAmt = afterDiscount * ((Number(taxPct) || 0) / 100);
  const grandTotal = afterDiscount + taxAmt;

  const change = method === 'cash' && cashInput ? Number(cashInput) - grandTotal : null;
  const splitTotal = (Number(splitCash) || 0) + (Number(splitCard) || 0);
  const splitValid = method !== 'split' || Math.abs(splitTotal - totals.subtotal) < 0.01;

  const canConfirm =
    method === 'card' ||
    method === 'digital' ||
    (method === 'cash' && Number(cashInput) >= grandTotal) ||
    (method === 'split' && splitValid);

  function appendDigit(d: string) {
    setCashInput((prev) => {
      if (d === '.' && prev.includes('.')) return prev;
      if (prev === '0' && d !== '.') return d;
      return (prev || '') + d;
    });
  }

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!branch?.id) throw new Error('No branch available.');
      const cartSig = JSON.stringify(items.map((i) => ({ p: i.productId, q: i.quantity })));
      const intent = getOrCreateCheckoutIntent(cartSig);
      let orderId = intent.orderId;

      if (!orderId) {
        const order = await createDraftOrder({ branch_id: branch.id, client_event_id: crypto.randomUUID() });
        orderId = order.id;
        setCheckoutIntentOrderId(cartSig, orderId);
        for (const item of items) {
          await addOrderItem(order.id, { product_id: item.productId, quantity: item.quantity });
        }
      }

      const payments = method === 'split'
        ? [
            { method: 'cash' as const, amount: Number(splitCash), cash_tendered: Number(splitCash), client_event_id: crypto.randomUUID() },
            { method: 'card' as const, amount: Number(splitCard), client_event_id: crypto.randomUUID() },
          ]
        : [{
            method: method as 'cash' | 'card' | 'digital',
            amount: grandTotal,
            cash_tendered: method === 'cash' ? Number(cashInput) : undefined,
            client_event_id: intent.key,
          }];

      const completed = await completeOrder(orderId!, { client_event_id: intent.key, payments }, intent.key);
      clearCheckoutIntent();
      return completed;
    },
    onMutate: () => setPhase('processing'),
    onSuccess: (order) => {
      setCompletedOrder(order);
      setCompletedOrderId(order.id);
      setPhase('receipt');
      setPayStep(false);
      toast.success('Payment complete');
    },
    onError: (err) => {
      setPhase('cart');
      const msg = err instanceof ApiError && err.status === 409
        ? 'Checkout conflict — verify last receipt.'
        : err instanceof Error ? err.message : 'Checkout failed.';
      toast.error(msg);
    },
  });

  const checkoutError = (() => {
    if (!checkoutMutation.error) return null;
    if (checkoutMutation.error instanceof ApiError && checkoutMutation.error.status === 409)
      return 'Checkout conflict. Verify last receipt.';
    return checkoutMutation.error instanceof Error ? checkoutMutation.error.message : 'Checkout failed.';
  })();

  function handleBack() {
    setPayStep(false);
    setCashInput('');
    setSplitCash('');
    setSplitCard('');
    checkoutMutation.reset();
  }

  return (
    <>
      <div className="w-[360px] bg-surface border-l border-border flex flex-col flex-shrink-0 overflow-hidden">

        {/* ── CART VIEW ── */}
        {!payStep && (
          <>
            {/* Header */}
            <div className="px-5 py-[18px] pb-[14px] border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <div className="text-[18px] font-semibold text-text1" style={{ fontFamily: 'var(--font-serif)' }}>Current Bill</div>
                <div className="text-[12px] text-text2 mt-0.5" id="cart-count">
                  {totals.itemCount > 0 ? `${totals.itemCount} item${totals.itemCount !== 1 ? 's' : ''}` : '0 items'}
                </div>
              </div>
              <button
                onClick={clearCart}
                className="text-[12px] font-medium text-text2 border border-border2 rounded-lg px-3 py-1.5 hover:text-text1 hover:bg-surface2 transition-all cursor-pointer"
                style={{ background: 'var(--surface3)' }}
              >
                Clear
              </button>
            </div>

            {/* Customer inputs */}
            <div className="px-5 py-3 border-b border-border flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="flex-1 bg-surface2 border border-border2 rounded-lg px-3 py-[7px] text-text1 text-[13px] outline-none transition-colors focus:border-accent"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-[120px] bg-surface2 border border-border2 rounded-lg px-3 py-[7px] text-text1 text-[13px] outline-none transition-colors focus:border-accent font-mono"
              />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text3 gap-2 py-8">
                  <div className="text-[40px] opacity-50">🛒</div>
                  <div className="text-[13px]">No items added</div>
                  <div className="text-[12px]">Click products to add</div>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemRow key={item.productId} item={item} currency={currency} onUpdateQty={updateQty} onRemove={removeItem} />
                ))
              )}
            </div>

            {/* Summary */}
            <div className="border-t border-border bg-surface2 px-5 py-4 flex-shrink-0">
              {/* Discount / Tax */}
              <div className="flex gap-1.5 mb-3">
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  placeholder="Discount (%)"
                  min="0" max="100"
                  className="flex-1 bg-surface border border-border2 rounded-lg px-2.5 py-[6px] text-text1 text-[12.5px] outline-none focus:border-accent font-mono transition-colors"
                />
                <input
                  type="number"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  placeholder="Tax (%)"
                  min="0" max="30"
                  className="flex-1 bg-surface border border-border2 rounded-lg px-2.5 py-[6px] text-text1 text-[12.5px] outline-none focus:border-accent font-mono transition-colors"
                />
              </div>

              {/* Summary rows */}
              <div className="flex justify-between items-center mb-2 text-[13.5px]">
                <span className="text-text2">Subtotal</span>
                <span className="font-mono">৳{totals.subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between items-center mb-2 text-[13.5px]">
                  <span className="text-text2">Discount</span>
                  <span className="font-mono" style={{ color: 'var(--red)' }}>-৳{discountAmt.toFixed(2)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between items-center mb-2 text-[13.5px]">
                  <span className="text-text2">Tax</span>
                  <span className="font-mono">+৳{taxAmt.toFixed(2)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center mb-3 pt-2.5 border-t border-border2 text-[16px] font-bold">
                <span className="text-text1">Total</span>
                <span className="font-mono text-[18px]" style={{ color: 'var(--accent)' }}>
                  ৳{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Pay method chips */}
              <div className="text-[11px] text-text3 mb-1.5">Payment Method</div>
              <div className="flex gap-1.5 mb-3">
                {(['cash', 'card', 'digital'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className="flex-1 py-2 rounded-lg border text-[12px] font-medium cursor-pointer transition-all duration-150"
                    style={method === m
                      ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' }
                      : { borderColor: 'var(--border2)', background: 'var(--surface)', color: 'var(--text2)' }}
                  >
                    {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'} {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              {/* Charge button */}
              <button
                disabled={totals.itemCount === 0}
                onClick={() => setPayStep(true)}
                className="w-full py-3 rounded-[10px] font-semibold text-[14px] cursor-pointer transition-all duration-150 active:scale-[0.99] tracking-[0.02em]"
                style={totals.itemCount > 0
                  ? { background: 'var(--accent)', color: 'var(--bg)' }
                  : { background: 'var(--surface3)', color: 'var(--text3)', cursor: 'not-allowed' }}
                onMouseEnter={(e) => { if (totals.itemCount > 0) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { if (totals.itemCount > 0) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.transform = ''; } }}
              >
                🧾 Generate Invoice
              </button>
            </div>
          </>
        )}

        {/* ── PAYMENT VIEW ── */}
        {payStep && (
          <>
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center gap-3 flex-shrink-0">
              <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-lg text-text3 hover:text-text1 hover:bg-surface2 transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div>
                <div className="font-semibold text-[16px] text-text1">Payment</div>
                <div className="text-[11px] text-text3 mt-0.5">
                  {currency} {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} due
                </div>
              </div>
            </div>

            {/* Scrollable payment content */}
            <div className="flex-1 overflow-y-auto">

              {/* Method tabs */}
              <div className="px-3 pt-3 pb-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['cash', 'card', 'digital', 'split'] as PayMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMethod(m); setCashInput(''); }}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-medium transition-all duration-150 cursor-pointer
                        ${method === m ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text2 hover:border-accent/30 hover:bg-surface2'}`}
                    >
                      <span className={method === m ? 'text-accent' : 'text-text3'}>{MethodIcons[m]}</span>
                      {METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── CASH ── */}
              {method === 'cash' && (
                <div className="px-3 pb-3">
                  {/* Tendered display */}
                  <div className="bg-bg border border-border rounded-xl px-4 py-3 mb-2.5 flex items-center justify-between">
                    <span className="text-text3 text-[11px]">Tendered</span>
                    <span className="font-mono text-[20px] font-bold text-text1 tabular-nums">
                      {cashInput ? `${Number(cashInput).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-1.5 mb-2.5 flex-wrap">
                    <button
                      onClick={() => setCashInput(String(Math.ceil(totals.subtotal)))}
                      className="px-2.5 py-1.5 text-[11px] bg-accent/10 text-accent border border-accent/20 rounded-lg font-medium hover:bg-accent/20 transition-colors cursor-pointer"
                    >
                      Exact
                    </button>
                    {[50, 100, 200, 500, 1000].filter((a) => a > totals.subtotal).map((a) => (
                      <button key={a} onClick={() => setCashInput(String(a))}
                        className="px-2.5 py-1.5 text-[11px] bg-surface2 text-text2 border border-border rounded-lg font-mono hover:border-accent/30 hover:text-text1 transition-colors cursor-pointer">
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2">
                    {['7','8','9','4','5','6','1','2','3','.','0'].map((d) => (
                      <NumKey key={d} label={d} onClick={() => appendDigit(d)} />
                    ))}
                    <NumKey label="⌫" onClick={() => setCashInput((p) => p.slice(0, -1))} />
                  </div>

                  {/* Change */}
                  {change !== null && (
                    <div className={`mt-2.5 flex items-center justify-between px-4 py-3 rounded-xl border font-mono
                      ${change >= 0 ? 'bg-pos-green/10 border-pos-green/30 text-pos-green' : 'bg-pos-red/10 border-pos-red/30 text-pos-red'}`}>
                      <span className="text-[11px] font-sans font-medium">{change >= 0 ? 'Change' : 'Short by'}</span>
                      <span className="text-[18px] font-bold tabular-nums">
                        {currency} {Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── CARD / DIGITAL ── */}
              {(method === 'card' || method === 'digital') && (
                <div className="px-3 pb-3">
                  <div className="bg-bg border border-border rounded-xl p-6 text-center mt-1">
                    <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-3">
                      <span className="text-text2">{MethodIcons[method]}</span>
                    </div>
                    <div className="text-text1 font-semibold text-[14px] mb-1">
                      {method === 'card' ? 'Tap, swipe or insert card' : 'Scan QR or tap to pay'}
                    </div>
                    <div className="text-text3 text-[12px]">
                      {currency} {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} will be charged
                    </div>
                  </div>
                </div>
              )}

              {/* ── SPLIT ── */}
              {method === 'split' && (
                <div className="px-3 pb-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text2 text-[11px] font-medium px-1">Cash amount</label>
                    <input
                      type="number" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="0.00"
                      className="bg-bg border border-border rounded-xl px-4 py-3 font-mono text-text1 text-[15px] focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text2 text-[11px] font-medium px-1">Card amount</label>
                    <input
                      type="number" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} placeholder="0.00"
                      className="bg-bg border border-border rounded-xl px-4 py-3 font-mono text-text1 text-[15px] focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-mono
                    ${splitValid ? 'bg-pos-green/10 border-pos-green/30 text-pos-green' : 'bg-surface2 border-border text-text3'}`}>
                    <span className="text-[11px] font-sans">Total</span>
                    <span className="text-[16px] font-bold tabular-nums">
                      {currency} {splitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {checkoutError && (
              <div className="mx-3 mb-2 text-[11px] text-pos-red bg-pos-red/10 border border-pos-red/20 rounded-xl px-3 py-2.5 flex-shrink-0">
                {checkoutError}
              </div>
            )}

            {/* Confirm */}
            <div className="px-3 pb-4 flex-shrink-0 border-t border-border pt-3">
              <button
                disabled={!canConfirm || phase === 'processing'}
                onClick={() => checkoutMutation.mutate()}
                className={`w-full py-4 rounded-xl font-bold text-[14px] tracking-wide flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.99]
                  ${canConfirm && phase !== 'processing'
                    ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
                    : 'bg-surface3 text-text3 cursor-not-allowed'}`}
              >
                {phase === 'processing' ? (
                  <><Spinner size={16} /> Processing…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Confirm · {currency} {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Receipt modal */}
      {phase === 'receipt' && completedOrder && (
        <ReceiptModal
          order={completedOrder}
          currency={currency}
          onNewSale={() => { clearCart(); setCompletedOrder(null); }}
        />
      )}
    </>
  );
}
