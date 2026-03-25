import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
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
  const [user, setUser] = useState<PosUser | null>(null);
  const [role, setRole] = useState<PosRole | null>(null);
  const [branch, setBranch] = useState<PosBranch | null>(null);
  const [tenant, setTenant] = useState<PosTenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setAuthToken(storedToken);

    fetchMe(storedToken)
      .then((me) => {
        applyMe({ setUser, setRole, setBranch, setTenant, setPermissions }, me);
      })
      .catch(() => {
        setToken(null);
        setAuthToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    setToken(response.access_token);
    setAuthToken(response.access_token);

    const me = await fetchMe(response.access_token);
    applyMe({ setUser, setRole, setBranch, setTenant, setPermissions }, me);

    if (!canSellFromPermissions(me.permissions ?? [])) {
      setToken(null);
      setAuthToken(null);
      throw new Error('Your account does not have POS sell permission (pos:sell).');
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setRole(null);
    setBranch(null);
    setTenant(null);
    setPermissions([]);
  }, []);

  const canSell = canSellFromPermissions(permissions);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        branch,
        tenant,
        permissions,
        token,
        isLoading,
        isAuthenticated: !!user,
        canSell,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
