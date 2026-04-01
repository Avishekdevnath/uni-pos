import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../lib/api';
import { Logo } from './shared/Logo';
import { Spinner } from './shared/Spinner';

function normalizeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 400) return 'Invalid email or password.';
    if (err.status >= 500) return 'Server error — please try again.';
    if (err.status === 0 || err.message.includes('fetch')) return 'Cannot reach server. Check your connection.';
    return err.message;
  }
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return 'Request timed out. Check your connection.';
  }
  if (err instanceof Error) return err.message;
  return 'Login failed.';
}

const DEMO_ACCOUNTS = [
  { role: 'Owner',          email: 'owner@unimart.demo',              branch: 'HQ Flagship' },
  { role: 'Senior Manager', email: 'sr.manager.dhaka@unimart.demo',   branch: 'HQ Flagship' },
  { role: 'Manager',        email: 'manager.dhkhq@unimart.demo',      branch: 'HQ Flagship' },
  { role: 'Cashier',        email: 'cashier1.dhkhq@unimart.demo',     branch: 'HQ Flagship' },
  { role: 'Senior Staff',   email: 'sr.staff.dhkhq@unimart.demo',     branch: 'HQ Flagship' },
  { role: 'Staff',          email: 'staff.dhkhq@unimart.demo',        branch: 'HQ Flagship' },
] as const;

const DEMO_PASSWORD = 'demo1234';

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  'Owner':          { bg: '#ede9fe', color: '#6d28d9' },
  'Senior Manager': { bg: '#dbeafe', color: '#1d4ed8' },
  'Manager':        { bg: '#e0f2fe', color: '#0369a1' },
  'Cashier':        { bg: '#dcfce7', color: '#15803d' },
  'Senior Staff':   { bg: '#fef3c7', color: '#b45309' },
  'Staff':          { bg: '#ffedd5', color: '#c2410c' },
};

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setDemoOpen(false);
  }

  const hasError = error !== null;

  return (
    <>
      <div className="card login-card">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText={true} />
        </div>

        <h1 className="text-center mb-1">Welcome back</h1>
        <p className="muted text-center mb-4" style={{ fontSize: '0.875rem' }}>
          Sign in to your billing terminal
        </p>

        <form onSubmit={handleSubmit} className="stack" aria-describedby={hasError ? 'login-error' : undefined}>
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              aria-invalid={hasError || undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              aria-invalid={hasError || undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {hasError && (
            <p id="login-error" className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {isSubmitting ? (
              <>
                <Spinner size={16} />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          style={{
            marginTop: '0.75rem',
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--border2)',
            borderRadius: '0.75rem',
            color: 'var(--text2)',
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          View demo accounts
        </button>
      </div>

      {/* Demo modal */}
      {demoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setDemoOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.15s ease',
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'relative',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              boxShadow: 'var(--card-shadow)',
              width: 'min(100%, 26rem)',
              padding: '1.5rem',
              animation: 'modalIn 0.18s ease',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <h2 id="demo-modal-title" style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
                Demo Accounts
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.8125rem' }}>
                All accounts use password{' '}
                <code style={{
                  background: 'var(--surface2)',
                  borderRadius: '0.375rem',
                  padding: '0.125rem 0.375rem',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                }}>
                  {DEMO_PASSWORD}
                </code>
                . Tap a row to fill the form.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DEMO_ACCOUNTS.map((a) => {
                const c = ROLE_COLORS[a.role];
                return (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => fillDemo(a.email)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text1)' }}>
                        {a.email}
                      </p>
                      <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>
                        {a.branch}
                      </p>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      background: c.bg,
                      color: c.color,
                      borderRadius: '9999px',
                      padding: '0.2rem 0.625rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      {a.role}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDemoOpen(false)}
              style={{
                marginTop: '1rem',
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: '0.75rem',
                color: 'var(--text2)',
                padding: '0.6rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
