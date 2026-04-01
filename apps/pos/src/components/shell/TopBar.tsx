import { useEffect, useState } from 'react';
import { useAppStore, type AppPage } from '../../store/app-store';
import { useAuth } from '../../hooks/use-auth';
import { Logo } from '../shared/Logo';
import {
  getSystemResolvedTheme,
  getThemeToggleCopy,
  resolveThemePreference,
} from '../../lib/theme';

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'pos',       label: '⚡ POS' },
  { id: 'invoice',   label: '🖨️ Invoice Entry' },
  { id: 'inventory', label: '📦 Inventory' },
  { id: 'reports',   label: '📊 Reports' },
  { id: 'customers', label: '👥 Customers' },
  { id: 'settings',  label: '⚙️ Settings' },
];

const MANAGER_ONLY: AppPage[] = ['reports', 'customers', 'settings'];

export function TopBar() {
  const { activePage, setActivePage, themePreference, toggleTheme } = useAppStore();
  const { user, branch, permissions } = useAuth();
  const [time, setTime] = useState('');
  const isManager = permissions.some((p) => p === '*' || p === 'reports:view');

  const systemTheme = getSystemResolvedTheme(
    typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
  );
  const resolvedTheme = resolveThemePreference(themePreference, systemTheme === 'dark');
  const themeToggleCopy = getThemeToggleCopy(resolvedTheme);

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const visibleNav = NAV_ITEMS.filter(
    (item) => !MANAGER_ONLY.includes(item.id) || isManager,
  );

  return (
    <div
      className="drag-region flex items-center justify-between px-7 h-[60px] bg-surface border-b border-border flex-shrink-0"
      style={{ userSelect: 'none' }}
    >
      {/* Logo */}
      <div className="no-drag">
        <Logo size="md" showText={true} />
      </div>

      {/* Nav */}
      <nav className="flex gap-1 no-drag">
        {visibleNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer
              ${activePage === item.id
                ? 'text-accent'
                : 'text-text2 hover:bg-surface2 hover:text-text1'}
            `}
            style={activePage === item.id ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-4 no-drag">
        <div className="text-[13px] text-text2">
          {branch?.name && <span className="text-text1 font-medium">{branch.name}</span>}
          {!branch?.name && <span className="text-text2">Welcome, <span className="text-text1 font-medium">{(user as any)?.fullName ?? (user as any)?.name ?? '—'}</span></span>}
        </div>
        <div className="font-mono text-[12px] text-text3">{time}</div>
        <button
          onClick={() => toggleTheme(resolvedTheme)}
          className="h-[28px] rounded-md bg-surface2 hover:bg-surface3 text-text2 hover:text-text1 px-3 text-[11px] font-medium transition-colors cursor-pointer"
          title={themeToggleCopy.title}
        >
          {themeToggleCopy.label}
        </button>
        {/* Window controls */}
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => window.electronAPI?.minimize()}
            className="w-[28px] h-[28px] rounded-md bg-surface2 hover:bg-surface3 text-text3 hover:text-text1 text-[12px] flex items-center justify-center transition-colors cursor-pointer"
            title="Minimize"
          >–</button>
          <button
            onClick={() => window.electronAPI?.maximize()}
            className="w-[28px] h-[28px] rounded-md bg-surface2 hover:bg-surface3 text-text3 hover:text-text1 text-[12px] flex items-center justify-center transition-colors cursor-pointer"
            title="Maximize"
          >⛶</button>
          <button
            onClick={() => window.electronAPI?.close()}
            className="w-[28px] h-[28px] rounded-md bg-surface2 hover:bg-pos-red/20 text-text3 hover:text-pos-red text-[12px] flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >✕</button>
        </div>
      </div>
    </div>
  );
}
