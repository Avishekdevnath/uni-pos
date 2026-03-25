import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/use-auth';

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
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card login-card">
      <h1>POS Terminal Login</h1>
      <p className="muted">Sign in with a user that has <code>pos:sell</code> permission.</p>
      <form onSubmit={handleSubmit} className="stack">
        <label>
          <span>Email</span>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
