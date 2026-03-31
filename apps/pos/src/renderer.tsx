import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './lib/query-client';
import {
  applyResolvedTheme,
  getStoredThemePreference,
  getSystemResolvedTheme,
  resolveThemePreference,
} from './lib/theme';
import { AuthProvider } from './providers/auth-provider';
import { AppShell } from './components/shell/AppShell';

const queryClient = createQueryClient();
const initialThemePreference = getStoredThemePreference(localStorage);
const initialSystemTheme = getSystemResolvedTheme(
  typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
);

applyResolvedTheme(
  document.documentElement,
  resolveThemePreference(initialThemePreference, initialSystemTheme === 'dark'),
);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
