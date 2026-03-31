import React from 'react';
import { useAuth } from '../hooks/use-auth';
import { LoginForm } from './login-form';
import { TerminalHome } from './terminal-home';

export function AppShell() {
  const { isLoading, isAuthenticated, canSell } = useAuth();

  if (isLoading) {
    return (
      <div className="center-screen">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="center-screen">
        <LoginForm />
      </div>
    );
  }

  if (!canSell) {
    return (
      <div className="center-screen">
        <div className="card login-card">
          <h1>Access denied</h1>
          <p className="error">Your account is authenticated but missing POS permission (<code>pos:sell</code>).</p>
        </div>
      </div>
    );
  }

  return <TerminalHome />;
}
