import React, { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, login as apiLogin, setToken } from '../lib/api';
import type { PosBranch, PosMeResponse, PosRole, PosTenant, PosUser } from '../types/auth';

const TOKEN_KEY = 'uni-pos.pos.access-token';

export interface AuthContextValue {
  user: PosUser | null;
  role: PosRole | null;
  branch: PosBranch | null;
  tenant: PosTenant | null;
  permissions: string[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canSell: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function canSellFromPermissions(permissions: string[]): boolean {
  return permissions.includes('pos:sell') || permissions.includes('pos:*') || permissions.includes('*');
}

function applyMe(setters: {
  setUser: (user: PosUser | null) => void;
  setRole: (role: PosRole | null) => void;
  setBranch: (branch: PosBranch | null) => void;
  setTenant: (tenant: PosTenant | null) => void;
  setPermissions: (permissions: string[]) => void;
}, me: PosMeResponse) {
  setters.setUser(me.user);
  setters.setRole(me.role ?? null);
  setters.setBranch(me.branch ?? null);
  setters.setTenant(me.tenant ?? null);
  setters.setPermissions(me.permissions ?? []);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // BYPASS AUTH: Always provide dummy authenticated context for UI/UX development
  const dummyUser = { id: 'dev-user', name: 'Dev User', fullName: 'Dev User', email: 'dev@localhost', roleId: 'cashier', tenantId: 'tenant-1', defaultBranchId: 'main-branch' };
  const dummyRole = { id: 'cashier', name: 'Cashier', permissions: ['pos:sell'] };
  const dummyBranch = { id: 'main-branch', name: 'Main Branch', code: 'MAIN' };
  const dummyTenant = { id: 'tenant-1', name: 'Demo Tenant', slug: 'demo-tenant', defaultCurrency: 'USD' };
  const dummyPermissions = ['pos:sell', 'pos:*', '*'];
  const dummyToken = 'dev-token';

  return (
    <AuthContext.Provider
      value={{
        user: dummyUser,
        role: dummyRole,
        branch: dummyBranch,
        tenant: dummyTenant,
        permissions: dummyPermissions,
        token: dummyToken,
        isLoading: false,
        isAuthenticated: true,
        canSell: true,
        login: async () => {},
        logout: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
