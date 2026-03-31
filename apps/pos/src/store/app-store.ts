import { create } from 'zustand';
import {
  THEME_STORAGE_KEY,
  getStoredThemePreference,
  toggleThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

export type AppPage =
  | 'pos'
  | 'invoice'
  | 'inventory'
  | 'reports'
  | 'customers'
  | 'settings';

interface AppStore {
  activePage: AppPage;
  themePreference: ThemePreference;
  setActivePage: (page: AppPage) => void;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: (resolvedTheme: ResolvedTheme) => void;
}

const PAGE_STORAGE_KEY = 'uni-pos.active-page';
const validPages: AppPage[] = ['pos', 'invoice', 'inventory', 'reports', 'customers', 'settings'];

function getStoredPage(): AppPage {
  const stored = localStorage.getItem(PAGE_STORAGE_KEY) as AppPage | null;
  return stored && validPages.includes(stored) ? stored : 'pos';
}

const initialThemePreference = getStoredThemePreference(localStorage);

export const useAppStore = create<AppStore>((set) => ({
  activePage: getStoredPage(),
  themePreference: initialThemePreference,
  setActivePage: (page) => {
    localStorage.setItem(PAGE_STORAGE_KEY, page);
    set({ activePage: page });
  },
  setThemePreference: (preference) => {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    set({ themePreference: preference });
  },
  toggleTheme: (resolvedTheme) =>
    set((state) => {
      const nextThemePreference = toggleThemePreference(
        state.themePreference,
        resolvedTheme,
      );
      localStorage.setItem(THEME_STORAGE_KEY, nextThemePreference);
      return { themePreference: nextThemePreference };
    }),
}));
