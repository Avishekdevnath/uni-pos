'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchSettings, updateSettings, type TenantSettings } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Store,
  DollarSign,
  Receipt,
  CreditCard,
  Package,
  Check,
  Loader2,
  Globe,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Currency data ────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepali Rupee', symbol: '₨' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
] as const;

const TIMEZONES = [
  'Asia/Dhaka', 'Asia/Kolkata', 'Asia/Karachi', 'Asia/Colombo',
  'Asia/Kathmandu', 'Asia/Yangon', 'Asia/Bangkok', 'Asia/Jakarta',
  'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Hong_Kong',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Kuwait', 'Asia/Baghdad', 'Asia/Beirut',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Warsaw', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'America/Mexico_City', 'America/Bogota',
  'Australia/Sydney', 'Pacific/Auckland',
];

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', description: 'Physical cash payments' },
  { key: 'card', label: 'Card', description: 'Credit/Debit card payments' },
  { key: 'mobile_banking', label: 'Mobile Banking', description: 'bKash, Nagad, Rocket, etc.' },
  { key: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer' },
  { key: 'cheque', label: 'Cheque', description: 'Cheque payments' },
  { key: 'store_credit', label: 'Store Credit', description: 'Customer store credit' },
  { key: 'gift_card', label: 'Gift Card', description: 'Gift card redemptions' },
];

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'currency', label: 'Currency', icon: DollarSign },
  { id: 'receipt', label: 'Receipt', icon: Receipt },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-48 shrink-0" />
          <Skeleton className="h-64 flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your store configuration, currency, receipts, and more
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar tabs */}
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left whitespace-nowrap',
                  'transition-colors duration-150',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <GeneralTab settings={settings!} onSave={mutation.mutate} isSaving={mutation.isPending} />
          )}
          {activeTab === 'currency' && (
            <CurrencyTab settings={settings!} onSave={mutation.mutate} isSaving={mutation.isPending} />
          )}
          {activeTab === 'receipt' && (
            <ReceiptTab settings={settings!} onSave={mutation.mutate} isSaving={mutation.isPending} />
          )}
          {activeTab === 'payment' && (
            <PaymentTab settings={settings!} onSave={mutation.mutate} isSaving={mutation.isPending} />
          )}
          {activeTab === 'inventory' && (
            <InventoryTab settings={settings!} onSave={mutation.mutate} isSaving={mutation.isPending} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared section wrapper ───────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="border-b border-border pb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SaveButton({ isSaving }: { isSaving: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button type="submit" disabled={isSaving} className="gap-2 rounded-xl">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {isSaving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab({ settings, onSave, isSaving }: TabProps) {
  const [form, setForm] = useState({
    storeName: settings.storeName ?? '',
    storeEmail: settings.storeEmail ?? '',
    storePhone: settings.storePhone ?? '',
    storeAddress: settings.storeAddress ?? '',
    timezone: settings.timezone ?? 'Asia/Dhaka',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <Section title="Store Information" description="Your business details shown on receipts and reports">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store Name">
            <Input value={form.storeName} onChange={(e) => setForm(p => ({ ...p, storeName: e.target.value }))} placeholder="My Store" />
          </Field>
          <Field label="Store Email">
            <Input type="email" value={form.storeEmail} onChange={(e) => setForm(p => ({ ...p, storeEmail: e.target.value }))} placeholder="store@example.com" />
          </Field>
          <Field label="Phone Number">
            <Input value={form.storePhone} onChange={(e) => setForm(p => ({ ...p, storePhone: e.target.value }))} placeholder="+880 1700 000000" />
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onValueChange={(v) => setForm(p => ({ ...p, timezone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Store Address" >
            <Textarea
              value={form.storeAddress}
              onChange={(e) => setForm(p => ({ ...p, storeAddress: e.target.value }))}
              placeholder="123 Main Street, City, Country"
              className="col-span-2 resize-none"
              rows={3}
            />
          </Field>
        </div>
      </Section>
      <SaveButton isSaving={isSaving} />
    </form>
  );
}

// ─── Currency Tab ─────────────────────────────────────────────────────────────

function CurrencyTab({ settings, onSave, isSaving }: TabProps) {
  const activeCurrencies = (settings.supportedCurrencies ?? 'BDT').split(',').filter(Boolean);
  const [form, setForm] = useState({
    defaultCurrency: settings.defaultCurrency ?? 'BDT',
    currencySymbolPosition: settings.currencySymbolPosition ?? 'before',
    currencyDecimalPlaces: String(settings.currencyDecimalPlaces ?? 2),
    thousandsSeparator: (settings.thousandsSeparator === '' ? 'none' : settings.thousandsSeparator) ?? ',',
    decimalSeparator: settings.decimalSeparator ?? '.',
    supportedCurrencies: activeCurrencies,
  });

  const toggleCurrency = (code: string) => {
    setForm(prev => {
      const existing = prev.supportedCurrencies;
      const next = existing.includes(code)
        ? existing.filter((c) => c !== code)
        : [...existing, code];
      if (next.length === 0) return prev; // keep at least 1
      return { ...prev, supportedCurrencies: next };
    });
  };

  const previewAmount = (() => {
    const symbol = CURRENCIES.find((c) => c.code === form.defaultCurrency)?.symbol ?? form.defaultCurrency;
    const decimals = parseInt(form.currencyDecimalPlaces);
    const num = (1234567.89).toFixed(decimals);
    const [int, dec] = num.split('.');
    const sep = form.thousandsSeparator === 'none' ? '' : form.thousandsSeparator;
    const formattedInt = sep ? int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : int;
    const formatted = dec !== undefined ? `${formattedInt}${form.decimalSeparator}${dec}` : formattedInt;
    return form.currencySymbolPosition === 'before' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
  })();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      thousandsSeparator: form.thousandsSeparator === 'none' ? '' : form.thousandsSeparator,
      currencyDecimalPlaces: parseInt(form.currencyDecimalPlaces),
      supportedCurrencies: form.supportedCurrencies.join(','),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Section title="Currency Format" description="How monetary values are displayed across the system">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default Currency">
            <Select value={form.defaultCurrency} onValueChange={(v) => setForm(p => ({ ...p, defaultCurrency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-2 text-muted-foreground">{c.symbol}</span>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Symbol Position">
            <Select value={form.currencySymbolPosition} onValueChange={(v) => setForm(p => ({ ...p, currencySymbolPosition: v as 'before' | 'after' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before amount ($ 100)</SelectItem>
                <SelectItem value="after">After amount (100 $)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Decimal Places">
            <Select value={form.currencyDecimalPlaces} onValueChange={(v) => setForm(p => ({ ...p, currencyDecimalPlaces: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — No decimals (100)</SelectItem>
                <SelectItem value="2">2 — Standard (100.00)</SelectItem>
                <SelectItem value="3">3 — Extended (100.000)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Thousands Separator">
            <Select value={form.thousandsSeparator} onValueChange={(v) => setForm(p => ({ ...p, thousandsSeparator: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Comma (1,000,000)</SelectItem>
                <SelectItem value=".">Period (1.000.000)</SelectItem>
                <SelectItem value=" ">Space (1 000 000)</SelectItem>
                <SelectItem value="none">None (1000000)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Live preview */}
        <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/40 p-4 flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Live preview</p>
            <p className="text-xl font-bold tabular-nums">{previewAmount}</p>
          </div>
        </div>
      </Section>

      <Section title="Accepted Currencies" description="Enable the currencies your store accepts for transactions">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto pr-1">
          {CURRENCIES.map((c) => {
            const isEnabled = form.supportedCurrencies.includes(c.code);
            const isDefault = c.code === form.defaultCurrency;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => !isDefault && toggleCurrency(c.code)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors duration-150',
                  isEnabled
                    ? 'border-primary/30 bg-primary/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  isDefault && 'cursor-not-allowed opacity-80',
                )}
              >
                <span className="font-mono text-base w-6 shrink-0 text-center">{c.symbol}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{c.code}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                </div>
                {isDefault && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                {isEnabled && !isDefault && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </Section>

      <SaveButton isSaving={isSaving} />
    </form>
  );
}

// ─── Receipt Tab ──────────────────────────────────────────────────────────────

function ReceiptTab({ settings, onSave, isSaving }: TabProps) {
  const [form, setForm] = useState({
    receiptHeader: settings.receiptHeader ?? '',
    receiptFooter: settings.receiptFooter ?? 'Thank you for your purchase!',
    receiptShowLogo: settings.receiptShowLogo ?? false,
    orderNumberPrefix: settings.orderNumberPrefix ?? 'ORD',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <Section title="Receipt Configuration" description="Customize what appears on printed and digital receipts">
        <div className="grid gap-4">
          <Field label="Order Number Prefix" hint="e.g. ORD → ORD-00001">
            <Input
              value={form.orderNumberPrefix}
              onChange={(e) => setForm(p => ({ ...p, orderNumberPrefix: e.target.value.toUpperCase().slice(0, 8) }))}
              placeholder="ORD"
              className="w-32 font-mono uppercase"
              maxLength={8}
            />
          </Field>
          <Field label="Receipt Header" hint="Shown at the top of every receipt">
            <Textarea
              value={form.receiptHeader}
              onChange={(e) => setForm(p => ({ ...p, receiptHeader: e.target.value }))}
              placeholder="Welcome to our store!"
              rows={2}
              className="resize-none"
            />
          </Field>
          <Field label="Receipt Footer" hint="Shown at the bottom of every receipt">
            <Textarea
              value={form.receiptFooter}
              onChange={(e) => setForm(p => ({ ...p, receiptFooter: e.target.value }))}
              placeholder="Thank you for your purchase!"
              rows={2}
              className="resize-none"
            />
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Show Logo on Receipt</p>
              <p className="text-xs text-muted-foreground mt-0.5">Display your store logo on printed receipts</p>
            </div>
            <Switch
              checked={form.receiptShowLogo}
              onCheckedChange={(v) => setForm(p => ({ ...p, receiptShowLogo: v }))}
            />
          </div>
        </div>
      </Section>
      <SaveButton isSaving={isSaving} />
    </form>
  );
}

// ─── Payment Methods Tab ──────────────────────────────────────────────────────

function PaymentTab({ settings, onSave, isSaving }: TabProps) {
  const activeMethods = JSON.parse(settings.paymentMethods ?? '["cash"]') as string[];
  const [enabled, setEnabled] = useState<string[]>(activeMethods);

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (next.length === 0) return prev;
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ paymentMethods: JSON.stringify(enabled) });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Section title="Accepted Payment Methods" description="Choose which payment methods cashiers can use at checkout">
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m) => {
            const isOn = enabled.includes(m.key);
            const isCash = m.key === 'cash';
            return (
              <div
                key={m.key}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 transition-colors duration-150',
                  isOn ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
                )}
              >
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  {isCash && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">Required — cannot be disabled</p>
                  )}
                </div>
                <Switch
                  checked={isOn}
                  onCheckedChange={() => !isCash && toggle(m.key)}
                  disabled={isCash}
                />
              </div>
            );
          })}
        </div>
      </Section>
      <SaveButton isSaving={isSaving} />
    </form>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────

function InventoryTab({ settings, onSave, isSaving }: TabProps) {
  const [form, setForm] = useState({
    lowStockThreshold: String(settings.lowStockThreshold ?? 5),
    trackInventory: settings.trackInventory ?? true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, lowStockThreshold: parseInt(form.lowStockThreshold) });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Section title="Inventory Management" description="Control how stock is tracked and when alerts are triggered">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Track Inventory</p>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically deduct stock on completed orders</p>
            </div>
            <Switch
              checked={form.trackInventory}
              onCheckedChange={(v) => setForm(p => ({ ...p, trackInventory: v }))}
            />
          </div>
          <Field label="Low Stock Threshold" hint="Show alert on dashboard when stock falls below this number">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={9999}
                value={form.lowStockThreshold}
                onChange={(e) => setForm(p => ({ ...p, lowStockThreshold: e.target.value }))}
                className="w-28 font-mono"
              />
              <span className="text-sm text-muted-foreground">units</span>
            </div>
          </Field>
        </div>
      </Section>
      <SaveButton isSaving={isSaving} />
    </form>
  );
}

// ─── Shared types ─────────────────────────────────────────────────────────────

interface TabProps {
  settings: TenantSettings;
  onSave: (data: Partial<TenantSettings>) => void;
  isSaving: boolean;
}
