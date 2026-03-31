import { useAppStore, type AppPage } from '../../store/app-store';
import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { fetchReportsSummary } from '../../lib/api';

interface NavItemProps {
  icon: string;
  label: string;
  page: AppPage;
  active: boolean;
  badge?: string | null;
  hint?: string;
  onClick: () => void;
}

function NavItem({ icon, label, active, badge, hint, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg cursor-pointer font-medium transition-all duration-150 mb-0.5 text-[13.5px] select-none
        ${active ? 'text-accent' : 'text-text2 hover:bg-surface2 hover:text-text1'}`}
      style={active ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
    >
      <span className="text-[16px] w-5 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}>
          {badge}
        </span>
      )}
      {hint && !badge && (
        <span className="text-[10px] font-mono text-text3 opacity-50">{hint}</span>
      )}
    </div>
  );
}

export function Sidebar() {
  const { activePage, setActivePage } = useAppStore();
  const { branch, logout, permissions } = useAuth();
  const isManager = permissions.some((p) => p === '*' || p === 'reports:view');

  const summaryQuery = useQuery({
    queryKey: ['sidebar-summary', branch?.id],
    queryFn: () => fetchReportsSummary(branch!.id, new Date().toISOString().split('T')[0]),
    enabled: !!branch?.id,
    refetchInterval: 60_000,
  });

  const revenue = summaryQuery.data?.revenue ?? 0;
  const txnCount = summaryQuery.data?.transactionCount ?? 0;

  return (
    <div className="w-[240px] bg-surface border-r border-border flex flex-col flex-shrink-0 py-4 px-3 overflow-y-auto">

      {/* Quick Access */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text3 px-2.5 mb-1.5">
          Quick Access
        </div>
        <NavItem icon="🧾" label="New Bill"       page="pos"      active={activePage === 'pos'}      hint="F1" onClick={() => setActivePage('pos')} />
        <NavItem icon="🖨️" label="Invoice Entry"  page="invoice"  active={activePage === 'invoice'}  hint="F2" onClick={() => setActivePage('invoice')} />
        <NavItem icon="📈" label="Today's Sales"  page="reports"  active={activePage === 'reports'}
          badge={txnCount > 0 ? String(txnCount) : null}
          onClick={() => setActivePage('reports')} />
        <NavItem icon="🔖" label="Saved Bills"    page="pos"      active={false} onClick={() => {}} />
      </div>

      {/* Management */}
      {isManager && (
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text3 px-2.5 mb-1.5">
            Management
          </div>
          <NavItem icon="📦" label="Products"   page="inventory" active={activePage === 'inventory'} hint="F3" onClick={() => setActivePage('inventory')} />
          <NavItem icon="👥" label="Customers"  page="customers" active={activePage === 'customers'} hint="F5" onClick={() => setActivePage('customers')} />
          <NavItem icon="📊" label="Analytics"  page="reports"   active={false}                      hint="F4" onClick={() => setActivePage('reports')} />
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
            ৳{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-text3 mt-2 mb-1">Transactions</div>
          <div className="font-mono text-[20px] font-medium" style={{ color: 'var(--green)' }}>
            {txnCount}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-auto">
        <div
          onClick={logout}
          className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg cursor-pointer text-[13px] text-text3 hover:text-pos-red hover:bg-pos-red/10 transition-all duration-150 select-none"
        >
          <span className="text-[16px] w-5 text-center">🚪</span>
          Logout
        </div>
      </div>
    </div>
  );
}
