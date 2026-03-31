import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportsSummary, type ReportsSummary } from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { Spinner } from '../shared/Spinner';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: boolean;
  green?: boolean;
}

function StatCard({ label, value, sub, icon, accent, green }: StatCardProps) {
  const valColor = accent ? 'var(--accent)' : green ? 'var(--green)' : undefined;
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
      <div className="text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">{label}</div>
      <div className="font-mono text-[22px] font-medium" style={valColor ? { color: valColor } : undefined}>
        {value}
      </div>
      {sub && <div className="text-text3 text-[11px]">{sub}</div>}
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayIso());

  const { data, isLoading, isError, refetch } = useQuery<ReportsSummary>({
    queryKey: ['reports-summary', user?.defaultBranchId, date],
    queryFn: () => fetchReportsSummary(user?.defaultBranchId ?? '', date),
    staleTime: 60 * 1000,
    enabled: Boolean(user?.defaultBranchId),
  });

  const isToday = date === todayIso();

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const shifted = d.toISOString().slice(0, 10);
    if (shifted <= todayIso()) setDate(shifted);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-text1 text-xl font-semibold">Analytics & Reports</h1>
          <p className="text-text3 text-xs mt-0.5">Track your shop performance</p>
        </div>
        <div className="flex-1" />

        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded-lg text-text2 hover:border-accent hover:text-text1 transition-colors"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="bg-surface border border-border rounded-lg text-text1 text-sm px-3 py-2 focus:outline-none focus:border-accent"
          />
          <button
            disabled={isToday}
            onClick={() => shiftDate(1)}
            className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded-lg text-text2 hover:border-accent hover:text-text1 transition-colors disabled:opacity-30"
          >
            ›
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(todayIso())}
              className="px-3 py-2 text-xs bg-accent/10 border border-accent/20 text-accent rounded-lg hover:bg-accent/20 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded-lg text-text2 hover:border-accent hover:text-text1 transition-colors"
          title="Refresh"
        >
          ↺
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Spinner size={28} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-pos-red text-sm">Failed to load report</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs bg-surface border border-border rounded-lg text-text2 hover:border-accent hover:text-text1"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <StatCard label="Today's Revenue" value={formatCurrency(data.revenue)} sub={`${data.transactionCount} transactions`} icon="💰" accent />
              <StatCard label="Items Sold Today" value={String(data.itemsSold)} sub="units" icon="📦" green />
              <StatCard label="Total Revenue" value={formatCurrency(data.revenue)} sub="all time" icon="📈" accent />
              <StatCard label="Avg Bill Value" value={formatCurrency(data.avgOrderValue)} sub="per transaction" icon="📊" />
            </div>

            {/* Chart cards row */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-[13px] font-semibold text-text2 mb-4">Sales by Category</div>
                {data.transactionCount === 0 ? (
                  <div className="text-text3 text-sm text-center py-6">No data yet</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Placeholder bars — real data would come from a breakdown endpoint */}
                    {['Products', 'Services', 'Other'].map((cat, i) => (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="text-[12px] text-text2 w-20">{cat}</div>
                        <div className="flex-1 h-2 rounded-full bg-surface3">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${[70, 20, 10][i]}%`, background: 'var(--accent)' }}
                          />
                        </div>
                        <div className="text-[11px] font-mono text-text3 w-8 text-right">{[70, 20, 10][i]}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-[13px] font-semibold text-text2 mb-4">Payment Methods</div>
                {data.transactionCount === 0 ? (
                  <div className="text-text3 text-sm text-center py-6">No data yet</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[['💵 Cash', 60], ['💳 Card', 30], ['📱 Digital', 10]].map(([label, pct]) => (
                      <div key={label as string} className="flex items-center gap-3">
                        <div className="text-[12px] text-text2 w-20">{label}</div>
                        <div className="flex-1 h-2 rounded-full bg-surface3">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${pct}%`, background: 'var(--green)' }}
                          />
                        </div>
                        <div className="text-[11px] font-mono text-text3 w-8 text-right">{pct}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent transactions table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="text-[13px] font-semibold text-text2">Recent Transactions</div>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Invoice #', 'Customer', 'Items', 'Total', 'Method', 'Time'].map((h) => (
                      <th key={h} className="text-left text-text3 font-medium px-5 py-3 text-[11px] uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.transactionCount === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-text3 px-5 py-8">No transactions yet</td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-text3 px-5 py-8 text-[12px]">
                        Transaction details coming soon
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
