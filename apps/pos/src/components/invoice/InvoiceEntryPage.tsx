import { useState, useRef, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';
import { createDraftOrder, addInvoiceItem, completeOrder } from '../../lib/api';

interface LineItem {
  id: string;
  barcode: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export function InvoiceEntryPage() {
  const { user, branch, tenant } = useAuth();
  const currency = tenant?.defaultCurrency ?? '৳';

  const [items, setItems] = useState<LineItem[]>([]);
  const [lastInvoiceNo, setLastInvoiceNo] = useState('—');
  const [currentInvoice, setCurrentInvoice] = useState('INV-NEW');
  const [error, setError] = useState<string | null>(null);

  // Customer bar
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Entry row
  const [barcode, setBarcode] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');

  // Totals panel
  const [discPct, setDiscPct] = useState('0');
  const [taxPct, setTaxPct] = useState('0');

  // Tender panel
  const [tdBkash, setTdBkash] = useState('');
  const [tdBkashRef, setTdBkashRef] = useState('');
  const [tdNagad, setTdNagad] = useState('');
  const [tdNagadRef, setTdNagadRef] = useState('');
  const [tdRocket, setTdRocket] = useState('');
  const [tdRocketRef, setTdRocketRef] = useState('');
  const [tdCard, setTdCard] = useState('');
  const [tdCardRef, setTdCardRef] = useState('');
  const [tdBank, setTdBank] = useState('');
  const [tdBankRef, setTdBankRef] = useState('');
  const [tdQr, setTdQr] = useState('');
  const [tdQrRef, setTdQrRef] = useState('');
  const [tdCash, setTdCash] = useState('');

  const barcodeRef = useRef<HTMLInputElement>(null);

  // Computed totals
  const mrpTotal = items.reduce((s, i) => s + i.amount, 0);
  const discAmt = mrpTotal * (parseFloat(discPct) || 0) / 100;
  const afterDisc = mrpTotal - discAmt;
  const taxAmt = afterDisc * (parseFloat(taxPct) || 0) / 100;
  const grandTotal = afterDisc + taxAmt;

  // Tender computed
  const tenderTotal = useMemo(() => {
    return [tdBkash, tdNagad, tdRocket, tdCard, tdBank, tdQr]
      .reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }, [tdBkash, tdNagad, tdRocket, tdCard, tdBank, tdQr]);
  const cashReceived = parseFloat(tdCash) || 0;
  const payable = grandTotal;
  const roundOff = Math.round(payable) - payable;
  const change = cashReceived + tenderTotal - payable + roundOff;

  const addRow = useCallback(() => {
    if (!desc && !barcode) return;
    const qtyNum = parseFloat(qty) || 1;
    const priceNum = parseFloat(price) || 0;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        barcode,
        description: desc || barcode,
        qty: qtyNum,
        unitPrice: priceNum,
        amount: qtyNum * priceNum,
      },
    ]);
    setBarcode(''); setDesc(''); setQty('1'); setPrice('');
    setTimeout(() => barcodeRef.current?.focus(), 10);
  }, [barcode, desc, qty, price]);

  const removeRow = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const clearAll = () => {
    setItems([]);
    setDiscPct('0'); setTaxPct('0');
    setTdBkash(''); setTdNagad(''); setTdRocket(''); setTdCard(''); setTdBank(''); setTdQr(''); setTdCash('');
    setCustName(''); setCustPhone('');
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!branch?.id) throw new Error('No branch.');
      if (items.length === 0) throw new Error('No items.');
      const order = await createDraftOrder({ branch_id: branch.id, client_event_id: crypto.randomUUID() });
      for (const item of items) {
        await addInvoiceItem(order.id, { description: item.description, quantity: item.qty, unit_price: item.unitPrice, manual_tax_rate: 0 });
      }
      const key = crypto.randomUUID();
      const completed = await completeOrder(order.id, {
        client_event_id: key,
        payments: [{ method: 'cash', amount: grandTotal, cash_tendered: cashReceived || grandTotal, client_event_id: key }],
      }, key);
      return completed;
    },
    onMutate: () => setError(null),
    onSuccess: (order) => {
      setLastInvoiceNo(order.orderNumber ?? order.id.slice(0, 8));
      setCurrentInvoice(`INV-${String(Date.now()).slice(-5)}`);
      clearAll();
    },
    onError: (err: any) => setError(err?.message ?? 'Invoice failed.'),
  });

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Terminal Header Bar ── */}
      <div
        className="flex items-center justify-between px-4 h-[52px] flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '2px solid var(--accent)' }}
      >
        {/* Left section */}
        <div className="flex items-center gap-5">
          {[
            { label: 'Outlet', value: branch?.name ?? '—', gold: false },
            { label: 'User', value: user?.fullName ?? '—', gold: true },
            { label: 'Version', value: 'v1.0.0', gold: false },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-5">
              {i > 0 && <div className="w-px h-7 bg-border2" />}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[.1em] text-text3">{f.label}</span>
                <span className="font-mono text-[11.5px] font-medium" style={f.gold ? { color: 'var(--accent)' } : { color: 'var(--text1)' }}>
                  {f.value}
                </span>
              </div>
            </div>
          ))}
          <div className="w-px h-7 bg-border2" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[.1em] text-text3">Last Invoice #</span>
            <span
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >{lastInvoiceNo}</span>
          </div>
        </div>
        {/* Right section */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[.1em] text-text3">Terminal</span>
            <span className="font-mono text-[11.5px] font-medium" style={{ color: 'var(--accent)' }}>POS-TERMINAL-01</span>
          </div>
          <div className="w-px h-7 bg-border2" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[.1em] text-text3">Current Invoice</span>
            <span
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >{currentInvoice}</span>
          </div>
        </div>
      </div>

      {/* ── Customer Bar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border2)' }}
      >
        {/* Customer name */}
        <div
          className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-[5px]"
          style={{ flex: 1, maxWidth: 200, background: 'var(--surface)', border: '1px solid var(--border2)' }}
        >
          <span className="text-[10px] font-semibold text-text3 uppercase tracking-[.06em] whitespace-nowrap">Customer</span>
          <input
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            placeholder="Walk-in"
            className="flex-1 bg-transparent border-none outline-none font-mono text-[12.5px] font-medium"
            style={{ color: 'var(--accent)' }}
          />
        </div>
        {/* Phone */}
        <div
          className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-[5px]"
          style={{ flex: 1, maxWidth: 180, background: 'var(--surface)', border: '1px solid var(--border2)' }}
        >
          <span className="text-[10px] font-semibold text-text3 uppercase tracking-[.06em] whitespace-nowrap">Mobile #</span>
          <input
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            type="tel"
            className="flex-1 bg-transparent border-none outline-none font-mono text-[12.5px] font-medium"
            style={{ color: 'var(--accent)' }}
          />
        </div>
        {/* Badges */}
        <div
          className="rounded-[6px] px-3 py-[5px] text-center"
          style={{ background: 'var(--surface3)', border: '1px solid var(--border2)' }}
        >
          <div className="text-[9px] text-text3 uppercase tracking-[.07em]">Points</div>
          <div className="font-mono text-[13px] font-semibold" style={{ color: 'var(--green)' }}>0</div>
        </div>
        <div
          className="rounded-[6px] px-3 py-[5px] text-center"
          style={{ background: 'var(--surface3)', border: '1px solid var(--border2)' }}
        >
          <div className="text-[9px] text-text3 uppercase tracking-[.07em]">Balance</div>
          <div className="font-mono text-[13px] font-semibold" style={{ color: 'var(--green)' }}>{currency}0</div>
        </div>
        {/* Hold / Recall */}
        <div className="flex gap-2 ml-auto">
          <button
            className="rounded-[7px] px-3 py-[7px] text-[13px] font-bold cursor-pointer transition-all"
            style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)', fontWeight: 500 }}
          >📌 Hold</button>
          <button
            className="rounded-[7px] px-3 py-[7px] text-[13px] font-bold cursor-pointer transition-all"
            style={{ background: 'var(--pos-blue-dim, rgba(59,130,246,0.1))', color: 'var(--blue)', border: '1px solid var(--blue)' }}
          >📂 Recall</button>
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Entry bar + Table + Footer */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border2">

          {/* Entry bar */}
          <div
            className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
            style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border2)' }}
          >
            {/* Barcode */}
            <div
              className="flex items-center gap-2 rounded-[7px] px-3 py-[6px]"
              style={{ flex: '1.2', background: 'var(--surface)', border: '1px solid var(--border2)' }}
            >
              <span className="text-[16px]">▊</span>
              <input
                ref={barcodeRef}
                placeholder="Item Code / Barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] font-semibold placeholder:font-normal placeholder:text-text3"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            {/* Description */}
            <div
              className="flex rounded-[7px] px-3 py-[6px]"
              style={{ flex: '2.5', background: 'var(--surface)', border: '1px solid var(--border2)' }}
            >
              <input
                placeholder="Product description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                className="flex-1 bg-transparent border-none outline-none text-text1 text-[13px] placeholder:text-text3"
              />
            </div>
            {/* Price */}
            <div
              className="rounded-[7px] px-2.5 py-[6px]"
              style={{ width: 90, background: 'var(--surface)', border: '1px solid var(--border2)' }}
            >
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                className="w-full bg-transparent border-none outline-none font-mono text-[13px] text-right text-text1 placeholder:text-left placeholder:text-text3"
              />
            </div>
            {/* Qty */}
            <div
              className="rounded-[7px] px-2.5 py-[6px]"
              style={{ width: 80, background: 'var(--surface)', border: '1px solid var(--border2)' }}
            >
              <input
                type="number"
                placeholder="Qty"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                className="w-full bg-transparent border-none outline-none font-mono text-[13px] text-right text-text1 placeholder:text-left placeholder:text-text3"
              />
            </div>
            {/* Add button */}
            <button
              onClick={addRow}
              className="rounded-[7px] px-4 py-2 text-[13px] font-bold cursor-pointer whitespace-nowrap transition-colors"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >+ Add</button>
          </div>

          {/* Items table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border2)' }}>
                  {[['#', 32], ['Code', 90], ['Description', null], ['Unit Price', 100], ['Qty', 80], ['Amount', 100], ['', 36]].map(([h, w], i) => (
                    <th
                      key={i}
                      className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[.09em] text-text3"
                      style={{ width: w ? w : undefined, textAlign: i >= 3 ? 'right' : 'left' }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text3 text-[13px]">
                      📋 No items added — enter a barcode or product name above
                    </td>
                  </tr>
                ) : items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-3 py-2.5 font-mono text-[11px] text-text3">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-text2">{item.barcode || '—'}</td>
                    <td className="px-3 py-2.5 text-[13px] text-text1">{item.description}</td>
                    <td className="px-3 py-2.5 font-mono text-[13px] text-right text-text1">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2.5 font-mono text-[13px] text-right text-text1">{item.qty}</td>
                    <td className="px-3 py-2.5 font-mono text-[13px] text-right font-medium" style={{ color: 'var(--accent)' }}>
                      {currency} {item.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => removeRow(item.id)}
                        className="text-text3 rounded px-1.5 py-0.5 text-[14px] transition-all"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--red)'; (e.currentTarget as HTMLElement).style.background = 'var(--red-dim)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ''; (e.currentTarget as HTMLElement).style.background = ''; }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
          <div
            className="flex items-center gap-5 px-4 py-2 flex-shrink-0"
            style={{ background: 'var(--surface2)', borderTop: '2px solid var(--border2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[.07em] text-text2">No. of Items</span>
              <span className="font-mono text-[16px] font-bold" style={{ color: 'var(--accent)' }}>{items.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[.07em] text-text2">Total Qty</span>
              <span className="font-mono text-[16px] font-bold" style={{ color: 'var(--green)' }}>{totalQty.toFixed(3)}</span>
            </div>
            <div className="ml-auto">
              <button
                onClick={clearAll}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-border text-text2 hover:border-pos-red hover:text-pos-red transition-colors"
              >🗑 Clear All</button>
            </div>
          </div>
        </div>

        {/* RIGHT: Totals + Tender + Actions */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 300 }}>

          {/* Totals panel */}
          <div
            className="flex-shrink-0 px-4 py-3.5"
            style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border2)' }}
          >
            {[
              { label: 'MRP Total', value: mrpTotal.toFixed(2), color: undefined },
              { label: '(+) SD / Surcharge', value: '0.00', color: undefined },
              { label: '(-) Discount', value: discAmt.toFixed(2), color: 'var(--red)' },
              { label: '(+) Tax / VAT', value: taxAmt.toFixed(2), color: undefined },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-[7px] border-b border-border">
                <span className="text-[12px] text-text2 font-medium">{label} <span className="text-text3 mx-1">:</span></span>
                <span className="font-mono text-[14px] font-medium" style={{ color: color ?? 'var(--text1)' }}>
                  {currency} {value}
                </span>
              </div>
            ))}
            {/* Grand total */}
            <div
              className="flex justify-between items-center rounded-lg px-3.5 py-2.5 mt-2.5"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}
            >
              <span className="text-[14px] font-bold uppercase tracking-[.05em]" style={{ color: 'var(--accent)' }}>TOTAL</span>
              <span className="font-mono text-[22px] font-bold" style={{ color: 'var(--accent-light, var(--accent))' }}>
                {currency} {grandTotal.toFixed(2)}
              </span>
            </div>
            {/* Discount % / Tax % */}
            <div className="flex gap-2 mt-2.5">
              <div className="flex-1">
                <div className="text-[9px] text-text3 mb-1 uppercase tracking-[.08em]">Discount %</div>
                <input
                  type="number" min={0} max={100}
                  value={discPct}
                  onChange={(e) => setDiscPct(e.target.value)}
                  className="w-full rounded-[6px] px-2 py-1.5 font-mono text-[12px] text-right outline-none"
                  style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', color: 'var(--text1)' }}
                />
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-text3 mb-1 uppercase tracking-[.08em]">Tax / VAT %</div>
                <input
                  type="number" min={0} max={50}
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  className="w-full rounded-[6px] px-2 py-1.5 font-mono text-[12px] text-right outline-none"
                  style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', color: 'var(--text1)' }}
                />
              </div>
            </div>
          </div>

          {/* Tender panel */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3" style={{ background: 'var(--surface2)' }}>
            <div
              className="text-[10px] font-bold uppercase tracking-[.1em] text-text3 mb-2.5 pb-1.5"
              style={{ borderBottom: '1px solid var(--border2)' }}
            >Tender Details</div>

            {/* Method / Amount+Ref header */}
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-semibold uppercase tracking-[.07em] text-text3">Method</span>
              <span className="text-[9px] font-semibold uppercase tracking-[.07em] text-text3">Amount &nbsp;&nbsp; Ref#</span>
            </div>

            {/* Tender rows */}
            {([
              ['📱 bKash',         tdBkash, setTdBkash, tdBkashRef, setTdBkashRef],
              ['📱 Nagad',         tdNagad, setTdNagad, tdNagadRef, setTdNagadRef],
              ['📱 Rocket',        tdRocket, setTdRocket, tdRocketRef, setTdRocketRef],
              ['💳 Card (Visa/MC)', tdCard,  setTdCard,  tdCardRef,  setTdCardRef],
              ['🏦 Bank Transfer', tdBank,  setTdBank,  tdBankRef,  setTdBankRef],
              ['💳 QR Code',       tdQr,    setTdQr,    tdQrRef,    setTdQrRef],
            ] as [string, string, (v:string)=>void, string, (v:string)=>void][]).map(([label, val, setVal, ref, setRef]) => (
              <div key={label} className="flex items-center justify-between gap-2 py-[5px] border-b border-border">
                <span className="text-[12px] text-text2 flex-1">{label}</span>
                <input
                  type="number" placeholder="0.00"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="rounded-[5px] px-2 py-1 text-right font-mono text-[12px] outline-none"
                  style={{ width: 82, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text1)' }}
                />
                <input
                  placeholder="Ref#"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="rounded-[5px] px-1.5 py-1 font-mono text-[10px] outline-none"
                  style={{ width: 52, background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                />
              </div>
            ))}

            {/* Round off (readonly) */}
            <div className="flex items-center justify-between gap-2 py-[5px] border-b border-border">
              <span className="text-[12px] text-text2 flex-1">🔄 Round Off</span>
              <input
                readOnly value={roundOff !== 0 ? roundOff.toFixed(2) : ''}
                placeholder="0.00"
                className="rounded-[5px] px-2 py-1 text-right font-mono text-[12px] cursor-default"
                style={{ width: 82, background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              />
              <div style={{ width: 52 }} />
            </div>

          </div>

          {/* ── Static: Payable / Cash / Change ── */}
          <div className="flex-shrink-0 px-3.5 py-2.5 flex flex-col gap-1.5" style={{ background: 'var(--surface)', borderTop: '2px solid var(--border2)' }}>
            {/* Payable */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-text1">Payable Amount</span>
              <input
                readOnly value={payable.toFixed(2)}
                className="rounded-[5px] px-2 py-1 text-right font-mono text-[13px] font-bold cursor-default"
                style={{ width: 90, background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
              />
            </div>
            {/* Cash received */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-text1">💵 Cash Received</span>
              <input
                type="number" placeholder="0.00"
                value={tdCash}
                onChange={(e) => setTdCash(e.target.value)}
                className="rounded-[5px] px-2 py-1 text-right font-mono text-[13px] font-bold outline-none"
                style={{ width: 90, background: 'rgba(62,207,142,0.1)', border: '1px solid var(--green)', color: 'var(--green)' }}
              />
            </div>
            {/* Change */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-text1">🔁 Change / Return</span>
              <input
                readOnly value={change > 0 ? change.toFixed(2) : '0.00'}
                className="rounded-[5px] px-2 py-1 text-right font-mono text-[13px] font-bold cursor-default"
                style={{ width: 90, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
              />
            </div>
            {error && (
              <div className="mt-1 px-2 py-1 text-[11px] rounded" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)' }}>
                {error}
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-shrink-0" style={{ borderTop: '2px solid var(--border2)' }}>
            {([
              { icon: '🖨', label: 'Print',  onClick: () => checkoutMutation.mutate(), disabled: checkoutMutation.isPending || items.length === 0, bg: 'var(--accent)', color: '#ffffff' },
              { icon: '📌', label: 'Hold',   onClick: () => {},  disabled: false, bg: 'rgba(59,130,246,0.1)', color: 'var(--blue)' },
              { icon: '⊘',  label: 'Void',   onClick: clearAll,  disabled: false, bg: 'rgba(239,68,68,0.1)', color: 'var(--red)' },
              { icon: '⬡',  label: 'Exit',   onClick: () => {},  disabled: false, bg: 'var(--surface2)', color: 'var(--text2)' },
            ]).map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                disabled={btn.disabled}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all disabled:opacity-40 cursor-pointer"
                style={{ background: btn.bg, color: btn.color, borderLeft: i > 0 ? '1px solid var(--border2)' : 'none' }}
              >
                <span className="text-[15px] leading-none">{checkoutMutation.isPending && i === 0 ? '⏳' : btn.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-[.1em]">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
