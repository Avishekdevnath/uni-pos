import React, { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  TOKEN_KEY,
  fetchMe,
  login as apiLogin,
  setToken,
  register401Handler,
  unregister401Handler,
} from '../lib/api';
import { useAppStore } from '../store/app-store';
import type { PosBranch, PosMeResponse, PosRole, PosTenant, PosUser } from '../types/auth';

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

function applyMe(
  me: PosMeResponse,
  setters: {
    setUser: (u: PosUser | null) => void;
    setRole: (r: PosRole | null) => void;
    setBranch: (b: PosBranch | null) => void;
    setTenant: (t: PosTenant | null) => void;
    setPermissions: (p: string[]) => void;
    setToken_: (t: string | null) => void;
  },
  token: string,
) {
  setters.setUser(me.user);
  setters.setRole(me.role ?? null);
  setters.setBranch(me.branch ?? null);
  setters.setTenant(me.tenant ?? null);
  setters.setPermissions(me.permissions ?? []);
  setters.setToken_(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const resetStore = useAppStore((s) => s.reset);

  const [user, setUser] = useState<PosUser | null>(null);
  const [role, setRole] = useState<PosRole | null>(null);
  const [branch, setBranch] = useState<PosBranch | null>(null);
  const [tenant, setTenant] = useState<PosTenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token_, setToken_] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setters = { setUser, setRole, setBranch, setTenant, setPermissions, setToken_ };

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setBranch(null);
    setTenant(null);
    setPermissions([]);
    setToken_(null);
    queryClient.clear();
    resetStore();
  }, [queryClient, resetStore]);

  // Register 401 auto-logout on mount, unregister on unmount
  const clearSessionRef = useRef(clearSession);
  clearSessionRef.current = clearSession;

  useEffect(() => {
    register401Handler(() => clearSessionRef.current());
    return () => unregister401Handler();
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetchMe(stored)
      .then((me) => {
        applyMe(me, setters, stored);
      })
      .catch(() => {
        // Token invalid or expired — clear it silently
        setToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    const token = response.access_token;
    setToken(token);
    const me = await fetchMe(token);
    applyMe(me, setters, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const isAuthenticated = user !== null;
  const canSell = canSellFromPermissions(permissions);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        branch,
        tenant,
        permissions,
        token: token_,
        isLoading,
        isAuthenticated,
        canSell,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
