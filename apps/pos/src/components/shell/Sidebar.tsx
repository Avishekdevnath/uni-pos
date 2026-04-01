import { useState } from 'react';
import { useAppStore, type AppPage } from '../../store/app-store';
import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { fetchReportsSummary } from '../../lib/api';
import { LogoutConfirmDialog } from '../shared/LogoutConfirmDialog';

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  badge?: string | null;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, badge, hint, disabled, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg font-medium transition-all duration-150 mb-0.5 text-[13.5px] select-none text-left
        ${active ? '' : 'text-text2 hover:bg-surface2 hover:text-text1'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={active ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
    >
      <span className="text-[16px] w-5 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
          style={{ background: 'var(--green)', color: '#ffffff' }}>
          {badge}
        </span>
      )}
      {hint && !badge && (
        <span className="text-[10px] font-mono text-text3 opacity-50">{hint}</span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { activePage, setActivePage } = useAppStore();
  const { branch, tenant, logout, permissions } = useAuth();
  const canReadReports = permissions.some((p) => p === '*' || p === 'reports:read');
  const isManager = permissions.some((p) =>
    p === '*' || p === 'reports:read' || p === 'products:read' || p === 'inventory:read',
  );
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const currency = tenant?.defaultCurrency ?? '৳';

  const summaryQuery = useQuery({
    queryKey: ['sidebar-summary', branch?.id],
    queryFn: () => fetchReportsSummary(branch!.id, new Date().toISOString().split('T')[0]),
    enabled: !!branch?.id && canReadReports,
    refetchInterval: 60_000,
  });

  const revenue = summaryQuery.data?.revenue ?? 0;
  const txnCount = summaryQuery.data?.transactionCount ?? 0;

  function go(page: AppPage) {
    setActivePage(page);
  }

  return (
    <>
      <div className="w-[240px] bg-surface border-r border-border flex flex-col flex-shrink-0 py-4 px-3 overflow-y-auto">

        {/* Quick Access */}
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text3 px-2.5 mb-1.5">
            Quick Access
          </div>
          <NavItem icon="🧾" label="New Bill"      active={activePage === 'pos'}     hint="F1" onClick={() => go('pos')} />
          <NavItem icon="🖨️" label="Invoice Entry" active={activePage === 'invoice'} hint="F2" onClick={() => go('invoice')} />
          <NavItem icon="📈" label="Today's Sales" active={activePage === 'reports'}
            badge={txnCount > 0 ? String(txnCount) : null}
            onClick={() => go('reports')} />
          <NavItem icon="🔖" label="Saved Bills"   active={false} disabled hint="Soon" onClick={() => {}} />
        </div>

        {/* Management */}
        {isManager && (
          <div className="mb-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text3 px-2.5 mb-1.5">
              Management
            </div>
            <NavItem icon="📦" label="Products"  active={activePage === 'inventory'} hint="F3" onClick={() => go('inventory')} />
            <NavItem icon="👥" label="Customers" active={activePage === 'customers'} hint="F5" onClick={() => go('customers')} />
            <NavItem icon="📊" label="Analytics" active={activePage === 'reports'}   hint="F4" onClick={() => go('reports')} />
          </div>
        )}

        {/* Today's Summary */}
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text3 px-2.5 mb-1.5">
            Today's Summary
          </div>
          <div className="p-3 bg-surface2 rounded-[10px] border border-border">
            <div className="text-[11px] text-text3 mb-1">Revenue</div>
            <div className="font-mono text-[20px] font-medium" style={{ color: 'var(--accent)' }}>
              {currency}{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-text3 mt-2 mb-1">Transactions</div>
            <div className="font-mono text-[20px] font-medium" style={{ color: 'var(--green)' }}>
              {txnCount}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg cursor-pointer text-[13px] text-text3 hover:text-pos-red hover:bg-pos-red/10 transition-all duration-150 select-none text-left"
          >
            <span className="text-[16px] w-5 text-center">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {confirmingLogout && (
        <LogoutConfirmDialog
          onConfirm={() => { setConfirmingLogout(false); logout(); }}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </>
  );
}
