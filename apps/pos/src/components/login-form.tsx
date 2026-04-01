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

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const hasError = error !== null;

  return (
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
    </div>
  );
}
