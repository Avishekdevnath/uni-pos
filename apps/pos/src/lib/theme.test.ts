import {
  DEFAULT_THEME_PREFERENCE,
  applyResolvedTheme,
  getThemePreferenceDescription,
  getThemeToggleCopy,
  getStoredThemePreference,
  getSystemResolvedTheme,
  resolveThemePreference,
  toggleThemePreference,
  watchSystemTheme,
} from './theme';

describe('theme utilities', () => {
  test('returns system when storage is empty', () => {
    const storage = { getItem: () => null } as Pick<Storage, 'getItem'>;

    expect(getStoredThemePreference(storage)).toBe(DEFAULT_THEME_PREFERENCE);
  });

  test('ignores invalid stored preference', () => {
    const storage = { getItem: () => 'sepia' } as Pick<Storage, 'getItem'>;

    expect(getStoredThemePreference(storage)).toBe('system');
  });

  test('resolves system preference from OS choice', () => {
    expect(resolveThemePreference('system', true)).toBe('dark');
    expect(resolveThemePreference('system', false)).toBe('light');
  });

  test('toggles using resolved theme when preference is system', () => {
    expect(toggleThemePreference('system', 'dark')).toBe('light');
  });

  test('applies the resolved theme to dataset', () => {
    const root = { dataset: {} as Record<string, string> };

    applyResolvedTheme(root as HTMLElement, 'dark');

    expect(root.dataset.theme).toBe('dark');
  });

  test('emits updates from a mocked system theme source', () => {
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    const query = {
      matches: false,
      addEventListener: (_: 'change', listener: (event: { matches: boolean }) => void) =>
        listeners.push(listener),
      removeEventListener: jest.fn(),
    };

    const onThemeChange = jest.fn();
    const stop = watchSystemTheme(query as unknown as MediaQueryList, onThemeChange);

    listeners[0]({ matches: true });

    expect(onThemeChange).toHaveBeenCalledWith('dark');

    stop();
  });

  test('reads the current system theme from matchMedia', () => {
    const matchMedia = jest.fn().mockReturnValue({ matches: true });

    expect(getSystemResolvedTheme(matchMedia)).toBe('dark');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  test('falls back to light when matchMedia is unavailable', () => {
    expect(getSystemResolvedTheme(undefined)).toBe('light');
  });

  test('builds quick-toggle copy from a dark resolved theme', () => {
    expect(getThemeToggleCopy('dark')).toEqual({
      label: 'Theme: Dark',
      title: 'Switch to light theme',
    });
  });

  test('builds quick-toggle copy from a light resolved theme', () => {
    expect(getThemeToggleCopy('light')).toEqual({
      label: 'Theme: Light',
      title: 'Switch to dark theme',
    });
  });

  test('describes system mode using the resolved theme', () => {
    expect(getThemePreferenceDescription('system', 'dark')).toContain(
      'following dark mode',
    );
  });

  test('describes explicit mode as a local override', () => {
    expect(getThemePreferenceDescription('light', 'light')).toContain(
      'local override',
    );
  });
});
