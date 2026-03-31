import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';
import { apiBaseUrl } from '../../lib/api';
import {
  getSystemResolvedTheme,
  getThemePreferenceDescription,
  resolveThemePreference,
} from '../../lib/theme';
import { useAppStore } from '../../store/app-store';
import { Spinner } from '../shared/Spinner';

async function updateBranchSettings(
  branchId: string,
  settings: Record<string, unknown>,
): Promise<void> {
  const token = localStorage.getItem('uni-pos.pos.access-token');
  const res = await fetch(`${apiBaseUrl}/branches/${branchId}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <div className="text-text1 text-sm font-medium">{label}</div>
        <div className="text-text3 text-xs mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface3'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const { themePreference, setThemePreference } = useAppStore();
  const branchId = user?.defaultBranchId ?? '';

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('৳');
  const [defaultTax, setDefaultTax] = useState('0');
  const [receiptPrint, setReceiptPrint] = useState(false);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [requireCustomer, setRequireCustomer] = useState(false);
  const [saved, setSaved] = useState(false);
  const systemTheme = getSystemResolvedTheme(
    typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
  );
  const resolvedTheme = resolveThemePreference(themePreference, systemTheme === 'dark');
  const themeDescription = getThemePreferenceDescription(
    themePreference,
    resolvedTheme,
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateBranchSettings(branchId, {
        receipt_auto_print: receiptPrint,
        tax_inclusive: taxInclusive,
        require_customer_on_checkout: requireCustomer,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-text1 text-xl font-semibold">Settings</h1>
          <p className="text-text3 text-xs mt-0.5">Configure your shop details</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Shop Information — matches reference form-grid */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--accent)' }}>🏪 Shop Information</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Shop Name', placeholder: 'My Shop', value: shopName, onChange: setShopName },
                { label: 'Owner Name', placeholder: 'John Doe', value: ownerName, onChange: setOwnerName },
                { label: 'Phone Number', placeholder: '+880 1234-567890', value: phone, onChange: setPhone },
                { label: 'Email', placeholder: 'shop@example.com', value: email, onChange: setEmail },
              ].map(({ label, placeholder, value, onChange }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">{label}</label>
                  <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="bg-surface2 border border-border2 rounded-lg px-3 py-2 text-text1 text-[13px] outline-none transition-colors"
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                  />
                </div>
              ))}
              {/* Address — full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Dhaka"
                  className="bg-surface2 border border-border2 rounded-lg px-3 py-2 text-text1 text-[13px] outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">Currency Symbol</label>
                <input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="৳"
                  className="bg-surface2 border border-border2 rounded-lg px-3 py-2 text-text1 text-[13px] outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">Default Tax (%)</label>
                <input
                  type="number"
                  value={defaultTax}
                  onChange={(e) => setDefaultTax(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="bg-surface2 border border-border2 rounded-lg px-3 py-2 text-text1 text-[13px] outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </div>
            </div>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {mutation.isPending ? <Spinner size={14} /> : null}
              {saved ? '✓ Saved' : mutation.isPending ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          {/* Theme */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--accent)' }}>🎨 Appearance</h2>
            <p className="text-text3 text-xs mb-4">{themeDescription}</p>
            <div className="flex flex-wrap gap-2">
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemePreference(mode)}
                  className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                    mode === themePreference
                      ? 'bg-accent/10 text-accent border-accent/30 font-semibold'
                      : 'bg-surface2 text-text2 border-border font-medium hover:text-text1 hover:border-border2'
                  }`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* POS Behaviour */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--accent)' }}>⚙️ POS Behaviour</h2>
            <ToggleRow
              label="Auto-print receipt"
              description="Immediately send to printer after checkout"
              checked={receiptPrint}
              onChange={setReceiptPrint}
            />
            <ToggleRow
              label="Tax-inclusive pricing"
              description="Displayed prices already include tax"
              checked={taxInclusive}
              onChange={setTaxInclusive}
            />
            <ToggleRow
              label="Require customer on checkout"
              description="Cashier must attach a customer profile before completing a sale"
              checked={requireCustomer}
              onChange={setRequireCustomer}
            />
          </div>

          {/* About */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--accent)' }}>ℹ️ About</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-text3 text-xs">App</span>
                <span className="text-text2 text-xs font-mono">uniPOS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text3 text-xs">API</span>
                <span className="text-text2 text-xs font-mono">{apiBaseUrl}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
