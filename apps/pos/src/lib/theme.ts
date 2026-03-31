export const THEME_STORAGE_KEY = 'uni-pos.pos.theme-preference';
export const DEFAULT_THEME_PREFERENCE = 'system';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
type MatchMediaFn = ((query: string) => Pick<MediaQueryList, 'matches'>) | undefined;

export function getStoredThemePreference(
  storage: Pick<Storage, 'getItem'> | undefined,
): ThemePreference {
  const raw = storage?.getItem(THEME_STORAGE_KEY);

  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }

  return DEFAULT_THEME_PREFERENCE;
}

export function resolveThemePreference(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function toggleThemePreference(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme,
): ThemePreference {
  if (preference === 'system') {
    return resolvedTheme === 'dark' ? 'light' : 'dark';
  }

  return preference === 'dark' ? 'light' : 'dark';
}

export function applyResolvedTheme(
  root: { dataset: Record<string, string> } | null | undefined,
  theme: ResolvedTheme,
): void {
  if (!root) {
    return;
  }

  root.dataset.theme = theme;
}

export function watchSystemTheme(
  query: Pick<MediaQueryList, 'addEventListener' | 'removeEventListener'>,
  onThemeChange: (theme: ResolvedTheme) => void,
): () => void {
  const handler = (event: { matches: boolean }) => {
    onThemeChange(event.matches ? 'dark' : 'light');
  };

  query.addEventListener('change', handler);

  return () => {
    query.removeEventListener('change', handler);
  };
}

export function getSystemResolvedTheme(matchMedia: MatchMediaFn): ResolvedTheme {
  if (!matchMedia) {
    return 'light';
  }

  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getThemeToggleCopy(
  resolvedTheme: ResolvedTheme,
): { label: string; title: string } {
  if (resolvedTheme === 'dark') {
    return {
      label: 'Theme: Dark',
      title: 'Switch to light theme',
    };
  }

  return {
    label: 'Theme: Light',
    title: 'Switch to dark theme',
  };
}

export function getThemePreferenceDescription(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme,
): string {
  if (preference === 'system') {
    return `Match the device appearance. Currently following ${resolvedTheme} mode.`;
  }

  return 'Using a local override for this terminal only.';
}
