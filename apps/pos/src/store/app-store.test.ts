import { useAppStore } from './app-store';

describe('app store theme state', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  test('defaults theme preference to system', () => {
    expect(useAppStore.getState().themePreference).toBe('system');
  });

  test('persists explicit preference changes', () => {
    useAppStore.getState().setThemePreference('dark');

    expect(localStorage.getItem('uni-pos.pos.theme-preference')).toBe('dark');
    expect(useAppStore.getState().themePreference).toBe('dark');
  });

  test('toggles against the resolved theme', () => {
    useAppStore.getState().toggleTheme('dark');

    expect(useAppStore.getState().themePreference).toBe('light');
  });
});
