'use client';
import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { fetchBranches } from '@/lib/api';
import type { Branch } from '@/types/branch';

const BRANCH_KEY = 'uni-pos.admin.selected-branch';

export interface BranchContextValue {
  branches: Branch[];
  selectedBranch: Branch | null;
  selectBranch: (branchId: string) => void;
  isLoading: boolean;
}

export const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    fetchBranches()
      .then((data) => {
        setBranches(data);
        const storedId = localStorage.getItem(BRANCH_KEY);
        const match =
          data.find((b) => b.id === storedId) ??
          data.find((b) => b.id === user?.defaultBranchId) ??
          data[0] ??
          null;
        setSelectedBranch(match);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, user?.defaultBranchId]);

  const selectBranch = useCallback(
    (branchId: string) => {
      const branch = branches.find((b) => b.id === branchId);
      if (branch) {
        setSelectedBranch(branch);
        localStorage.setItem(BRANCH_KEY, branchId);
      }
    },
    [branches],
  );

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, selectBranch, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
}
