import { shouldOpenDevTools } from './devtools';

describe('shouldOpenDevTools', () => {
  test('returns true when the Vite dev server URL is present', () => {
    expect(shouldOpenDevTools('http://localhost:5173')).toBe(true);
  });

  test('returns false when the Vite dev server URL is missing', () => {
    expect(shouldOpenDevTools(undefined)).toBe(false);
  });
});
