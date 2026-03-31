import { useEffect, useState } from 'react';
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts';
import { useAuth } from '../../hooks/use-auth';
import { useAppStore } from '../../store/app-store';
import {
  applyResolvedTheme,
  getSystemResolvedTheme,
  resolveThemePreference,
  type ResolvedTheme,
  watchSystemTheme,
} from '../../lib/theme';
import { LoginForm } from '../login-form';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { PosPage } from '../pos/PosPage';
import { InvoiceEntryPage } from '../invoice/InvoiceEntryPage';
import { InventoryPage } from '../inventory/InventoryPage';
import { ReportsPage } from '../reports/ReportsPage';
import { CustomersPage } from '../customers/CustomersPage';
import { SettingsPage } from '../settings/SettingsPage';
import { Spinner } from '../shared/Spinner';
import { StatusBar } from './StatusBar';
import { ToastStack } from '../shared/ToastStack';

export function AppShell() {
  const { isLoading, isAuthenticated, canSell } = useAuth();
  useKeyboardShortcuts();
  const { activePage, themePreference } = useAppStore();
  const [, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemResolvedTheme(
      typeof window.matchMedia === 'function'
        ? window.matchMedia.bind(window)
        : undefined,
    ),
  );

  useEffect(() => {
    const root = document.documentElement;
    const query =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    applyResolvedTheme(
      root,
      resolveThemePreference(themePreference, query?.matches ?? false),
    );
    setSystemTheme(query?.matches ? 'dark' : 'light');

    if (themePreference !== 'system' || !query) {
      return;
    }

    return watchSystemTheme(query, (theme) => {
      setSystemTheme(theme);
      applyResolvedTheme(root, theme);
    });
  }, [themePreference]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <LoginForm />
      </div>
    );
  }

  if (!canSell) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-sm text-center">
          <div className="text-pos-red text-4xl mb-4">🔒</div>
          <h2 className="text-text1 font-semibold text-lg mb-2">Access Denied</h2>
          <p className="text-text2 text-sm">
            Your account is missing the <code className="text-accent bg-surface2 px-1 rounded">pos:sell</code> permission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {activePage === 'pos' && <PosPage />}
          {activePage === 'invoice' && <InvoiceEntryPage />}
          {activePage === 'inventory' && <InventoryPage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'customers' && <CustomersPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>
      {/* Persistent status bar at the bottom */}
      <StatusBar />
      <ToastStack />
    </div>
  );
}
