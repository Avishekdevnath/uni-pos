import { useEffect } from 'react';
import { useAppStore } from '../store/app-store';

const PAGE_KEYS: Record<string, Parameters<ReturnType<typeof useAppStore.getState>['setActivePage']>[0]> = {
  F1: 'pos',
  F2: 'invoice',
  F3: 'inventory',
  F4: 'reports',
  F5: 'customers',
  F6: 'settings',
};

export function useKeyboardShortcuts() {
  const { setActivePage } = useAppStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const page = PAGE_KEYS[e.key];
      if (page) {
        e.preventDefault();
        setActivePage(page);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActivePage]);
}
