import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryProvider } from './providers/query-provider';
import { AuthProvider } from './providers/auth-provider';
import { CartProvider } from './providers/cart-provider';
import { AppShell } from './components/app-shell';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Missing #app root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
);
